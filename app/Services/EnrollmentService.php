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

        if (Enrollment::where('user_id', $user->id)->where('course_id', $course->id)->exists()) {
            return 'already_enrolled';
        }

        if ($course->isPaid()) {
            return 'payment_required';
        }

        $enrollment = null;
        DB::transaction(function () use ($user, $course, &$enrollment) {
            $enrollment = Enrollment::create(['user_id' => $user->id, 'course_id' => $course->id, 'status' => 'active', 'enrolled_at' => now()]);
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

    protected function dispatchWhatsAppNotification(Enrollment $enrollment, Course $course, User $student): void
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
        $course->load(['modules' => fn ($query) => $query->orderBy('sort_order')->with([
            'materials' => fn ($materialQuery) => $materialQuery->orderBy('sort_order')->with([
                'contents' => fn ($contentQuery) => $contentQuery->orderBy('sort_order')->with(['quizQuestions.quizOptions']),
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

        return [
            'course' => $course,
            'currentMaterial' => $currentMaterial,
            'currentContent' => $currentContent,
            'progress' => $progress,
            'contentProgress' => $contentProgress,
            'quizStates' => app(QuizService::class)->statesFor($user, $quizContents),
            'certificate' => Certificate::where('user_id', $user->id)->where('course_id', $course->id)->select('id', 'certificate_number')->first(),
            ...$this->progressMeta($course, $progress),
        ];
    }

    /**
     * Calculate total / completed / percent plus the resume target.
     */
    public function progressMeta(Course $course, array $progress): array
    {
        $materials = $course->modules->flatMap(fn ($module) => $module->materials);
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
                'content_id' => $resumeMaterial->contents->first()?->id,
            ] : null,
        ];
    }

    public function isCompleted(User $user, Course $course): bool
    {
        $materialIds = $course->modules()->with('materials:id,module_id')->get()
            ->flatMap(fn ($module) => $module->materials->pluck('id'));

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

    public function canCompleteMaterial(User $user, Material $material): bool
    {
        $material->loadMissing('contents');

        if ($material->contents->isEmpty()) {
            return false;
        }

        $completedContentIds = MaterialContentProgress::where('user_id', $user->id)
            ->whereIn('material_content_id', $material->contents->pluck('id'))
            ->where('is_completed', true)
            ->pluck('material_content_id')
            ->all();

        return $material->contents->every(
            fn (MaterialContent $content) => in_array($content->id, $completedContentIds, true)
        );
    }

    public function markProgress(User $user, Course $course, int $materialId): bool
    {
        $material = Material::whereKey($materialId)
            ->whereHas('module', fn ($query) => $query->where('course_id', $course->id))
            ->with('contents')
            ->firstOrFail();

        if (! $this->canCompleteMaterial($user, $material)) {
            return false;
        }

        MaterialProgress::updateOrCreate(
            ['user_id' => $user->id, 'material_id' => $material->id],
            ['is_completed' => true, 'completed_at' => now()],
        );

        app(EventTrackingService::class)->trackMaterialComplete($user, $course, $material);

        // Auto-generate certificate when course is 100% complete
        app(CertificateService::class)->generateIfCompleted($user, $course);

        return true;
    }
}
