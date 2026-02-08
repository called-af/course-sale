<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

use App\Http\Controllers\AuthControllers;
use App\Http\Controllers\RoleController;
use App\Http\Controllers\CourseControllers;

/*
|--------------------------------------------------------------------------
| PUBLIC
|--------------------------------------------------------------------------
*/
Route::get('/', function () {
    return auth()->check()
        ? redirect()->route('home.redirect')
        : Inertia::render('welcome');
})->name('home');

/*
|--------------------------------------------------------------------------
| AUTH (GUEST)
|--------------------------------------------------------------------------
*/
Route::middleware('guest')->group(function () {
    Route::get('/login', [AuthControllers::class, 'show'])->name('login');
    Route::post('/login', [AuthControllers::class, 'store']);

    Route::get('/register', [AuthControllers::class, 'showRegister']);
    Route::post('/register', [AuthControllers::class, 'register']);
});

/*
|--------------------------------------------------------------------------
| LOGOUT
|--------------------------------------------------------------------------
*/
Route::post('/logout', [AuthControllers::class, 'logout'])
    ->middleware('auth')
    ->name('logout');

/*
|--------------------------------------------------------------------------
| AUTHENTICATED (ALL ROLES)
|--------------------------------------------------------------------------
*/
Route::middleware(['auth', 'role'])->group(function () {

    /*
    |--------------------------------------------------------------------------
    | REDIRECT BY ROLE
    |--------------------------------------------------------------------------
    */
    Route::get('/home', function () {
        return match (auth()->user()->role) {
            'admin'      => redirect()->route('admin.dashboard'),
            'instructor' => redirect()->route('instructor.dashboard'),
            'student'    => redirect()->route('student.dashboard'),
            default      => redirect('/choose-role'),
        };
    })->name('home.redirect');

    /*
    |--------------------------------------------------------------------------
    | CHOOSE ROLE
    |--------------------------------------------------------------------------
    */
    Route::get('/choose-role', [RoleController::class, 'show'])->name('choose-role');
    Route::post('/choose-role', [RoleController::class, 'store']);

    /*
    |--------------------------------------------------------------------------
    | SHARED COURSE PAGES (INERTIA)
    |--------------------------------------------------------------------------
    */
    Route::prefix('courses')->name('courses.')->group(function () {
        Route::get('/', fn () =>
            Inertia::render('pages/courses/page')
        )->name('index');

        Route::get('/{course:slug}', fn (string $course) =>
            Inertia::render('pages/courses/[slug]/page', [
                'slug' => $course,
            ])
        )->name('show');
    });

    /*
    |--------------------------------------------------------------------------
    | COURSE API (CRUD)
    |--------------------------------------------------------------------------
    */
    Route::prefix('api/courses')->name('api.courses.')->group(function () {
        Route::get('/', [CourseControllers::class, 'index'])->name('index');
        Route::get('/{course:slug}', [CourseControllers::class, 'show'])->name('show');
        Route::post('/', [CourseControllers::class, 'store'])->name('store');
        Route::put('/{course:slug}', [CourseControllers::class, 'update'])->name('update');
        Route::delete('/{course:slug}', [CourseControllers::class, 'destroy'])->name('destroy');
    });

    /*
    |--------------------------------------------------------------------------
    | ADMIN
    |--------------------------------------------------------------------------
    */
    Route::middleware('role:admin')
        ->prefix('admin')
        ->name('admin.')
        ->group(function () {

            Route::get('/dashboard', fn () =>
                Inertia::render('admin/Dashboard')
            )->name('dashboard');

            Route::get('/courses', fn () =>
                Inertia::render('admin/course/page')
            )->name('courses');

            Route::get('/courses/{course:slug}', fn (string $course) =>
                Inertia::render('admin/course/[slug]/page', [
                    'slug' => $course,
                ])
            )->name('courses.show');
        });

    /*
    |--------------------------------------------------------------------------
    | INSTRUCTOR
    |--------------------------------------------------------------------------
    */
    Route::middleware('role:instructor')
        ->prefix('instructor')
        ->name('instructor.')
        ->group(function () {

            Route::get('/dashboard', fn () =>
                Inertia::render('instructor/Dashboard')
            )->name('dashboard');

            Route::get('/courses', fn () =>
                Inertia::render('instructor/course/page')
            )->name('courses');

            Route::get('/courses/{course:slug}', fn (string $course) =>
                Inertia::render('instructor/course/[slug]/page', [
                    'slug' => $course,
                ])
            )->name('courses.show');
        });

    /*
    |--------------------------------------------------------------------------
    | STUDENT
    |--------------------------------------------------------------------------
    */
    Route::middleware('role:student')
        ->prefix('student')
        ->name('student.')
        ->group(function () {

            Route::get('/dashboard', fn () =>
                Inertia::render('student/Dashboard')
            )->name('dashboard');

            Route::get('/courses/{course:slug}', fn (string $course) =>
                Inertia::render('student/course/[slug]/page', [
                    'slug' => $course,
                ])
            )->name('courses.show');
        });
});
