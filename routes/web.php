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
use App\Http\Controllers\ReviewController;
use App\Http\Controllers\CommentController;
use App\Http\Controllers\Admin\GeneralSettingsController;
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

    /** @var \App\Services\ReviewService $reviewService */
    $reviewService = app(\App\Services\ReviewService::class);
    $reviewData = $reviewService->getCourseReviews($course);

    $userReview = ($user?->role === 'student')
        ? $reviewService->getUserReview($course, $user->id)
        : null;

    // Progress + review flag for the sidebar resume & review form (100% only).
    $canReview = false;
    $progressPercent = 0;
    $completedCount = 0;
    $totalMaterials = 0;
    if ($isEnrolled && $user) {
        /** @var \App\Services\EnrollmentService $enrollmentService */
        $enrollmentService = app(\App\Services\EnrollmentService::class);
        $canReview = $enrollmentService->isCompleted($user, $course);
        $course->load(['modules.materials:id,module_id']);
        $allMaterialIds = $course->modules->flatMap(fn ($m) => $m->materials->pluck('id'));
        $totalMaterials = $allMaterialIds->count();
        $completedCount = \App\Models\MaterialProgress::where('user_id', $user->id)
            ->whereIn('material_id', $allMaterialIds)
            ->where('is_completed', true)
            ->count();
        $progressPercent = $totalMaterials > 0 ? (int) round(($completedCount / $totalMaterials) * 100) : 0;
    }

    /** @var \App\Services\CommentService $commentService */
    $commentService = app(\App\Services\CommentService::class);
    $comments = $commentService->getCourseComments($course);

    return Inertia::render('course/[slug]/page', [
        'course' => $course
            ->load(['creator:id,name', 'categories:id,name', 'tags:id,name,slug'])
            ->append('thumbnail_url'),
        'isEnrolled'      => $isEnrolled,
        'canReview'       => $canReview,
        'progressPercent' => $progressPercent,
        'completedCount'  => $completedCount,
        'totalMaterials'  => $totalMaterials,
        'reviews'      => $reviewData['reviews'],
        'ratingStats'  => $reviewData['rating_stats'],
        'userReview'   => $userReview,
        'comments'     => $comments,
    ]);
})->name('course.show');

Route::get('/course/id/{course}', function (Course $course) {
    abort_unless($course->status === 'published', 404);

    return redirect()->route('course.show', ['course' => $course->slug]);
})->name('course.show-by-id');

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

    $registerCourseStructureRoutes = static function (): void {
        Route::prefix('courses/{course:slug}')
            ->middleware('can:update,course')
            ->group(function () {
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
    };

    /*
    |--------------------------------------------------------------------------
    | ADMIN
    |--------------------------------------------------------------------------
    */
    Route::middleware('role:admin')
        ->prefix('admin')
        ->name('admin.')
        ->group(function () use ($registerCourseStructureRoutes) {

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

            $registerCourseStructureRoutes();

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

            Route::get('/settings/general', [GeneralSettingsController::class, 'edit'])
                ->name('settings.general');

            Route::put('/settings/appearance', [GeneralSettingsController::class, 'updateAppearance'])
                ->name('settings.appearance.update');

            Route::post('/settings/ai/verify-password', [GeneralSettingsController::class, 'verifyPassword'])
                ->name('settings.ai.verify-password');

            Route::patch('/settings/ai/toggle', [GeneralSettingsController::class, 'toggleAi'])
                ->name('settings.ai.toggle');

            Route::patch('/settings/recommendation/toggle', [GeneralSettingsController::class, 'toggleRecommendation'])
                ->name('settings.recommendation.toggle');

            Route::put('/settings/ai', [GeneralSettingsController::class, 'updateAi'])
                ->middleware('throttle:ai-settings-update')
                ->name('settings.ai.update');
        });

    /*
    |--------------------------------------------------------------------------
    | INSTRUCTOR
    |--------------------------------------------------------------------------
    */
    Route::middleware('role:instructor')
        ->prefix('instructor')
        ->name('instructor.')
        ->group(function () use ($registerCourseStructureRoutes) {

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

            $registerCourseStructureRoutes();
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

                return Inertia::render('student/course/page', compact('courses'));
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

            /*
            |--------------------------------------------------------------------------
            | REVIEWS (Student)
            |--------------------------------------------------------------------------
            */
            Route::post('/courses/{course:slug}/reviews', [ReviewController::class, 'store'])
                ->name('reviews.store');

            Route::delete('/courses/{course:slug}/reviews/{review}', [ReviewController::class, 'destroy'])
                ->name('reviews.destroy');

            /*
            |--------------------------------------------------------------------------
            | COMMENTS / DISCUSSION (Student)
            |--------------------------------------------------------------------------
            */
            Route::post('/courses/{course:slug}/comments', [CommentController::class, 'store'])
                ->name('comments.store');

            Route::put('/courses/{course:slug}/comments/{comment}', [CommentController::class, 'update'])
                ->name('comments.update');

            Route::delete('/courses/{course:slug}/comments/{comment}', [CommentController::class, 'destroy'])
                ->name('comments.destroy');
        });
});

