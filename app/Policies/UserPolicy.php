<?php

namespace App\Policies;

use App\Models\User;
use Illuminate\Auth\Access\Response;

class UserPolicy
{
    /**
     * Manage user from Admin, or allow instructors to view enrolled student lists.
     */
    public function viewAny(User $authUser): bool
    {
        return in_array($authUser->role, ['admin', 'instructor'], true);
    }

    public function view(User $authUser, User $user): bool
    {
        if ($authUser->role === 'admin') {
            return true;
        }

        if ($authUser->id === $user->id) {
            return true;
        }

        if ($authUser->role === 'instructor') {
            return $authUser->hasEnrolledStudent($user);
        }

        return false;
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
            return Response::deny('You cannot delete your own account.');
        }

        return $authUser->role === 'admin'
            ? Response::allow()
            : Response::deny();
    }
}
