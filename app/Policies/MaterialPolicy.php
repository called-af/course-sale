<?php

namespace App\Policies;

use App\Models\Material;
use App\Models\User;

class MaterialPolicy
{
    public function create(User $user): bool
    {
        return $user->hasRole(['admin', 'instructor']);
    }

    public function publish(User $user, Material $material): bool
    {
        return
            $user->role === 'admin'
            || (
                $user->role === 'instructor'
                && $material->module->course->creator_id === $user->id
            );
    }

    public function update(User $user, Material $material): bool
    {
        return $user->hasRole(['admin', 'instructor']);
    }

    public function delete(User $user, Material $material): bool
    {
        return $user->hasRole(['admin', 'instructor']);
    }
}
