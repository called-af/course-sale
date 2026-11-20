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

        $findMaterialByContent = function (int $targetContentId) use ($course): ?array {
            foreach ($course->modules as $module) {
                foreach ($module->materials as $material) {
                    $found = $material->contents->firstWhere('id', $targetContentId);
                    if ($found) {
                        return [$material, $found];
                    }
                }
            }

            return null;
        };

        if ($materialId) {
            foreach ($course->modules as $module) {
                foreach ($module->materials as $material) {
                    if ($material->id === $materialId) {
                        $currentMaterial = $material;
                        if ($contentId) {
                            $currentContent = $material->contents->firstWhere('id', $contentId);
                        }
                        break 2;
                    }
                }
            }
        }

        if (! $currentMaterial && $contentId) {
            $located = $findMaterialByContent($contentId);
            if ($located) {
                [$currentMaterial, $currentContent] = $located;
            }
        }

        $currentMaterial ??= $course->modules->first()?->materials->first();
        $currentContent ??= $currentMaterial?->contents->first();

        $materialIds = $course->modules->flatMap(fn ($module) => $module->materials->pluck('id'));
        $leafContents = $course->modules
            ->flatMap(fn ($module) => $module->materials)
            ->flatMap(fn ($material) => $material->contents)
            ->values();
        $contentIds = $leafContents->pluck('id');

        if ($currentMaterial) {
            app(EventTrackingService::class)->trackMaterialView($user, $course, $currentMaterial, [
                'content_id' => $currentContent?->id,
                'content_title' => $currentContent?->title,
                'content_type' => $currentContent?->type,
            ]);
        }

        $progress = MaterialProgress::where('user_id', $user->id)
            ->whereIn('material_id', $materialIds)
            ->where('is_completed', true)
            ->pluck('is_completed', 'material_id')
            ->toArray();

        $contentProgress = MaterialContentProgress::where('user_id', $user->id)
            ->whereIn('material_content_id', $contentIds)
            ->where('is_completed', true)
            ->pluck('is_completed', 'material_content_id')
            ->toArray();

        // Heal/sync derived material completion cache from content completion.
        $progress = $this->effectiveMaterialProgress($course, $progress, $contentProgress);
        $this->syncCompletedMaterials($user, $course, $progress);

        $allCourseMaterialIds = Material::query()
            ->whereHas('module', fn ($query) => $query->where('course_id', $course->id))
            ->pluck('id');

        if ($allCourseMaterialIds->isNotEmpty()) {
            $staleIds = $allCourseMaterialIds->reject(fn ($id) => ! empty($progress[$id]))->values();

            if ($staleIds->isNotEmpty()) {
                MaterialProgress::query()
                    ->where('user_id', $user->id)
                    ->whereIn('material_id', $staleIds)
                    ->where('is_completed', true)
                    ->update([
                        'is_completed' => false,
                        'completed_at' => null,
                    ]);
            }
        }

        $quizContents = $leafContents->where('type', 'quiz')->values();

        $resourcesUnlocked = $this->isCompleted($user, $course);

        $resources = collect(app(CourseResourceService::class)->mergedForCourse($course, publishedOnly: true))
            ->filter(function (array $resource) use ($resourcesUnlocked, $progress, $contentProgress) {
                if (($resource['source'] ?? CourseResourceService::SOURCE_MANUAL) === CourseResourceService::SOURCE_MANUAL) {
                    return $resourcesUnlocked;
                }

                if ($resourcesUnlocked) {
                    return true;
                }

                return ! empty($progress[$resource['material_id'] ?? 0])
                    || ! empty($contentProgress[$resource['material_content_id'] ?? 0]);
            })
            ->map(function (array $resource) use ($course) {
                $resource['download_url'] = ($resource['source'] ?? CourseResourceService::SOURCE_MANUAL) === CourseResourceService::SOURCE_MATERIAL
                    ? route('student.courses.resources.content.download', [
                        'course' => $course->slug,
                        'content' => $resource['material_content_id'],
                    ])
                    : route('student.courses.resources.download', [
                        'course' => $course->slug,
                        'resource' => $resource['id'],
                    ]);

                return $resource;
            })
            ->values()
            ->all();

        return [
            'course' => $course,
            'currentMaterial' => $currentMaterial,
            'currentContent' => $currentContent,
            'currentSectionId' => null,
            'progress' => $progress,
            'contentProgress' => $contentProgress,
            'quizStates' => app(QuizService::class)->statesFor($user, $quizContents),
            'certificate' => Certificate::where('user_id', $user->id)->where('course_id', $course->id)->select('id', 'certificate_number')->first(),
            'resources' => $resources,
            'resourcesUnlocked' => $resourcesUnlocked,
            'refundPolicy' => $this->refundPolicy($user, $course),
            ...$this->progressMeta($course, $progress, $contentProgress),
        ];
    }

    /**
     * Published, completable blocks of a material.
     *
     * @return \Illuminate\Support\Collection<int, MaterialContent>
     */
    protected function leafContents(Material $material): \Illuminate\Support\Collection
    {
        return $material->contents
            ->filter(fn (MaterialContent $content) => $content->status === 'published')
            ->values();
    }

    /**
     * Refund eligibility for a paid course. A student may only request a refund
     * within the configured window and while lesson progress is still low.
     *
     * @return array<string, mixed>
     */
    public function refundPolicy(User $user, Course $course): array
    {
        $windowDays = max(0, (int) config('services.payment.refund_window_days', 7));
        $maxProgressPercent = max(0, min(100, (int) config('services.payment.refund_max_progress_percent', 25)));

        $enrollment = Enrollment::query()
            ->where('user_id', $user->id)
            ->where('course_id', $course->id)
            ->first();

        $enrolledAt = $enrollment?->enrolled_at;

        if (is_numeric($enrolledAt)) {
            $enrolledAt = \Illuminate\Support\Carbon::createFromTimestamp((int) $enrolledAt);
        } elseif ($enrolledAt instanceof \DateTimeInterface) {
            $enrolledAt = \Illuminate\Support\Carbon::instance($enrolledAt);
        }

        $deadline = $enrolledAt?->copy()->addDays($windowDays);

        $totalContents = MaterialContent::query()
            ->where('status', 'published')
            ->whereHas('material', fn ($material) => $material
                ->where('status', 'published')
                ->whereHas('module', fn ($module) => $module
                    ->where('course_id', $course->id)
                    ->where('status', 'published')))
            ->count();

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
    public function progressMeta(Course $course, array $progress, array $contentProgress = []): array
    {
        $materials = $course->modules
            ->where('status', 'published')
            ->flatMap(fn ($module) => $module->materials->where('status', 'published'))
            ->values();

        $progress = $this->effectiveMaterialProgress($course, $progress, $contentProgress);

        $total = $materials->count();
        $completed = $materials->filter(fn ($material) => ! empty($progress[$material->id]))->count();
        $percent = $total > 0 ? (int) round(($completed / $total) * 100) : 0;

        $resumeMaterial = $materials->first(fn ($material) => empty($progress[$material->id])) ?? $materials->first();
        $resumeContent = null;

        if ($resumeMaterial) {
            $resumeContent = $resumeMaterial->contents
                ->first(fn ($content) => empty($contentProgress[$content->id]))
                ?? $resumeMaterial->contents->first();
        }

        return [
            'totalMaterials' => $total,
            'completedCount' => $completed,
            'progressPercent' => $percent,
            'canReview' => $total > 0 && $completed === $total,
            'resume' => $resumeMaterial ? [
                'material_id' => $resumeMaterial->id,
                'content_id' => $resumeContent?->id,
            ] : null,
        ];
    }

    public function isCompleted(User $user, Course $course): bool
    {
        $materials = Material::query()
            ->where('status', 'published')
            ->whereHas('module', fn ($query) => $query
                ->where('course_id', $course->id)
                ->where('status', 'published'))
            ->whereHas('contents', fn ($query) => $query->where('status', 'published'))
            ->with(['contents' => fn ($query) => $query->where('status', 'published')->select('id', 'material_id', 'status')])
            ->get(['id']);

        if ($materials->isEmpty()) {
            return false;
        }

        $materialIds = $materials->pluck('id');
        $completedMaterialIds = MaterialProgress::where('user_id', $user->id)
            ->whereIn('material_id', $materialIds)
            ->where('is_completed', true)
            ->pluck('material_id')
            ->flip();

        $contentIds = $materials->flatMap(fn (Material $material) => $material->contents->pluck('id'));
        $completedContentIds = MaterialContentProgress::where('user_id', $user->id)
            ->whereIn('material_content_id', $contentIds)
            ->where('is_completed', true)
            ->pluck('material_content_id')
            ->flip();

        foreach ($materials as $material) {
            if (isset($completedMaterialIds[$material->id])) {
                continue;
            }

            $leafContents = $material->contents;
            if ($leafContents->isEmpty()) {
                return false;
            }

            $allContentsCompleted = $leafContents->every(
                fn (MaterialContent $content) => isset($completedContentIds[$content->id])
            );

            if (! $allContentsCompleted) {
                return false;
            }
        }

        return true;
    }

    /**
     * Whether the student has effectively completed a specific lesson material
     * (all published contents completed).
     */
    public function hasCompletedMaterial(User $user, Material $material): bool
    {
        $contentIds = MaterialContent::query()
            ->where('material_id', $material->id)
            ->where('status', 'published')
            ->pluck('id');

        if ($contentIds->isEmpty()) {
            return false;
        }

        $completed = MaterialContentProgress::query()
            ->where('user_id', $user->id)
            ->whereIn('material_content_id', $contentIds)
            ->where('is_completed', true)
            ->count();

        return $completed >= $contentIds->count();
    }

    /**
     * Whether the student has completed a specific content block.
     */
    public function hasCompletedContent(User $user, MaterialContent $content): bool
    {
        return MaterialContentProgress::where('user_id', $user->id)
            ->where('material_content_id', $content->id)
            ->where('is_completed', true)
            ->exists();
    }

    public function markContentProgress(User $user, Course $course, MaterialContent $content): bool
    {
        $content->loadMissing('material.module');

        if ($content->material?->module?->course_id !== $course->id) {
            abort(404);
        }

        // Draft/unpublished content must never be reachable from the student player.
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

        $content->material?->loadMissing(['contents' => fn ($query) => $query->where('status', 'published')->select('id', 'material_id', 'status')]);
        $this->syncMaterialCompletion($user, $content->material, $course);

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
        $material = Material::query()
            ->whereKey($materialId)
            ->where('status', 'published')
            ->whereHas('module', fn ($query) => $query
                ->where('course_id', $course->id)
                ->where('status', 'published'))
            ->with([
                'module:id,course_id,status',
                'contents' => fn ($query) => $query->where('status', 'published')->select('id', 'material_id', 'status'),
            ])
            ->firstOrFail();

        // Material completion is derived from content completion (backend-owned).
        $this->syncMaterialCompletion($user, $material, $course);
    }

    /**
     * Sync derived material completion cache from content completion.
     * Marks complete when all published contents are done in a published material/module,
     * otherwise revokes stale completion cache for that material.
     */
    public function syncMaterialCompletion(User $user, ?Material $material, ?Course $course = null): bool
    {
        if (! $material) {
            return false;
        }

        $material->loadMissing([
            'module:id,course_id,status',
            'contents' => fn ($query) => $query->where('status', 'published')->select('id', 'material_id', 'status'),
        ]);

        $course = $course ?: ($material->module?->course_id ? Course::find($material->module->course_id) : null);
        if (! $course) {
            return false;
        }

        $isEligibleAndComplete = $material->status === 'published'
            && $material->module?->status === 'published'
            && $material->contents->isNotEmpty();

        if ($isEligibleAndComplete) {
            $contentIds = $material->contents->pluck('id');
            $completedCount = MaterialContentProgress::where('user_id', $user->id)
                ->whereIn('material_content_id', $contentIds)
                ->where('is_completed', true)
                ->count();

            $isEligibleAndComplete = $completedCount >= $contentIds->count();
        }

        if ($isEligibleAndComplete) {
            $this->recordMaterialCompletion($user, $course, $material);

            return true;
        }

        $this->revokeMaterialCompletion($user, $material);

        return false;
    }

    protected function recordMaterialCompletion(User $user, Course $course, Material $material): void
    {
        $progress = MaterialProgress::query()->firstOrNew([
            'user_id' => $user->id,
            'material_id' => $material->id,
        ]);

        $wasCompleted = (bool) $progress->is_completed;

        $progress->is_completed = true;
        $progress->completed_at = $progress->completed_at ?: now();
        $progress->save();

        if (! $wasCompleted) {
            app(EventTrackingService::class)->trackMaterialComplete($user, $course, $material);
        }

        app(CertificateService::class)->generateIfCompleted($user, $course);
    }

    protected function revokeMaterialCompletion(User $user, Material $material): void
    {
        $progress = MaterialProgress::query()
            ->where('user_id', $user->id)
            ->where('material_id', $material->id)
            ->where('is_completed', true)
            ->first();

        if (! $progress) {
            return;
        }

        $progress->forceFill([
            'is_completed' => false,
            'completed_at' => null,
        ])->save();
    }

    /**
     * Derive material completion from content completion when material records are missing.
     *
     * @param  array<int, mixed>  $progress
     * @param  array<int, mixed>  $contentProgress
     * @return array<int, bool>
     */
    protected function effectiveMaterialProgress(Course $course, array $progress, array $contentProgress = []): array
    {
        $effective = [];

        foreach ($progress as $materialId => $isCompleted) {
            if (! empty($isCompleted)) {
                $effective[(int) $materialId] = true;
            }
        }

        $materials = $course->relationLoaded('modules')
            ? $course->modules
                ->where('status', 'published')
                ->flatMap(fn ($module) => $module->materials->where('status', 'published'))
            : collect();

        foreach ($materials as $material) {
            if (! empty($effective[$material->id])) {
                continue;
            }

            $contents = $material->relationLoaded('contents')
                ? $material->contents->where('status', 'published')
                : $material->contents()->where('status', 'published')->get(['id', 'material_id', 'status']);

            if ($contents->isEmpty()) {
                continue;
            }

            $allCompleted = $contents->every(fn (MaterialContent $content) => ! empty($contentProgress[$content->id]));
            if ($allCompleted) {
                $effective[$material->id] = true;
            }
        }

        return $effective;
    }

    /**
     * Persist derived material completion cache for materials in the provided structure.
     * Records completion when effective, and revokes stale completion cache when not.
     *
     * @param  array<int, mixed>  $effectiveProgress
     */
    protected function syncCompletedMaterials(User $user, Course $course, array $effectiveProgress): void
    {
        $materials = $course->modules
            ->flatMap(fn ($module) => $module->materials);

        foreach ($materials as $material) {
            if (! empty($effectiveProgress[$material->id])) {
                $this->recordMaterialCompletion($user, $course, $material);

                continue;
            }

            $this->revokeMaterialCompletion($user, $material);
        }
    }

    /**
     * Reconcile material-level progress cache from content-level progress for a course.
     * Ensures backend-derived material completion records match current content truth
     * (adds missing completions and revokes stale ones). Idempotent.
     */
    public function reconcileMaterialProgress(User $user, Course $course): int
    {
        $publishedCourse = clone $course;
        $publishedCourse->load([
            'modules' => fn ($query) => $query
                ->where('status', 'published')
                ->with([
                    'materials' => fn ($materialQuery) => $materialQuery
                        ->where('status', 'published')
                        ->with([
                            'contents' => fn ($contentQuery) => $contentQuery
                                ->where('status', 'published')
                                ->select('id', 'material_id', 'status'),
                        ]),
                ]),
        ]);

        $publishedMaterialIds = $publishedCourse->modules->flatMap(fn ($module) => $module->materials->pluck('id'));
        $publishedContentIds = $publishedCourse->modules
            ->flatMap(fn ($module) => $module->materials)
            ->flatMap(fn ($material) => $material->contents->pluck('id'));

        $progress = $publishedMaterialIds->isEmpty()
            ? []
            : MaterialProgress::where('user_id', $user->id)
                ->whereIn('material_id', $publishedMaterialIds)
                ->where('is_completed', true)
                ->pluck('is_completed', 'material_id')
                ->toArray();

        $contentProgress = $publishedContentIds->isEmpty()
            ? []
            : MaterialContentProgress::where('user_id', $user->id)
                ->whereIn('material_content_id', $publishedContentIds)
                ->where('is_completed', true)
                ->pluck('is_completed', 'material_content_id')
                ->toArray();

        $effective = $this->effectiveMaterialProgress($publishedCourse, $progress, $contentProgress);
        $this->syncCompletedMaterials($user, $publishedCourse, $effective);

        // Revoke stale completion cache for materials in this course that are no longer
        // effectively complete (e.g. unpublished/removed from published structure).
        $allCourseMaterialIds = Material::query()
            ->whereHas('module', fn ($query) => $query->where('course_id', $course->id))
            ->pluck('id');

        if ($allCourseMaterialIds->isNotEmpty()) {
            $staleIds = $allCourseMaterialIds->reject(fn ($id) => ! empty($effective[$id]))->values();

            if ($staleIds->isNotEmpty()) {
                MaterialProgress::query()
                    ->where('user_id', $user->id)
                    ->whereIn('material_id', $staleIds)
                    ->where('is_completed', true)
                    ->update([
                        'is_completed' => false,
                        'completed_at' => null,
                    ]);
            }
        }

        return collect($effective)->filter()->count();
    }
}
