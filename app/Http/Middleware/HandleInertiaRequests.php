<?php

namespace App\Http\Middleware;

use App\Models\AppearanceSetting;
use App\Services\AdminReviewNotificationService;
use App\Services\InstructorApprovalNotificationService;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        return [
            ...parent::share($request),
            'name' => fn () => AppearanceSetting::current()->displayName(),
            'appearance' => function () {
                $setting = AppearanceSetting::current();

                return [
                    'palette' => $setting->palette,
                    'name' => $setting->displayName(),
                    'contact_email' => $setting->contactEmail(),
                    'domain' => $setting->domain(),
                    'logo_url' => $setting->logo_url,
                    'has_custom_logo' => $setting->hasCustomLogo(),
                ];
            },
            'auth' => [
                'user' => $request->user(),
            ],
            'adminReviewNotifications' => fn () => app(AdminReviewNotificationService::class)
                ->for($request->user()),
            'instructorApprovalNotifications' => fn () => app(InstructorApprovalNotificationService::class)
                ->for($request->user()),
            'flash' => [
                'success' => fn () => $request->session()->get('success'),
                'error' => fn () => $request->session()->get('error'),
            ],
        ];
    }
}
