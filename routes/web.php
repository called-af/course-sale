<?php

use App\Http\Controllers\Admin\AiIntegrationController;
use App\Http\Controllers\Admin\CourseApprovalController;
use App\Http\Controllers\Admin\ExportController;
use App\Http\Controllers\Admin\GeneralSettingsController;
use App\Http\Controllers\Admin\LandingSettingsController;
use App\Http\Controllers\Admin\OrderController;
use App\Http\Controllers\Admin\PayoutController;
use App\Http\Controllers\Admin\SeoSettingsController;
use App\Http\Controllers\Admin\WhatsAppIntegrationController;
use App\Http\Controllers\AuthControllers;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\CertificateController;
use App\Http\Controllers\CertificateTemplateController;
use App\Http\Controllers\CommentController;
use App\Http\Controllers\Course\CourseController;
use App\Http\Controllers\Course\CourseResourceController;
use App\Http\Controllers\Course\CourseStudentsExportController;
use App\Http\Controllers\Course\MaterialContentController;
use App\Http\Controllers\Course\MaterialController;
use App\Http\Controllers\Course\ModuleController;
use App\Http\Controllers\Course\QuizController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\EnrollmentController;
use App\Http\Controllers\Instructor\InstructorProfileController;
use App\Http\Controllers\Instructor\InstructorSettingsController;
use App\Http\Controllers\LandingController;
use App\Http\Controllers\Legal\LegalController;
use App\Http\Controllers\Payment\CheckoutController;
use App\Http\Controllers\Payment\PaymentController;
use App\Http\Controllers\Payment\PaymentWebhookController;
use App\Http\Controllers\QuizGradingController;
use App\Http\Controllers\RecommendationController;
use App\Http\Controllers\ReviewController;
use App\Http\Controllers\RoleController;
use App\Http\Controllers\Student\CourseResourceContentDownloadController;
use App\Http\Controllers\Student\CourseResourceDownloadController;
use App\Http\Controllers\Student\StudentProfileController;
use App\Http\Controllers\TagController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\Webhooks\WhatsAppWebhookController;
use App\Models\Course;
use App\Services\EventTrackingService;
use App\Services\Payment\PaymentService;
use App\Services\Payment\PaymentSettings;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

/*
|--------------------------------------------------------------------------
| STATIC / MARKETING PAGES
|--------------------------------------------------------------------------
*/
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
    $totalContents = 0;
    $refundPolicy = null;
    if ($isEnrolled && $user) {
        /** @var \App\Services\EnrollmentService $enrollmentService */
        $enrollmentService = app(\App\Services\EnrollmentService::class);
        $canReview = $enrollmentService->isCompleted($user, $course);
        $refundPolicy = $enrollmentService->refundPolicy($user, $course);

        // Track progress per published content block so a watched video, opened
        // file, read text or submitted quiz immediately reflects on the progress bar.
        $course->load([
            'modules' => fn ($modules) => $modules
                ->where('status', 'published')
                ->orderBy('sort_order')
                ->with([
                    'materials' => fn ($materials) => $materials
                        ->where('status', 'published')
                        ->orderBy('sort_order')
                        ->with([
                            'contents' => fn ($contents) => $contents
                                ->where('status', 'published')
                                ->orderBy('sort_order'),
                        ]),
                ]),
        ]);

        $allContentIds = $course->modules
            ->flatMap(fn ($module) => $module->materials)
            ->flatMap(fn ($material) => $material->contents)
            ->pluck('id');

        $totalContents = $allContentIds->count();

        $contentProgress = \App\Models\MaterialContentProgress::where('user_id', $user->id)
            ->whereIn('material_content_id', $allContentIds)
            ->where('is_completed', true)
            ->pluck('is_completed', 'material_content_id');

        $completedCount = $contentProgress->count();
        $progressPercent = $totalContents > 0 ? (int) round(($completedCount / $totalContents) * 100) : 0;
    }

    /** @var \App\Services\CommentService $commentService */
    $commentService = app(\App\Services\CommentService::class);
    $comments = $commentService->getCourseComments($course);

    // Checkout data powers the "Buy Course" modal, so students can pay
    // without leaving the course page.
    $paymentMethods = [];
    $paymentGateway = null;

    if ($user?->role === 'student' && $course->isPaid()) {
        $paymentMethods = app(PaymentService::class)->availableMethods();
        $settings = app(PaymentSettings::class)->current();

        $paymentGateway = [
            'name' => $settings->gateway,
            'midtrans_enabled' => filled(config('services.payment.midtrans.server_key')),
            'is_production' => (bool) config('services.payment.midtrans.is_production', false),
        ];
    }

    return Inertia::render('course/[slug]/page', [
        'course' => $course
            ->load(['creator:id,name', 'categories:id,name', 'tags:id,name,slug'])
            ->append('thumbnail_url'),
        'isEnrolled' => $isEnrolled,
        'canReview' => $canReview,
        'progressPercent' => $progressPercent,
        'completedCount' => $completedCount,
        'totalContents' => $totalContents,
        'refundPolicy' => $refundPolicy,
        'reviews' => $reviewData['reviews'],
        'ratingStats' => $reviewData['rating_stats'],
        'userReview' => $userReview,
        'comments' => $comments,
        'paymentMethods' => $paymentMethods,
        'paymentGateway' => $paymentGateway,
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
    Route::post('/login', [AuthControllers::class, 'store'])->middleware('throttle:6,1');

    Route::get('/register', [AuthControllers::class, 'showRegister']);
    Route::post('/register', [AuthControllers::class, 'register'])->middleware('throttle:6,1');

    Route::get('/auth/google/redirect', [AuthControllers::class, 'redirectToGoogle'])->name('auth.google.redirect');
    Route::get('/auth/google/callback', [AuthControllers::class, 'handleGoogleCallback'])->name('auth.google.callback');
});

