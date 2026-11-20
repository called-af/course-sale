<?php

namespace App\Services\AI\Tool;

use App\Models\Enrollment;
use App\Models\Material;
use App\Models\MaterialContent;
use App\Models\MaterialContentProgress;
use App\Models\MaterialProgress;

class UserProgressTool
{
    protected ?int $userId = null;

    public function setUserId($userId): void
    {
        $this->userId = $userId;
    }

    public function getDefinition(): array
    {
        return [
            'description' => 'Retrieve the current user\'s course progress, completed courses, and active courses.',
            'parameters' => [
                'type' => 'object',
                'properties' => [],
            ],
        ];
    }

    public function execute(array $arguments): array
    {
        if (! $this->userId) {
            return ['error' => 'User context not available'];
        }

        $enrollments = Enrollment::query()
            ->with([
                'course:id,title,level,status',
                'course.modules' => fn ($query) => $query
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
            ])
            ->where('user_id', $this->userId)
            ->get();

        $activeCourses = [];
        $completedCourses = [];

        foreach ($enrollments as $enrollment) {
            $course = $enrollment->course;
            if (! $course) {
                continue;
            }

            $materials = $course->modules
                ->flatMap(fn ($module) => $module->materials)
                ->filter(fn (Material $material) => $material->contents->isNotEmpty())
                ->values();

            $totalMaterials = $materials->count();

            $materialIds = $materials->pluck('id');
            $contentIds = $materials->flatMap(fn (Material $material) => $material->contents->pluck('id'));

            $completedMaterialIds = $materialIds->isEmpty()
                ? collect()
                : MaterialProgress::query()
                    ->where('user_id', $this->userId)
                    ->whereIn('material_id', $materialIds)
                    ->where('is_completed', true)
                    ->pluck('material_id')
                    ->flip();

            $completedContentIds = $contentIds->isEmpty()
                ? collect()
                : MaterialContentProgress::query()
                    ->where('user_id', $this->userId)
                    ->whereIn('material_content_id', $contentIds)
                    ->where('is_completed', true)
                    ->pluck('material_content_id')
                    ->flip();

            $completedMaterials = $materials->filter(function (Material $material) use ($completedMaterialIds, $completedContentIds) {
                if (isset($completedMaterialIds[$material->id])) {
                    return true;
                }

                return $material->contents->isNotEmpty()
                    && $material->contents->every(
                        fn (MaterialContent $content) => isset($completedContentIds[$content->id])
                    );
            })->count();

            $progress = $totalMaterials > 0
                ? (int) round(($completedMaterials / $totalMaterials) * 100)
                : 0;

            $courseData = [
                'course_id' => $enrollment->course_id,
                'title' => $course->title,
                'level' => $course->level,
                'progress' => $progress,
                'completed_materials' => $completedMaterials,
                'total_materials' => $totalMaterials,
                'completed' => $totalMaterials > 0 && $completedMaterials >= $totalMaterials,
            ];

            if ($courseData['completed']) {
                $completedCourses[] = $courseData;
            } else {
                $activeCourses[] = $courseData;
            }
        }

        return [
            'active_courses' => $activeCourses,
            'completed_courses' => $completedCourses,
        ];
    }
}
