<?php

namespace App\Policies;

use App\Models\Course;
use App\Models\User;

class CoursePolicy
{
    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user): bool
    {
        return in_array($user->role, ['admin', 'instructor']);
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, Course $course): bool
    {
        if (! $user) {
            return $course->status === 'published';
        }

        if ($user->role === 'admin') {
            return true;
        }

        if ($user->role === 'instructor') {
            return $course->creator_id === $user->id;
        }

        return $user->role === 'student'
            && $course->enrollments()
                ->where('user_id', $user->id)
                ->where('status', 'active')
                ->exists();
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user): bool
    {
        return in_array($user->role, ['admin', 'instructor']);
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, Course $course): bool
    {
        if ($user->role === 'admin') {
            return true;
        }

        return
            $user->role === 'instructor'
            && $course->creator_id === $user->id;
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, Course $course): bool
    {
        return $this->update($user, $course);
    }

    /**
     * Determine whether the user can restore the model.
     */
    public function restore(User $user, Course $course): bool
    {
        return $this->delete($user, $course);
    }

    /**
     * Determine whether the user can permanently delete the model.
     */
    public function forceDelete(User $user, Course $course): bool
    {
        return $user->role === 'admin';
    }

    public function publish(User $user, Course $course): bool
    {
        return $user->role === 'admin';
    }

    public function approve(User $user, Course $course): bool
    {
        return $user->role === 'admin';
    }
}
