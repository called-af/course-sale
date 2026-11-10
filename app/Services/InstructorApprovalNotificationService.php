<?php

namespace App\Services;

use App\Models\Course;
use App\Models\User;

class InstructorApprovalNotificationService
{
    public function for(?User $user): array
    {
        if ($user?->role !== 'instructor') {
            return ['count' => 0, 'courses' => []];
        }

        $courses = Course::query()
            ->where('creator_id', $user->id)
            ->whereNotNull('approved_at')
            ->latest('approved_at')
            ->get(['id', 'title', 'slug', 'approved_at']);

        return ['count' => $courses->count(), 'courses' => $courses];
    }
}
