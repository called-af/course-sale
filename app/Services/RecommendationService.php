<?php

namespace App\Services;

use App\Models\Course;
use App\Models\Enrollment;
use App\Models\RecommendationSetting;
use App\Models\User;
use App\Models\UserEvent;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class RecommendationService
{
    /**
     * Get recommended courses for a user (or guest).
     */
    public function getRecommendations(?User $user, int $limit = 6): array
    {
        // 1. Check both the legacy environment switch and the admin-managed
        // Python recommendation switch. They remain separate from the AI service.
        if (! config('recommendation.enabled', true)
            || ! RecommendationSetting::isEnabled()) {
            return [];
        }

        $ttl = (int) config('recommendation.cache_ttl', 7200);
        $cacheKey = $user ? "recommendations:user:{$user->id}:limit:{$limit}" : "recommendations:guest:limit:{$limit}";

        try {
            return $this->cacheStore()->remember($cacheKey, $ttl, function () use ($user, $limit) {
                return $this->computeRecommendations($user, $limit);
            });
        } catch (\Throwable $e) {
            Log::warning('Recommendation cache fallback to direct compute: '.$e->getMessage());

            return $this->computeRecommendations($user, $limit);
        }
    }

    /**
     * Compute recommendations using configured driver (Python ML or Laravel native)
     * with automatic fallback mechanism.
     */
    public function computeRecommendations(?User $user, int $limit = 6): array
    {
        $driver = config('recommendation.driver', 'python');

        if ($driver === 'python') {
            try {
                $pythonResults = $this->fetchPythonRecommendations($user, $limit);
                if (! empty($pythonResults)) {
                    return $pythonResults;
                }
            } catch (\Throwable $e) {
                $fallbackEnabled = config('recommendation.python.fallback_to_laravel', true);
                Log::warning("[Recommendation] Python ML service unreachable or failed: {$e->getMessage()}. Fallback to Laravel engine: ".($fallbackEnabled ? 'YES' : 'NO'));

                if (! $fallbackEnabled) {
                    return [];
                }
            }

            // Fallback to Laravel native Content-Based + Popularity engine
            return $this->computeLaravelRecommendations($user, $limit);
        }

        // Native Laravel driver
        return $this->computeLaravelRecommendations($user, $limit);
    }

    /**
     * Fetch recommendations from the Python FastAPI microservice.
     */
    public function fetchPythonRecommendations(?User $user, int $limit = 6): ?array
    {
        $baseUrl = rtrim(config('recommendation.python.url', 'http://127.0.0.1:8001'), '/');
        $timeout = (float) config('recommendation.python.timeout', 2.0);
        $retry = (int) config('recommendation.python.retry', 1);

        $endpoint = $user
            ? "{$baseUrl}/api/v1/recommendations/user/{$user->id}?limit={$limit}"
            : "{$baseUrl}/api/v1/recommendations/guest?limit={$limit}";

        $response = Http::timeout($timeout)
            ->retry($retry, 100)
            ->get($endpoint);

        if (! $response->successful()) {
            throw new \RuntimeException("Python service returned HTTP status {$response->status()}: {$response->body()}");
        }

        $payload = $response->json();
        $items = $payload['recommendations'] ?? [];

        if (empty($items)) {
            return null;
        }

        // Extract ordered course IDs and score metadata
        $courseMeta = [];
        $courseIds = [];
        foreach ($items as $item) {
            $cid = (int) ($item['course_id'] ?? 0);
            if ($cid > 0) {
                $courseIds[] = $cid;
                $courseMeta[$cid] = [
                    'score' => (float) ($item['score'] ?? 0.0),
                    'reason' => (string) ($item['reason'] ?? 'Recommended for you'),
                    'matching_tags' => (array) ($item['matching_tags'] ?? []),
                ];
            }
        }

        if (empty($courseIds)) {
            return null;
        }

        // Hydrate Course models from database (ensuring they exist and are published)
        $courses = Course::whereIn('id', $courseIds)
            ->where('status', 'published')
            ->with(['tags:id,name,slug', 'categories:id,name,slug', 'creator:id,name'])
            ->get()
            ->keyBy('id');

        $result = [];
        foreach ($courseIds as $cid) {
            if ($courses->has($cid)) {
                $course = $courses->get($cid);
                $courseArray = $course->toArray();
                $courseArray['thumbnail_url'] = $course->thumbnail_url;
                $courseArray['recommendation_score'] = round($courseMeta[$cid]['score'] ?? 0.0, 2);
                $courseArray['recommendation_reason'] = $courseMeta[$cid]['reason'] ?? 'Recommended for you';
                $courseArray['matching_tags'] = ! empty($courseMeta[$cid]['matching_tags'])
                    ? $courseMeta[$cid]['matching_tags']
                    : $course->tags->pluck('name')->take(3)->toArray();

                $result[] = $courseArray;
            }
        }

        return $result;
    }

    /**
     * Compute recommendations natively in Laravel using Content-Based Filtering
     * and Popularity Fallback.
     */
    public function computeLaravelRecommendations(?User $user, int $limit = 6): array
    {
        if (! $user) {
            return $this->getPopularCourses($limit);
        }

        // 1. Get courses already enrolled by user
        $enrolledCourseIds = Enrollment::where('user_id', $user->id)
            ->pluck('course_id')
            ->toArray();

        // 2. Fetch user interaction events
        $userEvents = UserEvent::where('user_id', $user->id)
            ->whereNotNull('course_id')
            ->get(['course_id', 'event_type']);

        // Cold-start fallback if user has no events
        if ($userEvents->isEmpty()) {
            return $this->getPopularCourses($limit, $enrolledCourseIds);
        }

        // 3. Calculate weights for interacted courses
        $eventWeights = config('recommendation.laravel.weights', [
            UserEvent::TYPE_COURSE_ENROLL => 5,
            UserEvent::TYPE_QUIZ_COMPLETE => 4,
            UserEvent::TYPE_MATERIAL_COMPLETE => 4,
            UserEvent::TYPE_QUIZ_ATTEMPT => 3,
            UserEvent::TYPE_MATERIAL_VIEW => 2,
            UserEvent::TYPE_COURSE_VIEW => 1,
        ]);

        $courseInteractionScores = [];
        foreach ($userEvents as $event) {
            $weight = $eventWeights[$event->event_type] ?? 1;
            $courseInteractionScores[$event->course_id] = ($courseInteractionScores[$event->course_id] ?? 0) + $weight;
        }

        // 4. Calculate user's tag preference weights
        $interactedCourseIds = array_keys($courseInteractionScores);
        $interactedCourses = Course::whereIn('id', $interactedCourseIds)
            ->with('tags:id,name')
            ->get(['id']);

        $tagWeights = [];
        foreach ($interactedCourses as $course) {
            $cScore = $courseInteractionScores[$course->id] ?? 1;
            foreach ($course->tags as $tag) {
                $tagWeights[$tag->id] = ($tagWeights[$tag->id] ?? 0) + $cScore;
            }
        }

        // If no tags found on interacted courses, fallback to popular
        if (empty($tagWeights)) {
            return $this->getPopularCourses($limit, $enrolledCourseIds);
        }

        // 5. Query candidate courses (published, not enrolled)
        $candidates = Course::where('status', 'published')
            ->whereNotIn('id', $enrolledCourseIds)
            ->with(['tags:id,name,slug', 'categories:id,name,slug', 'creator:id,name'])
            ->get();

        // 6. Score candidate courses based on tag overlap
        $scoredCourses = [];
        foreach ($candidates as $candidate) {
            $score = 0;
            $matchingTags = [];

            foreach ($candidate->tags as $tag) {
                if (isset($tagWeights[$tag->id])) {
                    $score += $tagWeights[$tag->id];
                    $matchingTags[] = $tag->name;
                }
            }

            if ($score > 0) {
                // Add minor quality signal bonus (rating)
                $score += ($candidate->rating_avg ?? 0) * 0.2;

                $candidateArray = $candidate->toArray();
                $candidateArray['thumbnail_url'] = $candidate->thumbnail_url;
                $candidateArray['recommendation_score'] = round($score, 2);
                $candidateArray['matching_tags'] = $matchingTags;
                $candidateArray['recommendation_reason'] = 'Based on your interests in '.implode(', ', array_slice($matchingTags, 0, 3));

                $scoredCourses[] = [
                    'score' => $score,
                    'course' => $candidateArray,
                ];
            }
        }

        // Sort descending by score
        usort($scoredCourses, fn ($a, $b) => $b['score'] <=> $a['score']);

        $recommended = array_column(array_slice($scoredCourses, 0, $limit), 'course');
        $recommendedIds = array_column($recommended, 'id');

        // 7. Backfill with popular courses if recommendations are less than limit
        if (count($recommended) < $limit) {
            $needed = $limit - count($recommended);
            $excludeIds = array_merge($enrolledCourseIds, $recommendedIds);
            $popularBackfill = $this->getPopularCourses($needed, $excludeIds);
            $recommended = array_merge($recommended, $popularBackfill);
        }

        return $recommended;
    }

    /**
     * Get popular courses fallback (based on 30-day course views, enrollments and ratings).
     */
    public function getPopularCourses(int $limit = 6, array $excludeIds = []): array
    {
        $windowDays = config('recommendation.laravel.popularity.window_days', 30);
        $viewsWeight = config('recommendation.laravel.popularity.views_weight', 1.5);
        $enrollmentsWeight = config('recommendation.laravel.popularity.enrollments_weight', 3.0);
        $ratingWeight = config('recommendation.laravel.popularity.rating_weight', 2.0);

        // Count course views in the last 30 days
        $recentViewCounts = UserEvent::where('event_type', UserEvent::TYPE_COURSE_VIEW)
            ->where('created_at', '>=', now()->subDays($windowDays))
            ->whereNotNull('course_id')
            ->select('course_id', DB::raw('COUNT(*) as views_count'))
            ->groupBy('course_id')
            ->pluck('views_count', 'course_id')
            ->toArray();

        $query = Course::where('status', 'published')
            ->with(['tags:id,name,slug', 'categories:id,name,slug', 'creator:id,name'])
            ->withCount(['enrollments' => fn ($q) => $q->where('status', 'active')]);

        if (! empty($excludeIds)) {
            $query->whereNotIn('id', $excludeIds);
        }

        $courses = $query->get();

        $ranked = $courses->map(function (Course $course) use ($recentViewCounts, $viewsWeight, $enrollmentsWeight, $ratingWeight) {
            $views = $recentViewCounts[$course->id] ?? 0;
            $enrollments = $course->enrollments_count ?? 0;
            $rating = (float) ($course->rating_avg ?? 0);

            // Composite popularity score
            $popScore = ($views * $viewsWeight) + ($enrollments * $enrollmentsWeight) + ($rating * $ratingWeight);

            $courseArray = $course->toArray();
            $courseArray['thumbnail_url'] = $course->thumbnail_url;
            $courseArray['recommendation_score'] = round($popScore, 2);
            $courseArray['recommendation_reason'] = 'Popular with students this month';
            $courseArray['matching_tags'] = $course->tags->pluck('name')->take(3)->toArray();

            return [
                'score' => $popScore,
                'course' => $courseArray,
            ];
        })->sortByDesc('score')->values();

        return $ranked->take($limit)->pluck('course')->toArray();
    }

    /**
     * Get real-time status and health of the recommendation subsystem.
     */
    public function getStatus(): array
    {
        $legacyEnabled = (bool) config('recommendation.enabled', true);
        $adminEnabled = RecommendationSetting::isEnabled();
        $driver = config('recommendation.driver', 'python');
        $pythonUrl = config('recommendation.python.url', 'http://127.0.0.1:8001');
        $fallbackToLaravel = (bool) config('recommendation.python.fallback_to_laravel', true);

        $pythonOnline = false;
        $pythonHealth = null;

        if ($legacyEnabled && $adminEnabled && $driver === 'python') {
            try {
                $res = Http::timeout(0.6)->get(rtrim($pythonUrl, '/').'/api/v1/health');
                if ($res->successful()) {
                    $pythonOnline = true;
                    $pythonHealth = $res->json();
                }
            } catch (\Throwable) {
                $pythonOnline = false;
            }
        }

        return [
            'enabled' => $legacyEnabled,
            'admin_enabled' => $adminEnabled,
            'driver' => $driver,
            'python_url' => $pythonUrl,
            'python_online' => $pythonOnline,
            'python_health' => $pythonHealth,
            'fallback_to_laravel' => $fallbackToLaravel,
            'active_engine' => ! $legacyEnabled || ! $adminEnabled
                ? 'DISABLED'
                : ($driver === 'python'
                    ? ($pythonOnline ? 'PYTHON_FASTAPI_ML' : ($fallbackToLaravel ? 'LARAVEL_NATIVE_FALLBACK' : 'PYTHON_OFFLINE_NO_FALLBACK'))
                    : 'LARAVEL_NATIVE'),
        ];
    }

    /**
     * Invalidate cached recommendations for a specific user.
     */
    public function invalidateUserCache(int $userId): void
    {
        try {
            $store = $this->cacheStore();

            foreach ([4, 6, 8, 10] as $limit) {
                $store->forget("recommendations:user:{$userId}:limit:{$limit}");
            }

            $store->forget('recommendations:guest:limit:4');
            $store->forget('recommendations:guest:limit:6');
            $store->forget('recommendations:guest:limit:8');
            $store->forget('recommendations:guest:limit:10');
        } catch (\Throwable $e) {
            Log::warning("Failed to clear recommendation cache: {$e->getMessage()}");
        }
    }

    /**
     * Resolve the cache store without hard-coding Redis, so deployments that
     * use database/file/memcached keep working instead of throwing.
     */
    protected function cacheStore(): \Illuminate\Contracts\Cache\Repository
    {
        $store = config('recommendation.cache_store');

        return Cache::store($store ?: config('cache.default'));
    }
}
