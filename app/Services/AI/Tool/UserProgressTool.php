<?php

namespace App\Services\AI\Tool;

use App\Models\Enrollment;
use Illuminate\Support\Facades\DB;

class UserProgressTool
{
    protected ?int $userId = null;

    public function setUserId($userId)
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

        $enrollments = Enrollment::with('course:id,title,level')
            ->where('user_id', $this->userId)
            ->get();

        $activeCourses = [];
        $completedCourses = [];

        foreach ($enrollments as $enrollment) {
            $course = $enrollment->course;
            if (! $course) {
                continue;
            }

            // Calculate progress from material_progress table
            // Count total materials in the course (across all modules)
            $totalMaterials = DB::table('materials')
                ->join('modules', 'materials.module_id', '=', 'modules.id')
                ->where('modules.course_id', $enrollment->course_id)
                ->count();

            // Count completed materials by this user for this course
            $completedMaterials = DB::table('material_progress')
                ->join('materials', 'material_progress.material_id', '=', 'materials.id')
                ->join('modules', 'materials.module_id', '=', 'modules.id')
                ->where('modules.course_id', $enrollment->course_id)
                ->where('material_progress.user_id', $this->userId)
                ->where('material_progress.is_completed', true)
                ->count();

            $progress = $totalMaterials > 0
                ? round(($completedMaterials / $totalMaterials) * 100)
                : 0;

            $courseData = [
                'course_id' => $enrollment->course_id,
                'title' => $course->title,
                'level' => $course->level,
                'progress' => $progress,
                'completed_materials' => $completedMaterials,
                'total_materials' => $totalMaterials,
                'completed' => $progress >= 100,
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
