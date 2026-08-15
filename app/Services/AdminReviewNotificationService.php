<?php

namespace App\Services;

use App\Models\Course;
use App\Models\User;

class AdminReviewNotificationService
{
    public function for(User|null $user): array
    {
        if ($user?->role !== 'admin') {
            return ['count' => 0, 'courses' => []];
        }

        $courses = Course::query()
            ->where('status', 'review')
            ->with('creator:id,name')
            ->latest('updated_at')
            ->get(['id', 'creator_id', 'title', 'slug', 'updated_at']);

        return [
            'count' => $courses->count(),
            'courses' => $courses,
        ];
    }
}
