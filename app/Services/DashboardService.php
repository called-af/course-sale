<?php

namespace App\Services;

use App\Models\Certificate;
use App\Models\Course;
use App\Models\Enrollment;
use App\Models\MaterialContent;
use App\Models\MaterialProgress;
use App\Models\Order;
use App\Models\QuizAttempt;
use App\Models\Review;
use App\Models\User;
use App\Models\UserEvent;
use Carbon\Carbon;

class DashboardService
{
    public function adminData(): array
    {
        return [
            'metrics' => [
                'totalUsers' => User::count(),
                'totalCourses' => Course::count(),
                'activeEnrollments' => Enrollment::where('status', 'active')->count(),
                'revenue' => (float) Order::where('status', 'paid')->sum('total_price'),
            ],
            'topCourses' => Course::withCount(['enrollments' => fn ($query) => $query->where('status', 'active')])
                ->orderByDesc('enrollments_count')->take(5)->get(['id', 'title', 'slug']),
            'recentEnrollments' => Enrollment::where('status', 'active')
                ->with(['user:id,name', 'course:id,title,slug'])->latest('enrolled_at')->take(5)->get(),
            'recentCourses' => Course::latest()->take(5)->get(['id', 'title', 'slug', 'status', 'created_at']),
        ];
    }

    public function studentData(User $user): array
    {
        $enrollments = Enrollment::where('user_id', $user->id)
            ->where('status', 'active')
            ->with([
                'course' => fn ($query) => $query->with([
                    'creator:id,name',
                    'categories:id,name',
                    'modules' => fn ($moduleQuery) => $moduleQuery->orderBy('sort_order')->with([
                        'materials' => fn ($materialQuery) => $materialQuery->orderBy('sort_order')->with([
                            'contents' => fn ($contentQuery) => $contentQuery->orderBy('sort_order'),
                        ]),
                    ]),
                ]),
            ])
            ->latest()
            ->get();

        $userCompletedMaterials = MaterialProgress::where('user_id', $user->id)
            ->where('is_completed', true)
            ->get()
            ->keyBy('material_id');

        $userCertificates = Certificate::where('user_id', $user->id)
            ->get()
            ->keyBy('course_id');

        $enrolledCourses = $enrollments->map(function ($enrollment) use ($userCompletedMaterials, $userCertificates) {
            $course = $enrollment->course;
            $course->append('thumbnail_url');

            $allMaterials = $course->modules->flatMap(fn ($module) => $module->materials);
            $total = $allMaterials->count();

            $completedMaterials = $allMaterials->filter(fn ($m) => isset($userCompletedMaterials[$m->id]));
            $completedCount = $completedMaterials->count();
            $progressPercent = $total ? (int) round(($completedCount / $total) * 100) : 0;

            // Find resume target / next unfinished lesson
            $nextMaterial = null;
            if ($progressPercent < 100) {
                $firstUnfinished = $allMaterials->first(fn ($m) => ! isset($userCompletedMaterials[$m->id]));
                if ($firstUnfinished) {
                    $firstContent = $firstUnfinished->contents->first();
                    $nextMaterial = [
                        'id' => $firstUnfinished->id,
                        'title' => $firstUnfinished->title,
                        'content_id' => $firstContent?->id,
                        'content_title' => $firstContent?->title,
                        'content_type' => $firstContent?->type ?? 'lesson',
                    ];
                }
            }

            $cert = $userCertificates->get($course->id);

            // Latest completed timestamp for sorting recently active courses
            $lastActivity = $completedMaterials->map(fn ($m) => $userCompletedMaterials[$m->id]->completed_at)->max()
                ?? $enrollment->enrolled_at;

            return [
                'enrollment' => $enrollment->only('id', 'status', 'enrolled_at'),
                'course' => array_merge($course->toArray(), [
                    'progress_percent' => $progressPercent,
                    'completed_materials' => $completedCount,
                    'total_materials' => $total,
                    'next_material' => $nextMaterial,
                    'is_completed' => $progressPercent === 100,
                    'certificate' => $cert ? [
                        'id' => $cert->id,
                        'certificate_number' => $cert->certificate_number,
                    ] : null,
                    'last_activity' => $lastActivity,
                ]),
            ];
        });

        // Continue learning course: find in-progress course with latest activity
        $inProgressCourses = $enrolledCourses->filter(fn ($item) => $item['course']['progress_percent'] < 100);
        $continueLearningCourse = $inProgressCourses->sortByDesc(fn ($item) => $item['course']['last_activity'])->first()
            ?? $enrolledCourses->first();

        $completedMaterialIds = $userCompletedMaterials->keys();
        $recommendedCourses = app(RecommendationService::class)->getRecommendations($user, 4);

        // Calculate certificates
        $recentCertificates = Certificate::where('user_id', $user->id)
            ->with(['course:id,title,slug,thumbnail', 'course.creator:id,name'])
            ->latest('issued_at')
            ->take(3)
            ->get()
            ->map(fn ($cert) => [
                'id' => $cert->id,
                'certificate_number' => $cert->certificate_number,
                'issued_at' => $cert->issued_at ? Carbon::parse($cert->issued_at)->format('d M Y') : 'Just now',
                'has_pdf' => (bool) $cert->pdf_path,
                'course' => [
                    'id' => $cert->course->id,
                    'title' => $cert->course->title,
                    'slug' => $cert->course->slug,
                    'thumbnail_url' => $cert->course->thumbnail_url,
                    'instructor' => $cert->course->creator?->name ?? 'KursusIO Instructor',
                ],
            ]);

        // Weekly activity (last 7 days)
        $englishDays = ['Sunday' => 'Sun', 'Monday' => 'Mon', 'Tuesday' => 'Tue', 'Wednesday' => 'Wed', 'Thursday' => 'Thu', 'Friday' => 'Fri', 'Saturday' => 'Sat'];
        $weeklyActivity = collect();
        for ($i = 6; $i >= 0; $i--) {
            $date = Carbon::now()->subDays($i);
            $dateStr = $date->toDateString();
            $dayName = $englishDays[$date->format('l')] ?? $date->format('D');
            $count = MaterialProgress::where('user_id', $user->id)
                ->where('is_completed', true)
                ->whereDate('completed_at', $dateStr)
                ->count();
            $weeklyActivity->push([
                'date' => $dateStr,
                'day_name' => $dayName,
                'count' => $count,
                'is_today' => $i === 0,
            ]);
        }

        // Quiz performance
        $completedQuizAttempts = QuizAttempt::where('user_id', $user->id)->where('status', 'completed')->get();
        $averageQuizScore = $completedQuizAttempts->count() > 0 ? round((float) $completedQuizAttempts->avg('score'), 1) : null;

        // Recent learning milestones / activities
        $recentActivities = UserEvent::where('user_id', $user->id)
            ->whereIn('event_type', [
                UserEvent::TYPE_MATERIAL_COMPLETE,
                UserEvent::TYPE_QUIZ_COMPLETE,
                UserEvent::TYPE_COURSE_ENROLL,
                UserEvent::TYPE_MATERIAL_VIEW,
            ])
            ->with(['course:id,title,slug', 'material:id,title'])
            ->latest()
            ->take(5)
            ->get()
            ->map(function ($event) {
                return [
                    'id' => $event->id,
                    'type' => $event->event_type,
                    'title' => match ($event->event_type) {
                        UserEvent::TYPE_MATERIAL_COMPLETE => 'Completed lesson: '.($event->material?->title ?? 'Lesson'),
                        UserEvent::TYPE_MATERIAL_VIEW => 'Studied lesson: '.($event->material?->title ?? 'Lesson'),
                        UserEvent::TYPE_QUIZ_COMPLETE => 'Completed a quiz',
                        UserEvent::TYPE_COURSE_ENROLL => 'Enrolled in a new course',
                        default => 'Learning activity',
                    },
                    'course_title' => $event->course?->title,
                    'course_slug' => $event->course?->slug,
                    'time_ago' => $event->created_at->diffForHumans(),
                ];
            });

        $totalCompleted = $enrolledCourses->filter(fn ($item) => $item['course']['progress_percent'] === 100)->count();
        $overallProgress = $enrolledCourses->count() ? (int) round($enrolledCourses->avg(fn ($item) => $item['course']['progress_percent'])) : 0;

        return [
            'enrolledCourses' => $enrolledCourses->values(),
            'continueLearningCourse' => $continueLearningCourse,
            'totalCompleted' => $totalCompleted,
            'overallProgress' => $overallProgress,
            'completedMaterials' => $completedMaterialIds->count(),
            'learningMinutes' => (int) MaterialContent::whereIn('material_id', $completedMaterialIds)->sum('duration'),
            'totalCertificates' => Certificate::where('user_id', $user->id)->count(),
            'recentCertificates' => $recentCertificates,
            'weeklyActivity' => $weeklyActivity,
            'averageQuizScore' => $averageQuizScore,
            'quizzesCompleted' => $completedQuizAttempts->count(),
            'recentActivities' => $recentActivities,
            'recommendedCourses' => $recommendedCourses,
            'ai' => app(AiSettings::class)->forDisplay(),
        ];
    }

