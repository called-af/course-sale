<?php

namespace Tests\Feature;

use App\Models\Course;
use App\Models\InstructorPayout;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Payment;
use App\Models\PaymentProvider;
use App\Models\PaymentSetting;
use App\Models\PayoutAccountAudit;
use App\Models\User;
use App\Services\Payment\PaymentService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class InstructorPayoutOperationsTest extends TestCase
{
    use RefreshDatabase;

    private function configurePayouts(int $holdDays = 0, float $minimum = 0, int $lockHours = 24): void
    {
        PaymentSetting::current()->forceFill([
            'payout_hold_days' => $holdDays,
            'payout_minimum' => $minimum,
            'payout_account_lock_hours' => $lockHours,
        ])->save();
    }

    private function provider(): PaymentProvider
    {
        return PaymentProvider::factory()->create([
            'name' => 'Midtrans',
            'code' => 'midtrans',
            'is_active' => true,
        ]);
    }

    private function paidCourse(?User $instructor = null): Course
    {
        $attributes = [
            'title' => 'Payout Course',
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

    /**
     * @return array{0: Order, 1: Payment}
     */
    private function orderWithPayment(User $student, Course $course): array
    {
        $order = Order::factory()->create([
            'user_id' => $student->id,
            'order_number' => 'ORD-PAYOUT-'.fake()->unique()->numerify('####'),
            'status' => 'pending',
            'total_price' => 150000,
        ]);

        OrderItem::factory()->create([
            'order_id' => $order->id,
            'course_id' => $course->id,
            'course_title' => $course->title,
            'course_price' => 150000,
        ]);

        $payment = Payment::factory()->create([
            'order_id' => $order->id,
            'provider_id' => $this->provider()->id,
            'amount' => 150000,
            'status' => 'pending',
        ]);

        return [$order, $payment];
    }

    private function instructor(array $overrides = []): User
    {
        return User::factory()->create(array_merge([
            'role' => 'instructor',
            'password' => Hash::make('secret-password'),
            'payout_bank_name' => 'BCA',
            'payout_account_number' => '1234567890',
            'payout_account_name' => 'Instructor Name',
        ], $overrides));
    }

    private function payout(User $instructor, array $overrides = []): InstructorPayout
    {
        return InstructorPayout::create(array_merge([
            'instructor_id' => $instructor->id,
            'gross_amount' => 150000,
            'platform_fee' => 30000,
            'net_amount' => 120000,
            'status' => 'pending',
            'available_at' => now()->subMinute(),
        ], $overrides));
    }

    private function admin(): User
    {
        return User::factory()->create(['role' => 'admin']);
    }

    public function test_ledger_available_at_follows_the_hold_period(): void
    {
        config(['services.payment.midtrans.server_key' => 'test-server-key']);
        $this->configurePayouts(7);

        $instructor = $this->instructor();
        $student = User::factory()->create(['role' => 'student']);
        $course = $this->paidCourse($instructor);
        [$order, $payment] = $this->orderWithPayment($student, $course);

        app(PaymentService::class)->markPaid($payment);

        $payout = InstructorPayout::where('order_id', $order->id)->firstOrFail();

        $this->assertNotNull($payout->available_at);
        $this->assertTrue($payout->available_at->greaterThan(now()->addDays(6)->addHours(23)));
        $this->assertTrue($payout->available_at->lessThan(now()->addDays(7)->addHour()));
        $this->assertFalse($payout->isAvailable());
    }

    public function test_admin_cannot_mark_a_payout_paid_before_the_hold_period_ends(): void
    {
        $this->configurePayouts(7, 0);

        $instructor = $this->instructor();
        $payout = $this->payout($instructor, ['available_at' => now()->addDays(3)]);

        $this->actingAs($this->admin())
            ->put(route('admin.payouts.pay', $payout), ['reference' => 'TRF-EARLY'])
            ->assertSessionHas('error');

        $this->assertSame('pending', $payout->fresh()->status);
    }

    public function test_admin_can_mark_a_payout_paid_after_the_hold_period(): void
    {
        $this->configurePayouts(7, 0);

        $instructor = $this->instructor();
        $payout = $this->payout($instructor, ['available_at' => now()->subMinute()]);

        $this->actingAs($this->admin())
            ->put(route('admin.payouts.pay', $payout), ['reference' => 'TRF-OK'])
            ->assertSessionHas('success');

        $payout->refresh();

        $this->assertSame('paid', $payout->status);
        $this->assertSame('TRF-OK', $payout->reference);
        $this->assertNotNull($payout->paid_at);
    }

    public function test_admin_cannot_pay_below_the_minimum_threshold(): void
    {
        $this->configurePayouts(0, 200000);

        $instructor = $this->instructor();
        $payout = $this->payout($instructor);

        $this->actingAs($this->admin())
            ->put(route('admin.payouts.pay', $payout))
            ->assertSessionHas('error');

        $this->assertSame('pending', $payout->fresh()->status);
    }

    public function test_admin_cannot_pay_an_instructor_with_an_incomplete_bank_account(): void
    {
        $this->configurePayouts(0, 0);

        $instructor = $this->instructor([
            'payout_bank_name' => null,
            'payout_account_number' => null,
            'payout_account_name' => null,
        ]);
        $payout = $this->payout($instructor);

        $this->actingAs($this->admin())
            ->put(route('admin.payouts.pay', $payout))
            ->assertSessionHas('error');

        $this->assertSame('pending', $payout->fresh()->status);
    }

    public function test_a_recently_changed_bank_account_locks_payouts(): void
    {
        $this->configurePayouts(0, 0, 24);

        $instructor = $this->instructor(['payout_account_updated_at' => now()->subHour()]);
        $payout = $this->payout($instructor);

        $this->actingAs($this->admin())
            ->put(route('admin.payouts.pay', $payout))
            ->assertSessionHas('error');

        $this->assertSame('pending', $payout->fresh()->status);
    }

    public function test_admin_can_batch_pay_every_available_ledger_for_an_instructor(): void
    {
        $this->configurePayouts(0, 0);

        $instructor = $this->instructor();
        $first = $this->payout($instructor);
        $second = $this->payout($instructor);

        $this->actingAs($this->admin())
            ->put(route('admin.payouts.batch.pay'), [
                'instructor_id' => $instructor->id,
                'reference' => 'BATCH-OK',
            ])
            ->assertSessionHas('success');

        $this->assertSame('paid', $first->fresh()->status);
        $this->assertSame('paid', $second->fresh()->status);
        $this->assertSame('BATCH-OK', $first->fresh()->reference);
        $this->assertSame('BATCH-OK', $second->fresh()->reference);
    }

    public function test_admin_can_export_ready_payouts_to_csv(): void
    {
        $this->configurePayouts(0, 0);

        $instructor = $this->instructor(['name' => 'Budi Santoso']);
        $this->payout($instructor);

        $response = $this->actingAs($this->admin())->get(route('admin.payouts.export'));

        $response->assertOk();
        $this->assertStringStartsWith('text/csv', (string) $response->headers->get('content-type'));

        $content = $response->streamedContent();

        $this->assertStringContainsString('Budi Santoso', $content);
        $this->assertStringContainsString('BCA', $content);
        $this->assertStringContainsString('1234567890', $content);
        $this->assertStringContainsString('120000.00', $content);
    }

    public function test_changing_the_bank_account_requires_the_current_password(): void
    {
        $instructor = $this->instructor();
        $this->actingAs($instructor);

        $this->put(route('instructor.settings.payout.update'), [
            'bank_name' => 'BNI',
            'account_number' => '999888777',
            'account_name' => 'Instructor Name',
        ])->assertSessionHasErrors('current_password');

        $this->assertSame('BCA', $instructor->fresh()->payout_bank_name);
        $this->assertDatabaseCount('payout_account_audits', 0);
    }

    public function test_changing_the_bank_account_with_the_correct_password_is_audited_and_locked(): void
    {
        $this->configurePayouts(0, 0, 24);

        $instructor = $this->instructor();
        $this->actingAs($instructor);

        $this->put(route('instructor.settings.payout.update'), [
            'bank_name' => 'BNI',
            'account_number' => '999888777',
            'account_name' => 'Instructor Name',
            'current_password' => 'secret-password',
        ])->assertSessionHas('success');

        $instructor->refresh();

        $this->assertSame('BNI', $instructor->payout_bank_name);
        $this->assertSame('999888777', $instructor->payout_account_number);
        $this->assertNotNull($instructor->payout_account_updated_at);
        $this->assertTrue($instructor->isPayoutAccountLocked());

        $audit = PayoutAccountAudit::where('user_id', $instructor->id)->firstOrFail();

        $this->assertContains('bank_name', $audit->changed_fields);
        $this->assertContains('account_number', $audit->changed_fields);
        $this->assertSame('BCA', $audit->old_values['bank_name']);
        $this->assertSame('BNI', $audit->new_values['bank_name']);
    }

    public function test_admin_can_update_payout_operations_settings(): void
    {
        $this->actingAs($this->admin())
            ->put(route('admin.settings.payment.update'), [
                'gateway' => 'midtrans',
                'currency' => 'IDR',
                'payout_hold_days' => 3,
                'payout_minimum' => 50000,
                'payout_account_lock_hours' => 12,
            ])
            ->assertSessionHas('success');

        $setting = PaymentSetting::current()->fresh();

        $this->assertSame(3, (int) $setting->payout_hold_days);
        $this->assertSame(50000.0, (float) $setting->payout_minimum);
        $this->assertSame(12, (int) $setting->payout_account_lock_hours);
    }
}
