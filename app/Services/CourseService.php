<?php

namespace App\Services;

use App\Models\Category;
use App\Models\Course;
use App\Models\Tag;
use App\Models\User;
use DomainException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class CourseService
{
    public function indexData(User $user): array
    {
        $query = Course::with(['creator:id,name', 'categories:id,name']);

        if ($user->role === 'instructor') {
            $query->where('creator_id', $user->id);
        }

        return [
            'courses' => $user->role === 'admin'
                ? $query->latest()->paginate(10)->withQueryString()
                : $query->latest()->get()->append('thumbnail_url'),
            'categories' => Category::select('id', 'name', 'img', 'desc')->get(),
        ];
    }

    public function detailData(Course $course): array
    {
        return [
            'course' => $course->load([
                'creator:id,name', 'categories:id,name', 'tags:id,name,slug',
                'modules' => fn ($modules) => $modules->select('id', 'course_id', 'title', 'sort_order', 'status')->orderBy('sort_order')->with([
                    'materials' => fn ($materials) => $materials->orderBy('sort_order')->with([
                        'contents' => fn ($contents) => $contents->orderBy('sort_order'),
                    ]),
                ]),
            ])->append('thumbnail_url'),
            'categories' => Category::select('id', 'name', 'img', 'desc')->get(),
            'tags' => Tag::select('id', 'name')->get(),
            'users' => User::select('avatar', 'name', 'email')->get(),
        ];
    }

    public function previewData(Course $course): array
    {
        return ['course' => $course->load([
            'creator:id,name', 'categories:id,name',
            'modules' => fn ($modules) => $modules->select('id', 'course_id', 'title', 'sort_order', 'status')->orderBy('sort_order')->with([
                'materials' => fn ($materials) => $materials->select('id', 'module_id', 'title', 'sort_order', 'status')->orderBy('sort_order')->with([
                    'contents' => fn ($contents) => $contents->orderBy('sort_order')->with('quizQuestions.quizOptions'),
                ]),
            ]),
        ])->append('thumbnail_url')];
    }

    public function delete(Course $course): void
    {
        DB::transaction(fn () => $course->delete());
    }

    public function submitForReview(Course $course): Course
    {
        return DB::transaction(function () use ($course) {
            if ($course->status === 'review') {
                throw new DomainException('This course is already under review and awaiting admin approval.');
            }

            if ($course->status === 'published') {
                throw new DomainException('This course has already been approved and published.');
            }

            if (! $course->canBePublished()) {
                throw new DomainException('This course does not meet the review requirements. Add a title, description, level, thumbnail, at least one category, and at least one module.');
            }

            $course->update(['status' => 'review']);

            return $course->refresh();
        });
    }
    /**
     * Creates a course.
     */
    public function create(array $data, int $userId): Course
    {
        // melakukan db transkaski
        return DB::transaction(function () use ($data, $userId) {

            $title = $data['title'];

            $course = Course::create([
                'creator_id' => $userId,
                'title' => $title,
                'slug' => $this->generateUniqueSlug($title),
                'status' => 'draft',
                'type' => 'free',
            ]);

            return $course;
        });
    }

    protected function generateUniqueSlug(string $title): string
    {
        $slug = Str::slug($title);
        $original = $slug;
        $counter = 1;

        while (
            Course::where('slug', $slug)->exists()
        ) {
            $slug = "{$original}-{$counter}";
            $counter++;
        }

        return $slug;
    }

    public function update(Course $course, array $data): Course
    {
        return DB::transaction(function () use ($course, $data) {

            if (isset($data['thumbnail'])) {

                if ($course->thumbnail) {
                    Storage::disk('public')->delete($course->thumbnail);
                }

                $data['thumbnail'] = $data['thumbnail']
                    ->store('thumbnails', 'public');
            }

            if (isset($data['title']) && $data['title'] !== $course->title) {
                $data['slug'] = $this->generateUniqueSlug($data['title']);
            }

            /*
            |--------------------------------------------------------------------------
            | AUTHORIZATION PUBLISH (FIXED)
            |--------------------------------------------------------------------------
            */
            if (($data['status'] ?? null) === 'review' && $course->status !== 'review') {
                if (! $course->canBePublished()) {
                    throw new DomainException('This course is incomplete and cannot be submitted for review.');
                }
            }

            if (($data['status'] ?? null) === 'published') {

                if ($course->status !== 'review') {
                    throw new DomainException('This course must be submitted for review before an administrator can approve it.');
                }

                if ($course->isPublished()) {
                    throw new DomainException('This course has already been published.');
                }

                Gate::authorize('publish', $course);

                if (! $course->canBePublished()) {
                    throw new DomainException('This course is incomplete and cannot be published.');
                }

                $data['published_at'] = now();
                $data['approved_at'] = now();
            }

            if (isset($data['type']) && $data['type'] === 'free') {
                $data['price'] = null;
            }

            $course->update($data);

            /*
            |--------------------------------------------------------------------------
            | CATEGORY SYNC
            |--------------------------------------------------------------------------
            */
            if (array_key_exists('category_ids', $data)) {
                $course->categories()->sync($data['category_ids']);
            }

            /*
            |--------------------------------------------------------------------------
            | TAG SYNC
            |--------------------------------------------------------------------------
            */
            if (array_key_exists('tag_ids', $data)) {
                $course->tags()->sync($data['tag_ids']);
            }

            return $course->refresh();
        });
    }
}
