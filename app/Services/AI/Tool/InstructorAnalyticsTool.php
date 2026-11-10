<?php

namespace App\Services\AI\Tool;

use App\Models\Course;
use App\Models\Enrollment;
use App\Models\OrderItem;
use App\Models\Review;
use App\Models\User;

class InstructorAnalyticsTool
{
    protected ?int $userId = null;

    public function setUserId($userId): void
    {
        $this->userId = $userId;
    }

    public function getDefinition(): array
    {
        return [
            'description' => 'Retrieve full instructor analytics including total earnings/revenue, per-course earnings, average ratings, rating count, student reviews, and course performance metrics for the current authenticated instructor\'s own courses. Strictly restricted to the instructor\'s own courses; access to other instructors\' revenue or private metrics is forbidden.',
            'parameters' => [
                'type' => 'object',
                'properties' => [
                    'metric' => [
                        'type' => 'string',
                        'enum' => ['all', 'earnings', 'ratings', 'reviews', 'summary'],
                        'description' => 'Optional filter for specific analytics: "earnings" for revenue breakdown, "ratings" for ratings and averages, "reviews" for student feedback, "summary" for high-level totals, or "all" for complete instructor data.',
                    ],
                    'course_id' => [
                        'type' => 'integer',
                        'description' => 'Optional ID of a specific course owned by the instructor to retrieve detailed earnings, ratings, and reviews.',
                    ],
                    'course_title' => [
                        'type' => 'string',
                        'description' => 'Optional course title keyword to filter by a specific course owned by the instructor.',
                    ],
                    'instructor_id' => [
                        'type' => 'integer',
                        'description' => 'Optional ID of an instructor. Instructors can only query their own ID; querying other instructors will be rejected.',
                    ],
                ],
            ],
        ];
    }

