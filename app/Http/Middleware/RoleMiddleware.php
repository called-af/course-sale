<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class RoleMiddleware
{
    public function handle(Request $request, Closure $next, ...$roles)
    {
        $user = $request->user();

        if (! $user) {
            abort(401);
        }

        if ($user->role === null) {
            if (! $request->is('choose-role')) {
                return redirect('/choose-role');
            }

            return $next($request);
        }

        if ($request->is('choose-role')) {
            return match ($user->role) {
                'admin'      => redirect()->route('admin.dashboard'),
                'instructor' => redirect()->route('instructor.dashboard'),
                'student'    => redirect()->route('student.dashboard'),
                default      => abort(403),
            };
        }

        if (! empty($roles) && ! in_array($user->role, $roles)) {
            abort(403);
        }

        return $next($request);
    }
}
