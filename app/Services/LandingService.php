<?php

namespace App\Services;

use App\Models\AppearanceSetting;
use App\Models\Certificate;
use App\Models\LandingSetting;
use App\Models\Review;
use App\Models\User;
use Illuminate\Support\Str;

class LandingService
{
    public function __construct(private readonly CertificateService $certificates) {}

    /**
     * Testimonials are pulled from approved course reviews — never static copy.
     *
     * @return list<array<string, mixed>>
     */
    public function testimonials(): array
    {
        $settings = LandingSetting::content(LandingSetting::SECTION_TESTIMONIAL);
        $limit = LandingSetting::intSetting(LandingSetting::SECTION_TESTIMONIAL, 'limit', 6, 1, 24);
        $minRating = LandingSetting::intSetting(LandingSetting::SECTION_TESTIMONIAL, 'min_rating', 4, 1, 5);

        return Review::query()
            ->where('is_approved', true)
            ->whereNotNull('comment')
            ->where('comment', '<>', '')
            ->where('rating', '>=', $minRating)
            ->with(['user:id,name,avatar', 'course:id,title,slug'])
            ->latest()
            ->take($limit)
            ->get()
            ->map(function (Review $review) {
                $name = $review->user?->name ?? 'Learner';
                $avatar = $review->user?->avatar_url;

                return [
                    'id' => $review->id,
                    'name' => $name,
                    'role' => $review->course
                        ? 'Student · '.$review->course->title
                        : 'Student',
                    'avatar' => $avatar ?: 'https://ui-avatars.com/api/?name='.urlencode($name).'&background=7c3aed&color=ffffff',
                    'comment' => $review->comment,
                    'rating' => (int) $review->rating,
                ];
            })
            ->values()
            ->all();
    }

    /**
     * How many courses the landing "Courses" section shows.
     */
    public function courseLimit(): int
    {
        return LandingSetting::intSetting(LandingSetting::SECTION_COURSES, 'limit', 8, 1, 24);
    }

    /**
     * Real instructors for the landing carousel.
     *
     * Admins choose which instructors appear (or show all). Course counts,
     * student totals and expertise are derived from published courses so the
     * section can never drift away from actual platform data.
     *
     * @return list<array<string, mixed>>
     */
    public function instructors(): array
    {
        $settings = LandingSetting::content(LandingSetting::SECTION_INSTRUCTOR);

        $mode = ($settings['mode'] ?? 'selected') === 'all' ? 'all' : 'selected';
        $sort = in_array($settings['sort'] ?? 'courses', ['selected', 'courses', 'students', 'name'], true)
            ? $settings['sort']
            : 'courses';
        $limit = LandingSetting::intSetting(LandingSetting::SECTION_INSTRUCTOR, 'limit', 4, 1, 24);
        $defaultRole = trim((string) ($settings['default_role'] ?? 'Instructor')) ?: 'Instructor';

        $selectedIds = $this->positiveIds($settings['selected_ids'] ?? []);

        // An empty selection means "not configured yet" — show real instructors
        // automatically rather than an empty section on a fresh install.
        $filterByIds = $mode === 'selected' && $selectedIds !== [];

        $query = User::query()->where('role', 'instructor');

        if ($filterByIds) {
            $query->whereIn('id', $selectedIds);
        }

        $users = $query
            ->select(['id', 'name', 'headline', 'bio', 'avatar'])
            ->with([
                'createdCourses' => fn ($courses) => $courses
                    ->where('status', 'published')
                    ->select(['id', 'creator_id'])
                    ->withCount([
                        'enrollments' => fn ($enrollments) => $enrollments
                            ->where('status', 'active')
                            ->whereHas('user', fn ($users) => $users->withoutTrashed()),
                    ])
                    ->with('categories:id,name'),
            ])
            ->latest()
            // Guard rail so a huge instructor roster cannot bloat the landing payload.
            ->take(max(200, $limit * 5))
            ->get();

        $instructors = $users->map(function (User $user) use ($defaultRole) {
            $courses = $user->createdCourses;
            $expertise = $courses
                ->flatMap(fn ($course) => $course->categories)
                ->pluck('name')
                ->unique()
                ->take(3)
                ->values()
                ->all();

            $students = (int) $courses->sum('enrollments_count');

            return [
                'id' => $user->id,
                'slug' => Str::slug($user->name).'-'.$user->id,
                'name' => $user->name,
                'role' => $user->headline ?: $defaultRole,
                'bio' => $user->bio ?: 'This instructor has not added a bio yet.',
                'avatar_url' => $user->avatar_url,
                'expertise' => $expertise,
                'courses' => $courses->count(),
                'students' => $students,
                'students_label' => $this->formatCount($students),
            ];
        })->all();

        usort($instructors, function (array $a, array $b) use ($sort, $filterByIds, $selectedIds) {
            if ($sort === 'selected' && $filterByIds) {
                return array_search($a['id'], $selectedIds, true) <=> array_search($b['id'], $selectedIds, true);
            }

            if ($sort === 'students') {
                return $b['students'] <=> $a['students'] ?: strcasecmp($a['name'], $b['name']);
            }

            if ($sort === 'name') {
                return strcasecmp($a['name'], $b['name']);
            }

            return $b['courses'] <=> $a['courses'] ?: $b['students'] <=> $a['students'];
        });

        return array_values(array_slice($instructors, 0, $limit));
    }

