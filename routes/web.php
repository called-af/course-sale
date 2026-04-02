<?php

use App\Http\Controllers\AuthControllers;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\Course\CourseController;
use App\Http\Controllers\Course\MaterialContentController;
use App\Http\Controllers\Course\MaterialController;
use App\Http\Controllers\Course\ModuleController;
use App\Http\Controllers\LandingController;
use App\Http\Controllers\RoleController;
use App\Http\Controllers\UserController;
use App\Models\Course;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', [LandingController::class, 'show'])->name('home');

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
        return match (Auth::user()->role) {
            'admin' => redirect()->route('admin.dashboard'),
            'instructor' => redirect()->route('instructor.dashboard'),
            'student' => redirect()->route('student.dashboard'),
            default => redirect('/choose-role'),
        };
    })->name('home.redirect');

    Route::get('/choose-role', [RoleController::class, 'show'])->name('choose-role');
    Route::post('/choose-role', [RoleController::class, 'store']);

    /*
    |--------------------------------------------------------------------------
    | PUBLIC COURSES (CATALOG)
    |--------------------------------------------------------------------------
    */
    Route::prefix('courses')->name('courses.')->group(function () {

        Route::get('/', function () {
            return Inertia::render('course/page', [
                'courses' => Course::where('status', 'published')
                    ->latest()
                    ->get(),
            ]);
        })->name('index');

        Route::get('/{course:slug}', [CourseController::class, 'show'])
            ->name('show');
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

            Route::get('/dashboard', fn () => Inertia::render('admin/Dashboard')
            )->name('dashboard');

            Route::get('/courses', [CourseController::class, 'index'])
                ->name('courses.index');

            Route::get('/courses/{course:slug}', [CourseController::class, 'show'])
                ->name('courses.show');

            Route::post('/courses', [CourseController::class, 'store'])
                ->name('courses.store');

            Route::put('/courses/{course:slug}', [CourseController::class, 'update'])
                ->name('courses.update');

            Route::delete('/courses/{course:slug}', [CourseController::class, 'destroy'])
                ->name('courses.destroy');

            Route::prefix('courses/{course:slug}')->group(function () {

                /*
                |--------------------------------------------------------------------------
                | MODULES
                |--------------------------------------------------------------------------
                */

                Route::post('/modules', [ModuleController::class, 'store'])
                    ->name('modules.store');

                Route::get('/modules/{module}', [ModuleController::class, 'show'])
                    ->name('modules.show');

                Route::put('/modules/{module}', [ModuleController::class, 'update'])
                    ->name('modules.update');

                Route::delete('/modules/{module}', [ModuleController::class, 'destroy'])
                    ->name('modules.destroy');

                Route::put('/modules/{module}/move', [ModuleController::class, 'move']);

                /*
                |--------------------------------------------------------------------------
                | MATERIALS
                |--------------------------------------------------------------------------
                */
                Route::post('/modules/{module}/materials', [MaterialController::class, 'store'])
                    ->name('materials.store');

                Route::put('/modules/{module}/materials/{material}', [MaterialController::class, 'update'])
                    ->name('materials.update');

                Route::delete('/modules/{module}/materials/{material}', [MaterialController::class, 'destroy'])
                    ->name('materials.destroy');

                Route::post(
                    '/modules/{module}/materials/{material}/contents',
                    [MaterialContentController::class, 'store']
                )->name('contents.store');

                Route::get(
                    '/modules/{module}/materials/{material}/contents/{content}',
                    [MaterialContentController::class, 'show']
                )->name('contents.show');

                Route::put(
                    '/modules/{module}/materials/{material}/contents/{content}',
                    [MaterialContentController::class, 'update']
                )->name('contents.update');

                Route::delete(
                    '/modules/{module}/materials/{material}/contents/{content}',
                    [MaterialContentController::class, 'destroy']
                )->name('contents.destroy');

                Route::get(
                    '/modules/{module}/materials/{material}/contents/{content}/edit',
                    [MaterialContentController::class, 'edit']
                )->name('contents.edit');
            });

            Route::get('/categories', fn () => Inertia::render('admin/category/page', [
                'categories' => \App\Models\Category::latest()->get(),
            ]))->name('categories.index');

            Route::post('/categories', [CategoryController::class, 'store'])
                ->name('categories.store');

            Route::put('/categories/{category}', [CategoryController::class, 'update'])
                ->name('categories.update');

            Route::delete('/categories/{category}', [CategoryController::class, 'destroy'])
                ->name('categories.destroy');

            Route::resource('users', UserController::class)
                ->except(['create', 'edit', 'delete']);

            Route::get('/profile', [UserController::class, 'profile'])
                ->name('admin.profile');
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

            Route::get('/dashboard', fn () => Inertia::render('user/Dashboard')
            )->name('dashboard');

            Route::get('/courses', fn () => Inertia::render('user/course/page', [
                'courses' => Course::where('creator_id', Auth::id())
                    ->latest()
                    ->get(),
            ])
            )->name('courses.index');

            Route::get('/courses/{course:slug}', fn (Course $course) => Inertia::render('user/course/[slug]/page', [
                'course' => $course,
            ])
            )->name('courses.show');

            Route::post('/courses', [CourseController::class, 'store'])
                ->name('courses.store');

            Route::put('/courses/{course:slug}', [CourseController::class, 'update'])
                ->name('courses.update');
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

            Route::get('/dashboard', fn () => Inertia::render('user/Dashboard')
            )->name('dashboard');

            Route::get('/courses/{course:slug}', fn (Course $course) => Inertia::render('user/course/[slug]/page', [
                'course' => $course,
            ])
            )->name('courses.show');
        });
});
