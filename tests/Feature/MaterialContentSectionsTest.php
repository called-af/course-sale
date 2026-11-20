<?php

use App\Models\Course;
use App\Models\Enrollment;
use App\Models\Material;
use App\Models\MaterialContent;
use App\Models\MaterialContentProgress;
use App\Models\Module;
use App\Models\QuizOption;
use App\Models\QuizQuestion;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;

function makeContentHierarchy(): array
{
    $instructor = User::factory()->create(['role' => 'instructor']);

    $course = Course::factory()->create([
        'creator_id' => $instructor->id,
        'status' => 'published',
        'type' => 'free',
    ]);

    $module = Module::factory()->create([
        'course_id' => $course->id,
        'status' => 'published',
    ]);

    $material = Material::factory()->create([
        'module_id' => $module->id,
        'status' => 'published',
    ]);

    return [$instructor, $course, $module, $material];
}

function contentsUrl(Course $course, Module $module, Material $material, ?MaterialContent $content = null): string
{
    $url = "/instructor/courses/{$course->slug}/modules/{$module->id}/materials/{$material->id}/contents";

    return $content ? "{$url}/{$content->id}" : $url;
}

it('creates many typed content blocks under a material and scopes their order', function () {
    [$instructor, $course, $module, $material] = makeContentHierarchy();

    $this->actingAs($instructor)
        ->post(contentsUrl($course, $module, $material), [
            'title' => 'Watching the basics',
            'type' => 'video',
            'status' => 'published',
            'content_url' => 'https://www.youtube.com/watch?v=abc123',
        ])
        ->assertRedirect();

    $this->actingAs($instructor)
        ->post(contentsUrl($course, $module, $material), [
            'title' => 'Reading the docs',
            'type' => 'text',
            'status' => 'published',
            'content_text' => [['type' => 'p', 'children' => [['text' => 'Hello world']]]],
        ])
        ->assertRedirect();

    $this->actingAs($instructor)
        ->post(contentsUrl($course, $module, $material), [
            'title' => 'Check your understanding',
            'type' => 'quiz',
            'status' => 'draft',
            'duration' => 15,
        ])
        ->assertRedirect();

    $contents = $material->contents()->get();

    expect($contents)->toHaveCount(3)
        ->and($contents->pluck('sort_order')->all())->toBe([1, 2, 3])
        ->and($contents->pluck('type')->all())->toBe(['video', 'text', 'quiz']);
});

it('requires a published content block before a material can be published', function () {
    [$instructor, $course, $module, $material] = makeContentHierarchy();

    $material->update(['status' => 'draft']);

    $this->actingAs($instructor)
        ->put("/instructor/courses/{$course->slug}/modules/{$module->id}/materials/{$material->id}", [
            'title' => $material->title,
            'status' => 'published',
        ])
        ->assertSessionHas('error');

    expect($material->refresh()->status)->toBe('draft');

    MaterialContent::factory()->create([
        'material_id' => $material->id,
        'type' => 'text',
        'status' => 'published',
        'content_text' => [['type' => 'p', 'children' => [['text' => 'Hello world']]]],
        'sort_order' => 1,
    ]);

    $this->actingAs($instructor)
        ->put("/instructor/courses/{$course->slug}/modules/{$module->id}/materials/{$material->id}", [
            'title' => $material->title,
            'status' => 'published',
        ])
        ->assertSessionHas('success');

    expect($material->refresh()->status)->toBe('published');
});

it('deletes uploaded files when a content block is deleted', function () {
    Storage::fake('public');
    [$instructor, $course, $module, $material] = makeContentHierarchy();

    Storage::disk('public')->put('materials/contents/block.pdf', 'dummy');

    $content = MaterialContent::create([
        'material_id' => $material->id,
        'type' => 'file',
        'title' => 'Workbook',
        'content_url' => '/storage/materials/contents/block.pdf',
        'sort_order' => 1,
        'status' => 'published',
    ]);

    $this->actingAs($instructor)
        ->delete(contentsUrl($course, $module, $material, $content))
        ->assertRedirect();

    expect(MaterialContent::find($content->id))->toBeNull();
    Storage::disk('public')->assertMissing('materials/contents/block.pdf');
});

it('moves content blocks inside their material', function () {
    [$instructor, $course, $module, $material] = makeContentHierarchy();

    $first = MaterialContent::create([
        'material_id' => $material->id,
        'type' => 'text',
        'title' => 'First',
        'content_text' => [['type' => 'p', 'children' => [['text' => 'First']]]],
        'sort_order' => 1,
        'status' => 'published',
    ]);

    $second = MaterialContent::create([
        'material_id' => $material->id,
        'type' => 'text',
        'title' => 'Second',
        'content_text' => [['type' => 'p', 'children' => [['text' => 'Second']]]],
        'sort_order' => 2,
        'status' => 'published',
    ]);

    $this->actingAs($instructor)
        ->put(contentsUrl($course, $module, $material, $second).'/move', ['direction' => 'up'])
        ->assertRedirect();

    expect($first->refresh()->sort_order)->toBe(2)
        ->and($second->refresh()->sort_order)->toBe(1);
});

