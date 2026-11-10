<?php

use App\Models\Course;
use App\Models\Material;
use App\Models\MaterialContent;
use App\Models\Module;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;

function makeMaterialContentHierarchy(): array
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

function materialContentsUrl(Course $course, Module $module, Material $material, ?MaterialContent $content = null): string
{
    $url = "/instructor/courses/{$course->slug}/modules/{$module->id}/materials/{$material->id}/contents";

    return $content ? "{$url}/{$content->id}" : $url;
}

function storedPath(string $url): string
{
    return 'materials/contents/'.basename($url);
}

it('stores an uploaded file attachment and exposes it through content_url', function () {
    Storage::fake('public');

    [$instructor, $course, $module, $material] = makeMaterialContentHierarchy();

    $this->actingAs($instructor)
        ->post(materialContentsUrl($course, $module, $material), [
            'title' => 'Course handbook',
            'type' => 'file',
            'status' => 'draft',
            'file' => UploadedFile::fake()->create('handbook.pdf', 120, 'application/pdf'),
        ])
        ->assertRedirect();

    $content = MaterialContent::firstOrFail();

    expect($content->type)->toBe('file')
        ->and($content->content_url)->toStartWith('/storage/materials/contents/')
        ->and(storedPath($content->content_url))->toEndWith('.pdf');

    Storage::disk('public')->assertExists(storedPath($content->content_url));
});

it('stores an uploaded presentation deck', function () {
    Storage::fake('public');

    [$instructor, $course, $module, $material] = makeMaterialContentHierarchy();

    $this->actingAs($instructor)
        ->post(materialContentsUrl($course, $module, $material), [
            'title' => 'Product deck',
            'type' => 'ppt',
            'status' => 'draft',
            'file' => UploadedFile::fake()->create(
                'deck.pptx',
                300,
                'application/vnd.openxmlformats-officedocument.presentationml.presentation'
            ),
        ])
        ->assertRedirect()
        ->assertSessionHasNoErrors();

    $content = MaterialContent::firstOrFail();

    expect($content->type)->toBe('ppt')
        ->and($content->content_url)->toStartWith('/storage/materials/contents/');

    Storage::disk('public')->assertExists(storedPath($content->content_url));
});

it('replaces and deletes uploaded files when content changes', function () {
    Storage::fake('public');

    [$instructor, $course, $module, $material] = makeMaterialContentHierarchy();

    $this->actingAs($instructor)
        ->post(materialContentsUrl($course, $module, $material), [
            'title' => 'Slides',
            'type' => 'ppt',
            'status' => 'draft',
            'file' => UploadedFile::fake()->create('first.pdf', 50, 'application/pdf'),
        ])
        ->assertRedirect();

    $content = MaterialContent::firstOrFail();
    $firstPath = storedPath($content->content_url);

    Storage::disk('public')->assertExists($firstPath);

    // Replace the uploaded file with a new one.
    $this->actingAs($instructor)
        ->post(materialContentsUrl($course, $module, $material, $content), [
            '_method' => 'PUT',
            'title' => 'Slides',
            'type' => 'ppt',
            'status' => 'draft',
            'file' => UploadedFile::fake()->create('second.pdf', 50, 'application/pdf'),
        ])
        ->assertRedirect()
        ->assertSessionHasNoErrors();

    $content->refresh();
    $secondPath = storedPath($content->content_url);

    expect($secondPath)->not->toBe($firstPath);
    Storage::disk('public')->assertMissing($firstPath);
    Storage::disk('public')->assertExists($secondPath);

    // Replacing the upload with a pasted URL removes the managed file too.
    $this->actingAs($instructor)
        ->put(materialContentsUrl($course, $module, $material, $content), [
            'title' => 'Slides',
            'type' => 'ppt',
            'status' => 'draft',
            'content_url' => 'https://docs.google.com/presentation/d/abc123/view',
        ])
        ->assertRedirect()
        ->assertSessionHasNoErrors();

    $content->refresh();

    expect($content->content_url)->toBe('https://docs.google.com/presentation/d/abc123/view');
    Storage::disk('public')->assertMissing($secondPath);
});

it('deletes the uploaded file when the content is deleted', function () {
    Storage::fake('public');

    [$instructor, $course, $module, $material] = makeMaterialContentHierarchy();

    $this->actingAs($instructor)
        ->post(materialContentsUrl($course, $module, $material), [
            'title' => 'Attachment',
            'type' => 'file',
            'status' => 'draft',
            'file' => UploadedFile::fake()->create('notes.docx', 40, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'),
        ])
        ->assertRedirect();

    $content = MaterialContent::firstOrFail();
    $path = storedPath($content->content_url);

    Storage::disk('public')->assertExists($path);

    $this->actingAs($instructor)
        ->delete(materialContentsUrl($course, $module, $material, $content))
        ->assertRedirect();

    Storage::disk('public')->assertMissing($path);
    expect(MaterialContent::find($content->id))->toBeNull();
});

it('rejects unsupported uploads for presentations', function () {
    Storage::fake('public');

    [$instructor, $course, $module, $material] = makeMaterialContentHierarchy();

    $this->actingAs($instructor)
        ->post(materialContentsUrl($course, $module, $material), [
            'title' => 'Bad deck',
            'type' => 'ppt',
            'status' => 'draft',
            'file' => UploadedFile::fake()->create('malware.exe', 10, 'application/x-msdownload'),
        ])
        ->assertSessionHasErrors('file');

    expect(MaterialContent::count())->toBe(0);
});

it('keeps pasted URLs working for file attachments', function () {
    [$instructor, $course, $module, $material] = makeMaterialContentHierarchy();

    $this->actingAs($instructor)
        ->post(materialContentsUrl($course, $module, $material), [
            'title' => 'External PDF',
            'type' => 'file',
            'status' => 'published',
            'content_url' => 'https://example.com/files/guide.pdf',
        ])
        ->assertRedirect()
        ->assertSessionHasNoErrors();

    expect(MaterialContent::firstOrFail()->content_url)->toBe('https://example.com/files/guide.pdf');
});

it('uses the instructor layout when an instructor edits material content', function () {
    [$instructor, $course, $module, $material] = makeMaterialContentHierarchy();

    $content = MaterialContent::factory()->create([
        'material_id' => $material->id,
        'type' => 'file',
        'content_url' => 'https://example.com/files/guide.pdf',
        'status' => 'draft',
    ]);

    $this->actingAs($instructor)
        ->get(materialContentsUrl($course, $module, $material, $content).'/edit')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page->component('student/course/[material]/page'));
});

it('uses the admin layout when an admin edits material content', function () {
    [, $course, $module, $material] = makeMaterialContentHierarchy();

    $admin = User::factory()->create(['role' => 'admin']);

    $content = MaterialContent::factory()->create([
        'material_id' => $material->id,
        'type' => 'ppt',
        'content_url' => 'https://docs.google.com/presentation/d/abc123/view',
        'status' => 'draft',
    ]);

    $this->actingAs($admin)
        ->get(str_replace('/instructor/', '/admin/', materialContentsUrl($course, $module, $material, $content)).'/edit')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page->component('admin/course/[material]/page'));
});
