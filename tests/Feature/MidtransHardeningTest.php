<?php

namespace Tests\Feature;

use App\Models\Course;
use App\Models\Enrollment;
use App\Models\InstructorPayout;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Payment;
use App\Models\PaymentMethod;
use App\Models\PaymentProvider;
use App\Models\PaymentSetting;
use App\Models\Refund;
use App\Models\User;
use App\Services\Payment\PaymentService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class MidtransHardeningTest extends TestCase
{
    use RefreshDatabase;

    private function provider(string $code = 'midtrans'): PaymentProvider
    {
        return PaymentProvider::factory()->create([
            'name' => ucfirst($code),
            'code' => $code,
            'is_active' => true,
        ]);
    }

    private function method(PaymentProvider $provider): PaymentMethod
    {
        return PaymentMethod::factory()->create([
            'provider_id' => $provider->id,
            'name' => 'Midtrans',
            'code' => 'snap',
        ]);
    }

    private function paidCourse(?User $instructor = null): Course
    {
        $attributes = [
            'title' => 'Hardening Course',
            'type' => 'paid',
            'price' => 150000,
            'status' => 'published',
            'published_at' => now(),
        ];

        if ($instructor) {
            $attributes['creator_id'] = $instructor->id;
        }

        return Course::factory()->create($attributes);
    }

    private function orderWithPayment(
        User $student,
        Course $course,
        string $status = 'paid',
        array $paymentOverrides = [],
    ): array {
        $order = Order::factory()->create([
            'user_id' => $student->id,
            'order_number' => 'ORD-HARD-'.fake()->unique()->numerify('####'),
            'status' => $status,
            'total_price' => 150000,
            'paid_at' => $status === 'paid' ? now() : null,
        ]);

        OrderItem::factory()->create([
            'order_id' => $order->id,
            'course_id' => $course->id,
            'course_title' => $course->title,
            'course_price' => 150000,
        ]);

        $payment = Payment::factory()->create(array_merge([
            'order_id' => $order->id,
            'provider_id' => $this->provider()->id,
            'amount' => 150000,
            'status' => $status === 'paid' ? 'paid' : $status,
            'paid_at' => $status === 'paid' ? now() : null,
        ], $paymentOverrides));

        return [$order, $payment];
    }

    private function signature(string $orderNumber, string $statusCode, string $grossAmount, string $serverKey = 'test-server-key'): string
    {
        return hash('sha512', $orderNumber.$statusCode.$grossAmount.$serverKey);
    }

    private function webhook(Order $order, string $transactionStatus, array $extra = []): \Illuminate\Testing\TestResponse
    {
        $gross = number_format((float) $order->total_price, 2, '.', '');

        return $this->postJson('/payments/midtrans/webhook', array_merge([
            'order_id' => $order->order_number,
            'status_code' => '200',
            'gross_amount' => $gross,
            'signature_key' => $this->signature($order->order_number, '200', $gross),
            'transaction_status' => $transactionStatus,
            'fraud_status' => 'accept',
        ], $extra));
    }

    public function test_chargeback_webhook_revokes_access_and_records_the_dispute(): void
    {
        config(['services.payment.midtrans.server_key' => 'test-server-key']);

        $student = User::factory()->create(['role' => 'student']);
        $course = $this->paidCourse();
        [$order, $payment] = $this->orderWithPayment($student, $course);

        Enrollment::create([
            'user_id' => $student->id,
            'course_id' => $course->id,
            'status' => 'active',
            'enrolled_at' => now(),
        ]);

        $this->webhook($order, 'chargeback')->assertOk();

        $this->assertSame('chargeback', $order->fresh()->status);
        $this->assertSame('chargeback', $payment->fresh()->status);
        $this->assertSame('revoked', Enrollment::where('user_id', $student->id)->first()?->status);
        $this->assertDatabaseHas('refunds', [
            'payment_id' => $payment->id,
            'type' => 'chargeback',
            'status' => 'success',
        ]);
    }

    public function test_settlement_reversal_deny_revokes_access(): void
    {
        config(['services.payment.midtrans.server_key' => 'test-server-key']);

        $student = User::factory()->create(['role' => 'student']);
        $course = $this->paidCourse();
        [$order, $payment] = $this->orderWithPayment($student, $course);

        Enrollment::create([
            'user_id' => $student->id,
            'course_id' => $course->id,
            'status' => 'active',
            'enrolled_at' => now(),
        ]);

        $this->webhook($order, 'deny', ['fraud_status' => 'deny'])->assertOk();

        $this->assertSame('failed', $order->fresh()->status);
        $this->assertSame('failed', $payment->fresh()->status);
        $this->assertSame('revoked', Enrollment::where('user_id', $student->id)->first()?->status);
    }

    public function test_refund_rejects_http_200_with_error_status_code(): void
    {
        config([
            'services.payment.midtrans.server_key' => 'test-server-key',
            'services.payment.midtrans.api_base_url' => 'https://api.sandbox.midtrans.com',
        ]);

        Http::fake([
            'https://api.sandbox.midtrans.com/v2/*/refund' => Http::response([
                'status_code' => '412',
                'status_message' => 'Refund is not allowed for this transaction',
            ], 200),
        ]);

        $admin = User::factory()->create(['role' => 'admin']);
        $student = User::factory()->create(['role' => 'student']);
        $course = $this->paidCourse();
        [$order, $payment] = $this->orderWithPayment($student, $course, paymentOverrides: ['payment_type' => 'qris']);

        $this->actingAs($admin)
            ->post(route('admin.orders.refund', $order), ['reason' => 'Student request'])
            ->assertRedirect()
            ->assertSessionHas('error');

        $this->assertSame('paid', $payment->fresh()->status);
        $this->assertSame(0, Refund::where('payment_id', $payment->id)->where('status', 'success')->count());
        $this->assertDatabaseHas('refunds', [
            'payment_id' => $payment->id,
            'status' => 'failed',
        ]);
    }

    public function test_refund_is_not_attempted_for_unsupported_channels(): void
    {
        config(['services.payment.midtrans.server_key' => 'test-server-key']);
        Http::fake();

        $admin = User::factory()->create(['role' => 'admin']);
        $student = User::factory()->create(['role' => 'student']);
        $course = $this->paidCourse();
        [$order, $payment] = $this->orderWithPayment($student, $course, paymentOverrides: ['payment_type' => 'echannel']);

        $this->actingAs($admin)
            ->post(route('admin.orders.refund', $order), ['reason' => 'Student request'])
            ->assertRedirect()
            ->assertSessionHas('error');

        $this->assertSame('paid', $payment->fresh()->status);
        Http::assertNothingSent();
    }

    public function test_refund_retry_reuses_the_same_refund_key(): void
    {
        config([
            'services.payment.midtrans.server_key' => 'test-server-key',
            'services.payment.midtrans.api_base_url' => 'https://api.sandbox.midtrans.com',
        ]);

        Http::fake([
            'https://api.sandbox.midtrans.com/v2/*/refund' => Http::sequence()
                ->push(['status_code' => '412', 'status_message' => 'Temporary rejection'], 200)
                ->push(['status_code' => '200', 'transaction_status' => 'refund'], 200),
        ]);

        $admin = User::factory()->create(['role' => 'admin']);
        $student = User::factory()->create(['role' => 'student']);
        $course = $this->paidCourse();
        [$order, $payment] = $this->orderWithPayment($student, $course, paymentOverrides: ['payment_type' => 'qris']);

        $this->actingAs($admin)->post(route('admin.orders.refund', $order), ['reason' => 'Retry me'])->assertSessionHas('error');
        $this->actingAs($admin)->post(route('admin.orders.refund', $order), ['reason' => 'Retry me'])->assertSessionHas('success');

        $keys = Http::recorded()->map(fn (array $pair) => $pair[0]->data()['refund_key'])->all();

        $this->assertCount(2, $keys);
        $this->assertSame($keys[0], $keys[1]);
        $this->assertSame('refunded', $payment->fresh()->status);
    }

    public function test_partial_refund_keeps_access_until_the_remaining_amount_is_refunded(): void
    {
        config([
            'services.payment.midtrans.server_key' => 'test-server-key',
            'services.payment.midtrans.api_base_url' => 'https://api.sandbox.midtrans.com',
        ]);

        Http::fake([
            'https://api.sandbox.midtrans.com/v2/*/refund' => Http::response([
                'status_code' => '200',
                'transaction_status' => 'partial_refund',
                'refund_id' => 'rf-partial',
            ], 200),
        ]);

        $admin = User::factory()->create(['role' => 'admin']);
        $student = User::factory()->create(['role' => 'student']);
        $course = $this->paidCourse();
        [$order, $payment] = $this->orderWithPayment($student, $course, paymentOverrides: ['payment_type' => 'gopay']);

        Enrollment::create([
            'user_id' => $student->id,
            'course_id' => $course->id,
            'status' => 'active',
            'enrolled_at' => now(),
        ]);

        $this->actingAs($admin)
            ->post(route('admin.orders.refund', $order), ['reason' => 'Partial', 'amount' => 50000])
            ->assertSessionHas('success');

        $payment->refresh();
        $this->assertSame('partial_refund', $payment->status);
        $this->assertSame('50000.00', $payment->refunded_amount);
        $this->assertSame('paid', $order->fresh()->status);
        $this->assertSame('active', Enrollment::where('user_id', $student->id)->first()?->status);

        $this->actingAs($admin)
            ->post(route('admin.orders.refund', $order), ['reason' => 'Remainder', 'amount' => 100000])
            ->assertSessionHas('success');

        $this->assertSame('refunded', $payment->fresh()->status);
        $this->assertSame('refunded', $order->fresh()->status);
        $this->assertSame('revoked', Enrollment::where('user_id', $student->id)->first()?->status);
    }

    public function test_async_refund_is_finalized_by_the_provider_webhook(): void
    {
        config([
            'services.payment.midtrans.server_key' => 'test-server-key',
            'services.payment.midtrans.api_base_url' => 'https://api.sandbox.midtrans.com',
        ]);

        Http::fake([
            'https://api.sandbox.midtrans.com/v2/*/refund' => Http::response([
                'status_code' => '200',
                'transaction_status' => 'pending',
                'refund_id' => 'rf-pending',
            ], 200),
        ]);

        $student = User::factory()->create(['role' => 'student']);
        $course = $this->paidCourse();
        [$order, $payment] = $this->orderWithPayment($student, $course, paymentOverrides: ['payment_type' => 'qris']);

        $refund = app(PaymentService::class)->refund($payment, 'Async refund');

        $this->assertSame('pending', $refund->status);
        $this->assertSame('paid', $payment->fresh()->status);

        $this->webhook($order, 'refund', ['refund_amount' => '150000.00'])->assertOk();

        $this->assertSame('refunded', $payment->fresh()->status);
        $this->assertSame('refunded', $order->fresh()->status);
        $this->assertSame('success', $refund->fresh()->status);
    }

    public function test_production_mode_rejects_a_sandbox_server_key(): void
    {
        config([
            'services.payment.midtrans.server_key' => 'SB-Mid-server-test',
            'services.payment.midtrans.is_production' => true,
            'services.payment.midtrans.snap_base_url' => 'https://app.sandbox.midtrans.com',
            'services.payment.midtrans.api_base_url' => 'https://api.sandbox.midtrans.com',
        ]);
        Http::fake();

        PaymentSetting::current()->forceFill(['gateway' => 'midtrans', 'currency' => 'IDR'])->save();

        $student = User::factory()->create(['role' => 'student']);
        $course = $this->paidCourse();
        $method = $this->method($this->provider());

        $this->actingAs($student)
            ->post("/student/courses/{$course->slug}/checkout", ['payment_method_id' => $method->id])
            ->assertRedirect()
            ->assertSessionHas('error');

        $this->assertDatabaseCount('orders', 0);
        $this->assertDatabaseCount('payments', 0);
        Http::assertNothingSent();
    }

    public function test_enrolled_student_cannot_checkout_the_same_course_twice(): void
    {
        config(['services.payment.midtrans.server_key' => 'test-server-key']);
        PaymentSetting::current()->forceFill(['gateway' => 'midtrans', 'currency' => 'IDR'])->save();
        Http::fake();

        $student = User::factory()->create(['role' => 'student']);
        $course = $this->paidCourse();
        $this->method($this->provider());

        Enrollment::create([
            'user_id' => $student->id,
            'course_id' => $course->id,
            'status' => 'active',
            'enrolled_at' => now(),
        ]);

        $this->actingAs($student)
            ->post("/student/courses/{$course->slug}/checkout")
            ->assertRedirect(route('student.courses.show', $course->slug));

        $this->assertDatabaseCount('orders', 0);
        Http::assertNothingSent();
    }

    public function test_paid_order_creates_an_instructor_payout_ledger_and_admin_can_mark_it_paid(): void
    {
        config([
            'services.payment.midtrans.server_key' => 'test-server-key',
            'services.payment.platform_fee_percent' => 20,
            'services.payment.payout_hold_days' => 0,
            'services.payment.payout_minimum' => 0,
        ]);

        PaymentSetting::current()->forceFill([
            'platform_fee_percent' => 20,
            'payout_hold_days' => 0,
            'payout_minimum' => 0,
        ])->save();

        $instructor = User::factory()->create([
            'role' => 'instructor',
            'payout_bank_name' => 'BCA',
            'payout_account_number' => '1234567890',
            'payout_account_name' => 'Instructor',
        ]);
        $student = User::factory()->create(['role' => 'student']);
        $course = $this->paidCourse($instructor);
        [$order, $payment] = $this->orderWithPayment($student, $course, status: 'pending');

        app(PaymentService::class)->markPaid($payment);

        $payout = InstructorPayout::where('order_id', $order->id)->firstOrFail();

        $this->assertSame($instructor->id, $payout->instructor_id);
        $this->assertSame('pending', $payout->status);
        $this->assertSame('120000.00', $payout->net_amount);
        $this->assertSame('30000.00', $payout->platform_fee);

        $admin = User::factory()->create(['role' => 'admin']);

        $this->withoutVite();

        $this->actingAs($admin)->get('/admin/payouts')->assertOk();

        $this->actingAs($admin)
            ->put("/admin/payouts/{$payout->id}/pay", ['reference' => 'TRF-001', 'notes' => 'BCA transfer'])
            ->assertRedirect();

        $payout->refresh();
        $this->assertSame('paid', $payout->status);
        $this->assertSame('TRF-001', $payout->reference);
        $this->assertNotNull($payout->paid_at);
    }

    public function test_paid_order_uses_platform_fee_updated_from_admin_panel(): void
    {
        config(['services.payment.midtrans.server_key' => 'test-server-key']);

        $instructor = User::factory()->create(['role' => 'instructor']);
        $student = User::factory()->create(['role' => 'student']);
        $course = $this->paidCourse($instructor);
        [$order, $payment] = $this->orderWithPayment($student, $course, status: 'pending');

        /** @var User $admin */
        $admin = User::factory()->create(['role' => 'admin']);
        $this->actingAs($admin);

        $this->put(route('admin.settings.payment.update'), [
            'gateway' => 'midtrans',
            'currency' => 'IDR',
            'platform_fee_percent' => 15,
        ])->assertRedirect();

        app(PaymentService::class)->markPaid($payment);

        $payout = InstructorPayout::where('order_id', $order->id)->firstOrFail();

        $this->assertSame('22500.00', $payout->platform_fee);
        $this->assertSame('127500.00', $payout->net_amount);
    }

    public function test_payout_account_is_encrypted_and_hidden_from_serialization(): void
    {
        $instructor = User::factory()->create(['role' => 'instructor']);

        $this->actingAs($instructor)->put('/instructor/settings/payout', [
            'bank_name' => 'BCA',
            'account_number' => '123-456-7890',
            'account_name' => 'Budi Santoso',
        ])->assertRedirect();

        $raw = DB::table('users')->where('id', $instructor->id)->value('payout_account_number');

        $this->assertNotSame('1234567890', $raw);
        $this->assertSame('1234567890', $instructor->fresh()->payout_account_number);
        $this->assertArrayNotHasKey('payout_account_number', $instructor->fresh()->toArray());
    }

    public function test_webhook_acknowledges_unknown_orders_to_stop_retries(): void
    {
        config(['services.payment.midtrans.server_key' => 'test-server-key']);

        $gross = '100.00';

        $this->postJson('/payments/midtrans/webhook', [
            'order_id' => 'ORD-UNKNOWN-1',
            'status_code' => '200',
            'gross_amount' => $gross,
            'signature_key' => $this->signature('ORD-UNKNOWN-1', '200', $gross),
            'transaction_status' => 'settlement',
        ])->assertOk();
    }

    public function test_webhook_rejects_a_different_merchant(): void
    {
        config([
            'services.payment.midtrans.server_key' => 'test-server-key',
            'services.payment.midtrans.merchant_id' => 'M123',
        ]);

        $student = User::factory()->create(['role' => 'student']);
        $course = $this->paidCourse();
        [$order] = $this->orderWithPayment($student, $course, status: 'pending');

        $this->webhook($order, 'settlement', ['merchant_id' => 'M999'])->assertForbidden();
        $this->assertSame('pending', $order->fresh()->status);
    }

    public function test_admin_manual_confirmation_verifies_with_midtrans(): void
    {
        config([
            'services.payment.midtrans.server_key' => 'test-server-key',
            'services.payment.midtrans.api_base_url' => 'https://api.sandbox.midtrans.com',
        ]);

        Http::fake([
            'https://api.sandbox.midtrans.com/v2/*/status' => Http::sequence()
                ->push(['status_code' => '200', 'transaction_status' => 'pending'], 200)
                ->push(['status_code' => '200', 'transaction_status' => 'settlement', 'fraud_status' => 'accept'], 200),
        ]);

        $admin = User::factory()->create(['role' => 'admin']);
        $student = User::factory()->create(['role' => 'student']);
        $course = $this->paidCourse();
        [$order] = $this->orderWithPayment($student, $course, status: 'pending');

        $this->actingAs($admin)
            ->put(route('admin.orders.pay', $order), ['reason' => 'Cek manual'])
            ->assertSessionHas('error');

        $this->assertSame('pending', $order->fresh()->status);

        $this->actingAs($admin)
            ->put(route('admin.orders.pay', $order), ['reason' => 'Cek manual'])
            ->assertSessionHas('success');

        $this->assertSame('paid', $order->fresh()->status);
    }

    public function test_payment_currency_cannot_be_changed_away_from_idr(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);

        $this->actingAs($admin)
            ->put(route('admin.settings.payment.update'), [
                'gateway' => 'midtrans',
                'currency' => 'USD',
            ])
            ->assertSessionHasErrors('currency');

        $this->assertSame('IDR', PaymentSetting::current()->currency);
    }
}
