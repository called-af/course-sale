<?php

namespace App\Services\AI\Tool;

use Illuminate\Support\Facades\Http;
use App\Models\Course;

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
                        'description' => 'Number of recommendations to return (default 5)'
                    ]
                ]
            ]
        ];
    }

    public function execute(array $arguments): array
    {
        if (!$this->userId) {
            return ['error' => 'User context not available for recommendations'];
        }

        $limit = $arguments['limit'] ?? 5;
        $baseUrl = config('services.recommendation.url', 'http://127.0.0.1:8001');

        try {
            $response = Http::timeout(5)->post($baseUrl . '/recommend', [
                'user_id' => $this->userId,
                'limit' => $limit
            ]);

            if ($response->failed()) {
                // Fallback to basic database recommendation (e.g. popular courses)
                return $this->getFallbackRecommendations($limit);
            }

            $recommendations = $response->json('recommendations', []);
            $courseIds = array_column($recommendations, 'course_id');
            
            // Retrieve actual course data from Laravel DB
            $courses = Course::whereIn('id', $courseIds)->get()->keyBy('id');

            $results = [];
            foreach ($recommendations as $rec) {
                if (isset($courses[$rec['course_id']])) {
                    $course = $courses[$rec['course_id']];
                    $results[] = [
                        'id' => $course->id,
                        'slug' => $course->slug,
                        'title' => $course->title,
                        'price' => $course->price,
                        'level' => $course->level,
                        'score' => $rec['score'] ?? null,
                        'reason' => $rec['reason'] ?? 'Recommended for you'
                    ];
                }
            }

            return ['recommendations' => $results];
        } catch (\Exception $e) {
            // Fallback if FastAPI is completely down
            return $this->getFallbackRecommendations($limit);
        }
    }

    protected function getFallbackRecommendations($limit)
    {
        $courses = Course::where('status', 'published')
                         ->orderBy('rating_avg', 'desc')
                         ->take($limit)
                         ->get(['id', 'title', 'price', 'level']);
                         
        $results = [];
        foreach ($courses as $course) {
            $results[] = [
                'id' => $course->id,
                'slug' => $course->slug,
                'title' => $course->title,
                'price' => $course->price,
                'level' => $course->level,
                'reason' => 'Highly rated course'
            ];
        }
        
        return ['recommendations' => $results];
    }
}
