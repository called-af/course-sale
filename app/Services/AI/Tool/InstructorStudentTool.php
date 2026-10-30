<?php

namespace App\Services\AI\Tool;

use App\Models\Course;
use App\Models\Enrollment;
use App\Models\User;

class InstructorStudentTool
{
    protected ?int $userId = null;

    public function setUserId($userId): void
    {
        $this->userId = $userId;
    }

    public function getDefinition(): array
    {
        return [
            'description' => 'Retrieve the count and details of students enrolled in courses owned by the current instructor, or list courses owned by the instructor. Instructors can only access students enrolled in their own courses and cannot access users who did not enroll in their courses.',
            'parameters' => [
                'type' => 'object',
                'properties' => [
                    'only_courses' => [
                        'type' => 'boolean',
                        'description' => 'Optional. Set to true to retrieve only the list and total count of courses owned by the current instructor without student breakdown.',
                    ],
                    'course_id' => [
                        'type' => 'integer',
                        'description' => 'Optional ID of a specific course owned by the instructor to check enrolled student count and list.',
                    ],
                    'course_title' => [
                        'type' => 'string',
                        'description' => 'Optional course title or keyword to filter the instructor\'s own courses.',
                    ],
                    'student_id' => [
                        'type' => 'integer',
                        'description' => 'Optional ID of a specific user/student to check if they are enrolled in the instructor\'s courses.',
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

        // 1. Only courses request
        if (! empty($arguments['only_courses'])) {
            $ownedCourses = Course::where('creator_id', $user->id)
                ->withCount(['enrollments' => fn ($q) => $q->where('status', 'active')->whereHas('user', fn ($uq) => $uq->withoutTrashed())])
                ->get();

            $totalEarnings = $ownedCourses->sum(fn ($c) => $c->type === 'paid' ? (float) ($c->price ?? 0) * (int) ($c->enrollments_count ?? 0) : 0.0);
            $rated = $ownedCourses->where('rating_count', '>', 0);
            $avgRating = $rated->count() > 0 ? round((float) $rated->avg('rating_avg'), 2) : null;

            return [
                'total_owned_courses' => $ownedCourses->count(),
                'total_earnings' => $totalEarnings,
                'average_rating' => $avgRating,
                'owned_courses' => $ownedCourses->map(fn ($c) => [
                    'id' => $c->id,
                    'title' => $c->title,
                    'slug' => $c->slug,
                    'level' => $c->level,
                    'status' => $c->status,
                    'type' => $c->type,
                    'price' => $c->type === 'paid' ? (float) $c->price : 0.0,
                    'earnings' => $c->type === 'paid' ? (float) ($c->price ?? 0) * (int) ($c->enrollments_count ?? 0) : 0.0,
                    'rating_avg' => $c->rating_count > 0 ? (float) $c->rating_avg : null,
                    'rating_count' => (int) $c->rating_count,
                    'enrolled_students_count' => $c->enrollments_count ?? 0,
                ])->values()->all(),
            ];
        }

        // 2. Specific student lookup
        if (! empty($arguments['student_id'])) {
            $student = User::find($arguments['student_id']);
            if (! $student) {
                return ['error' => 'Student tidak ditemukan.'];
            }

            if (! $user->hasRole('admin') && ! $user->hasEnrolledStudent($student)) {
                return ['error' => 'Akses ditolak. User/Student tersebut tidak terdaftar pada course milik Anda. Anda tidak dapat mengakses user yang tidak enroll di course Anda.'];
            }

            $enrolledCourses = Course::where('creator_id', $user->id)
                ->whereHas('enrollments', fn ($q) => $q->where('user_id', $student->id)->where('status', 'active'))
                ->get(['id', 'title', 'slug', 'level']);

            return [
                'student' => [
                    'id' => $student->id,
                    'name' => $student->name,
                    'email' => $student->email,
                    'enrolled_courses' => $enrolledCourses->map(fn ($c) => [
                        'id' => $c->id,
                        'title' => $c->title,
                        'slug' => $c->slug,
                        'level' => $c->level,
                    ])->all(),
                ],
            ];
        }

        // 3. Specific course lookup by ID or title
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
                return ['error' => 'Akses ditolak. Anda hanya dapat mengakses data student yang enroll pada course milik Anda sendiri.'];
            }

            $enrollments = Enrollment::where('course_id', $course->id)
                ->where('status', 'active')
                ->whereHas('user', fn ($uq) => $uq->withoutTrashed())
                ->with(['user' => fn ($uq) => $uq->withoutTrashed()->select('id', 'name', 'email')])
                ->latest('enrolled_at')
                ->get();

            $courseEarnings = $course->type === 'paid' ? (float) ($course->price ?? 0) * $enrollments->count() : 0.0;

            return [
                'course_id' => $course->id,
                'course_title' => $course->title,
                'type' => $course->type,
                'price' => $course->type === 'paid' ? (float) $course->price : 0.0,
                'earnings' => $courseEarnings,
                'rating_avg' => $course->rating_count > 0 ? (float) $course->rating_avg : null,
                'rating_count' => (int) $course->rating_count,
                'enrolled_students_count' => $enrollments->count(),
                'students' => $enrollments->filter(fn ($e) => $e->user !== null)->map(fn ($e) => [
                    'id' => $e->user->id,
                    'name' => $e->user->name,
                    'email' => $e->user->email,
                    'enrolled_at' => $this->formatEnrolledAt($e->enrolled_at, $e->created_at),
                ])->values()->all(),
            ];
        }

        // 4. All courses owned by the instructor
        $courses = Course::where('creator_id', $user->id)
            ->with(['enrollments' => function ($q) {
                $q->where('status', 'active')
                    ->whereHas('user', fn ($uq) => $uq->withoutTrashed())
                    ->with(['user' => fn ($uq) => $uq->withoutTrashed()->select('id', 'name', 'email')]);
            }])
            ->get();

        $courseSummaries = [];
        $uniqueStudentIds = [];

        foreach ($courses as $c) {
            $students = $c->enrollments->filter(fn ($e) => $e->user !== null)->map(fn ($e) => [
                'id' => $e->user->id,
                'name' => $e->user->name,
                'email' => $e->user->email,
                'enrolled_at' => $this->formatEnrolledAt($e->enrolled_at, $e->created_at),
            ])->values()->all();

            foreach ($students as $s) {
                $uniqueStudentIds[$s['id']] = true;
            }

            $cEarnings = $c->type === 'paid' ? (float) ($c->price ?? 0) * count($students) : 0.0;

            $courseSummaries[] = [
                'course_id' => $c->id,
                'course_title' => $c->title,
                'type' => $c->type,
                'price' => $c->type === 'paid' ? (float) $c->price : 0.0,
                'earnings' => $cEarnings,
                'rating_avg' => $c->rating_count > 0 ? (float) $c->rating_avg : null,
                'rating_count' => (int) $c->rating_count,
                'enrolled_students_count' => count($students),
                'students' => $students,
            ];
        }

        $ratedCourses = $courses->where('rating_count', '>', 0);
        $avgRating = $ratedCourses->count() > 0 ? round((float) $ratedCourses->avg('rating_avg'), 2) : null;

        return [
            'total_courses' => $courses->count(),
            'total_unique_students' => count($uniqueStudentIds),
            'total_enrollments' => array_sum(array_column($courseSummaries, 'enrolled_students_count')),
            'total_earnings' => array_sum(array_column($courseSummaries, 'earnings')),
            'average_rating' => $avgRating,
            'courses' => $courseSummaries,
        ];
    }

    protected function formatEnrolledAt($enrolledAt, $createdAt): string
    {
        if ($enrolledAt) {
            if (is_numeric($enrolledAt)) {
                return date('c', (int) $enrolledAt);
            }
            if ($enrolledAt instanceof \DateTimeInterface) {
                return $enrolledAt->format('c');
            }

            return (string) $enrolledAt;
        }

        return $createdAt ? (string) $createdAt : '';
    }
}
