<?php

namespace App\Services;

use App\Models\Certificate;
use App\Models\Course;
use App\Models\Enrollment;
use App\Models\Material;
use App\Models\MaterialContent;
use App\Models\MaterialContentProgress;
use App\Models\MaterialProgress;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class EnrollmentService
{
    public function isEnrolled(User $user, Course $course): bool
    {
        return Enrollment::where('user_id', $user->id)
            ->where('course_id', $course->id)
            ->where('status', 'active')
            ->exists();
    }

    public function enroll(User $user, Course $course): string
    {
        if (! $course->isPublished()) {
            abort(404);
        }

        $existing = Enrollment::where('user_id', $user->id)
            ->where('course_id', $course->id)
            ->first();

        if ($existing?->status === 'active') {
            return 'already_enrolled';
        }

        // Revoked/expired paid enrollments must go through checkout again.
        if ($course->isPaid()) {
            return 'payment_required';
        }

        $enrollment = null;
        DB::transaction(function () use ($user, $course, $existing, &$enrollment) {
            if ($existing) {
                $existing->update(['status' => 'active', 'enrolled_at' => now()]);
                $enrollment = $existing->refresh();
            } else {
                $enrollment = Enrollment::create([
                    'user_id' => $user->id,
                    'course_id' => $course->id,
                    'status' => 'active',
                    'enrolled_at' => now(),
                ]);
            }

            if (is_null($user->role)) {
                $user->update(['role' => 'student']);
            }
        });

        app(EventTrackingService::class)->trackCourseEnroll($user, $course);

        if ($enrollment) {
            $this->dispatchWhatsAppNotification($enrollment, $course, $user);
        }

        return 'enrolled';
    }

    public function dispatchWhatsAppNotification(Enrollment $enrollment, Course $course, User $student): void
    {
        try {
            $course->loadMissing('creator');
            $instructor = $course->creator;

            if ($instructor && $instructor->whatsapp_notification_enabled && ! empty($instructor->whatsapp_number)) {
                \App\Jobs\SendWhatsAppEnrollmentNotificationJob::dispatch(
                    $enrollment->id,
                    $instructor->id,
                    $student->id,
                    $course->id
                );
            }
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::error('Failed to dispatch WhatsApp enrollment notification: '.$e->getMessage(), [
                'enrollment_id' => $enrollment->id,
                'course_id' => $course->id,
            ]);
        }
    }

    public function learningData(User $user, Course $course, ?int $materialId = null, ?int $contentId = null): array
    {
        $course->load(['modules' => fn ($query) => $query
            ->where('status', 'published')
            ->orderBy('sort_order')
            ->with([
                'materials' => fn ($materialQuery) => $materialQuery
                    ->where('status', 'published')
                    ->orderBy('sort_order')
                    ->with([
                        'contents' => fn ($contentQuery) => $contentQuery
                            ->where('status', 'published')
                            ->orderBy('sort_order')
                            ->with(['quizQuestions.quizOptions']),
                    ]),
            ])]);
        $course->loadMissing(['creator:id,name', 'categories:id,name']);
        $course->append('thumbnail_url');

        $currentMaterial = null;
        $currentContent = null;
        if ($materialId && $contentId) {
            foreach ($course->modules as $module) {
                foreach ($module->materials as $material) {
                    if ($material->id === $materialId) {
                        $currentMaterial = $material;
                        $currentContent = $material->contents->firstWhere('id', $contentId);
                        break 2;
                    }
                }
            }
        }

        $currentMaterial ??= $course->modules->first()?->materials->first();
        $currentContent ??= $currentMaterial?->contents->first();
        $materialIds = $course->modules->flatMap(fn ($module) => $module->materials->pluck('id'));
        $contentIds = $course->modules->flatMap(
            fn ($module) => $module->materials->flatMap(fn ($material) => $material->contents->pluck('id'))
        );

        if ($currentMaterial) {
            app(EventTrackingService::class)->trackMaterialView($user, $course, $currentMaterial, [
                'content_id' => $currentContent?->id,
                'content_title' => $currentContent?->title,
                'content_type' => $currentContent?->type,
            ]);
        }

        $progress = MaterialProgress::where('user_id', $user->id)->whereIn('material_id', $materialIds)->pluck('is_completed', 'material_id')->toArray();

        $contentProgress = MaterialContentProgress::where('user_id', $user->id)
            ->whereIn('material_content_id', $contentIds)
            ->where('is_completed', true)
            ->pluck('is_completed', 'material_content_id')
            ->toArray();

        $quizContents = $course->modules
            ->flatMap(fn ($module) => $module->materials)
            ->flatMap(fn ($material) => $material->contents)
            ->where('type', 'quiz')
            ->values();

        $resourcesUnlocked = $this->isCompleted($user, $course);

        $resources = $resourcesUnlocked
            ? \App\Models\CourseResource::query()
                ->where('course_id', $course->id)
                ->where('status', 'published')
                ->orderBy('sort_order')
                ->get()
                ->map(fn ($resource) => [
                    'id' => $resource->id,
                    'title' => $resource->title,
                    'description' => $resource->description,
                    'download_url' => route('student.courses.resources.download', [
                        'course' => $course->slug,
                        'resource' => $resource->id,
                    ]),
                ])
                ->all()
            : [];

        return [
            'course' => $course,
            'currentMaterial' => $currentMaterial,
            'currentContent' => $currentContent,
            'progress' => $progress,
            'contentProgress' => $contentProgress,
            'quizStates' => app(QuizService::class)->statesFor($user, $quizContents),
            'certificate' => Certificate::where('user_id', $user->id)->where('course_id', $course->id)->select('id', 'certificate_number')->first(),
            'resources' => $resources,
            'resourcesUnlocked' => $resourcesUnlocked,
            'refundPolicy' => $this->refundPolicy($user, $course),
            ...$this->progressMeta($course, $progress),
        ];
    }

    /**
     * Refund eligibility for a paid course. A student may only request a refund
     * within the configured window and while lesson progress is still low.
     *
     * @return array{
     *     applies: bool,
     *     window_days: int,
     *     max_progress_percent: int,
     *     enrolled_at: string|null,
     *     deadline: string|null,
     *     days_left: int|null,
     *     progress_percent: int,
     *     expired: bool,
     *     over_progress: bool,
     *     eligible: bool
     * }
     */
    public function refundPolicy(User $user, Course $course): array
    {
        $windowDays = max(0, (int) config('services.payment.refund_window_days', 7));
        $maxProgressPercent = max(0, min(100, (int) config('services.payment.refund_max_progress_percent', 25)));

        $enrollment = Enrollment::query()
            ->where('user_id', $user->id)
            ->where('course_id', $course->id)
            ->first();

        // `enrolled_at` uses the legacy `timestamp` cast, which returns an
        // integer on this app, so normalise it before doing date math.
        $enrolledAt = $enrollment?->enrolled_at;

        if (is_numeric($enrolledAt)) {
            $enrolledAt = \Illuminate\Support\Carbon::createFromTimestamp((int) $enrolledAt);
        } elseif ($enrolledAt instanceof \DateTimeInterface) {
            $enrolledAt = \Illuminate\Support\Carbon::instance($enrolledAt);
        }

        $deadline = $enrolledAt?->copy()->addDays($windowDays);

        $contentsQuery = fn () => MaterialContent::query()
            ->where('status', 'published')
            ->whereHas('material', fn ($material) => $material
                ->where('status', 'published')
                ->whereHas('module', fn ($module) => $module
                    ->where('course_id', $course->id)
                    ->where('status', 'published')));

        $totalContents = $contentsQuery()->count();

        $completedContents = MaterialContentProgress::query()
            ->where('user_id', $user->id)
            ->where('is_completed', true)
            ->whereHas('content', fn ($content) => $content
                ->where('status', 'published')
                ->whereHas('material', fn ($material) => $material
                    ->where('status', 'published')
                    ->whereHas('module', fn ($module) => $module
                        ->where('course_id', $course->id)
                        ->where('status', 'published'))))
            ->count();

        $progressRatio = $totalContents > 0 ? ($completedContents / $totalContents) * 100 : 0.0;
        $progressPercent = (int) round($progressRatio);
        $overProgress = $progressRatio > $maxProgressPercent;
        $expired = $deadline !== null && now()->greaterThan($deadline);

        $applies = $course->isPaid() && $enrollment !== null;

        return [
            'applies' => $applies,
            'window_days' => $windowDays,
            'max_progress_percent' => $maxProgressPercent,
            'enrolled_at' => $enrolledAt?->toIso8601String(),
            'deadline' => $deadline?->toIso8601String(),
            'days_left' => $deadline
                ? max(0, (int) ceil(($deadline->getTimestamp() - now()->getTimestamp()) / 86400))
                : null,
            'progress_percent' => $progressPercent,
            'expired' => $expired,
            'over_progress' => $overProgress,
            'eligible' => $applies && ! $expired && ! $overProgress,
        ];
    }

    /**
     * Calculate total / completed / percent plus the resume target.
     */
    public function progressMeta(Course $course, array $progress): array
    {
        $materials = $course->modules
            ->where('status', 'published')
            ->flatMap(fn ($module) => $module->materials->where('status', 'published'))
            ->values();
        $total = $materials->count();
        $completed = $materials->filter(fn ($material) => ! empty($progress[$material->id]))->count();
        $percent = $total > 0 ? (int) round(($completed / $total) * 100) : 0;

        $resumeMaterial = $materials->first(fn ($material) => empty($progress[$material->id])) ?? $materials->first();

        return [
            'totalMaterials' => $total,
            'completedCount' => $completed,
            'progressPercent' => $percent,
            'canReview' => $total > 0 && $completed === $total,
            'resume' => $resumeMaterial ? [
                'material_id' => $resumeMaterial->id,
                'content_id' => $resumeMaterial->contents->where('status', 'published')->first()?->id,
            ] : null,
        ];
    }

    public function isCompleted(User $user, Course $course): bool
    {
        $materialIds = Material::where('status', 'published')
            ->whereHas('module', fn ($query) => $query
                ->where('course_id', $course->id)
                ->where('status', 'published'))
            ->whereHas('contents', fn ($query) => $query->where('status', 'published'))
            ->pluck('id');

        if ($materialIds->isEmpty()) {
            return false;
        }

        $completed = MaterialProgress::where('user_id', $user->id)
            ->whereIn('material_id', $materialIds)
            ->where('is_completed', true)
            ->count();

        return $completed >= $materialIds->count();
    }

    public function markContentProgress(User $user, Course $course, MaterialContent $content): bool
    {
        $content->loadMissing('material.module');

        if ($content->material?->module?->course_id !== $course->id) {
            abort(404);
        }

        // Draft/unpublished lessons must never be reachable from the student player.
        if (
            $content->status !== 'published'
            || $content->material?->status !== 'published'
            || $content->material?->module?->status !== 'published'
        ) {
            abort(404);
        }

        // Quiz content is only completed through a full quiz submission.
        if ($content->type === 'quiz') {
            return false;
        }

        MaterialContentProgress::updateOrCreate(
            [
                'user_id' => $user->id,
                'material_content_id' => $content->id,
            ],
            [
                'is_completed' => true,
                'completed_at' => now(),
            ]
        );

        return true;
    }

    /**
     * Activate (or re-activate) an enrollment. Used by the checkout flow when
     * a paid order is confirmed.
     */
    public function activate(User $user, Course $course): Enrollment
    {
        $existing = Enrollment::where('user_id', $user->id)
            ->where('course_id', $course->id)
            ->first();

        if ($existing && $existing->status === 'active') {
            return $existing;
        }

        if ($existing) {
            $existing->update([
                'status' => 'active',
                'enrolled_at' => now(),
            ]);

            return $existing;
        }

        return Enrollment::create([
            'user_id' => $user->id,
            'course_id' => $course->id,
            'status' => 'active',
            'enrolled_at' => now(),
        ]);
    }

    /**
     * Revoke learning access after a refund.
     */
    public function revoke(Enrollment $enrollment): void
    {
        $enrollment->update(['status' => 'revoked']);
    }

    public function markProgress(User $user, Course $course, int $materialId): void
    {
        $material = Material::whereKey($materialId)
            ->where('status', 'published')
            ->whereHas('module', fn ($query) => $query
                ->where('course_id', $course->id)
                ->where('status', 'published'))
            ->firstOrFail();

        MaterialProgress::updateOrCreate(
            ['user_id' => $user->id, 'material_id' => $material->id],
            ['is_completed' => true, 'completed_at' => now()],
        );

        app(EventTrackingService::class)->trackMaterialComplete($user, $course, $material);

        // Auto-generate certificate when course is 100% complete
        app(CertificateService::class)->generateIfCompleted($user, $course);
    }
}
