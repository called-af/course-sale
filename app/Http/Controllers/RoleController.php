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

        $user->update([
            'role' => $validated['role'],
        ]);

        return match ($validated['role']) {
            'student'    => redirect()->route('student.dashboard'),
            'instructor' => redirect()->route('instructor.dashboard'),
        };
    }
}
