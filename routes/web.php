<?php

use App\Http\Controllers\AuthControllers;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\CertificateController;
use App\Http\Controllers\CertificateTemplateController;
use App\Http\Controllers\Course\CourseController;
use App\Http\Controllers\Course\MaterialContentController;
use App\Http\Controllers\Course\MaterialController;
use App\Http\Controllers\Course\ModuleController;
use App\Http\Controllers\EnrollmentController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\LandingController;
use App\Http\Controllers\RoleController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\Course\QuizController;
use App\Http\Controllers\Admin\CourseApprovalController;
use App\Http\Controllers\RecommendationController;
use App\Http\Controllers\TagController;
use App\Services\EventTrackingService;
use App\Models\Course;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', [LandingController::class, 'show'])->name('home');
Route::get('/certificate/{certificateNumber}', [CertificateController::class, 'verify'])->name('certificate.verify');
Route::get('/courses/recommended', [RecommendationController::class, 'index'])->name('courses.recommended');
Route::get('/course', function () {
    $user = Auth::user();
    $recommended = app(\App\Services\RecommendationService::class)->getRecommendations($user, 4);

    return Inertia::render('course/page', [
        'courses' => Course::where('status', 'published')
            ->with(['creator:id,name', 'categories:id,name', 'tags:id,name,slug'])
            ->latest()
            ->get()
            ->append('thumbnail_url'),
        'recommendedCourses' => $recommended,
    ]);
})->name('course.index');

Route::get('/course/{course:slug}', function (Course $course) {
    abort_unless($course->status === 'published', 404);

    $user = Auth::user();
    if ($user) {
        app(EventTrackingService::class)->trackCourseView($user, $course);
    }

    $isEnrolled = $user?->role === 'student'
        && $course->enrollments()
            ->where('user_id', $user->id)
            ->where('status', 'active')
            ->exists();

    return Inertia::render('course/[slug]/page', [
        'course' => $course
            ->load(['creator:id,name', 'categories:id,name', 'tags:id,name,slug'])
            ->append('thumbnail_url'),
        'isEnrolled' => $isEnrolled,
    ]);
})->name('course.show');

