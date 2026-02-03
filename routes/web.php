<?php

use App\Http\Controllers\AuthControllers;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/login', [AuthControllers::class, 'show'])->name('login');
Route::post('/login', [AuthControllers::class, 'store'])->name('login.store');
Route::post('/logout', [AuthControllers::class, 'logout'])->name('logout');

/* DEFAULT REDIRECT SETELAH LOGIN */
Route::middleware(['auth'])->get('/', function () {
    return match (auth()->user()->role) {
        'admin'      => redirect()->route('admin.dashboard'),
        'instructor' => redirect()->route('instructor.dashboard'),
        'student'    => redirect()->route('student.dashboard'),
        default      => abort(403),
    };
});

/* ADMIN */
Route::middleware(['auth', 'role:admin'])->group(function () {
    Route::get('/admin/dashboard', fn () =>
        Inertia::render('admin/Dashboard')
    )->name('admin.dashboard');
});

/* INSTRUCTOR */
Route::middleware(['auth', 'role:instructor'])->group(function () {
    Route::get('/instructor/dashboard', fn () =>
        Inertia::render('instructor/Dashboard')
    )->name('instructor.dashboard');
});

/* STUDENT */
Route::middleware(['auth', 'role:student'])->group(function () {
    Route::get('/student/dashboard', fn () =>
        Inertia::render('student/Dashboard')
    )->name('student.dashboard');
});
