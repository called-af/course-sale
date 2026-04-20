<?php

namespace App\Policies;

use App\Models\Module;
use App\Models\User;

class ModulePolicy
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
    public function view(?User $user, Module $module): bool
    {
        if (! $user) {
            return $module->status === 'published';
        }

        if ($user->role === 'admin') {
            return true;
        }

        if ($user->role === 'instructor') {
            return $module->course->creator_id === $user->id;
        }

        return $module->status === 'published';
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
    public function update(User $user, Module $module): bool
    {
        if ($user->role === 'admin') {
            return true;
        }

        return
            $user->role === 'instructor'
            && $module->course->creator_id === $user->id;
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, Module $module): bool
    {
        return $this->update($user, $module);
    }

    public function publish(User $user, Module $module): bool
    {
        return
            $user->role === 'admin'
            || (
                $user->role === 'instructor'
                && $module->course->creator_id === $user->id
            );
    }
}
