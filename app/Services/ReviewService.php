<?php

namespace App\Services;

use App\Models\Course;
use App\Models\Review;
use App\Models\Enrollment;
use Illuminate\Support\Facades\DB;

class ReviewService
{
    /**
     * Get all approved reviews for a course along with rating statistics.
     */
    public function getCourseReviews(Course $course): array
    {
        $reviews = Review::where('course_id', $course->id)
            ->where('is_approved', true)
            ->with('user:id,name,avatar')
            ->latest()
            ->get()
            ->map(function (Review $review) {
                return [
                    'id'           => $review->id,
                    'rating'       => $review->rating,
                    'comment'      => $review->comment,
                    'created_at'   => $review->created_at,
                    'user'         => [
                        'id'         => $review->user->id,
                        'name'       => $review->user->name,
                        'avatar_url' => $review->user->avatar_url ?? null,
                    ],
                ];
            });

        $ratingStats = $this->getRatingStats($course);

        return [
            'reviews'      => $reviews,
            'rating_stats' => $ratingStats,
        ];
    }

    /**
     * Calculate the rating distribution statistics (1-5 stars).
     */
    public function getRatingStats(Course $course): array
    {
        $counts = Review::where('course_id', $course->id)
            ->where('is_approved', true)
            ->selectRaw('rating, COUNT(*) as count')
            ->groupBy('rating')
            ->pluck('count', 'rating')
            ->toArray();

        $total = array_sum($counts);
        $distribution = [];

        for ($i = 5; $i >= 1; $i--) {
            $count = $counts[$i] ?? 0;
            $distribution[] = [
                'star'       => $i,
                'count'      => $count,
                'percentage' => $total > 0 ? round(($count / $total) * 100) : 0,
            ];
        }

        return [
            'average'      => $total > 0 ? round(array_sum(array_map(fn ($r, $c) => $r * $c, array_keys($counts), $counts)) / $total, 1) : 0,
            'total'        => $total,
            'distribution' => $distribution,
        ];
    }

    /**
     * Store or update a student review.
     * Students can only review enrolled courses AFTER reaching 100% completion.
     */
    public function storeOrUpdate(Course $course, int $userId, int $rating, ?string $comment): Review
    {
        $enrolled = Enrollment::where('user_id', $userId)
            ->where('course_id', $course->id)
            ->where('status', 'active')
            ->exists();

        if (! $enrolled) {
            throw new \DomainException('You must be enrolled in this course to leave a review.');
        }

        if (! app(\App\Services\EnrollmentService::class)->isCompleted(
            \App\Models\User::findOrFail($userId), $course
        )) {
            throw new \DomainException('You can leave a review after completing 100% of the course.');
        }

        $review = Review::updateOrCreate(
            ['user_id' => $userId, 'course_id' => $course->id],
            [
                'rating'  => $rating,
                'comment' => $comment,
            ]
        );

        $this->recalculateCourseRating($course);

        return $review;
    }

    /**
     * Delete a review owned by the user.
     */
    public function destroy(Review $review, int $userId): void
    {
        if ($review->user_id !== $userId) {
            throw new \DomainException('You are not authorized to delete this review.');
        }

        $course = $review->course;
        $review->delete();
        $this->recalculateCourseRating($course);
    }

    /**
     * Admin: approve or reject a review.
     */
    public function setApproval(Review $review, bool $approved): void
    {
        $review->update([
            'is_approved' => $approved,
            'approved_at' => $approved ? now() : null,
        ]);

        $this->recalculateCourseRating($review->course);
    }

    /**
     * Check whether the user has already reviewed this course.
     */
    public function getUserReview(Course $course, int $userId): ?Review
    {
        return Review::where('course_id', $course->id)
            ->where('user_id', $userId)
            ->with('user:id,name,avatar')
            ->first();
    }

    /**
     * Recalculate rating_avg and rating_count on the courses table.
     * Public so it can be called from controllers.
     */
    public function recalculateCourseRatingPublic(Course $course): void
    {
        $this->recalculateCourseRating($course);
    }

    /**
     * Recalculate rating_avg and rating_count on the courses table.
     */
    private function recalculateCourseRating(Course $course): void
    {
        $stats = Review::where('course_id', $course->id)
            ->where('is_approved', true)
            ->selectRaw('AVG(rating) as avg_rating, COUNT(*) as total')
            ->first();

        $course->update([
            'rating_avg'   => $stats->avg_rating ? round($stats->avg_rating, 2) : 0,
            'rating_count' => $stats->total ?? 0,
        ]);
    }

    /**
     * Admin: get all reviews (including pending) with filters.
     */
    public function getAdminReviews(?string $status = null, ?int $courseId = null): \Illuminate\Database\Eloquent\Collection
    {
        $query = Review::with(['user:id,name,avatar', 'course:id,title,slug'])
            ->latest();

        if ($status === 'pending') {
            $query->where('is_approved', false);
        } elseif ($status === 'approved') {
            $query->where('is_approved', true);
        }

        if ($courseId) {
            $query->where('course_id', $courseId);
        }

        return $query->get();
    }
}