Route::post('/logout', [AuthControllers::class, 'logout'])
    ->middleware('auth')
    ->name('logout');

/*
|--------------------------------------------------------------------------
| AUTH — PASSWORD RESET & EMAIL VERIFICATION
|--------------------------------------------------------------------------
*/
Route::get('/forgot-password', [AuthControllers::class, 'showForgotPassword'])->name('auth.forgot-password');
Route::post('/forgot-password', [AuthControllers::class, 'forgotPassword'])->middleware('throttle:6,1');

Route::get('/reset-password/{token}', [AuthControllers::class, 'showResetPassword'])->name('auth.reset-password');
Route::post('/reset-password', [AuthControllers::class, 'resetPassword']);

Route::get('/verify-email/{id}/{hash}', [AuthControllers::class, 'verifyEmail'])->name('auth.verify-email');
Route::post('/email/resend', [AuthControllers::class, 'resendVerificationEmail'])->middleware('auth');

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

                /*
                |--------------------------------------------------------------------------
                | COURSE RESOURCES (unlocked after all materials are completed)
                |--------------------------------------------------------------------------
                */
                Route::post('/resources', [CourseResourceController::class, 'store'])
                    ->name('resources.store');

                Route::put('/resources/{resource}', [CourseResourceController::class, 'update'])
                    ->name('resources.update');

                Route::delete('/resources/{resource}', [CourseResourceController::class, 'destroy'])
                    ->name('resources.destroy');

                /*
                |--------------------------------------------------------------------------
                | STUDENT EXPORT
                |--------------------------------------------------------------------------
                */
                Route::get('/students/export', CourseStudentsExportController::class)
                    ->name('students.export');
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

            Route::get('/orders', [OrderController::class, 'index'])->name('orders.index');
            Route::get('/orders/export', [ExportController::class, 'orders'])->name('orders.export');
            Route::get('/orders/{order}', [OrderController::class, 'show'])->name('orders.show');
            Route::put('/orders/{order}/pay', [OrderController::class, 'markPaid'])->name('orders.pay');
            Route::post('/orders/{order}/refund', [OrderController::class, 'refund'])->name('orders.refund');

            Route::get('/payouts', [PayoutController::class, 'index'])->name('payouts.index');
            Route::get('/payouts/export', [PayoutController::class, 'exportCsv'])->name('payouts.export');
            Route::put('/payouts/batch', [PayoutController::class, 'markBatchPaid'])->name('payouts.batch.pay');
            Route::put('/payouts/{payout}/pay', [PayoutController::class, 'markPaid'])->name('payouts.pay');

            Route::get('/landing', [LandingController::class, 'show'])->name('landing');

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

            Route::get('/certificate-template', [CertificateTemplateController::class, 'globalShow'])
                ->name('certificate-template.show');

            Route::put('/certificate-template', [CertificateTemplateController::class, 'globalUpdate'])
                ->name('certificate-template.update');

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

            Route::get('/users/export', [ExportController::class, 'users'])->name('users.export');

            Route::resource('users', UserController::class)
                ->except(['create', 'edit', 'delete']);

            Route::get('/profile', [UserController::class, 'profile'])
                ->name('admin.profile');

            Route::get('/quiz-attempts', [QuizGradingController::class, 'index'])
                ->name('quiz-attempts.index');
            Route::put('/quiz-attempts/{attempt}/grade', [QuizGradingController::class, 'grade'])
                ->name('quiz-attempts.grade');

            Route::get('/settings/general', [GeneralSettingsController::class, 'edit'])
                ->name('settings.general');

            Route::get('/settings/seo', [SeoSettingsController::class, 'edit'])
                ->name('settings.seo');

            Route::post('/settings/seo', [SeoSettingsController::class, 'update'])
                ->name('settings.seo.update');

            Route::put('/settings/appearance', [GeneralSettingsController::class, 'updateAppearance'])
                ->name('settings.appearance.update');

            Route::put('/settings/identity', [GeneralSettingsController::class, 'updateIdentity'])
                ->name('settings.identity.update');

            Route::get('/settings/landing', fn () => redirect()->route('admin.settings.landing.edit', 'hero'))
                ->name('settings.landing');

            Route::get('/settings/landing/{section}', [LandingSettingsController::class, 'edit'])
                ->name('settings.landing.edit');

            Route::put('/settings/landing/{section}', [LandingSettingsController::class, 'update'])
                ->name('settings.landing.update');

            Route::post('/settings/logo', [GeneralSettingsController::class, 'updateLogo'])
                ->name('settings.logo.update');

            Route::delete('/settings/logo', [GeneralSettingsController::class, 'destroyLogo'])
                ->name('settings.logo.destroy');

            Route::post('/settings/ai/verify-password', [GeneralSettingsController::class, 'verifyPassword'])
                ->name('settings.ai.verify-password');

            Route::patch('/settings/ai/toggle', [GeneralSettingsController::class, 'toggleAi'])
                ->name('settings.ai.toggle');

            Route::patch('/settings/recommendation/toggle', [GeneralSettingsController::class, 'toggleRecommendation'])
                ->name('settings.recommendation.toggle');

            Route::patch('/settings/whatsapp/toggle', [GeneralSettingsController::class, 'toggleWhatsapp'])
                ->name('settings.whatsapp.toggle');

            Route::put('/settings/whatsapp', [GeneralSettingsController::class, 'updateWhatsapp'])
                ->name('settings.whatsapp.update');

            Route::post('/settings/whatsapp/test', [GeneralSettingsController::class, 'testWhatsapp'])
                ->name('settings.whatsapp.test');

            Route::put('/settings/ai', [GeneralSettingsController::class, 'updateAi'])
                ->middleware('throttle:ai-settings-update')
                ->name('settings.ai.update');

            Route::get('/settings/payment', [GeneralSettingsController::class, 'editPayment'])
                ->name('settings.payment');

            Route::put('/settings/payment', [GeneralSettingsController::class, 'updatePayment'])
                ->name('settings.payment.update');

            /*
            |--------------------------------------------------------------------------
            | INTEGRATIONS
            |--------------------------------------------------------------------------
            */
            Route::prefix('integrations')->name('integrations.')->group(function () {
                Route::get('/ai', [AiIntegrationController::class, 'index'])->name('ai.index');
                Route::post('/ai/providers', [AiIntegrationController::class, 'store'])->name('ai.store');
                Route::put('/ai/providers/{provider}', [AiIntegrationController::class, 'update'])->name('ai.update');
                Route::delete('/ai/providers/{provider}', [AiIntegrationController::class, 'destroy'])->name('ai.destroy');
                Route::patch('/ai/providers/{provider}/toggle', [AiIntegrationController::class, 'toggle'])->name('ai.toggle');
                Route::put('/ai/providers/{provider}/default', [AiIntegrationController::class, 'setDefault'])->name('ai.default');
                Route::post('/ai/providers/{provider}/test', [AiIntegrationController::class, 'test'])
                    ->middleware('throttle:10,1')
                    ->name('ai.test');
                Route::post('/ai/providers/{provider}/models/discover', [AiIntegrationController::class, 'discoverModels'])
                    ->middleware('throttle:10,1')
                    ->name('ai.models.discover');
                Route::post('/ai/providers/{provider}/models', [AiIntegrationController::class, 'storeModel'])->name('ai.models.store');
                Route::put('/ai/providers/{provider}/models/{model}', [AiIntegrationController::class, 'updateModel'])->name('ai.models.update');
                Route::delete('/ai/providers/{provider}/models/{model}', [AiIntegrationController::class, 'destroyModel'])->name('ai.models.destroy');
                Route::post('/ai/import-legacy', [AiIntegrationController::class, 'importLegacy'])->name('ai.import-legacy');
                Route::patch('/ai/global', [AiIntegrationController::class, 'toggleGlobal'])->name('ai.global');
                Route::patch('/ai/recommendation', [GeneralSettingsController::class, 'toggleRecommendation'])->name('ai.recommendation');

                Route::get('/whatsapp', [WhatsAppIntegrationController::class, 'index'])->name('whatsapp.index');
                Route::post('/whatsapp/providers', [WhatsAppIntegrationController::class, 'store'])->name('whatsapp.store');
                Route::put('/whatsapp/providers/{provider}', [WhatsAppIntegrationController::class, 'update'])->name('whatsapp.update');
                Route::delete('/whatsapp/providers/{provider}', [WhatsAppIntegrationController::class, 'destroy'])->name('whatsapp.destroy');
                Route::patch('/whatsapp/providers/{provider}/toggle', [WhatsAppIntegrationController::class, 'toggle'])->name('whatsapp.toggle');
                Route::put('/whatsapp/providers/{provider}/default', [WhatsAppIntegrationController::class, 'setDefault'])->name('whatsapp.default');
                Route::post('/whatsapp/providers/{provider}/test', [WhatsAppIntegrationController::class, 'test'])
                    ->middleware('throttle:10,1')
                    ->name('whatsapp.test');
                Route::post('/whatsapp/providers/{provider}/messages/{message}/status', [WhatsAppIntegrationController::class, 'messageStatus'])->name('whatsapp.messages.status');
                Route::post('/whatsapp/providers/{provider}/templates', [WhatsAppIntegrationController::class, 'storeTemplate'])->name('whatsapp.templates.store');
                Route::delete('/whatsapp/providers/{provider}/templates/{template}', [WhatsAppIntegrationController::class, 'destroyTemplate'])->name('whatsapp.templates.destroy');
                Route::post('/whatsapp/send-test', [WhatsAppIntegrationController::class, 'sendTest'])
                    ->middleware('throttle:10,1')
                    ->name('whatsapp.send-test');
                Route::post('/whatsapp/import-legacy', [WhatsAppIntegrationController::class, 'importLegacy'])->name('whatsapp.import-legacy');
                Route::patch('/whatsapp/global', [WhatsAppIntegrationController::class, 'toggleGlobal'])->name('whatsapp.global');
            });
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

            Route::put('/courses/{course:slug}/certificate-template/signature', [CertificateTemplateController::class, 'updateSignature'])
                ->name('courses.certificate-template.signature');

            Route::get('/quiz-attempts', [QuizGradingController::class, 'index'])
                ->name('quiz-attempts.index');
            Route::put('/quiz-attempts/{attempt}/grade', [QuizGradingController::class, 'grade'])
                ->name('quiz-attempts.grade');

            Route::get('/profile', [InstructorProfileController::class, 'edit'])->name('profile');
            Route::put('/profile', [InstructorProfileController::class, 'update'])->name('profile.update');

            Route::get('/settings', [InstructorSettingsController::class, 'edit'])->name('settings');
            Route::get('/settings/general', [InstructorSettingsController::class, 'edit'])->name('settings.general');
            Route::get('/settings/profile', fn () => redirect()->route('instructor.profile'))->name('settings.profile');
            Route::put('/settings/whatsapp', [InstructorSettingsController::class, 'updateWhatsApp'])->name('settings.whatsapp.update');
            Route::put('/settings/payout', [InstructorSettingsController::class, 'updatePayout'])->name('settings.payout.update');
            Route::post('/settings/whatsapp/test', [InstructorSettingsController::class, 'testWhatsApp'])
                ->middleware('throttle:5,1')
                ->name('settings.whatsapp.test');

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

            Route::get('/profile', [StudentProfileController::class, 'edit'])->name('profile');
            Route::put('/profile', [StudentProfileController::class, 'update'])->name('profile.update');
            Route::get('/settings', [StudentProfileController::class, 'settings'])->name('settings');
            Route::put('/settings/whatsapp', [StudentProfileController::class, 'updateWhatsApp'])->name('settings.whatsapp.update');

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

            Route::get('/courses/{course:slug}/checkout', [CheckoutController::class, 'index'])->name('course.checkout');
            Route::post('/courses/{course:slug}/checkout', [CheckoutController::class, 'store']);

            Route::get('/courses/{course:slug}/resources/{resource}', CourseResourceDownloadController::class)
                ->name('courses.resources.download');

            Route::get('/courses/{course:slug}/resources/contents/{content}', CourseResourceContentDownloadController::class)
                ->name('courses.resources.content.download');

            Route::get('/orders/{order:order_number}', [PaymentController::class, 'show'])->name('payment.show');
            Route::post('/courses/{course:slug}/contents/{content}/complete', [EnrollmentController::class, 'markContentProgress'])
                ->name('courses.contents.complete');

            Route::post('/courses/{course:slug}/quiz/{content}/start', [EnrollmentController::class, 'startQuiz'])
                ->name('courses.quiz.start');

            Route::post('/courses/{course:slug}/quiz/{content}/draft', [EnrollmentController::class, 'saveQuizDraft'])
                ->name('courses.quiz.draft');

            Route::post('/courses/{course:slug}/quiz/{content}/reset', [EnrollmentController::class, 'resetQuiz'])
                ->name('courses.quiz.reset');

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
                    'id' => $r->id,
                    'rating' => $r->rating,
                    'comment' => $r->comment,
                    'is_approved' => $r->is_approved,
                    'created_at' => $r->created_at,
                    'user' => ['id' => $r->user?->id, 'name' => $r->user?->name ?? 'Deleted user'],
                    'course' => [
                        'id' => $r->course?->id,
                        'title' => $r->course?->title ?? 'Deleted course',
                        'slug' => $r->course?->slug,
                    ],
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
                    'id' => $c->id,
                    'body' => $c->body,
                    'parent_id' => $c->parent_id,
                    'is_approved' => $c->is_approved,
                    'created_at' => $c->created_at,
                    'user' => ['id' => $c->user?->id, 'name' => $c->user?->name ?? 'Deleted user'],
                    'course' => [
                        'id' => $c->course?->id,
                        'title' => $c->course?->title ?? 'Deleted course',
                        'slug' => $c->course?->slug,
                    ],
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
| Payment webhooks (unauthenticated, signature verified)
|--------------------------------------------------------------------------
*/
Route::post('/payments/midtrans/webhook', [PaymentWebhookController::class, 'midtrans'])
    ->middleware('throttle:payment-webhooks')
    ->name('payment.webhook.midtrans');

/*
|--------------------------------------------------------------------------
| WhatsApp provider webhooks (unauthenticated, signature verified)
|--------------------------------------------------------------------------
*/
Route::get('/webhooks/whatsapp/{provider}', [WhatsAppWebhookController::class, 'verify'])
    ->name('webhooks.whatsapp.verify');

Route::post('/webhooks/whatsapp/{provider}', [WhatsAppWebhookController::class, 'handle'])
    ->middleware('throttle:whatsapp-webhooks')
    ->name('webhooks.whatsapp');

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

/*
|--------------------------------------------------------------------------
| LEGAL PAGES
|--------------------------------------------------------------------------
*/
Route::get('/terms', [LegalController::class, 'terms'])->name('legal.terms');
Route::get('/privacy', [LegalController::class, 'privacy'])->name('legal.privacy');
