<?php

namespace App\Services;

use App\Models\Category;
use App\Models\Course;
use App\Models\Enrollment;
use App\Models\MaterialContentProgress;
use App\Models\Tag;
use App\Models\User;
use DomainException;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;
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
                    'contents' => fn ($contents) => $contents
                        ->orderBy('sort_order')
                        ->with(['quizQuestions.quizOptions']),
                ]),
            ]),
        ])->append('thumbnail_url');

        $course->setRelation('resources', collect(app(CourseResourceService::class)->mergedForCourse($course)));
        $course->setAttribute('certificate_template', app(CertificateService::class)->templatePayload($course));

        $progressContext = $this->enrollmentProgressContext($course);

        return [
            'course' => $course,
            'categories' => Category::select('id', 'name', 'img', 'desc')->get(),
            'tags' => Tag::select('id', 'name')->get(),
            'enrolled_students' => $this->enrolledStudents($course, 15, $progressContext),
            'enrolled_students_summary' => $this->enrolledStudentsSummary($course, $progressContext),
        ];
    }

    /**
     * Enrolled students with progress, paginated for the course detail page.
     * Progress for all students is fetched in a single grouped query instead of
     * one query per student.
     *
     * @param  array{content_ids: Collection, total_contents: int, progress_counts: Collection}|null  $progressContext
     */
    public function enrolledStudents(Course $course, int $perPage = 15, ?array $progressContext = null): LengthAwarePaginator
    {
        $context = $progressContext ?? $this->enrollmentProgressContext($course);

        return $this->enrollmentQuery($course)
            ->paginate(max(1, $perPage))
            ->withQueryString()
            ->through(fn ($enrollment) => $this->formatEnrolledStudent(
                $enrollment,
                $context['progress_counts'],
                $context['total_contents'],
            ));
    }

    /**
     * Stream every enrolled student row for CSV export without loading the
     * entire list into memory or issuing one progress query per student.
     *
     * @return \Generator<int, array<string, mixed>>
     */
    public function enrolledStudentRows(Course $course): \Generator
    {
        $context = $this->enrollmentProgressContext($course);

        foreach ($this->enrollmentQuery($course)->cursor() as $enrollment) {
            yield $this->formatEnrolledStudent(
                $enrollment,
                $context['progress_counts'],
                $context['total_contents'],
            );
        }
    }

    /**
     * @param  array{content_ids: Collection, total_contents: int, progress_counts: Collection}|null  $progressContext
     * @return array{total: int, completed: int, in_progress: int, not_started: int}
     */
    public function enrolledStudentsSummary(Course $course, ?array $progressContext = null): array
    {
        $context = $progressContext ?? $this->enrollmentProgressContext($course);
        $userIds = $this->enrollmentQuery($course)->pluck('enrollments.user_id');

        $summary = [
            'total' => $userIds->count(),
            'completed' => 0,
            'in_progress' => 0,
            'not_started' => 0,
        ];

        foreach ($userIds as $userId) {
            $completed = (int) ($context['progress_counts'][$userId] ?? 0);

            if ($completed >= $context['total_contents'] && $context['total_contents'] > 0) {
                $summary['completed']++;
            } elseif ($completed > 0) {
                $summary['in_progress']++;
            } else {
                $summary['not_started']++;
            }
        }

        return $summary;
    }

    /**
     * @return array{content_ids: Collection, total_contents: int, progress_counts: Collection}
     */
    protected function enrollmentProgressContext(Course $course): array
    {
        $course->loadMissing([
            'modules:id,course_id',
            'modules.materials:id,module_id',
            'modules.materials.contents',
        ]);

        $contentIds = $course->modules
            ->flatMap(fn ($module) => $module->materials)
            ->flatMap(fn ($material) => $material->contents)
            ->pluck('id')
            ->values();

        return [
            'content_ids' => $contentIds,
            'total_contents' => $contentIds->count(),
            'progress_counts' => $this->completedContentCounts($contentIds),
        ];
    }

    protected function completedContentCounts(Collection $contentIds): Collection
    {
        if ($contentIds->isEmpty()) {
            return collect();
        }

        return DB::table((new MaterialContentProgress)->getTable())
            ->select('user_id', DB::raw('COUNT(DISTINCT material_content_id) as completed_contents'))
            ->where('is_completed', true)
            ->whereIn('material_content_id', $contentIds)
            ->groupBy('user_id')
            ->pluck('completed_contents', 'user_id');
    }

    protected function enrollmentQuery(Course $course)
    {
        return Enrollment::query()
            ->join('users', 'users.id', '=', 'enrollments.user_id')
            ->where('enrollments.course_id', $course->id)
            ->whereNull('users.deleted_at')
            ->select([
                'enrollments.id',
                'enrollments.user_id',
                'enrollments.status',
                'enrollments.enrolled_at',
                'enrollments.created_at',
                'users.name',
                'users.email',
                'users.avatar as student_avatar',
            ])
            ->orderByDesc('enrollments.enrolled_at');
    }

    /**
     * @param  \App\Models\Enrollment  $enrollment
     * @return array<string, mixed>
     */
    protected function formatEnrolledStudent($enrollment, Collection $progressCounts, int $totalContents): array
    {
        $completed = min((int) ($progressCounts[$enrollment->user_id] ?? 0), $totalContents);
        $percent = $totalContents > 0 ? (int) round(($completed / $totalContents) * 100) : 0;

        $avatar = $enrollment->student_avatar;
        if ($avatar && ! str_starts_with($avatar, 'http://') && ! str_starts_with($avatar, 'https://')) {
            $avatar = asset('storage/'.$avatar);
        }

        return [
            'id' => $enrollment->id,
            'user_id' => $enrollment->user_id,
            'name' => $enrollment->name ?: 'Unknown Student',
            'email' => $enrollment->email ?: '',
            'avatar_url' => $avatar,
            'status' => $enrollment->status,
            'enrolled_at' => $this->formatEnrolledAt($enrollment->enrolled_at, $enrollment->created_at),
            'progress_percent' => $percent,
            'completed_contents' => $completed,
            'total_contents' => $totalContents,
        ];
    }

    protected function formatEnrolledAt(mixed $value, mixed $fallback = null): string
    {
        if ($value instanceof \DateTimeInterface) {
            return $value->format('Y-m-d H:i:s');
        }

        if (is_numeric($value)) {
            return date('Y-m-d H:i:s', (int) $value);
        }

        return (string) ($value ?: $fallback ?: '');
    }

    public function previewData(Course $course, User $user): array
    {
        $course->load([
            'creator:id,name', 'categories:id,name', 'resources',
            'modules' => fn ($modules) => $modules->select('id', 'course_id', 'title', 'sort_order', 'status')->orderBy('sort_order')->with([
                'materials' => fn ($materials) => $materials->select('id', 'module_id', 'title', 'sort_order', 'status')->orderBy('sort_order')->with([
                    'contents' => fn ($contents) => $contents
                        ->orderBy('sort_order')
                        ->with(['quizQuestions.quizOptions']),
                ]),
            ]),
        ]);

        $course->append('thumbnail_url');
        $course->setRelation('resources', collect(app(CourseResourceService::class)->mergedForCourse($course)));

        // Quiz contents of the course for the preview runner.
        $quizContents = $course->modules
            ->flatMap(fn ($module) => ($module->materials ?? []))
            ->flatMap(fn ($material) => ($material->contents ?? []))
            ->filter(fn ($content) => $content->type === 'quiz')
            ->values();

        return [
            'course' => $course,
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
