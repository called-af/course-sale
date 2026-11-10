<?php

namespace App\Providers;

use App\Models\Category;
use App\Models\Course;
use App\Models\Material;
use App\Models\MaterialContent;
use App\Models\Module;
use App\Models\User;
use App\Policies\CategoryPolicy;
use App\Policies\CoursePolicy;
use App\Policies\MaterialContentPolicy;
use App\Policies\MaterialPolicy;
use App\Policies\ModulePolicy;
use App\Policies\UserPolicy;
use App\Services\CourseStructureService;
use Carbon\CarbonImmutable;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Auth\Notifications\VerifyEmail;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Date;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;
use Illuminate\Validation\Rules\Password;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->scoped(CourseStructureService::class);
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        $this->configureDefaults();

        Gate::policy(Category::class, CategoryPolicy::class);
        Gate::policy(Course::class, CoursePolicy::class);
        Gate::policy(Module::class, ModulePolicy::class);
        Gate::policy(Material::class, MaterialPolicy::class);
        Gate::policy(MaterialContent::class, MaterialContentPolicy::class);
        Gate::policy(User::class, UserPolicy::class);

        Gate::define('manage-settings', fn ($user = null) => (bool) $user?->hasRole('admin'));

        RateLimiter::for('ai-settings-update', function (Request $request) {
            return Limit::perMinute(5)->by($request->user()?->id ?: $request->ip());
        });

        // Laravel's built-in notifications expect the conventional
        // `password.reset` / `verification.verify` route names. This app uses
        // its own names, so point the notifications at the real routes.
        ResetPassword::createUrlUsing(fn ($notifiable, string $token) => route('auth.reset-password', [
            'token' => $token,
            'email' => $notifiable->getEmailForPasswordReset(),
        ]));

        VerifyEmail::createUrlUsing(fn ($notifiable) => route('auth.verify-email', [
            'id' => $notifiable->getKey(),
            'hash' => sha1($notifiable->getEmailForVerification()),
        ]));
    }

    protected function configureDefaults(): void
    {
        Date::use(CarbonImmutable::class);

        DB::prohibitDestructiveCommands(
            app()->isProduction(),
        );

        Password::defaults(fn (): ?Password => app()->isProduction()
            ? Password::min(12)
                ->mixedCase()
                ->letters()
                ->numbers()
                ->symbols()
                ->uncompromised()
            : null
        );
    }
}