    public function execute(array $arguments): array
    {
        if (! $this->userId) {
            return ['error' => 'User context not available'];
        }

        $user = User::find($this->userId);
        if (! $user || ! $user->hasRole(['instructor', 'admin'])) {
            return ['error' => 'Akses ditolak. Fitur ini hanya dapat diakses oleh user dengan role instructor.'];
        }

        // 1. If instructor_id is specified, ensure it belongs to the current user (unless admin)
        if (! empty($arguments['instructor_id']) && ! $user->hasRole('admin') && (int) $arguments['instructor_id'] !== $user->id) {
            return ['error' => 'Akses ditolak. Anda tidak berhak mengakses data instructor lain. Hanya dapat mengakses data milik Anda sendiri.'];
        }

        // 2. Specific course lookup by ID or title
        if (! empty($arguments['course_id']) || ! empty($arguments['course_title'])) {
            $query = Course::query();

            if (! empty($arguments['course_id'])) {
                $query->where('id', $arguments['course_id']);
            } elseif (! empty($arguments['course_title'])) {
                $query->where('title', 'like', '%'.$arguments['course_title'].'%');
            }

            $course = $query->first();

            if (! $course) {
                return ['error' => 'Course tidak ditemukan.'];
            }

            if (! $user->hasRole('admin') && $course->creator_id !== $user->id) {
                return ['error' => 'Akses ditolak. Anda hanya dapat mengakses data analitik, pendapatan, dan rating untuk course milik Anda sendiri.'];
            }

            $enrolledCount = $course->enrollments()
                ->where('status', 'active')
                ->whereHas('user', fn ($uq) => $uq->withoutTrashed())
                ->count();

            $courseEarnings = $this->calculateCourseEarnings($course, $enrolledCount);

            $reviews = Review::where('course_id', $course->id)
                ->where('is_approved', true)
                ->with(['user' => fn ($uq) => $uq->withoutTrashed()->select('id', 'name')])
                ->latest()
                ->get();

            return [
                'course_id' => $course->id,
                'title' => $course->title,
                'slug' => $course->slug,
                'status' => $course->status,
                'level' => $course->level,
                'type' => $course->type,
                'price' => $course->type === 'paid' ? (float) $course->price : 0.0,
                'formatted_price' => $course->type === 'paid' ? $this->formatRupiah((float) $course->price) : 'Free',
                'enrolled_students_count' => $enrolledCount,
                'earnings' => $courseEarnings,
                'formatted_earnings' => $this->formatRupiah($courseEarnings),
                'rating_avg' => $course->rating_count > 0 ? (float) $course->rating_avg : null,
                'rating_count' => (int) $course->rating_count,
                'total_reviews' => $reviews->count(),
                'reviews' => $reviews->map(fn ($r) => [
                    'id' => $r->id,
                    'reviewer_name' => $r->user?->name ?? 'Anonymous',
                    'rating' => (int) $r->rating,
                    'comment' => $r->comment,
                    'date' => $r->created_at?->format('Y-m-d H:i:s'),
                ])->values()->all(),
            ];
        }

        // 3. Overall instructor courses & metrics
        $courses = Course::where('creator_id', $user->id)
            ->withCount(['enrollments' => fn ($q) => $q->where('status', 'active')->whereHas('user', fn ($uq) => $uq->withoutTrashed())])
            ->with(['reviews' => fn ($q) => $q->where('is_approved', true)->with(['user' => fn ($uq) => $uq->withoutTrashed()->select('id', 'name')])->latest()])
            ->latest()
            ->get();

        $coursesData = [];
        $totalEarnings = 0.0;
        $totalEnrollments = 0;
        $allApprovedReviews = [];

        foreach ($courses as $c) {
            $enrolledCount = (int) ($c->enrollments_count ?? 0);
            $totalEnrollments += $enrolledCount;

            $courseEarnings = $this->calculateCourseEarnings($c, $enrolledCount);
            $totalEarnings += $courseEarnings;

            $courseReviews = $c->reviews->map(fn ($r) => [
                'id' => $r->id,
                'reviewer_name' => $r->user?->name ?? 'Anonymous',
                'rating' => (int) $r->rating,
                'comment' => $r->comment,
                'course_id' => $c->id,
                'course_title' => $c->title,
                'date' => $r->created_at?->format('Y-m-d H:i:s'),
            ])->values()->all();

            foreach ($courseReviews as $cr) {
                $allApprovedReviews[] = $cr;
            }

            $coursesData[] = [
                'id' => $c->id,
                'title' => $c->title,
                'slug' => $c->slug,
                'status' => $c->status,
                'level' => $c->level,
                'type' => $c->type,
                'price' => $c->type === 'paid' ? (float) $c->price : 0.0,
                'formatted_price' => $c->type === 'paid' ? $this->formatRupiah((float) $c->price) : 'Free',
                'enrolled_students_count' => $enrolledCount,
                'earnings' => $courseEarnings,
                'formatted_earnings' => $this->formatRupiah($courseEarnings),
                'rating_avg' => $c->rating_count > 0 ? (float) $c->rating_avg : null,
                'rating_count' => (int) $c->rating_count,
                'recent_reviews' => array_slice($courseReviews, 0, 3),
            ];
        }

        $uniqueStudentCount = Enrollment::where('status', 'active')
            ->whereHas('user', fn ($uq) => $uq->withoutTrashed())
            ->whereHas('course', fn ($q) => $q->where('creator_id', $user->id))
            ->distinct('user_id')
            ->count('user_id');

        $ratedCourses = $courses->where('rating_count', '>', 0);
        $averageRating = $ratedCourses->count() > 0 ? round((float) $ratedCourses->avg('rating_avg'), 2) : null;
        $totalReviewsCount = count($allApprovedReviews);

        $metric = $arguments['metric'] ?? 'all';

        if ($metric === 'earnings') {
            return [
                'instructor_id' => $user->id,
                'instructor_name' => $user->name,
                'total_earnings' => $totalEarnings,
                'formatted_total_earnings' => $this->formatRupiah($totalEarnings),
                'total_paid_courses' => $courses->where('type', 'paid')->count(),
                'total_free_courses' => $courses->where('type', 'free')->count(),
                'earnings_by_course' => array_map(fn ($c) => [
                    'course_id' => $c['id'],
                    'title' => $c['title'],
                    'type' => $c['type'],
                    'price' => $c['price'],
                    'formatted_price' => $c['formatted_price'],
                    'enrolled_students_count' => $c['enrolled_students_count'],
                    'earnings' => $c['earnings'],
                    'formatted_earnings' => $c['formatted_earnings'],
                ], $coursesData),
            ];
        }

        if ($metric === 'ratings' || $metric === 'reviews') {
            return [
                'instructor_id' => $user->id,
                'instructor_name' => $user->name,
                'average_rating' => $averageRating,
                'total_ratings_count' => (int) $courses->sum('rating_count'),
                'total_reviews' => $totalReviewsCount,
                'ratings_by_course' => array_map(fn ($c) => [
                    'course_id' => $c['id'],
                    'title' => $c['title'],
                    'rating_avg' => $c['rating_avg'],
                    'rating_count' => $c['rating_count'],
                ], $coursesData),
                'recent_reviews' => array_slice($allApprovedReviews, 0, 10),
            ];
        }

        if ($metric === 'summary') {
            return [
                'instructor_id' => $user->id,
                'instructor_name' => $user->name,
                'total_courses' => $courses->count(),
                'total_enrolled_students' => $totalEnrollments,
                'total_unique_students' => $uniqueStudentCount,
                'total_earnings' => $totalEarnings,
                'formatted_total_earnings' => $this->formatRupiah($totalEarnings),
                'average_rating' => $averageRating,
                'total_ratings_count' => (int) $courses->sum('rating_count'),
                'total_reviews' => $totalReviewsCount,
            ];
        }

        return [
            'instructor' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
            ],
            'summary' => [
                'total_courses' => $courses->count(),
                'total_enrolled_students' => $totalEnrollments,
                'total_unique_students' => $uniqueStudentCount,
                'total_earnings' => $totalEarnings,
                'formatted_total_earnings' => $this->formatRupiah($totalEarnings),
                'average_rating' => $averageRating,
                'total_ratings_count' => (int) $courses->sum('rating_count'),
                'total_reviews' => $totalReviewsCount,
            ],
            'courses' => $coursesData,
            'recent_reviews' => array_slice($allApprovedReviews, 0, 10),
        ];
    }

    protected function calculateCourseEarnings(Course $course, int $enrolledCount): float
    {
        $enrollmentEarnings = $course->type === 'paid' ? (float) ($course->price ?? 0) * $enrolledCount : 0.0;

        $orderEarnings = (float) OrderItem::where('course_id', $course->id)
            ->whereHas('order', fn ($q) => $q->where('status', 'paid'))
            ->sum('course_price');

        return max($enrollmentEarnings, $orderEarnings);
    }

    protected function formatRupiah(float $amount): string
    {
        return 'Rp '.number_format($amount, 0, ',', '.');
    }
}
