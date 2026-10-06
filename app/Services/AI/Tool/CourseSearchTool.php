<?php

namespace App\Services\AI\Tool;

use App\Models\Course;

class CourseSearchTool
{
    public function getDefinition(): array
    {
        return [
            'description' => 'Search courses using structured filters like query, category, level, and max_price.',
            'parameters' => [
                'type' => 'object',
                'properties' => [
                    'query' => [
                        'type' => 'string',
                        'description' => 'Search keyword (e.g. Laravel, React)'
                    ],
                    'category' => [
                        'type' => 'string',
                        'description' => 'Category name to filter by'
                    ],
                    'level' => [
                        'type' => 'string',
                        'enum' => ['beginner', 'intermediate', 'advanced'],
                        'description' => 'Difficulty level'
                    ],
                    'max_price' => [
                        'type' => 'integer',
                        'description' => 'Maximum price user is willing to pay'
                    ]
                ]
            ]
        ];
    }

    public function execute(array $arguments): array
    {
        $hash = md5(json_encode($arguments));
        $cacheKey = "course-search:{$hash}";

        $courses = \Illuminate\Support\Facades\Cache::remember($cacheKey, now()->addMinutes(30), function () use ($arguments) {
            $query = Course::query()->where('status', 'published');

            if (!empty($arguments['query'])) {
                $searchTerm = $arguments['query'];
                $query->where(function ($q) use ($searchTerm) {
                    $q->where('title', 'like', '%' . $searchTerm . '%')
                      ->orWhere('description', 'like', '%' . $searchTerm . '%');
                });
            }

            if (!empty($arguments['category'])) {
                $query->whereHas('categories', function($q) use ($arguments) {
                    $q->where('name', 'like', '%' . $arguments['category'] . '%');
                });
            }

            if (!empty($arguments['level'])) {
                $query->where('level', $arguments['level']);
            }

            if (isset($arguments['max_price'])) {
                $query->where('price', '<=', $arguments['max_price']);
            }

            return $query->take(5)->get(['id', 'title', 'price', 'level', 'rating_avg'])->toArray();
        });

        return ['courses' => $courses];
    }
}
