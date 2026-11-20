<?php

namespace App\Http\Controllers;

use App\Http\Requests\User\StoreUserRequest;
use App\Http\Requests\User\UpdateUserRequest;
use App\Models\User;
use App\Services\UserService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class UserController extends Controller
{
    public function __construct(
        protected UserService $userService
    ) {
        $this->authorizeResource(User::class, 'user');
    }

    public function index(Request $request): Response
    {
        return Inertia::render('admin/user/page', $this->userService->indexData($request));
    }

    public function show(User $user): Response
    {
        return Inertia::render('admin/user/[id]/page', $this->userService->detailData($user));
    }

    public function profile(): Response
    {
        return Inertia::render('admin/Profile', $this->userService->profileData(request()->user()));
    }

    public function store(StoreUserRequest $request): RedirectResponse
    {
        $this->userService->create($request->validated());

        return back()->with('success', 'User created');
    }

    public function update(UpdateUserRequest $request, User $user): RedirectResponse
    {
        $this->userService->update($user, $request->validated());

        return back()->with('success', 'User updated');
    }

    public function destroy(User $user): RedirectResponse
    {
        try {
            $this->userService->delete($user);

            return back()->with('success', 'User deleted');
        } catch (\Throwable $e) {
            report($e);

            return back()->with('error', 'Failed to delete user: '.$e->getMessage());
        }
    }
}
