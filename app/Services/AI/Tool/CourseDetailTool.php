<?php

namespace App\Services\AI\Tool;

use App\Models\Course;

class CourseDetailTool
{
    public function getDefinition(): array
    {
        return [
            'description' => 'Retrieve detailed information for a specific course by ID.',
            'parameters' => [
                'type' => 'object',
                'properties' => [
                    'course_id' => [
                        'type' => 'integer',
                        'description' => 'The ID of the course'
                    ]
                ],
                'required' => ['course_id']
            ]
        ];
    }

    public function execute(array $arguments): array
    {
        if (empty($arguments['course_id'])) {
            return ['error' => 'course_id is required'];
        }

        $course = Course::with(['creator', 'modules', 'categories'])->find($arguments['course_id']);

        if (!$course) {
            return ['error' => 'Course not found'];
        }

        return [
            'id' => $course->id,
            'title' => $course->title,
            'description' => $course->description,
            'level' => $course->level,
            'type' => $course->type,
            'price' => $course->type === 'free' ? null : $course->price,
            'rating' => $course->rating_count > 0 ? (float) $course->rating_avg : null,
            'rating_count' => (int) $course->rating_count,
            'instructor' => $course->creator ? $course->creator->name : null,
            'modules_count' => $course->modules->count(),
            'modules' => $course->modules->pluck('title')->toArray(),
            'categories' => $course->categories->pluck('name')->toArray(),
        ];
    }
}