Route::post('/course/{course:slug}/enroll', [EnrollmentController::class, 'store'])
    ->middleware(['auth', 'role:student'])
    ->name('course.enroll');

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
            $user = Auth::user();
            $recommended = app(\App\Services\RecommendationService::class)->getRecommendations($user, 4);

            return Inertia::render('course/page', [
                'courses' => Course::where('status', 'published')
                    ->with(['creator:id,name', 'categories:id,name', 'tags:id,name,slug'])
                    ->latest()
                    ->get()
                    ->append('thumbnail_url'),
                'recommendedCourses' => $recommended,
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

            Route::get('/dashboard', [DashboardController::class, 'admin'])->name('dashboard');

            Route::get('/courses', [CourseController::class, 'index'])
                ->name('courses.index');

            Route::get('/courses/{course:slug}', [CourseController::class, 'show'])
                ->name('courses.show');

            Route::get('/courses/{course:slug}/preview', [CourseController::class, 'preview'])
                ->name('courses.preview');

            Route::post('/courses', [CourseController::class, 'store'])
                ->name('courses.store');

            Route::put('/courses/{course:slug}', [CourseController::class, 'update'])
                ->name('courses.update');

            Route::put('/courses/{course:slug}/approve', [CourseApprovalController::class, 'approve'])
                ->name('courses.approve');

            Route::delete('/courses/{course:slug}', [CourseController::class, 'destroy'])
                ->name('courses.destroy');

            Route::get('/courses/{course:slug}/certificate-template', [CertificateTemplateController::class, 'show'])
                ->name('courses.certificate-template.show');

            Route::put('/courses/{course:slug}/certificate-template', [CertificateTemplateController::class, 'update'])
                ->name('courses.certificate-template.update');

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

                Route::put('/modules/{module}/materials/{material}/move', [MaterialController::class, 'move']);

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

                Route::put(
                    '/modules/{module}/materials/{material}/contents/{content}/move',
                    [MaterialContentController::class, 'move']
                )->name('contents.move');

                Route::get(
                    '/modules/{module}/materials/{material}/contents/{content}/edit',
                    [MaterialContentController::class, 'edit']
                )->name('contents.edit');

                // Keep this after the existing contents.move route.

                /*
                |--------------------------------------------------------------------------
                | QUIZ QUESTIONS (nested under content)
                |--------------------------------------------------------------------------
                */
                Route::get(
                    '/modules/{module}/materials/{material}/contents/{content}/quiz-questions',
                    [QuizController::class, 'index']
                )->name('contents.quiz.index');

                Route::post(
                    '/modules/{module}/materials/{material}/contents/{content}/quiz-questions',
                    [QuizController::class, 'store']
                )->name('contents.quiz.store');

                Route::put(
                    '/modules/{module}/materials/{material}/contents/{content}/quiz-questions',
                    [QuizController::class, 'update']
                )->name('contents.quiz.update');

                Route::delete(
                    '/modules/{module}/materials/{material}/contents/{content}/quiz-questions/{quizQuestion}',
                    [QuizController::class, 'destroy']
                )->name('contents.quiz.destroy');
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

            Route::get('/tags', [TagController::class, 'index'])
                ->name('tags.index');

            Route::post('/tags', [TagController::class, 'store'])
                ->name('tags.store');

            Route::put('/tags/{tag}', [TagController::class, 'update'])
                ->name('tags.update');

            Route::delete('/tags/{tag}', [TagController::class, 'destroy'])
                ->name('tags.destroy');

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

            Route::get('/dashboard', [DashboardController::class, 'instructor'])->name('dashboard');

            Route::get('/courses', [CourseController::class, 'index'])
                ->name('courses.index');

            Route::get('/courses/{course:slug}', [CourseController::class, 'show'])
                ->name('courses.show');

            Route::get('/courses/{course:slug}/preview', [CourseController::class, 'preview'])
                ->name('courses.preview');

            Route::post('/courses', [CourseController::class, 'store'])
                ->name('courses.store');

            Route::put('/courses/{course:slug}', [CourseController::class, 'update'])
                ->name('courses.update');

            Route::put('/courses/{course:slug}/submit-review', [CourseController::class, 'submitForReview'])
                ->name('courses.submit-review');

            Route::delete('/courses/{course:slug}', [CourseController::class, 'destroy'])
                ->name('courses.destroy');

            Route::get('/courses/{course:slug}/certificate-template', [CertificateTemplateController::class, 'show'])
                ->name('courses.certificate-template.show');

            Route::put('/courses/{course:slug}/certificate-template', [CertificateTemplateController::class, 'update'])
                ->name('courses.certificate-template.update');
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

            Route::get('/dashboard', [DashboardController::class, 'student'])->name('dashboard');

            Route::get('/courses', function () {
                $courses = Course::query()
                    ->whereHas('enrollments', fn ($query) => $query
                        ->where('user_id', Auth::id())
                        ->where('status', 'active'))
                    ->with(['creator:id,name', 'categories:id,name'])
                    ->latest()
                    ->get()
                    ->append('thumbnail_url');

                return Inertia::render('user/course/page', compact('courses'));
            })->name('courses.index');

            Route::get('/courses/{course:slug}', [EnrollmentController::class, 'show'])
                ->name('courses.show');

            Route::post('/courses/{course:slug}/progress', [EnrollmentController::class, 'markProgress'])
                ->name('courses.progress.store');

            Route::post('/courses/{course:slug}/quiz/{content}/submit', [EnrollmentController::class, 'submitQuiz'])
                ->name('courses.quiz.submit');

            Route::get('/certificates', [CertificateController::class, 'index'])
                ->name('certificates.index');

            Route::get('/certificates/{certificate}/download', [CertificateController::class, 'download'])
                ->name('certificates.download');
        });
});
