<?php

use App\Models\Course;
use App\Models\Enrollment;
use App\Models\Material;
use App\Models\MaterialContent;
use App\Models\MaterialContentProgress;
use App\Models\Module;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

function makeRefundPolicyCourse(string $type = 'paid'): array
{
    $instructor = User::factory()->create(['role' => 'instructor']);
    $student = User::factory()->create(['role' => 'student']);

    $course = Course::factory()->create([
        'creator_id' => $instructor->id,
        'status' => 'published',
        'type' => $type,
        'price' => $type === 'paid' ? 150000 : 0,
    ]);

    Enrollment::factory()->create([
        'user_id' => $student->id,
        'course_id' => $course->id,
        'status' => 'active',
        'enrolled_at' => now(),
    ]);

    $module = Module::factory()->create([
        'course_id' => $course->id,
        'status' => 'published',
    ]);

    $material = Material::factory()->create([
        'module_id' => $module->id,
        'status' => 'published',
    ]);

    $contents = collect(range(1, 4))->map(fn (int $index) => MaterialContent::factory()->create([
        'material_id' => $material->id,
        'type' => 'text',
        'title' => "Lesson {$index}",
        'status' => 'published',
    ]));

    return [$student, $course, $contents];
}

it('shows the refund policy for an enrolled paid course', function () {
    [$student, $course] = makeRefundPolicyCourse();

    $this->actingAs($student)
        ->get(route('student.courses.show', $course->slug))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('student/course/[enroll]/page')
            ->where('refundPolicy.applies', true)
            ->where('refundPolicy.eligible', true)
            ->where('refundPolicy.expired', false)
            ->where('refundPolicy.over_progress', false)
            ->where('refundPolicy.window_days', 7)
            ->where('refundPolicy.max_progress_percent', 25)
            ->where('refundPolicy.progress_percent', 0)
            ->has('refundPolicy.deadline'));

    $this->actingAs($student)
        ->get(route('course.show', $course->slug))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('course/[slug]/page')
            ->where('refundPolicy.applies', true)
            ->where('refundPolicy.eligible', true));
});

it('marks the refund as expired after the configured window', function () {
    [$student, $course] = makeRefundPolicyCourse();

    $this->travel(8)->days();

    $this->actingAs($student)
        ->get(route('student.courses.show', $course->slug))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('refundPolicy.applies', true)
            ->where('refundPolicy.eligible', false)
            ->where('refundPolicy.expired', true)
            ->where('refundPolicy.over_progress', false)
            ->where('refundPolicy.days_left', 0));
});

it('allows refund while progress is exactly at the configured limit', function () {
    [$student, $course, $contents] = makeRefundPolicyCourse();

    // 1 of 4 lessons = 25%, which is still allowed.
    MaterialContentProgress::create([
        'user_id' => $student->id,
        'material_content_id' => $contents->first()->id,
        'is_completed' => true,
        'completed_at' => now(),
    ]);

    $this->actingAs($student)
        ->get(route('student.courses.show', $course->slug))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('refundPolicy.progress_percent', 25)
            ->where('refundPolicy.over_progress', false)
            ->where('refundPolicy.eligible', true));
});

it('blocks refund once progress passes the configured limit', function () {
    [$student, $course, $contents] = makeRefundPolicyCourse();

    // 2 of 4 lessons = 50%, above the 25% refund limit.
    foreach ($contents->take(2) as $content) {
        MaterialContentProgress::create([
            'user_id' => $student->id,
            'material_content_id' => $content->id,
            'is_completed' => true,
            'completed_at' => now(),
        ]);
    }

    $this->actingAs($student)
        ->get(route('student.courses.show', $course->slug))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('refundPolicy.applies', true)
            ->where('refundPolicy.eligible', false)
            ->where('refundPolicy.expired', false)
            ->where('refundPolicy.over_progress', true)
            ->where('refundPolicy.progress_percent', 50));
});

it('does not apply the refund policy to free courses', function () {
    [$student, $course] = makeRefundPolicyCourse('free');

    $this->actingAs($student)
        ->get(route('student.courses.show', $course->slug))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('refundPolicy.applies', false)
            ->where('refundPolicy.eligible', false));
});