    /**
     * Global certificate template used by the landing sample and by courses
     * that do not override the design.
     *
     * @return array<string, mixed>
     */
    public function globalCertificateTemplate(): array
    {
        return $this->certificates->globalTemplatePayload();
    }

    /**
     * Instructor choices for the admin landing settings screen.
     *
     * @return list<array<string, mixed>>
     */
    public function instructorOptions(): array
    {
        return User::query()
            ->where('role', 'instructor')
            ->select(['id', 'name', 'headline', 'avatar'])
            ->withCount([
                'createdCourses as courses_count' => fn ($courses) => $courses->where('status', 'published'),
            ])
            ->orderBy('name')
            ->get()
            ->map(fn (User $user) => [
                'id' => $user->id,
                'name' => $user->name,
                'headline' => $user->headline,
                'avatar_url' => $user->avatar_url,
                'courses_count' => (int) $user->courses_count,
            ])
            ->all();
    }

    /**
     * Real, verifiable certificates for the landing showcase.
     *
     * @return list<array<string, mixed>>
     */
    public function certificates(): array
    {
        $settings = LandingSetting::content(LandingSetting::SECTION_CERTIFICATE);

        $mode = ($settings['mode'] ?? 'latest') === 'featured' ? 'featured' : 'latest';
        $limit = LandingSetting::intSetting(LandingSetting::SECTION_CERTIFICATE, 'limit', 3, 1, 12);
        $featuredIds = $this->positiveIds($settings['featured_ids'] ?? []);

        $query = Certificate::query()
            ->whereHas('user', fn ($users) => $users->whereNull('deleted_at'))
            ->whereHas('course', fn ($courses) => $courses->whereNull('deleted_at'))
            ->with([
                'user:id,name',
                // certificate_template is required to resolve per-course signature overrides.
                'course:id,title,slug,creator_id,certificate_template',
                'course.creator:id,name',
            ]);

        if ($mode === 'featured' && $featuredIds !== []) {
            $query->whereIn('id', $featuredIds);
        }

        $certificates = $query
            ->latest('issued_at')
            ->take(max(50, $limit * 5))
            ->get()
            ->map(function (Certificate $certificate) {
                $number = $certificate->certificate_number;

                return [
                    'id' => $certificate->id,
                    'certificate_number' => $number,
                    'student_name' => $certificate->user?->name ?? 'Learner',
                    'course_title' => $certificate->course?->title ?? 'Course',
                    'instructor_name' => $certificate->course?->creator?->name ?? AppearanceSetting::current()->displayName(),
                    'issued_at' => $certificate->issued_at?->format('d F Y') ?? '',
                    'verify_url' => url('/certificate/'.$number),
                    // The same resolved payload used by the PDF generator, so
                    // the landing preview always matches the issued design.
                    'template' => $this->certificates->templatePayload($certificate->course),
                ];
            })
            ->all();

        if ($mode === 'featured' && $featuredIds !== []) {
            usort($certificates, fn (array $a, array $b) => array_search($a['id'], $featuredIds, true) <=> array_search($b['id'], $featuredIds, true));
        }

        return array_values(array_slice($certificates, 0, $limit));
    }

    /**
     * Certificate choices for the admin landing settings screen.
     *
     * @return list<array<string, mixed>>
     */
    public function certificateOptions(): array
    {
        return Certificate::query()
            ->whereHas('user', fn ($users) => $users->whereNull('deleted_at'))
            ->whereHas('course', fn ($courses) => $courses->whereNull('deleted_at'))
            ->with(['user:id,name', 'course:id,title'])
            ->latest('issued_at')
            ->take(50)
            ->get()
            ->map(fn (Certificate $certificate) => [
                'id' => $certificate->id,
                'certificate_number' => $certificate->certificate_number,
                'student_name' => $certificate->user?->name ?? 'Learner',
                'course_title' => $certificate->course?->title ?? 'Course',
                'issued_at' => $certificate->issued_at?->format('d M Y') ?? '',
            ])
            ->all();
    }

    /**
     * @return list<int>
     */
    private function positiveIds(mixed $ids): array
    {
        if (! is_array($ids)) {
            return [];
        }

        return array_values(array_unique(array_filter(
            array_map('intval', $ids),
            fn (int $id) => $id > 0,
        )));
    }

    private function formatCount(int $value): string
    {
        if ($value < 1000) {
            return (string) $value;
        }

        return rtrim(rtrim(number_format($value / 1000, 1, '.', ''), '0'), '.').'k';
    }
}
