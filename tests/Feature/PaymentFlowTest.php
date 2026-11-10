<?php

namespace Tests\Feature;

use App\Models\Course;
use App\Models\Enrollment;
use App\Models\Order;
use App\Models\PaymentMethod;
use App\Models\PaymentProvider;
use App\Models\PaymentSetting;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class PaymentFlowTest extends TestCase
{
    use RefreshDatabase;

    private function makeCourse(): Course
    {
        return Course::factory()->create([
            'type' => 'paid',
            'price' => 150000,
            'status' => 'published',
            'published_at' => now(),
        ]);
    }

    private function makeMethod(): PaymentMethod
    {
        $provider = PaymentProvider::factory()->create([
            'name' => 'Midtrans',
            'code' => 'midtrans',
            'is_active' => true,
        ]);

        return PaymentMethod::factory()->create([
            'provider_id' => $provider->id,
            'name' => 'Credit Card',
            'code' => 'credit_card',
        ]);
    }

    public function test_paid_course_enrollment_redirects_to_checkout(): void
    {
        $student = User::factory()->create(['role' => 'student']);
        $course = $this->makeCourse();

        $this->actingAs($student)
            ->post("/course/{$course->slug}/enroll")
            ->assertRedirect(route('student.course.checkout', $course->slug));

        $this->assertDatabaseMissing('enrollments', [
            'user_id' => $student->id,
            'course_id' => $course->id,
            'status' => 'active',
        ]);
    }

    public function test_free_course_enrollment_activates_immediately(): void
    {
        $student = User::factory()->create(['role' => 'student']);
        $course = Course::factory()->create([
            'type' => 'free',
            'price' => 0,
            'status' => 'published',
            'published_at' => now(),
        ]);

        $this->actingAs($student)
            ->post("/course/{$course->slug}/enroll")
            ->assertRedirect(route('student.courses.show', $course->slug));

        $this->assertDatabaseHas('enrollments', [
            'user_id' => $student->id,
            'course_id' => $course->id,
            'status' => 'active',
        ]);
    }

    public function test_student_can_create_midtrans_payment_order(): void
    {
        config(['services.payment.midtrans.server_key' => 'test-server-key']);

        PaymentSetting::current()->forceFill(['gateway' => 'midtrans'])->save();

        Http::fake([
            'https://app.sandbox.midtrans.com/snap/v1/transactions' => Http::response([
                'token' => 'snap-token-123',
                'redirect_url' => 'https://app.sandbox.midtrans.com/snap/v2/vtweb/snap-token-123',
            ], 201),
        ]);

        $student = User::factory()->create(['role' => 'student']);
        $course = $this->makeCourse();
        $method = $this->makeMethod();

        $response = $this->actingAs($student)->post("/student/courses/{$course->slug}/checkout", [
            'payment_method_id' => $method->id,
        ]);

        $response->assertSessionHasNoErrors();

        $order = Order::query()->where('user_id', $student->id)->first();

        $this->assertNotNull($order);
        $this->assertSame('pending', $order->status);
        $this->assertDatabaseHas('payments', [
            'order_id' => $order->id,
            'amount' => 150000,
            'status' => 'pending',
        ]);

        $response->assertRedirect('https://app.sandbox.midtrans.com/snap/v2/vtweb/snap-token-123');
    }

    public function test_inertia_checkout_returns_a_location_header_for_the_gateway(): void
    {
        config(['services.payment.midtrans.server_key' => 'test-server-key']);

        PaymentSetting::current()->forceFill(['gateway' => 'midtrans'])->save();

        Http::fake([
            'https://app.sandbox.midtrans.com/snap/v1/transactions' => Http::response([
                'token' => 'snap-token-123',
                'redirect_url' => 'https://app.sandbox.midtrans.com/snap/v2/vtweb/snap-token-123',
            ], 201),
        ]);

        $student = User::factory()->create(['role' => 'student']);
        $course = $this->makeCourse();
        $method = $this->makeMethod();

        $this->actingAs($student)
            ->withHeader('X-Inertia', 'true')
            ->post("/student/courses/{$course->slug}/checkout", [
                'payment_method_id' => $method->id,
            ])
            ->assertStatus(409)
            ->assertHeader('X-Inertia-Location', 'https://app.sandbox.midtrans.com/snap/v2/vtweb/snap-token-123');
    }

    public function test_retry_checkout_replaces_a_cancelled_gateway_transaction(): void
    {
        config(['services.payment.midtrans.server_key' => 'test-server-key']);

        PaymentSetting::current()->forceFill(['gateway' => 'midtrans'])->save();

        Http::fake([
            'https://app.sandbox.midtrans.com/snap/v1/transactions' => Http::sequence()
                ->push([
                    'token' => 'snap-token-old',
                    'redirect_url' => 'https://app.sandbox.midtrans.com/snap/v2/vtweb/snap-token-old',
                ], 201)
                ->push([
                    'token' => 'snap-token-new',
                    'redirect_url' => 'https://app.sandbox.midtrans.com/snap/v2/vtweb/snap-token-new',
                ], 201),
            'https://api.sandbox.midtrans.com/v2/*/status' => Http::response([
                'status_code' => '200',
                'transaction_status' => 'cancel',
                'fraud_status' => 'accept',
            ], 200),
        ]);

        $student = User::factory()->create(['role' => 'student']);
        $course = $this->makeCourse();
        $this->makeMethod();

        $this->actingAs($student)
            ->post("/student/courses/{$course->slug}/checkout")
            ->assertRedirect('https://app.sandbox.midtrans.com/snap/v2/vtweb/snap-token-old');

        $oldOrder = Order::query()->where('user_id', $student->id)->firstOrFail();
        $this->assertSame('pending', $oldOrder->status);

        $this->actingAs($student)
            ->post("/student/courses/{$course->slug}/checkout")
            ->assertRedirect('https://app.sandbox.midtrans.com/snap/v2/vtweb/snap-token-new');

        $this->assertSame('failed', $oldOrder->fresh()->status);

        $newOrder = Order::query()->where('user_id', $student->id)->latest('id')->firstOrFail();

        $this->assertNotSame($oldOrder->id, $newOrder->id);
        $this->assertSame('pending', $newOrder->status);
        $this->assertDatabaseHas('payments', [
            'order_id' => $newOrder->id,
            'payment_url' => 'https://app.sandbox.midtrans.com/snap/v2/vtweb/snap-token-new',
        ]);
    }

    public function test_retry_checkout_uses_the_gateway_status_when_already_paid(): void
    {
        config(['services.payment.midtrans.server_key' => 'test-server-key']);

        PaymentSetting::current()->forceFill(['gateway' => 'midtrans'])->save();

        Http::fake([
            'https://app.sandbox.midtrans.com/snap/v1/transactions' => Http::response([
                'token' => 'snap-token-123',
                'redirect_url' => 'https://app.sandbox.midtrans.com/snap/v2/vtweb/snap-token-123',
            ], 201),
            'https://api.sandbox.midtrans.com/v2/*/status' => Http::response([
                'status_code' => '200',
                'transaction_status' => 'settlement',
                'fraud_status' => 'accept',
            ], 200),
        ]);

        $student = User::factory()->create(['role' => 'student']);
        $course = $this->makeCourse();
        $this->makeMethod();

        $this->actingAs($student)->post("/student/courses/{$course->slug}/checkout");

        $order = Order::query()->where('user_id', $student->id)->firstOrFail();

        $this->actingAs($student)
            ->post("/student/courses/{$course->slug}/checkout")
            ->assertRedirect(route('student.courses.show', $course->slug));

        $this->assertSame('paid', $order->fresh()->status);
        $this->assertSame(1, Order::query()->where('user_id', $student->id)->count());
        $this->assertDatabaseHas('enrollments', [
            'user_id' => $student->id,
            'course_id' => $course->id,
            'status' => 'active',
        ]);
    }

    public function test_midtrans_webhook_marks_order_paid_and_enrolls_student(): void
    {
        config(['services.payment.midtrans.server_key' => 'test-server-key']);

        PaymentSetting::current()->forceFill(['gateway' => 'midtrans'])->save();

        Http::fake([
            'https://app.sandbox.midtrans.com/snap/v1/transactions' => Http::response([
                'token' => 'snap-token-123',
                'redirect_url' => 'https://app.sandbox.midtrans.com/snap/v2/vtweb/snap-token-123',
            ], 201),
        ]);

        $student = User::factory()->create(['role' => 'student']);
        $course = $this->makeCourse();
        $method = $this->makeMethod();

        $this->actingAs($student)->post("/student/courses/{$course->slug}/checkout", [
            'payment_method_id' => $method->id,
        ]);

        $order = Order::query()->where('user_id', $student->id)->firstOrFail();
        $grossAmount = number_format((float) $order->total_price, 2, '.', '');
        $signature = hash('sha512', $order->order_number.'200'.$grossAmount.'test-server-key');

        $response = $this->postJson('/payments/midtrans/webhook', [
            'order_id' => $order->order_number,
            'status_code' => '200',
            'gross_amount' => $grossAmount,
            'signature_key' => $signature,
            'transaction_status' => 'settlement',
            'fraud_status' => 'accept',
        ]);

        $response->assertOk();

        $this->assertSame('paid', $order->fresh()->status);
        $this->assertDatabaseHas('payments', ['order_id' => $order->id, 'status' => 'paid']);
        $this->assertDatabaseHas('enrollments', [
            'user_id' => $student->id,
            'course_id' => $course->id,
            'status' => 'active',
        ]);

        // Re-delivering the same webhook must be idempotent.
        $this->postJson('/payments/midtrans/webhook', [
            'order_id' => $order->order_number,
            'status_code' => '200',
            'gross_amount' => $grossAmount,
            'signature_key' => $signature,
            'transaction_status' => 'settlement',
            'fraud_status' => 'accept',
        ])->assertOk();

        $this->assertSame(1, Enrollment::query()->where('user_id', $student->id)->where('course_id', $course->id)->count());
    }

    public function test_midtrans_webhook_rejects_invalid_signature(): void
    {
        config(['services.payment.midtrans.server_key' => 'test-server-key']);

        $this->postJson('/payments/midtrans/webhook', [
            'order_id' => 'ORD-UNKNOWN',
            'status_code' => '200',
            'gross_amount' => '100.00',
            'signature_key' => 'invalid',
            'transaction_status' => 'settlement',
        ])->assertForbidden();
    }

    public function test_admin_can_update_payment_gateway(): void
    {
        /** @var User $admin */
        $admin = User::factory()->create(['role' => 'admin']);
        $this->actingAs($admin);

        $response = $this->put(route('admin.settings.payment.update'), [
            'gateway' => 'midtrans',
            'currency' => 'IDR',
        ]);

        $response->assertRedirect();
        $response->assertSessionHas('success');

        $this->assertSame('midtrans', app(\App\Services\Payment\PaymentSettings::class)->current()->gateway);
    }

    public function test_admin_cannot_update_payment_gateway_with_invalid_value(): void
    {
        /** @var User $admin */
        $admin = User::factory()->create(['role' => 'admin']);
        $this->actingAs($admin);

        $response = $this->put(route('admin.settings.payment.update'), [
            'gateway' => 'paypal',
            'currency' => 'IDR',
        ]);

        $response->assertSessionHasErrors('gateway');
    }

    public function test_student_cannot_update_payment_gateway(): void
    {
        /** @var User $student */
        $student = User::factory()->create(['role' => 'student']);
        $this->actingAs($student);

        $this->put(route('admin.settings.payment.update'), [
            'gateway' => 'midtrans',
            'currency' => 'IDR',
        ])->assertForbidden();
    }

    public function test_admin_can_update_platform_fee_percent(): void
    {
        /** @var User $admin */
        $admin = User::factory()->create(['role' => 'admin']);
        $this->actingAs($admin);

        $response = $this->put(route('admin.settings.payment.update'), [
            'gateway' => 'midtrans',
            'currency' => 'IDR',
            'platform_fee_percent' => 15,
        ]);

        $response->assertRedirect();
        $response->assertSessionHas('success');

        $this->assertSame(15.0, (float) PaymentSetting::current()->platform_fee_percent);
    }

    public function test_admin_cannot_update_platform_fee_percent_outside_allowed_range(): void
    {
        /** @var User $admin */
        $admin = User::factory()->create(['role' => 'admin']);
        $this->actingAs($admin);

        $this->put(route('admin.settings.payment.update'), [
            'gateway' => 'midtrans',
            'currency' => 'IDR',
            'platform_fee_percent' => 150,
        ])->assertSessionHasErrors('platform_fee_percent');

        $this->assertSame(20.0, (float) PaymentSetting::current()->platform_fee_percent);
    }
}
