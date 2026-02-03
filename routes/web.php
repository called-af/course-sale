<?php

use App\Http\Controllers\AuthControllers;
use App\Http\Controllers\RoleController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    if (! auth()->check()) {
        return Inertia::render('welcome');
    }

    return redirect()->route('home.redirect');
})->name('home');

Route::middleware('guest')->group(function () {
    Route::get('/login', [AuthControllers::class, 'show'])->name('login');
    Route::post('/login', [AuthControllers::class, 'store']);

    Route::get('/register', [AuthControllers::class, 'showRegister']);
    Route::post('/register', [AuthControllers::class, 'register']);
});

Route::post('/logout', [AuthControllers::class, 'logout'])
    ->middleware('auth')
    ->name('logout');

Route::middleware(['auth', 'role'])->group(function () {

    Route::get('/home', function () {
        return match (auth()->user()->role) {
            'admin'      => redirect()->route('admin.dashboard'),
            'instructor' => redirect()->route('instructor.dashboard'),
            'student'    => redirect()->route('student.dashboard'),
            default      => redirect('/choose-role'),
        };
    })->name('home.redirect');

    Route::get('/choose-role', [RoleController::class, 'show'])
        ->name('choose-role');

    Route::post('/choose-role', [RoleController::class, 'store']);

    Route::middleware('role:admin')->group(function () {
        Route::get('/admin/dashboard', fn () =>
            Inertia::render('admin/Dashboard')
        )->name('admin.dashboard');
    });

    Route::middleware('role:instructor')->group(function () {
        Route::get('/instructor/dashboard', fn () =>
            Inertia::render('instructor/Dashboard')
        )->name('instructor.dashboard');
    });

    Route::middleware('role:student')->group(function () {
        Route::get('/student/dashboard', fn () =>
            Inertia::render('student/Dashboard')
        )->name('student.dashboard');
    });
});
