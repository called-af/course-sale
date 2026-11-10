<?php

namespace App\Policies;

use App\Models\Material;
use App\Models\MaterialContent;
use App\Models\User;

class MaterialContentPolicy
{
    /**
     * Create a new policy instance.
     */
    public function create(User $user, Material $material): bool
    {
        return $user->id === $material->module->course->creator_id
            || $user->role === 'admin';
    }

    public function update(User $user, MaterialContent $content): bool
    {
        return $user->id === $content->material->module->course->creator_id
            || $user->role === 'admin';
    }

    public function delete(User $user, MaterialContent $content): bool
    {
        return $this->update($user, $content);
    }
}
