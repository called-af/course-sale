<?php

namespace App\Policies;

use App\Models\User;
use Illuminate\Auth\Access\Response;

class UserPolicy
{
    /**
     * Manage user from Admin.
     */
    public function viewAny(User $authUser): bool
    {
        return $authUser->role === 'admin';
    }

    public function view(User $authUser, User $user): bool
    {
        return $authUser->role === 'admin';
    }

    public function create(User $authUser): bool
    {
        return $authUser->role === 'admin';
    }

    public function update(User $authUser, User $user): bool
    {
        return $authUser->role === 'admin';
    }

    public function delete(User $authUser, User $user): Response
    {
        if ($authUser->id === $user->id) {
            return Response::deny('Tidak bisa menghapus akun sendiri');
        }

        return $authUser->role === 'admin'
            ? Response::allow()
            : Response::deny();
    }
}
