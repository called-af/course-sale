<?php

namespace App\Services;

use App\Models\Course;
use DomainException;
use Illuminate\Support\Facades\DB;

class CourseApprovalService
{
    public function approve(Course $course): Course
    {
        return DB::transaction(function () use ($course) {
            if ($course->status !== 'review') {
                throw new DomainException('The course must be under review before it can be approved.');
            }

            if (! $course->canBePublished()) {
                throw new DomainException('The course is not complete enough to be published.');
            }

            $course->update([
                'status' => 'published',
                'published_at' => now(),
                'approved_at' => now(),
            ]);

            return $course->refresh();
        });
    }
}
