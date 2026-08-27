<?php

namespace App\Services;

use App\Models\Course;
use App\Models\Enrollment;
use App\Models\User;
use App\Models\UserEvent;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class RecommendationService
{
    public const CACHE_TTL_SECONDS = 7200; // 2 hours (within 1-6 hours)

    /**
     * Get recommended courses for a user (or guest).
     */
    public function getRecommendations(?User $user, int $limit = 6): array
    {
        $cacheKey = $user ? "recommendations:user:{$user->id}:limit:{$limit}" : "recommendations:guest:limit:{$limit}";

        try {
            return Cache::store('redis')->remember($cacheKey, self::CACHE_TTL_SECONDS, function () use ($user, $limit) {
                return $this->computeRecommendations($user, $limit);
            });
        } catch (\Throwable $e) {
            Log::warning('Redis recommendation cache fallback to direct compute: '.$e->getMessage());

            return $this->computeRecommendations($user, $limit);
        }
    }

    /**
     * Compute recommendations using Content-Based Filtering with Popularity Fallback.
     */
    public function computeRecommendations(?User $user, int $limit = 6): array
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
        $eventWeights = [
            UserEvent::TYPE_COURSE_ENROLL => 5,
            UserEvent::TYPE_QUIZ_COMPLETE => 4,
            UserEvent::TYPE_MATERIAL_COMPLETE => 4,
            UserEvent::TYPE_QUIZ_ATTEMPT => 3,
            UserEvent::TYPE_MATERIAL_VIEW => 2,
            UserEvent::TYPE_COURSE_VIEW => 1,
        ];

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
        // Count course views in the last 30 days
        $recentViewCounts = UserEvent::where('event_type', UserEvent::TYPE_COURSE_VIEW)
            ->where('created_at', '>=', now()->subDays(30))
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

        $ranked = $courses->map(function (Course $course) use ($recentViewCounts) {
            $views = $recentViewCounts[$course->id] ?? 0;
            $enrollments = $course->enrollments_count ?? 0;
            $rating = (float) ($course->rating_avg ?? 0);

            // Composite popularity score
            $popScore = ($views * 1.5) + ($enrollments * 3) + ($rating * 2);

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
     * Invalidate cached recommendations for a specific user.
     */
    public function invalidateUserCache(int $userId): void
    {
        try {
            Cache::store('redis')->forget("recommendations:user:{$userId}:limit:6");
            Cache::store('redis')->forget("recommendations:user:{$userId}:limit:4");
            Cache::store('redis')->forget("recommendations:user:{$userId}:limit:8");
            Cache::store('redis')->forget("recommendations:user:{$userId}:limit:10");
        } catch (\Throwable $e) {
            Log::warning("Failed to clear Redis recommendation cache: {$e->getMessage()}");
        }
    }
}
