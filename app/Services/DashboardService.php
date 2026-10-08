<?php

namespace App\Services;

use App\Models\Course;
use App\Models\Enrollment;
use App\Models\MaterialContent;
use App\Models\MaterialProgress;
use App\Models\Order;
use App\Models\User;

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
        $enrollments = Enrollment::where('user_id', $user->id)->where('status', 'active')
            ->with(['course' => fn ($query) => $query->with(['modules' => fn ($moduleQuery) => $moduleQuery->with('materials')])])
            ->latest()->get();

        $enrolledCourses = $enrollments->map(function ($enrollment) use ($user) {
            $course = $enrollment->course;
            $course->append('thumbnail_url');
            $materialIds = $course->modules->flatMap(fn ($module) => $module->materials->pluck('id'));
            $total = $materialIds->count();
            $completed = $total ? MaterialProgress::where('user_id', $user->id)->whereIn('material_id', $materialIds)->where('is_completed', true)->count() : 0;

            return [
                'enrollment' => $enrollment->only('id', 'status', 'enrolled_at'),
                'course' => array_merge($course->toArray(), [
                    'progress_percent' => $total ? (int) round($completed / $total * 100) : 0,
                    'completed_materials' => $completed,
                    'total_materials' => $total,
                ]),
            ];
        });

        $completedMaterialIds = MaterialProgress::where('user_id', $user->id)->where('is_completed', true)->pluck('material_id');
        $recommendedCourses = app(RecommendationService::class)->getRecommendations($user, 4);

        return [
            'enrolledCourses' => $enrolledCourses->values(),
            'totalCompleted' => $enrolledCourses->filter(fn ($item) => $item['course']['progress_percent'] === 100)->count(),
            'overallProgress' => $enrolledCourses->count() ? (int) round($enrolledCourses->avg(fn ($item) => $item['course']['progress_percent'])) : 0,
            'completedMaterials' => $completedMaterialIds->count(),
            'learningMinutes' => MaterialContent::whereIn('material_id', $completedMaterialIds)->sum('duration'),
            'recommendedCourses' => $recommendedCourses,
            'ai' => app(AiSettings::class)->forDisplay(),
        ];
    }

    public function instructorData(User $user): array
    {
        $courses = Course::where('creator_id', $user->id)
            ->withCount(['enrollments' => fn ($query) => $query->where('status', 'active')])
            ->latest()->get()->append('thumbnail_url');

        return [
            'instructorCourses' => $courses,
            'totalStudents' => $courses->sum('enrollments_count'),
            'totalEarnings' => $courses->sum(fn ($course) => $course->type === 'paid' ? ($course->price ?? 0) * $course->enrollments_count : 0),
            'averageRating' => round((float) $courses->avg('rating_avg'), 1),
            'recentEnrollments' => Enrollment::where('status', 'active')
                ->whereHas('course', fn ($query) => $query->where('creator_id', $user->id))
                ->with(['user:id,name', 'course:id,title,slug'])->latest('enrolled_at')->take(5)->get(),
            'ai' => app(AiSettings::class)->forDisplay(),
        ];
    }
}
