<?php

namespace App\Http\Controllers\Instructor;

use App\Http\Controllers\Controller;
use App\Http\Requests\Instructor\UpdateInstructorProfileRequest;
use App\Services\UserService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class InstructorProfileController extends Controller
{
    public function __construct(
        protected UserService $userService
    ) {}

    /**
     * Display the instructor profile page.
     */
    public function edit(Request $request): Response
    {
        return Inertia::render('instructor/Profile', $this->userService->profileData($request->user()));
    }

    /**
     * Update instructor's profile information.
     */
    public function update(UpdateInstructorProfileRequest $request): RedirectResponse
    {
        $user = $request->user();

        $this->userService->update($user, $request->validated());

        return back()->with('success', 'Instructor profile updated successfully.');
    }
}
