<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Hash;

class UserService
{
    public function indexData(Request $request): array
    {
        $search = $request->string('search')->trim()->toString();
        $role = $request->string('role')->toString();
        $query = User::withCount(['createdCourses', 'enrollments']);

        if ($search !== '') {
            $query->where(fn ($users) => $users
                ->where('name', 'like', "%{$search}%")
                ->orWhere('email', 'like', "%{$search}%"));
        }

        if (in_array($role, ['admin', 'instructor', 'student'], true)) {
            $query->where('role', $role);
        } else {
            $role = '';
        }

        return [
            'users' => $query->latest()->paginate(10)->withQueryString(),
            'filters' => ['search' => $search, 'role' => $role],
        ];
    }

    public function detailData(User $user): array
    {
        return ['user' => $user->load([
            'createdCourses' => fn ($courses) => $courses->withCount(['modules', 'enrollments'])
                ->with(['categories:id,name', 'creator:id,name'])->latest(),
            'enrollments.course:id,title,slug,thumbnail',
        ])];
    }

    public function profileData(User $user): array
    {
        return ['user' => $user->load([
            'createdCourses' => fn ($courses) => $courses->withCount(['modules', 'enrollments'])
                ->with('categories:id,name')->latest(),
        ])];
    }
    public function create(array $data): User
    {
        return DB::transaction(function () use ($data) {

            return User::create([
                'name' => $data['name'],
                'email' => $data['email'],
                'password' => Hash::make($data['password']),
                'role' => $data['role'],
            ]);
        });
    }

    public function update(User $user, array $data): User
    {
        return DB::transaction(function () use ($user, $data) {

            if (! empty($data['password'])) {
                $data['password'] = Hash::make($data['password']);
            } else {
                unset($data['password']);
            }

            if (isset($data['avatar'])) {

                if ($user->avatar) {
                    Storage::disk('public')->delete($user->avatar);
                }

                $data['avatar'] = $data['avatar']->store('avatars', 'public');
            }

            $user->update($data);

            return $user->refresh();
        });
    }

    public function delete(User $user): void
    {
        DB::transaction(function () use ($user) {
            DB::table('sessions')->where('user_id', $user->id)->delete();
            \App\Models\Enrollment::where('user_id', $user->id)->update(['status' => 'revoked']);
            $user->delete();
        });
    }
}
