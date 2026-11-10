<?php

use App\Models\Course;
use App\Models\Enrollment;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\User;

it('exports orders as CSV', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $student = User::factory()->create(['role' => 'student', 'email' => 'buyer@example.com']);

    $order = Order::factory()->create([
        'user_id' => $student->id,
        'order_number' => 'ORD-EXPORT-123',
        'status' => 'paid',
        'total_price' => 150000,
    ]);

    OrderItem::factory()->create([
        'order_id' => $order->id,
        'course_title' => 'Exported Course',
    ]);

    $response = $this->actingAs($admin)->get('/admin/orders/export');

    $response->assertOk();
    $response->assertHeader('content-type', 'text/csv; charset=UTF-8');

    $csv = $response->streamedContent();

    expect($csv)
        ->toContain('Order Number')
        ->toContain('ORD-EXPORT-123')
        ->toContain('buyer@example.com')
        ->toContain('Exported Course');
});

it('exports users filtered by role', function () {
    $admin = User::factory()->create(['role' => 'admin', 'email' => 'admin-export@example.com']);
    User::factory()->create(['role' => 'student', 'email' => 'student-export@example.com']);
    User::factory()->create(['role' => 'instructor', 'email' => 'instructor-export@example.com']);

    $response = $this->actingAs($admin)->get('/admin/users/export?role=student');

    $response->assertOk();

    $csv = $response->streamedContent();

    expect($csv)
        ->toContain('student-export@example.com')
        ->not->toContain('admin-export@example.com')
        ->not->toContain('instructor-export@example.com');
});

it('exports enrolled students for a course', function () {
    $instructor = User::factory()->create(['role' => 'instructor']);
    $student = User::factory()->create(['role' => 'student', 'email' => 'enrolled@example.com']);

    $course = Course::factory()->create([
        'creator_id' => $instructor->id,
        'status' => 'published',
    ]);

    Enrollment::factory()->create([
        'user_id' => $student->id,
        'course_id' => $course->id,
        'status' => 'active',
        'enrolled_at' => now(),
    ]);

    $response = $this->actingAs($instructor)->get("/instructor/courses/{$course->slug}/students/export");

    $response->assertOk();

    expect($response->streamedContent())->toContain('enrolled@example.com');
});

it('forbids instructors from exporting students of another course', function () {
    $owner = User::factory()->create(['role' => 'instructor']);
    $other = User::factory()->create(['role' => 'instructor']);

    $course = Course::factory()->create([
        'creator_id' => $owner->id,
        'status' => 'published',
    ]);

    $this->actingAs($other)
        ->get("/instructor/courses/{$course->slug}/students/export")
        ->assertForbidden();
});

it('forbids students from exporting admin data', function () {
    $student = User::factory()->create(['role' => 'student']);

    $this->actingAs($student)->get('/admin/orders/export')->assertForbidden();
    $this->actingAs($student)->get('/admin/users/export')->assertForbidden();
});
