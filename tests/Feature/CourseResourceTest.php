<?php

use App\Models\Course;
use App\Models\CourseResource;
use App\Models\Enrollment;
use App\Models\Material;
use App\Models\MaterialContent;
use App\Models\MaterialContentProgress;
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

it('collects file-type lesson materials as automatic resources', function () {
    [, $student, $course, $materials, $resource] = makeResourceCourse();

    MaterialContent::factory()->create([
        'material_id' => $materials->first()->id,
        'type' => 'file',
        'title' => 'Course Workbook',
        'content_url' => '/storage/materials/contents/workbook.pdf',
        'status' => 'published',
    ]);

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
            ->has('resources', 2)
            ->where('resources.0.title', $resource->title)
            ->where('resources.1.title', 'Course Workbook')
            ->where('resources.1.source', 'material')
            ->where('resources.1.file_type', 'PDF'));
});

it('downloads automatic lesson-file resources after completion', function () {
    [, $student, $course, $materials] = makeResourceCourse();

    Storage::fake('public');
    Storage::disk('public')->put('materials/contents/workbook.pdf', 'pdf-content');

    $content = MaterialContent::factory()->create([
        'material_id' => $materials->first()->id,
        'type' => 'ppt',
        'title' => 'Lecture Slides',
        'content_url' => '/storage/materials/contents/workbook.pdf',
        'status' => 'published',
    ]);

    foreach ($materials as $material) {
        MaterialProgress::create([
            'user_id' => $student->id,
            'material_id' => $material->id,
            'is_completed' => true,
            'completed_at' => now(),
        ]);
    }

    $this->actingAs($student)
        ->get("/student/courses/{$course->slug}/resources/contents/{$content->id}")
        ->assertOk()
        ->assertDownload('lecture-slides.pdf');
});

it('downloads automatic lesson-file resources once their lesson is completed', function () {
    [, $student, $course, $materials] = makeResourceCourse();

    Storage::fake('public');
    Storage::disk('public')->put('materials/contents/workbook.pdf', 'pdf-content');

    $content = MaterialContent::factory()->create([
        'material_id' => $materials->first()->id,
        'type' => 'file',
        'title' => 'Partial Workbook',
        'content_url' => '/storage/materials/contents/workbook.pdf',
        'status' => 'published',
    ]);

    MaterialProgress::create([
        'user_id' => $student->id,
        'material_id' => $materials->first()->id,
        'is_completed' => true,
        'completed_at' => now(),
    ]);

    $this->actingAs($student)
        ->get("/student/courses/{$course->slug}/resources/contents/{$content->id}")
        ->assertOk()
        ->assertDownload('partial-workbook.pdf');
});

it('forbids downloading automatic lesson-file resources before completion', function () {
    [, $student, $course, $materials] = makeResourceCourse();

    $content = MaterialContent::factory()->create([
        'material_id' => $materials->first()->id,
        'type' => 'file',
        'content_url' => '/storage/materials/contents/workbook.pdf',
        'status' => 'published',
    ]);

    $this->actingAs($student)
        ->get("/student/courses/{$course->slug}/resources/contents/{$content->id}")
        ->assertForbidden();
});

it('forbids downloading automatic resources from another course', function () {
    [, $student, , $materials] = makeResourceCourse();
    [, , $otherCourse] = makeResourceCourse();

    $content = MaterialContent::factory()->create([
        'material_id' => $materials->first()->id,
        'type' => 'file',
        'content_url' => '/storage/materials/contents/workbook.pdf',
        'status' => 'published',
    ]);

    foreach ($materials as $material) {
        MaterialProgress::create([
            'user_id' => $student->id,
            'material_id' => $material->id,
            'is_completed' => true,
            'completed_at' => now(),
        ]);
    }

    $this->actingAs($student)
        ->get("/student/courses/{$otherCourse->slug}/resources/contents/{$content->id}")
        ->assertNotFound();
});

it('exposes automatic resources on the course management page', function () {
    [, , $course, $materials] = makeResourceCourse();

    MaterialContent::factory()->create([
        'material_id' => $materials->first()->id,
        'type' => 'file',
        'title' => 'Management Workbook',
        'content_url' => '/storage/materials/contents/workbook.pdf',
        'status' => 'published',
    ]);

    $admin = User::factory()->create(['role' => 'admin']);

    $this->actingAs($admin)
        ->get("/admin/courses/{$course->slug}")
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/course/[slug]/page')
            ->has('course.resources', 2)
            ->where('course.resources.0.source', 'manual')
            ->where('course.resources.1.title', 'Management Workbook')
            ->where('course.resources.1.source', 'material'));
});

it('unlocks automatic resources as each lesson material is completed', function () {
    [, $student, $course, $materials] = makeResourceCourse();

    $first = MaterialContent::factory()->create([
        'material_id' => $materials->first()->id,
        'type' => 'file',
        'title' => 'First Lesson Workbook',
        'content_url' => '/storage/materials/contents/workbook.pdf',
        'status' => 'published',
    ]);

    MaterialContent::factory()->create([
        'material_id' => $materials->last()->id,
        'type' => 'file',
        'title' => 'Second Lesson Workbook',
        'content_url' => '/storage/materials/contents/workbook.pdf',
        'status' => 'published',
    ]);

    MaterialProgress::create([
        'user_id' => $student->id,
        'material_id' => $materials->first()->id,
        'is_completed' => true,
        'completed_at' => now(),
    ]);

    $this->actingAs($student)
        ->get("/student/courses/{$course->slug}")
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('resourcesUnlocked', false)
            ->has('resources', 1)
            ->where('resources.0.id', $first->id)
            ->where('resources.0.title', 'First Lesson Workbook')
            ->where('resources.0.source', 'material'));
});

it('unlocks automatic resources when their lesson content is completed', function () {
    [, $student, $course, $materials] = makeResourceCourse();

    $content = MaterialContent::factory()->create([
        'material_id' => $materials->first()->id,
        'type' => 'ppt',
        'title' => 'Slide Deck',
        'content_url' => '/storage/materials/contents/slides.pdf',
        'status' => 'published',
    ]);

    MaterialContentProgress::create([
        'user_id' => $student->id,
        'material_content_id' => $content->id,
        'is_completed' => true,
        'completed_at' => now(),
    ]);

    $this->actingAs($student)
        ->get("/student/courses/{$course->slug}")
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('resourcesUnlocked', false)
            ->has('resources', 1)
            ->where('resources.0.id', $content->id)
            ->where('resources.0.source', 'material'));
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
