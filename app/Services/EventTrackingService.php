<?php

namespace App\Services;

use App\Jobs\TrackUserEventJob;
use App\Models\Course;
use App\Models\Material;
use App\Models\User;
use App\Models\UserEvent;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class EventTrackingService
{
    /**
     * Track a user event.
     */
    public function track(
        int $userId,
        string $eventType,
        ?int $courseId = null,
        ?int $materialId = null,
        array $metadata = [],
        bool $useQueue = false
    ): ?UserEvent {
        if ($useQueue) {
            TrackUserEventJob::dispatch($userId, $eventType, $courseId, $materialId, $metadata);
        }

        // Always create record directly to guarantee immediate consistency
        $event = UserEvent::create([
            'user_id' => $userId,
            'course_id' => $courseId,
            'material_id' => $materialId,
            'event_type' => $eventType,
            'metadata' => empty($metadata) ? null : $metadata,
        ]);

        // Invalidate recommendation cache on significant actions
        if (in_array($eventType, [
            UserEvent::TYPE_COURSE_ENROLL,
            UserEvent::TYPE_MATERIAL_COMPLETE,
            UserEvent::TYPE_QUIZ_COMPLETE,
        ])) {
            $this->invalidateRecommendationCache($userId);
        }

        return $event;
    }

    public function trackCourseView(User|int $user, Course|int $course, array $metadata = []): ?UserEvent
    {
        $userId = $user instanceof User ? $user->id : $user;
        $courseId = $course instanceof Course ? $course->id : $course;

        // Prevent spamming course_view events within short time (e.g. 5 minutes)
        $throttleKey = "event_throttled:course_view:{$userId}:{$courseId}";
        if (Cache::has($throttleKey)) {
            return null;
        }
        Cache::put($throttleKey, true, now()->addMinutes(5));

        return $this->track($userId, UserEvent::TYPE_COURSE_VIEW, $courseId, null, $metadata);
    }

    public function trackCourseEnroll(User|int $user, Course|int $course, array $metadata = []): ?UserEvent
    {
        $userId = $user instanceof User ? $user->id : $user;
        $courseId = $course instanceof Course ? $course->id : $course;

        return $this->track($userId, UserEvent::TYPE_COURSE_ENROLL, $courseId, null, $metadata);
    }

    public function trackMaterialView(
        User|int $user,
        Course|int|null $course = null,
        Material|int|null $material = null,
        array $metadata = []
    ): ?UserEvent {
        $userId = $user instanceof User ? $user->id : $user;
        $courseId = $course instanceof Course ? $course->id : $course;
        $materialId = $material instanceof Material ? $material->id : $material;

        $throttleKey = "event_throttled:material_view:{$userId}:{$materialId}";
        if ($materialId && Cache::has($throttleKey)) {
            return null;
        }
        if ($materialId) {
            Cache::put($throttleKey, true, now()->addMinutes(5));
        }

        return $this->track($userId, UserEvent::TYPE_MATERIAL_VIEW, $courseId, $materialId, $metadata);
    }

    public function trackMaterialComplete(
        User|int $user,
        Course|int|null $course = null,
        Material|int|null $material = null,
        array $metadata = []
    ): ?UserEvent {
        $userId = $user instanceof User ? $user->id : $user;
        $courseId = $course instanceof Course ? $course->id : $course;
        $materialId = $material instanceof Material ? $material->id : $material;

        return $this->track($userId, UserEvent::TYPE_MATERIAL_COMPLETE, $courseId, $materialId, $metadata);
    }

    public function trackQuizAttempt(
        User|int $user,
        Course|int|null $course = null,
        Material|int|null $material = null,
        float $score = 0,
        array $metadata = []
    ): ?UserEvent {
        $userId = $user instanceof User ? $user->id : $user;
        $courseId = $course instanceof Course ? $course->id : $course;
        $materialId = $material instanceof Material ? $material->id : $material;

        $metadata['score'] = $score;

        return $this->track($userId, UserEvent::TYPE_QUIZ_ATTEMPT, $courseId, $materialId, $metadata);
    }

    public function trackQuizComplete(
        User|int $user,
        Course|int|null $course = null,
        Material|int|null $material = null,
        float $score = 0,
        array $metadata = []
    ): ?UserEvent {
        $userId = $user instanceof User ? $user->id : $user;
        $courseId = $course instanceof Course ? $course->id : $course;
        $materialId = $material instanceof Material ? $material->id : $material;

        $metadata['score'] = $score;

        return $this->track($userId, UserEvent::TYPE_QUIZ_COMPLETE, $courseId, $materialId, $metadata);
    }

    /**
     * Invalidate cached recommendations for user.
     */
    public function invalidateRecommendationCache(int $userId): void
    {
        try {
            app(RecommendationService::class)->invalidateUserCache($userId);
        } catch (\Throwable $e) {
            Log::warning("Failed to invalidate recommendation cache: {$e->getMessage()}");
        }
    }
}
