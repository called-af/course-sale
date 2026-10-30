<?php

namespace App\Services\AI\Tool;

use App\Models\Course;
use App\Models\User;

class CourseDetailTool
{
    protected ?int $userId = null;

    public function setUserId($userId): void
    {
        $this->userId = $userId;
    }

    public function getDefinition(): array
    {
        return [
            'description' => 'Retrieve detailed information for a specific course by ID. Unenrolled students only receive course overview and module titles (mockup), while enrolled students and course owner instructors receive full module and material contents.',
            'parameters' => [
                'type' => 'object',
                'properties' => [
                    'course_id' => [
                        'type' => 'integer',
                        'description' => 'The ID of the course',
                    ],
                ],
                'required' => ['course_id'],
            ],
        ];
    }

    public function execute(array $arguments): array
    {
        if (empty($arguments['course_id'])) {
            return ['error' => 'course_id is required'];
        }

        $course = Course::with(['creator', 'modules.materials', 'categories'])->find($arguments['course_id']);

        if (! $course) {
            return ['error' => 'Course not found'];
        }

        $user = $this->userId ? User::find($this->userId) : null;
        $isOwner = $user && ($user->id === $course->creator_id || $user->hasRole('admin'));
        $isEnrolled = $user && $course->enrollments()
            ->where('user_id', $user->id)
            ->where('status', 'active')
            ->exists();
        $hasFullAccess = $isOwner || $isEnrolled;

        $modulesCount = $course->modules->count();

        $base = [
            'id' => $course->id,
            'title' => $course->title,
            'description' => $course->description,
            'level' => $course->level,
            'type' => $course->type,
            'price' => $course->type === 'free' ? null : $course->price,
            'rating' => $course->rating_count > 0 ? (float) $course->rating_avg : null,
            'rating_count' => (int) $course->rating_count,
            'instructor' => $course->creator ? $course->creator->name : null,
            'modules_count' => $modulesCount,
            'categories' => $course->categories->pluck('name')->toArray(),
            'is_owner' => $isOwner,
            'is_enrolled' => $isEnrolled,
            'has_full_access' => $hasFullAccess,
        ];

        if ($isOwner) {
            $enrolledCount = $course->enrollments()
                ->where('status', 'active')
                ->whereHas('user', fn ($uq) => $uq->withoutTrashed())
                ->count();
            $enrollmentEarnings = $course->type === 'paid' ? (float) ($course->price ?? 0) * $enrolledCount : 0.0;
            $orderEarnings = (float) \App\Models\OrderItem::where('course_id', $course->id)
                ->whereHas('order', fn ($q) => $q->where('status', 'paid'))
                ->sum('course_price');
            $earnings = max($enrollmentEarnings, $orderEarnings);

            $reviews = \App\Models\Review::where('course_id', $course->id)
                ->where('is_approved', true)
                ->with(['user' => fn ($uq) => $uq->withoutTrashed()->select('id', 'name')])
                ->latest()
                ->take(5)
                ->get()
                ->map(fn ($r) => [
                    'reviewer_name' => $r->user?->name ?? 'Anonymous',
                    'rating' => (int) $r->rating,
                    'comment' => $r->comment,
                    'date' => $r->created_at?->format('Y-m-d H:i:s'),
                ])->values()->all();

            $base['owner_analytics'] = [
                'enrolled_students_count' => $enrolledCount,
                'earnings' => $earnings,
                'formatted_earnings' => 'Rp '.number_format($earnings, 0, ',', '.'),
                'rating_avg' => $course->rating_count > 0 ? (float) $course->rating_avg : null,
                'rating_count' => (int) $course->rating_count,
                'recent_reviews' => $reviews,
            ];
        }

        if (! $hasFullAccess) {
            return array_merge($base, [
                'access_restricted' => true,
                'access_message' => "User belum enroll di course ini. Hanya dapat melihat mockup info dan {$modulesCount} modul. Materi pelajaran tidak tersedia sampai user enroll.",
                'modules' => $course->modules->pluck('title')->toArray(),
                'materials' => null,
            ]);
        }

        return array_merge($base, [
            'access_restricted' => false,
            'modules' => $course->modules->map(fn ($module) => [
                'id' => $module->id,
                'title' => $module->title,
                'materials' => $module->materials->map(fn ($mat) => [
                    'id' => $mat->id,
                    'title' => $mat->title,
                    'description' => $mat->description,
                ])->values()->toArray(),
            ])->values()->toArray(),
        ]);
    }
}
