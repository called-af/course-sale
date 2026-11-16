<?php

namespace App\Services;

use App\Models\Category;
use App\Models\Course;
use App\Models\MaterialContentProgress;
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
        $course->load([
            'creator:id,name', 'categories:id,name', 'tags:id,name,slug', 'resources',
            'modules' => fn ($modules) => $modules->select('id', 'course_id', 'title', 'sort_order', 'status')->orderBy('sort_order')->with([
                'materials' => fn ($materials) => $materials->orderBy('sort_order')->with([
                    'contents' => fn ($contents) => $contents->orderBy('sort_order'),
                ]),
            ]),
        ])->append('thumbnail_url');

        $course->setRelation('resources', collect(app(CourseResourceService::class)->mergedForCourse($course)));

        return [
            'course' => $course,
            'categories' => Category::select('id', 'name', 'img', 'desc')->get(),
            'tags' => Tag::select('id', 'name')->get(),
            'enrolled_students' => $this->enrolledStudents($course),
        ];
    }

    /**
     * Enrolled students with their progress — shared by the course detail page
     * and the CSV export.
     *
     * @return array<int, array<string, mixed>>
     */
    public function enrolledStudents(Course $course): array
    {
        $course->loadMissing([
            'modules:id,course_id',
            'modules.materials:id,module_id',
        ]);

        $enrollments = $course->enrollments()
            ->whereHas('user', fn ($query) => $query->withoutTrashed())
            ->with(['user' => fn ($query) => $query->withoutTrashed()->select('id', 'name', 'email', 'avatar')])
            ->latest('enrolled_at')
            ->get();

        // Progress is tracked per content (lesson/file/video/quiz) — the same
        // basis the course detail page uses — instead of per material or module.
        $contentIds = $course->modules
            ->flatMap(fn ($module) => $module->materials->flatMap(fn ($material) => $material->contents->pluck('id')));
        $totalContents = $contentIds->count();

        return $enrollments
            ->filter(fn ($enrollment) => $enrollment->user !== null)
            ->map(function ($enrollment) use ($contentIds, $totalContents) {
                $user = $enrollment->user;

                $completedContentIds = MaterialContentProgress::where('user_id', $enrollment->user_id)
                    ->whereIn('material_content_id', $contentIds)
                    ->where('is_completed', true)
                    ->pluck('material_content_id');
                $completed = $completedContentIds->count();
                $percent = $totalContents > 0 ? (int) round(($completed / $totalContents) * 100) : 0;

                $enrolledAt = $enrollment->enrolled_at;
                if ($enrolledAt) {
                    if (is_numeric($enrolledAt)) {
                        $formattedDate = date('Y-m-d H:i:s', (int) $enrolledAt);
                    } elseif ($enrolledAt instanceof \DateTimeInterface) {
                        $formattedDate = $enrolledAt->format('Y-m-d H:i:s');
                    } else {
                        $formattedDate = (string) $enrolledAt;
                    }
                } else {
                    $formattedDate = (string) $enrollment->created_at;
                }

                return [
                    'id' => $enrollment->id,
                    'user_id' => $user?->id,
                    'name' => $user?->name ?? 'Unknown Student',
                    'email' => $user?->email ?? '',
                    'avatar_url' => $user?->avatar_url,
                    'status' => $enrollment->status,
                    'enrolled_at' => $formattedDate,
                    'progress_percent' => $percent,
                    'completed_contents' => $completed,
                    'total_contents' => $totalContents,
                ];
            })->values()->all();
    }

    public function previewData(Course $course, User $user): array
    {
        // Quiz contents of the course, flattened for the preview runner.
        $quizContents = $course->modules
            ->flatMap(fn ($module) => ($module->materials ?? [])->flatMap(fn ($material) => ($material->contents ?? [])))
            ->filter(fn ($content) => $content->type === 'quiz')
            ->values();

        return [
            'course' => tap($course->load([
                'creator:id,name', 'categories:id,name', 'resources',
                'modules' => fn ($modules) => $modules->select('id', 'course_id', 'title', 'sort_order', 'status')->orderBy('sort_order')->with([
                    'materials' => fn ($materials) => $materials->select('id', 'module_id', 'title', 'sort_order', 'status')->orderBy('sort_order')->with([
                        'contents' => fn ($contents) => $contents->orderBy('sort_order')->with('quizQuestions.quizOptions'),
                    ]),
                ]),
            ])->append('thumbnail_url'), function (Course $course) {
                $course->setRelation('resources', collect(app(CourseResourceService::class)->mergedForCourse($course)));
            }),
            'quizStates' => app(QuizService::class)->statesFor($user, $quizContents),
        ];
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
