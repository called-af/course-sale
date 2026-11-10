<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class RoleController extends Controller
{
    public function show()
    {
        return Inertia::render('auth/ChooseRole');
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'role' => ['required', Rule::in(['student', 'instructor'])],
        ]);

        $user = $request->user();

        if ($user->role === 'admin') {
            abort(403);
        }

        // A role is chosen once, at onboarding. Existing students/instructors
        // must not be able to self-promote (e.g. student -> instructor).
        if ($user->role !== null && $user->role !== $validated['role']) {
            abort(403, 'Your account role has already been set. Contact an administrator if it needs to change.');
        }

        $user->update([
            'role' => $validated['role'],
        ]);

        return match ($validated['role']) {
            'student' => redirect()->route('student.dashboard'),
            'instructor' => redirect()->route('instructor.dashboard'),
        };
    }
}
