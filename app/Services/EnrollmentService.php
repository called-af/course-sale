<?php

namespace App\Services;

use App\Models\Course;
use App\Models\Enrollment;
use App\Models\Material;
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

        DB::transaction(function () use ($user, $course) {
            Enrollment::create(['user_id' => $user->id, 'course_id' => $course->id, 'status' => 'active', 'enrolled_at' => now()]);
            if (is_null($user->role)) {
                $user->update(['role' => 'student']);
            }
        });

        return 'enrolled';
    }

    public function learningData(User $user, Course $course, ?int $materialId = null, ?int $contentId = null): array
    {
        $course->load(['modules' => fn ($query) => $query->orderBy('sort_order')->with([
            'materials' => fn ($materialQuery) => $materialQuery->orderBy('sort_order')->with([
                'contents' => fn ($contentQuery) => $contentQuery->orderBy('sort_order')->with(['quizQuestions.quizOptions']),
            ]),
        ])]);

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

        return [
            'course' => $course->append('thumbnail_url'),
            'currentMaterial' => $currentMaterial,
            'currentContent' => $currentContent,
            'progress' => MaterialProgress::where('user_id', $user->id)->whereIn('material_id', $materialIds)->pluck('is_completed', 'material_id')->toArray(),
        ];
    }

    public function markProgress(User $user, Course $course, int $materialId): void
    {
        $material = Material::whereKey($materialId)->whereHas('module', fn ($query) => $query->where('course_id', $course->id))->firstOrFail();
        MaterialProgress::updateOrCreate(
            ['user_id' => $user->id, 'material_id' => $material->id],
            ['is_completed' => true, 'completed_at' => now()],
        );
    }
}
