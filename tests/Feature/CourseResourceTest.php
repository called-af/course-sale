<?php

use App\Models\Course;
use App\Models\CourseResource;
use App\Models\Enrollment;
use App\Models\Material;
use App\Models\MaterialContent;
use App\Models\MaterialProgress;
use App\Models\Module;
use App\Models\User;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;

function makeResourceCourse(): array
{
    $instructor = User::factory()->create(['role' => 'instructor']);
    $student = User::factory()->create(['role' => 'student']);

    $course = Course::factory()->create([
        'creator_id' => $instructor->id,
        'status' => 'published',
        'type' => 'free',
        'title' => 'Resource Course',
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

    $materials = collect([1, 2])->map(function () use ($module) {
        $material = Material::factory()->create([
            'module_id' => $module->id,
            'status' => 'published',
        ]);

        MaterialContent::factory()->create([
            'material_id' => $material->id,
            'type' => 'text',
            'status' => 'published',
        ]);

        return $material;
    });

    $resource = CourseResource::create([
        'course_id' => $course->id,
        'title' => 'Starter Kit',
        'description' => 'Downloadable assets for the course.',
        'external_url' => 'https://example.com/kit.zip',
        'status' => 'published',
        'sort_order' => 1,
    ]);

    return [$instructor, $student, $course, $materials, $resource];
}

it('hides resources until the student completes every material', function () {
    [, $student, $course] = makeResourceCourse();

    $this->actingAs($student)
        ->get("/student/courses/{$course->slug}")
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('student/course/[enroll]/page')
            ->where('resourcesUnlocked', false)
            ->has('resources', 0));
});

it('unlocks resources once every material is completed', function () {
    [, $student, $course, $materials] = makeResourceCourse();

    foreach ($materials as $material) {
        MaterialProgress::create([
            'user_id' => $student->id,
            'material_id' => $material->id,
            'is_completed' => true,
            'completed_at' => now(),
        ]);
    }

    $this->actingAs($student)
        ->get("/student/courses/{$course->slug}")
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('resourcesUnlocked', true)
            ->has('resources', 1)
            ->where('resources.0.title', 'Starter Kit'));
});

it('forbids downloading resources before completion', function () {
    [, $student, $course, , $resource] = makeResourceCourse();

    $this->actingAs($student)
        ->get("/student/courses/{$course->slug}/resources/{$resource->id}")
        ->assertForbidden();
});

it('allows downloading a file resource after completion', function () {
    [, $student, $course, $materials] = makeResourceCourse();

    Storage::fake('public');

    $resource = CourseResource::create([
        'course_id' => $course->id,
        'title' => 'Workbook',
        'file_path' => 'course-resources/'.$course->id.'/workbook.pdf',
        'status' => 'published',
        'sort_order' => 2,
    ]);

    Storage::disk('public')->put($resource->file_path, 'pdf-content');

    foreach ($materials as $material) {
        MaterialProgress::create([
            'user_id' => $student->id,
            'material_id' => $material->id,
            'is_completed' => true,
            'completed_at' => now(),
        ]);
    }

    $this->actingAs($student)
        ->get("/student/courses/{$course->slug}/resources/{$resource->id}")
        ->assertOk()
        ->assertDownload('workbook.pdf');
});

it('redirects external resource downloads after completion', function () {
    [, $student, $course, $materials, $resource] = makeResourceCourse();

    foreach ($materials as $material) {
        MaterialProgress::create([
            'user_id' => $student->id,
            'material_id' => $material->id,
            'is_completed' => true,
            'completed_at' => now(),
        ]);
    }

    $this->actingAs($student)
        ->get("/student/courses/{$course->slug}/resources/{$resource->id}")
        ->assertRedirect('https://example.com/kit.zip');
});

it('lets an admin create a resource', function () {
    [, , $course] = makeResourceCourse();
    $admin = User::factory()->create(['role' => 'admin']);

    $this->actingAs($admin)
        ->post("/admin/courses/{$course->slug}/resources", [
            'title' => 'New Resource',
            'description' => 'Extra material',
            'external_url' => 'https://example.com/new.pdf',
            'status' => 'published',
        ])
        ->assertRedirect()
        ->assertSessionHas('success');

    $this->assertDatabaseHas('course_resources', [
        'course_id' => $course->id,
        'title' => 'New Resource',
        'external_url' => 'https://example.com/new.pdf',
        'status' => 'published',
    ]);
});

it('prevents an instructor from managing resources of another course', function () {
    [, , $course] = makeResourceCourse();
    $otherInstructor = User::factory()->create(['role' => 'instructor']);

    $this->actingAs($otherInstructor)
        ->post("/instructor/courses/{$course->slug}/resources", [
            'title' => 'Unauthorized Resource',
            'external_url' => 'https://example.com/nope.pdf',
            'status' => 'published',
        ])
        ->assertForbidden();
});

it('lets the owner instructor manage their course resources', function () {
    [$instructor, , $course] = makeResourceCourse();

    $this->actingAs($instructor)
        ->post("/instructor/courses/{$course->slug}/resources", [
            'title' => 'Instructor Resource',
            'external_url' => 'https://example.com/instructor.pdf',
            'status' => 'published',
        ])
        ->assertRedirect()
        ->assertSessionHas('success');

    $this->assertDatabaseHas('course_resources', [
        'course_id' => $course->id,
        'title' => 'Instructor Resource',
    ]);
});
