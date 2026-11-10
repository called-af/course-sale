<?php

namespace App\Services\AI\Tool;

use App\Models\Course;
use App\Models\User;
use App\Services\RecommendationService;

class RecommendationTool
{
    protected ?int $userId = null;

    public function setUserId($userId)
    {
        $this->userId = $userId;
    }

    public function getDefinition(): array
    {
        return [
            'description' => 'Get personalized course recommendations for the current user based on their behavior.',
            'parameters' => [
                'type' => 'object',
                'properties' => [
                    'limit' => [
                        'type' => 'integer',
                        'description' => 'Number of recommendations to return (default 5)',
                    ],
                ],
            ],
        ];
    }

    public function execute(array $arguments): array
    {
        if (! $this->userId) {
            return ['error' => 'User context not available for recommendations'];
        }

        $limit = max(1, min(10, (int) ($arguments['limit'] ?? 5)));

        try {
            $user = User::find($this->userId);
            $recommendations = app(RecommendationService::class)
                ->getRecommendations($user, $limit);

            $results = collect($recommendations)->map(fn (array $course) => [
                'id' => $course['id'],
                'slug' => $course['slug'],
                'title' => $course['title'],
                'type' => $course['type'] ?? null,
                'price' => ($course['type'] ?? null) === 'free' ? null : ($course['price'] ?? null),
                'level' => $course['level'] ?? null,
                'rating' => ($course['rating_count'] ?? 0) > 0 ? (float) $course['rating_avg'] : null,
                'rating_count' => (int) ($course['rating_count'] ?? 0),
                'score' => $course['recommendation_score'] ?? null,
                'reason' => $course['recommendation_reason'] ?? 'Recommended for you',
            ])->values()->all();

            return $results !== []
                ? ['recommendations' => $results]
                : $this->getFallbackRecommendations($limit);
        } catch (\Throwable) {
            return $this->getFallbackRecommendations($limit);
        }
    }

    protected function getFallbackRecommendations($limit)
    {
        $courses = Course::where('status', 'published')
            ->orderByDesc('rating_count')
            ->orderByDesc('rating_avg')
            ->take($limit)
            ->get(['id', 'title', 'slug', 'type', 'price', 'level', 'rating_avg', 'rating_count']);

        $results = [];
        foreach ($courses as $course) {
            $results[] = [
                'id' => $course->id,
                'slug' => $course->slug,
                'title' => $course->title,
                'type' => $course->type,
                'price' => $course->type === 'free' ? null : $course->price,
                'level' => $course->level,
                'rating' => $course->rating_count > 0 ? (float) $course->rating_avg : null,
                'rating_count' => (int) $course->rating_count,
                'reason' => $course->rating_count > 0 ? 'Highly rated course' : 'Course rekomendasi',
            ];
        }

        return ['recommendations' => $results];
    }
}
