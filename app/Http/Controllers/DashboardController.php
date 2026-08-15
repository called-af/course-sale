<?php

namespace App\Http\Controllers;

use App\Models\Course;
use App\Models\Enrollment;
use App\Models\MaterialProgress;
use App\Models\MaterialContent;
use App\Models\Order;
use App\Models\User;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function admin(): Response
    {
        $topCourses = Course::query()
            ->withCount(['enrollments' => fn ($query) => $query->where('status', 'active')])
            ->orderByDesc('enrollments_count')
            ->take(5)
            ->get(['id', 'title', 'slug']);

        $recentEnrollments = Enrollment::query()
            ->where('status', 'active')
            ->with(['user:id,name', 'course:id,title,slug'])
            ->latest('enrolled_at')
            ->take(5)
            ->get();

        return Inertia::render('admin/Dashboard', [
            'metrics' => [
                'totalUsers' => User::count(),
                'totalCourses' => Course::count(),
                'activeEnrollments' => Enrollment::where('status', 'active')->count(),
                'revenue' => (float) Order::where('status', 'paid')->sum('total_price'),
            ],
            'topCourses' => $topCourses,
            'recentEnrollments' => $recentEnrollments,
            'recentCourses' => Course::latest()->take(5)->get(['id', 'title', 'slug', 'status', 'created_at']),
        ]);
    }

    public function student(): Response
    {
        $user = Auth::user();

        $enrollments = Enrollment::where('user_id', $user->id)
            ->where('status', 'active')
            ->with([
                'course' => function ($q) {
                    $q->with([
                        'modules' => fn ($mq) => $mq->with('materials'),
                    ]);
                },
            ])
            ->latest()
            ->get();

        // Compute progress for each enrollment
        $enrolledCourses = $enrollments->map(function ($enrollment) use ($user) {
            $course    = $enrollment->course;
            $course->append('thumbnail_url');
            $allMaterialIds = collect();

            foreach ($course->modules ?? [] as $module) {
                foreach ($module->materials ?? [] as $material) {
                    $allMaterialIds->push($material->id);
                }
            }

            $totalMaterials = $allMaterialIds->count();

            $completedCount = $totalMaterials > 0
                ? MaterialProgress::where('user_id', $user->id)
                    ->whereIn('material_id', $allMaterialIds)
                    ->where('is_completed', true)
                    ->count()
                : 0;

            $progressPercent = $totalMaterials > 0
                ? (int) round($completedCount / $totalMaterials * 100)
                : 0;

            return [
                'enrollment' => $enrollment->only('id', 'status', 'enrolled_at'),
                'course'     => array_merge($course->toArray(), [
                    'progress_percent'     => $progressPercent,
                    'completed_materials'  => $completedCount,
                    'total_materials'      => $totalMaterials,
                ]),
            ];
        });

        $totalCompleted  = $enrolledCourses->filter(fn ($ec) => $ec['course']['progress_percent'] === 100)->count();
        $overallProgress = $enrolledCourses->count() > 0
            ? (int) round($enrolledCourses->avg(fn ($ec) => $ec['course']['progress_percent']))
            : 0;

        return Inertia::render('user/Dashboard', [
            'enrolledCourses' => $enrolledCourses->values(),
            'totalCompleted'  => $totalCompleted,
            'overallProgress' => $overallProgress,
            'completedMaterials' => MaterialProgress::where('user_id', $user->id)
                ->where('is_completed', true)
                ->count(),
            'learningMinutes' => MaterialContent::whereIn(
                'material_id',
                MaterialProgress::where('user_id', $user->id)
                    ->where('is_completed', true)
                    ->pluck('material_id')
            )->sum('duration'),
        ]);
    }

    public function instructor(): Response
    {
        $user = Auth::user();

        $courses = Course::where('creator_id', $user->id)
            ->withCount(['enrollments' => fn ($query) => $query->where('status', 'active')])
            ->latest()
            ->get()
            ->append('thumbnail_url');

        $totalStudents = $courses->sum('enrollments_count');

        // Earnings: sum of price × enrollments for paid courses (rough calc)
        $totalEarnings = $courses->sum(function ($course) {
            if ($course->type === 'paid') {
                return ($course->price ?? 0) * $course->enrollments_count;
            }
            return 0;
        });

        return Inertia::render('user/Dashboard', [
            'instructorCourses' => $courses,
            'totalStudents'     => $totalStudents,
            'totalEarnings'     => $totalEarnings,
            'averageRating'     => round((float) $courses->avg('rating_avg'), 1),
            'recentEnrollments' => Enrollment::query()
                ->where('status', 'active')
                ->whereHas('course', fn ($query) => $query->where('creator_id', $user->id))
                ->with(['user:id,name', 'course:id,title,slug'])
                ->latest('enrolled_at')
                ->take(5)
                ->get(),
        ]);
    }
}