it('serves materials with flat content blocks and tracks progress per content', function () {
    [$instructor, $course, $module, $material] = makeContentHierarchy();

    $student = User::factory()->create(['role' => 'student']);

    Enrollment::factory()->create([
        'user_id' => $student->id,
        'course_id' => $course->id,
        'status' => 'active',
    ]);

    $video = MaterialContent::create([
        'material_id' => $material->id,
        'type' => 'video',
        'title' => 'Video block',
        'content_url' => 'https://www.youtube.com/watch?v=abc123',
        'sort_order' => 1,
        'status' => 'published',
    ]);

    $text = MaterialContent::create([
        'material_id' => $material->id,
        'type' => 'text',
        'title' => 'Text block',
        'content_text' => [['type' => 'p', 'children' => [['text' => 'Read me']]]],
        'sort_order' => 2,
        'status' => 'published',
    ]);

    MaterialContent::create([
        'material_id' => $material->id,
        'type' => 'text',
        'title' => 'Draft block',
        'content_text' => [['type' => 'p', 'children' => [['text' => 'Not yet']]]],
        'sort_order' => 3,
        'status' => 'draft',
    ]);

    $this->actingAs($student)
        ->get("/student/courses/{$course->slug}")
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('student/course/[enroll]/page')
            ->has('course.modules.0.materials.0.contents', 2)
            ->where('course.modules.0.materials.0.contents.0.title', 'Video block'));

    $this->actingAs($student)
        ->postJson("/student/courses/{$course->slug}/contents/{$video->id}/complete")
        ->assertOk();

    expect(MaterialContentProgress::where('user_id', $student->id)
        ->where('material_content_id', $video->id)
        ->where('is_completed', true)
        ->exists())->toBeTrue();

    // Course progress counts published content blocks.
    $this->actingAs($student)
        ->get("/course/{$course->slug}")
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('totalContents', 2)
            ->where('completedCount', 1)
            ->where('progressPercent', 50));

    MaterialContentProgress::create([
        'user_id' => $student->id,
        'material_content_id' => $text->id,
        'is_completed' => true,
        'completed_at' => now(),
    ]);

    $this->actingAs($student)
        ->get("/course/{$course->slug}")
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('totalContents', 2)
            ->where('completedCount', 2)
            ->where('progressPercent', 100));
});

it('runs a quiz content block', function () {
    [$instructor, $course, $module, $material] = makeContentHierarchy();

    $student = User::factory()->create(['role' => 'student']);

    Enrollment::factory()->create([
        'user_id' => $student->id,
        'course_id' => $course->id,
        'status' => 'active',
    ]);

    $quiz = MaterialContent::create([
        'material_id' => $material->id,
        'type' => 'quiz',
        'title' => 'Block quiz',
        'duration' => 10,
        'sort_order' => 1,
        'status' => 'published',
    ]);

    $question = QuizQuestion::factory()->create([
        'material_content_id' => $quiz->id,
        'question' => 'Pick the right answer',
        'type' => 'multiple_choice',
        'sort_order' => 1,
    ]);

    $correct = QuizOption::factory()->create([
        'quiz_question_id' => $question->id,
        'option_text' => 'Correct',
        'is_correct' => true,
    ]);

    QuizOption::factory()->create([
        'quiz_question_id' => $question->id,
        'option_text' => 'Wrong',
        'is_correct' => false,
    ]);

    $this->actingAs($student)
        ->postJson("/student/courses/{$course->slug}/quiz/{$quiz->id}/start")
        ->assertOk()
        ->assertJsonPath('state.status', 'in_progress');

    $this->actingAs($student)
        ->postJson("/student/courses/{$course->slug}/quiz/{$quiz->id}/submit", [
            'answers' => [$question->id => $correct->id],
        ])
        ->assertOk()
        ->assertJsonPath('data.score', 100);

    expect(MaterialContentProgress::where('user_id', $student->id)
        ->where('material_content_id', $quiz->id)
        ->where('is_completed', true)
        ->exists())->toBeTrue();
});

it('uploads a file content block and exposes it as a course resource', function () {
    Storage::fake('public');
    [$instructor, $course, $module, $material] = makeContentHierarchy();

    $this->actingAs($instructor)
        ->post(contentsUrl($course, $module, $material), [
            'title' => 'Workbook',
            'type' => 'file',
            'status' => 'published',
            'file' => UploadedFile::fake()->create('workbook.pdf', 20, 'application/pdf'),
        ])
        ->assertRedirect();

    $content = $material->contents()->firstOrFail();

    expect($content->content_url)->toContain('/storage/materials/contents/');

    $resources = app(\App\Services\CourseResourceService::class)->mergedForCourse($course->fresh(), publishedOnly: true);

    expect(collect($resources)->pluck('title'))->toContain('Workbook');
});
