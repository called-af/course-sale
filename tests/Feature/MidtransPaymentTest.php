<?php

namespace Tests\Feature;

use App\Models\Course;
use App\Models\Enrollment;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Payment;
use App\Models\PaymentMethod;
use App\Models\PaymentProvider;
use App\Models\PaymentSetting;
use App\Models\Refund;
use App\Models\User;
use App\Services\Payment\PaymentService;
use Database\Seeders\PaymentSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class MidtransPaymentTest extends TestCase
{
    use RefreshDatabase;

    private function paidCourse(): Course
    {
        return Course::factory()->create([
            'title' => 'Test Course',
            'type' => 'paid',
            'price' => 150000,
            'status' => 'published',
            'published_at' => now(),
        ]);
    }

    private function provider(string $code = 'midtrans'): PaymentProvider
    {
        return PaymentProvider::factory()->create([
            'name' => ucfirst($code),
            'code' => $code,
            'is_active' => true,
        ]);
    }

    private function method(PaymentProvider $provider, string $code = 'snap'): PaymentMethod
    {
        return PaymentMethod::factory()->create([
            'provider_id' => $provider->id,
            'name' => 'Midtrans',
            'code' => $code,
        ]);
    }

    private function signature(string $orderNumber, string $statusCode, string $grossAmount, string $serverKey = 'test-server-key'): string
    {
        return hash('sha512', $orderNumber.$statusCode.$grossAmount.$serverKey);
    }

    public function test_checkout_creates_a_snap_transaction_against_the_snap_host(): void
    {
        config([
            'services.payment.midtrans.server_key' => 'SB-Mid-server-test',
            'services.payment.midtrans.snap_base_url' => 'https://app.sandbox.midtrans.com',
            'services.payment.midtrans.api_base_url' => 'https://api.sandbox.midtrans.com',
        ]);

        PaymentSetting::current()->forceFill(['gateway' => 'midtrans'])->save();

        Http::fake([
            'https://app.sandbox.midtrans.com/snap/v1/transactions' => Http::response([
                'token' => 'snap-token-123',
                'redirect_url' => 'https://app.sandbox.midtrans.com/snap/v2/vtweb/snap-token-123',
            ], 201),
        ]);

        $student = User::factory()->create(['role' => 'student']);
        $course = $this->paidCourse();
        $method = $this->method($this->provider());

        $response = $this->actingAs($student)->post(
            "/student/courses/{$course->slug}/checkout",
            ['payment_method_id' => $method->id]
        );

        $response->assertRedirect('https://app.sandbox.midtrans.com/snap/v2/vtweb/snap-token-123');

        Http::assertSent(function ($request) {
            $body = $request->data();

            return $request->url() === 'https://app.sandbox.midtrans.com/snap/v1/transactions'
                && $body['transaction_details']['gross_amount'] === 150000
                && $body['item_details'][0]['name'] === 'Test Course'
                && $request->hasHeader('Authorization');
        });

        $this->assertDatabaseHas('payments', [
            'reference' => 'snap-token-123',
            'payment_url' => 'https://app.sandbox.midtrans.com/snap/v2/vtweb/snap-token-123',
        ]);
    }

    public function test_available_methods_only_include_the_active_gateway(): void
    {
        config(['services.payment.midtrans.server_key' => 'SB-Mid-server-test']);

        PaymentSetting::current()->forceFill(['gateway' => 'midtrans'])->save();

        $midtrans = $this->method($this->provider('midtrans'), 'credit_card');

        $methods = app(PaymentService::class)->availableMethods();

        $this->assertSame([$midtrans->id], array_column($methods, 'id'));
    }

    public function test_midtrans_capture_with_challenge_does_not_grant_access(): void
    {
        config(['services.payment.midtrans.server_key' => 'test-server-key']);

        $provider = $this->provider();
        $student = User::factory()->create(['role' => 'student']);
        $course = $this->paidCourse();
        $order = Order::factory()->create([
            'user_id' => $student->id,
            'order_number' => 'ORD-MID-1',
            'status' => 'pending',
            'total_price' => 150000,
        ]);
        Payment::factory()->create([
            'order_id' => $order->id,
            'provider_id' => $provider->id,
            'amount' => 150000,
            'status' => 'pending',
        ]);

        $gross = '150000.00';

        $this->postJson('/payments/midtrans/webhook', [
            'order_id' => $order->order_number,
            'status_code' => '200',
            'gross_amount' => $gross,
            'signature_key' => $this->signature($order->order_number, '200', $gross),
            'transaction_status' => 'capture',
            'fraud_status' => 'challenge',
        ])->assertOk();

        $this->assertSame('pending', $order->fresh()->status);
        $this->assertDatabaseMissing('enrollments', [
            'user_id' => $student->id,
            'course_id' => $course->id,
        ]);
    }

    public function test_midtrans_capture_with_accept_grants_access(): void
    {
        config(['services.payment.midtrans.server_key' => 'test-server-key']);

        $provider = $this->provider();
        $student = User::factory()->create(['role' => 'student']);
        $course = $this->paidCourse();
        $order = Order::factory()->create([
            'user_id' => $student->id,
            'order_number' => 'ORD-MID-2',
            'status' => 'pending',
            'total_price' => 150000,
        ]);
        Payment::factory()->create([
            'order_id' => $order->id,
            'provider_id' => $provider->id,
            'amount' => 150000,
            'status' => 'pending',
        ]);
        OrderItem::factory()->create([
            'order_id' => $order->id,
            'course_id' => $course->id,
            'course_title' => $course->title,
            'course_price' => 150000,
        ]);

        $gross = '150000.00';

        $this->postJson('/payments/midtrans/webhook', [
            'order_id' => $order->order_number,
            'status_code' => '200',
            'gross_amount' => $gross,
            'signature_key' => $this->signature($order->order_number, '200', $gross),
            'transaction_status' => 'capture',
            'fraud_status' => 'accept',
        ])->assertOk();

        $this->assertSame('paid', $order->fresh()->status);
        $this->assertDatabaseHas('enrollments', [
            'user_id' => $student->id,
            'course_id' => $course->id,
            'status' => 'active',
        ]);
    }

    public function test_webhook_rejects_an_amount_that_does_not_match_the_order(): void
    {
        config(['services.payment.midtrans.server_key' => 'test-server-key']);

        $provider = $this->provider();
        $student = User::factory()->create(['role' => 'student']);
        $order = Order::factory()->create([
            'user_id' => $student->id,
            'order_number' => 'ORD-MID-3',
            'status' => 'pending',
            'total_price' => 150000,
        ]);
        Payment::factory()->create([
            'order_id' => $order->id,
            'provider_id' => $provider->id,
            'amount' => 150000,
            'status' => 'pending',
        ]);

        $gross = '1000.00';

        $this->postJson('/payments/midtrans/webhook', [
            'order_id' => $order->order_number,
            'status_code' => '200',
            'gross_amount' => $gross,
            'signature_key' => $this->signature($order->order_number, '200', $gross),
            'transaction_status' => 'settlement',
        ])->assertStatus(422);

        $this->assertSame('pending', $order->fresh()->status);
    }

    public function test_midtrans_refund_webhook_revokes_access_without_calling_the_api_again(): void
    {
        config(['services.payment.midtrans.server_key' => 'test-server-key']);

        $provider = $this->provider();
        $student = User::factory()->create(['role' => 'student']);
        $course = $this->paidCourse();
        $order = Order::factory()->create([
            'user_id' => $student->id,
            'order_number' => 'ORD-MID-4',
            'status' => 'paid',
            'total_price' => 150000,
            'paid_at' => now(),
        ]);
        $payment = Payment::factory()->create([
            'order_id' => $order->id,
            'provider_id' => $provider->id,
            'amount' => 150000,
            'status' => 'paid',
        ]);
        Enrollment::create([
            'user_id' => $student->id,
            'course_id' => $course->id,
            'status' => 'active',
            'enrolled_at' => now(),
        ]);
        OrderItem::factory()->create([
            'order_id' => $order->id,
            'course_id' => $course->id,
            'course_title' => $course->title,
            'course_price' => 150000,
        ]);

        Http::fake();

        $gross = '150000.00';

        $this->postJson('/payments/midtrans/webhook', [
            'order_id' => $order->order_number,
            'status_code' => '200',
            'gross_amount' => $gross,
            'signature_key' => $this->signature($order->order_number, '200', $gross),
            'transaction_status' => 'refund',
        ])->assertOk();

        $this->assertSame('refunded', $order->fresh()->status);
        $this->assertSame('refunded', $payment->fresh()->status);
        $this->assertSame(1, Refund::where('payment_id', $payment->id)->count());
        $this->assertSame('revoked', Enrollment::where('user_id', $student->id)->where('course_id', $course->id)->first()?->status);

        Http::assertNothingSent();
    }

    public function test_admin_refund_calls_the_midtrans_refund_api(): void
    {
        config([
            'services.payment.midtrans.server_key' => 'test-server-key',
            'services.payment.midtrans.api_base_url' => 'https://api.sandbox.midtrans.com',
        ]);

        Http::fake([
            'https://api.sandbox.midtrans.com/v2/*/refund' => Http::response(['status_code' => '200'], 200),
        ]);

        $admin = User::factory()->create(['role' => 'admin']);
        $student = User::factory()->create(['role' => 'student']);
        $course = $this->paidCourse();
        $order = Order::factory()->create([
            'user_id' => $student->id,
            'order_number' => 'ORD-MID-5',
            'status' => 'paid',
            'total_price' => 150000,
            'paid_at' => now(),
        ]);
        $payment = Payment::factory()->create([
            'order_id' => $order->id,
            'provider_id' => $this->provider()->id,
            'amount' => 150000,
            'status' => 'paid',
        ]);
        OrderItem::factory()->create([
            'order_id' => $order->id,
            'course_id' => $course->id,
            'course_title' => $course->title,
            'course_price' => 150000,
        ]);

        $this->actingAs($admin)
            ->post(route('admin.orders.refund', $order), ['reason' => 'Student request'])
            ->assertRedirect();

        $this->assertSame('refunded', $order->fresh()->status);
        $this->assertSame('refunded', $payment->fresh()->status);
        $this->assertDatabaseHas('refunds', [
            'payment_id' => $payment->id,
            'status' => 'success',
        ]);

        Http::assertSent(fn ($request) => $request->url() === 'https://api.sandbox.midtrans.com/v2/ORD-MID-5/refund'
            && $request->data()['amount'] === 150000);
    }

    public function test_payment_seeder_switches_an_existing_installation_to_midtrans(): void
    {
        config(['services.payment.midtrans.server_key' => 'SB-Mid-server-test']);

        PaymentSetting::current()->forceFill(['gateway' => 'midtrans'])->save();

        $this->seed(PaymentSeeder::class);

        $this->assertSame('midtrans', PaymentSetting::current()->gateway);
        $this->assertDatabaseHas('payment_providers', ['code' => 'midtrans', 'is_active' => true]);
    }

    public function test_instructor_can_save_a_payout_bank_account(): void
    {
        $instructor = User::factory()->create(['role' => 'instructor']);

        $this->actingAs($instructor)
            ->put('/instructor/settings/payout', [
                'bank_name' => 'BCA',
                'account_number' => '123-456-7890',
                'account_name' => 'Budi Santoso',
            ])
            ->assertRedirect();

        $instructor->refresh();

        $this->assertSame('BCA', $instructor->payout_bank_name);
        $this->assertSame('1234567890', $instructor->payout_account_number);
        $this->assertSame('Budi Santoso', $instructor->payout_account_name);
    }

    public function test_payout_account_rejects_invalid_account_numbers(): void
    {
        $instructor = User::factory()->create(['role' => 'instructor']);

        $this->actingAs($instructor)
            ->put('/instructor/settings/payout', [
                'bank_name' => 'BCA',
                'account_number' => 'not-a-number',
                'account_name' => 'Budi Santoso',
            ])
            ->assertSessionHasErrors('account_number');
    }
}
