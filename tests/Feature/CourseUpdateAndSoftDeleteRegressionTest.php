<?php

namespace Tests\Feature;

use App\Models\Course;
use App\Models\Review;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class CourseUpdateAndSoftDeleteRegressionTest extends TestCase
{
    use RefreshDatabase;

    public function test_updating_course_title_redirects_to_the_regenerated_slug(): void
    {
        /** @var User $instructor */
        $instructor = User::factory()->create(['role' => 'instructor']);

        $course = Course::factory()->create([
            'creator_id' => $instructor->id,
            'title' => 'Original Title',
            'slug' => 'original-title',
            'status' => 'draft',
        ]);

        $response = $this->actingAs($instructor)->put(
            route('instructor.courses.update', $course->slug),
            ['title' => 'Brand New Title']
        );

        $course->refresh();

        $this->assertSame('brand-new-title', $course->slug);
        $response->assertRedirect(route('instructor.courses.show', $course->slug));
    }

    public function test_admin_can_moderate_a_review_whose_course_was_soft_deleted(): void
    {        /** @var User $admin */
        $admin = User::factory()->create(['role' => 'admin']);
        /** @var User $instructor */
        $instructor = User::factory()->create(['role' => 'instructor']);

        $course = Course::factory()->create(['creator_id' => $instructor->id]);
        /** @var Review $review */
        $review = Review::factory()->create([
            'course_id' => $course->id,
            'is_approved' => false,
        ]);

        $course->delete();

        $this->actingAs($admin)
            ->put(route('admin.reviews.approve', $review))
            ->assertRedirect();

        $this->assertDatabaseHas('reviews', [
            'id' => $review->id,
            'is_approved' => true,
        ]);
    }

    public function test_legal_pages_are_reachable_and_render_informative_content(): void
    {
        $this->get('/terms')->assertOk()->assertInertia(fn (Assert $page) => $page->component('legal/terms'));

        $this->get('/privacy')->assertOk()->assertInertia(fn (Assert $page) => $page->component('legal/privacy'));
    }

    public function test_forgot_password_request_is_handled(): void
    {
        $user = User::factory()->create(['email' => 'student@example.com']);

        $this->post('/forgot-password', ['email' => $user->email])
            ->assertRedirect();
    }

    public function test_user_can_resend_the_verification_email(): void
    {
        $user = User::factory()->create([
            'role' => 'student',
            'email_verified_at' => null,
        ]);

        $this->actingAs($user)
            ->post('/email/resend')
            ->assertRedirect();
    }

    public function test_student_cannot_promote_themselves_to_instructor(): void
    {
        /** @var User $student */
        $student = User::factory()->create(['role' => 'student']);

        $this->actingAs($student)
            ->post('/choose-role', ['role' => 'instructor'])
            ->assertForbidden();

        $this->assertSame('student', $student->refresh()->role);
    }

    public function test_instructor_earnings_use_actual_paid_orders(): void
    {
        /** @var User $instructor */
        $instructor = User::factory()->create(['role' => 'instructor']);
        /** @var User $student */
        $student = User::factory()->create(['role' => 'student']);

        $course = Course::factory()->create([
            'creator_id' => $instructor->id,
            'type' => 'paid',
            'price' => 150000,
            'status' => 'published',
        ]);

        $order = \App\Models\Order::factory()->create([
            'user_id' => $student->id,
            'order_number' => 'ORD-TEST-1',
            'status' => 'paid',
            'total_price' => 150000,
        ]);

        \App\Models\OrderItem::create([
            'order_id' => $order->id,
            'course_id' => $course->id,
            'course_title' => $course->title,
            'course_price' => 150000,
        ]);

        // A pending order must not inflate earnings.
        $pending = \App\Models\Order::factory()->create([
            'user_id' => $student->id,
            'order_number' => 'ORD-TEST-2',
            'status' => 'pending',
            'total_price' => 150000,
        ]);

        \App\Models\OrderItem::create([
            'order_id' => $pending->id,
            'course_id' => $course->id,
            'course_title' => $course->title,
            'course_price' => 150000,
        ]);

        $data = app(\App\Services\DashboardService::class)->instructorData($instructor);

        $this->assertSame(150000.0, (float) $data['totalEarnings']);
    }
}
