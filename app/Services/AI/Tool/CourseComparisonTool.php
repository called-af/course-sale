<?php

namespace App\Services\AI\Tool;

use App\Models\Course;

class CourseComparisonTool
{
    public function getDefinition(): array
    {
        return [
            'description' => 'Compare multiple courses by passing their IDs.',
            'parameters' => [
                'type' => 'object',
                'properties' => [
                    'course_ids' => [
                        'type' => 'array',
                        'items' => [
                            'type' => 'integer',
                        ],
                        'description' => 'Array of course IDs to compare',
                    ],
                ],
                'required' => ['course_ids'],
            ],
        ];
    }

    public function execute(array $arguments): array
    {
        if (empty($arguments['course_ids']) || ! is_array($arguments['course_ids'])) {
            return ['error' => 'course_ids array is required'];
        }

        $courses = Course::with(['modules', 'categories'])
            ->whereIn('id', $arguments['course_ids'])
            ->get();

        $comparison = [];

        foreach ($courses as $course) {
            $comparison[] = [
                'id' => $course->id,
                'title' => $course->title,
                'type' => $course->type,
                'price' => $course->type === 'free' ? null : $course->price,
                'level' => $course->level,
                'rating' => $course->rating_count > 0 ? (float) $course->rating_avg : null,
                'rating_count' => (int) $course->rating_count,
                'modules_count' => $course->modules->count(),
                'categories' => $course->categories->pluck('name')->toArray(),
            ];
        }

        return ['comparison' => $comparison];
    }
}