/*
|--------------------------------------------------------------------------
| ADMIN — Review & Comment Moderation
|--------------------------------------------------------------------------
*/
Route::middleware(['auth', 'role:admin'])
    ->prefix('admin')
    ->name('admin.')
    ->group(function () {

        Route::get('/reviews', function () {
            $reviews = app(\App\Services\ReviewService::class)->getAdminReviews();

            return \Inertia\Inertia::render('admin/reviews/page', [
                'reviews' => $reviews->map(fn ($r) => [
                    'id'          => $r->id,
                    'rating'      => $r->rating,
                    'comment'     => $r->comment,
                    'is_approved' => $r->is_approved,
                    'created_at'  => $r->created_at,
                    'user'        => ['id' => $r->user->id, 'name' => $r->user->name],
                    'course'      => ['id' => $r->course->id, 'title' => $r->course->title, 'slug' => $r->course->slug],
                ]),
            ]);
        })->name('reviews.index');

        Route::put('/reviews/{review}/approve', [ReviewController::class, 'approve'])
            ->name('reviews.approve');

        Route::put('/reviews/{review}/reject', [ReviewController::class, 'reject'])
            ->name('reviews.reject');

        Route::delete('/reviews/{review}', [ReviewController::class, 'adminDestroy'])
            ->name('reviews.destroy');

        Route::get('/comments', function () {
            $comments = app(\App\Services\CommentService::class)->getAdminComments();

            return \Inertia\Inertia::render('admin/comments/page', [
                'comments' => $comments->map(fn ($c) => [
                    'id'          => $c->id,
                    'body'        => $c->body,
                    'parent_id'   => $c->parent_id,
                    'is_approved' => $c->is_approved,
                    'created_at'  => $c->created_at,
                    'user'        => ['id' => $c->user->id, 'name' => $c->user->name],
                    'course'      => ['id' => $c->course->id, 'title' => $c->course->title, 'slug' => $c->course->slug],
                ]),
            ]);
        })->name('comments.index');

        Route::put('/comments/{comment}/approve', [CommentController::class, 'approve'])
            ->name('comments.approve');

        Route::put('/comments/{comment}/reject', [CommentController::class, 'reject'])
            ->name('comments.reject');

        Route::delete('/comments/{comment}', [CommentController::class, 'adminDestroy'])
            ->name('comments.destroy');
    });

/*
|--------------------------------------------------------------------------
| AI Chat
|--------------------------------------------------------------------------
*/
Route::middleware(['auth', 'role:student,instructor'])->group(function () {
    Route::get('/ai/chat/sessions', [\App\Http\Controllers\AI\ChatController::class, 'getSessions'])->name('ai.chat.sessions');
    Route::post('/ai/chat', [\App\Http\Controllers\AI\ChatController::class, 'store'])->name('ai.chat.store');
    Route::get('/ai/chat/{session}', [\App\Http\Controllers\AI\ChatController::class, 'show'])->name('ai.chat.show');
    Route::delete('/ai/chat/{session}', [\App\Http\Controllers\AI\ChatController::class, 'destroy'])->name('ai.chat.destroy');
    Route::get('/ai/chat/{session}/messages', [\App\Http\Controllers\AI\ChatController::class, 'messages'])->name('ai.chat.messages');
    Route::post('/ai/chat/{session}/messages', [\App\Http\Controllers\AI\ChatController::class, 'storeMessage'])
        ->name('ai.chat.storeMessage')
        ->middleware('throttle:10,1');
});
