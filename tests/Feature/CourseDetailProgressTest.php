<?php

use App\Models\Course;
use App\Models\Enrollment;
use App\Models\Material;
use App\Models\MaterialContent;
use App\Models\MaterialContentProgress;
use App\Models\Module;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

function makeCourseProgressCourse(): array
{
    $instructor = User::factory()->create(['role' => 'instructor']);
    $student = User::factory()->create(['role' => 'student']);

    $course = Course::factory()->create([
        'creator_id' => $instructor->id,
        'status' => 'published',
        'type' => 'free',
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

    $firstContent = MaterialContent::factory()->create([
        'material_id' => $material->id,
        'type' => 'text',
        'title' => 'First lesson',
        'status' => 'published',
    ]);

    $secondContent = MaterialContent::factory()->create([
        'material_id' => $material->id,
        'type' => 'file',
        'title' => 'Second lesson',
        'status' => 'published',
    ]);

    return [$student, $course, $firstContent, $secondContent];
}

it('calculates course progress from individual material contents', function () {
    [$student, $course, $firstContent, $secondContent] = makeCourseProgressCourse();

    MaterialContentProgress::create([
        'user_id' => $student->id,
        'material_content_id' => $firstContent->id,
        'is_completed' => true,
        'completed_at' => now(),
    ]);

    $this->actingAs($student)
        ->get("/course/{$course->slug}")
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('course/[slug]/page')
            ->where('progressPercent', 50)
            ->where('completedCount', 1)
            ->where('totalContents', 2));

    MaterialContentProgress::create([
        'user_id' => $student->id,
        'material_content_id' => $secondContent->id,
        'is_completed' => true,
        'completed_at' => now(),
    ]);

    $this->actingAs($student)
        ->get("/course/{$course->slug}")
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('progressPercent', 100)
            ->where('completedCount', 2)
            ->where('totalContents', 2));
});

it('ignores incomplete and unpublished contents in course progress', function () {
    [$student, $course, $firstContent, $secondContent] = makeCourseProgressCourse();

    MaterialContentProgress::create([
        'user_id' => $student->id,
        'material_content_id' => $firstContent->id,
        'is_completed' => false,
        'completed_at' => null,
    ]);

    // Unpublished content must not inflate the total.
    MaterialContent::factory()->create([
        'material_id' => $firstContent->material_id,
        'type' => 'text',
        'status' => 'draft',
    ]);

    $this->actingAs($student)
        ->get("/course/{$course->slug}")
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('progressPercent', 0)
            ->where('completedCount', 0)
            ->where('totalContents', 2));
});
