<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

use App\Http\Controllers\AuthControllers;
use App\Http\Controllers\RoleController;
use App\Http\Controllers\Course\CourseController;
use App\Models\Course;

Route::get('/', function () {
    return auth()->check()
        ? redirect()->route('home.redirect')
        : Inertia::render('welcome');
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

    Route::get('/choose-role', [RoleController::class, 'show'])->name('choose-role');
    Route::post('/choose-role', [RoleController::class, 'store']);

    Route::prefix('courses')->name('courses.')->group(function () {
        Route::get(
            '/',
            fn() =>
            Inertia::render('pages/courses/page')
        )->name('index');

        Route::get('/{course:slug}', [CourseController::class, 'show'])
            ->name('show');
    });

    Route::middleware('role:admin')
        ->prefix('admin')
        ->name('admin.')
        ->group(function () {

            Route::get(
                '/dashboard',
                fn() =>
                Inertia::render('admin/Dashboard')
            )->name('dashboard');

            Route::get(
                '/courses',
                fn() =>
                Inertia::render('admin/course/page')
            )->name('courses.index');

            Route::get(
                '/courses/{course:slug}',
                fn(Course $course) =>
                Inertia::render('admin/course/[slug]/page', [
                    'course' => $course,
                ])
            )->name('courses.show');

            Route::post('/courses', [CourseController::class, 'store'])
                ->name('courses.store');

            Route::put('/courses/{course:slug}', [CourseController::class, 'update'])
                ->name('courses.update');

            Route::delete('/courses/{course:slug}', [CourseController::class, 'destroy'])
                ->name('courses.destroy');
        });


    Route::middleware('role:instructor')
        ->prefix('instructor')
        ->name('instructor.')
        ->group(function () {

            Route::get(
                '/dashboard',
                fn() =>
                Inertia::render('instructor/Dashboard')
            )->name('dashboard');

            Route::get(
                '/courses',
                fn() =>
                Inertia::render('instructor/course/page')
            )->name('courses.index');

            Route::get(
                '/courses/{course:slug}',
                fn($course) =>
                Inertia::render('instructor/course/[slug]/page', [
                    'slug' => $course,
                ])
            )->name('courses.show');

            Route::post('/courses', [CourseController::class, 'store'])
                ->name('courses.store');

            Route::put('/courses/{course}', [CourseController::class, 'update'])
                ->name('courses.update');
        });


    Route::middleware('role:student')
        ->prefix('student')
        ->name('student.')
        ->group(function () {

            Route::get(
                '/dashboard',
                fn() =>
                Inertia::render('student/Dashboard')
            )->name('dashboard');

            Route::get(
                '/courses/{course:slug}',
                fn($course) =>
                Inertia::render('student/course/[slug]/page', [
                    'slug' => $course,
                ])
            )->name('courses.show');
        });
});