    public function instructorData(User $user): array
    {
        $courses = Course::where('creator_id', $user->id)
            ->withCount([
                'enrollments' => fn ($query) => $query->where('status', 'active')->whereHas('user', fn ($uq) => $uq->withoutTrashed()),
                'reviews' => fn ($query) => $query->where('is_approved', true),
            ])
            ->latest()->get()->append('thumbnail_url');

        $courseIds = $courses->pluck('id');
        $totalStudents = $courses->sum('enrollments_count');
        $totalReviews = $courses->sum('reviews_count');
        $totalCertificates = Certificate::whereIn('course_id', $courseIds)->count();
        $totalLessons = \App\Models\Material::whereHas('module', fn ($query) => $query->whereIn('course_id', $courseIds))->count();

        $statusCounts = [
            'published' => $courses->where('status', 'published')->count(),
            'review' => $courses->where('status', 'review')->count(),
            'draft' => $courses->where('status', 'draft')->count(),
        ];

        $enrollmentCounts = Enrollment::whereIn('course_id', $courseIds)
            ->where('status', 'active')
            ->whereHas('user', fn ($query) => $query->withoutTrashed())
            ->where('enrolled_at', '>=', now()->subDays(6)->startOfDay())
            ->selectRaw('DATE(enrolled_at) as date, COUNT(*) as total')
            ->groupBy('date')
            ->pluck('total', 'date');

        $enrollmentTrend = collect(range(6, 0))->map(function ($daysAgo) use ($enrollmentCounts) {
            $date = now()->subDays($daysAgo);

            return [
                'date' => $date->toDateString(),
                'day_name' => $date->format('D'),
                'count' => (int) ($enrollmentCounts[$date->toDateString()] ?? 0),
                'is_today' => $daysAgo === 0,
            ];
        })->values();

        $recentReviews = Review::whereIn('course_id', $courseIds)
            ->where('is_approved', true)
            ->with(['user:id,name', 'course:id,title,slug'])
            ->latest()
            ->take(5)
            ->get()
            ->map(fn (Review $review) => [
                'id' => $review->id,
                'rating' => $review->rating,
                'comment' => $review->comment,
                'created_at' => $review->created_at?->toDateString(),
                'user' => [
                    'id' => $review->user?->id,
                    'name' => $review->user?->name ?? 'Student',
                ],
                'course' => [
                    'id' => $review->course?->id,
                    'title' => $review->course?->title,
                    'slug' => $review->course?->slug,
                ],
            ]);

        return [
            'instructorCourses' => $courses,
            'totalStudents' => $totalStudents,
            'totalEarnings' => $courses->sum(fn ($course) => $course->type === 'paid' ? ($course->price ?? 0) * $course->enrollments_count : 0),
            'averageRating' => round((float) $courses->avg('rating_avg'), 1),
            'recentEnrollments' => Enrollment::where('status', 'active')
                ->whereHas('user', fn ($uq) => $uq->withoutTrashed())
                ->whereHas('course', fn ($query) => $query->where('creator_id', $user->id))
                ->with(['user:id,name', 'course:id,title,slug'])->latest('enrolled_at')->take(5)->get(),
            'totalReviews' => $totalReviews,
            'totalLessons' => $totalLessons,
            'totalCertificates' => $totalCertificates,
            'completionRate' => $totalStudents > 0 ? (int) round(($totalCertificates / $totalStudents) * 100) : 0,
            'statusCounts' => $statusCounts,
            'newStudentsThisMonth' => Enrollment::whereIn('course_id', $courseIds)
                ->where('status', 'active')
                ->whereHas('user', fn ($query) => $query->withoutTrashed())
                ->where('enrolled_at', '>=', now()->startOfMonth())
                ->count(),
            'enrollmentTrend' => $enrollmentTrend,
            'topCourse' => $courses->sortByDesc('enrollments_count')->first(),
            'recentReviews' => $recentReviews,
            'ai' => app(AiSettings::class)->forDisplay(),
        ];
    }
}
