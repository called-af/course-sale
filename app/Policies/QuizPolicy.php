<?php

namespace App\Policies;

use App\Models\User;
use App\Models\QuizQuestion;
use App\Models\QuizAttempt;

class QuizPolicy
{
    /**
     * ADMIN / INSTRUCTOR ONLY
     */
    public function create(User $user)
    {
        return in_array($user->role, ['admin', 'instructor']);
    }

    public function update(User $user)
    {
        return in_array($user->role, ['admin', 'instructor']);
    }

    /**
     * USER
     */
    public function start(User $user)
    {
        return $user->role === 'student';
    }

    public function submit(User $user, QuizAttempt $attempt)
    {
        return $user->id === $attempt->user_id;
    }
}