<?php

namespace App\Services\AI\Tool;

use App\Models\Course;

class LearningPathTool
{
    protected ?int $userId = null;

    public function setUserId($userId)
    {
        $this->userId = $userId;
    }

    public function getDefinition(): array
    {
        return [
            'description' => 'Generate a learning path for a specific goal.',
            'parameters' => [
                'type' => 'object',
                'properties' => [
                    'goal' => [
                        'type' => 'string',
                        'description' => 'User learning goal (e.g. Backend Developer)'
                    ]
                ],
                'required' => ['goal']
            ]
        ];
    }

    public function execute(array $arguments): array
    {
        $goal = $arguments['goal'] ?? '';
        
        // A simple implementation of learning path logic for demo
        // In reality, this might involve more complex query or another AI call.
        // We will just search for courses matching the goal and sort by level.

        $levels = ['beginner' => 1, 'intermediate' => 2, 'advanced' => 3];

        $courses = Course::where('status', 'published')
            ->where(function($q) use ($goal) {
                $q->where('title', 'like', "%{$goal}%")
                  ->orWhere('description', 'like', "%{$goal}%")
                  ->orWhereHas('categories', function($q2) use ($goal) {
                      $q2->where('name', 'like', "%{$goal}%");
                  });
            })
            ->get()
            ->sortBy(function($course) use ($levels) {
                return $levels[$course->level] ?? 1;
            })
            ->take(5);

        if ($courses->isEmpty()) {
            return ['error' => 'Could not generate a learning path for this goal from available courses.'];
        }

        $path = [];
        $order = 1;
        foreach ($courses as $course) {
            $path[] = [
                'order' => $order++,
                'course_id' => $course->id,
                'title' => $course->title,
                'level' => $course->level,
            ];
        }

        return ['learning_path' => $path];
    }
}
