<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Laravel\Socialite\Facades\Socialite;
use Throwable;

class AuthControllers extends Controller
{
    public function show()
    {
        return Inertia::render('auth/login');
    }

    public function showRegister()
    {
        return Inertia::render('auth/register');
    }

    public function showForgotPassword()
    {
        return Inertia::render('auth/forgot-password');
    }

    public function forgotPassword(Request $request)
    {
        $validated = $request->validate([
            'email' => ['required', 'email'],
        ]);

        $status = Password::sendResetLink($request->only('email'));

        if ($status === Password::RESET_LINK_SENT) {
            return back()->with('success', 'A password reset link has been sent to your email.');
        }

        return back()->withErrors(['email' => 'No account was found with that email address.'])
            ->with('error', 'No account was found with that email address.');
    }

    public function showResetPassword(Request $request, ?string $token = null)
    {
        return Inertia::render('auth/reset-password', [
            'token' => $token,
            'email' => $request->query('email'),
        ]);
    }

    public function resetPassword(Request $request)
    {
        $validated = $request->validate([
            'token' => ['required', 'string'],
            'email' => ['required', 'email'],
            'password' => ['required', 'confirmed', 'min:8'],
        ]);

        $status = Password::reset(
            $request->only('email', 'password', 'password_confirmation', 'token'),
            function ($user, string $password) {
                $user->forceFill([
                    'password' => bcrypt($password),
                    'remember_token' => Str::random(60),
                ])->save();

                $user->email_verified_at = $user->email_verified_at ?: now();

                $user->save();

                event(new \Illuminate\Auth\Events\PasswordReset($user, $user->email, 'users'));
            }
        );

        if ($status === Password::PASSWORD_RESET) {
            return redirect()
                ->route('login')
                ->with('success', 'Your password has been reset. Please sign in again.');
        }

        return back()
            ->withErrors(['email' => __($status->getMessage())])
            ->with('error', __($status->getMessage()));
    }

    public function verifyEmail(Request $request, string $id, string $hash): RedirectResponse
    {
        $user = User::find((int) $id);

        if (
            ! $user
            || ! hash_equals(sha1($user->getEmailForVerification()), (string) $hash)
        ) {
            return redirect()->route('login')->with('error', 'The verification link is invalid.');
        }

        if (! $user->hasVerifiedEmail()) {
            $user->markEmailAsVerified();
        }

        return redirect()
            ->route('login')
            ->with('success', 'Your email has been verified.');
    }

    public function resendVerificationEmail(Request $request): RedirectResponse
    {
        $user = $request->user();

        if ($user->hasVerifiedEmail()) {
            return back()->with('success', 'Your email is already verified.');
        }

        $user->sendEmailVerificationNotification();

        return back()->with('success', 'A verification email has been sent.');
    }

    public function store(Request $request)
    {
        $credentials = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required'],
        ]);

        if (! Auth::attempt($credentials)) {
            return back()
                ->withErrors(['email' => 'The email address or password is incorrect.'])
                ->with('error', 'The email address or password is incorrect.');
        }

        $request->session()->regenerate();

        return redirect()->intended(route('home.redirect'))
            ->with('success', 'Welcome back!');
    }

    public function register(Request $request)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'unique:users,email'],
            'password' => ['required', 'confirmed', 'min:8'],
        ]);

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => bcrypt($validated['password']),
            'role' => null,
        ]);

        Auth::login($user);

        return redirect('/choose-role')
            ->with('success', 'Registration successful! Please choose your role.');
    }

    public function redirectToGoogle(): RedirectResponse
    {
        return Socialite::driver('google')->redirect();
    }

    public function handleGoogleCallback(Request $request): RedirectResponse
    {
        try {
            $googleUser = Socialite::driver('google')->user();
        } catch (Throwable $e) {
            return redirect()
                ->route('login')
                ->with('error', 'Unable to authenticate with Google. Please try again.');
        }

        $email = $googleUser->getEmail();

        if (! $email) {
            return redirect()
                ->route('login')
                ->with('error', 'Google account did not provide an email address.');
        }

        $user = User::where('google_id', $googleUser->getId())->first();

        if (! $user) {
            $user = User::where('email', $email)->first();

            if ($user) {
                $updates = [];

                if (! $user->google_id) {
                    $updates['google_id'] = $googleUser->getId();
                }

                if (! $user->email_verified_at) {
                    $updates['email_verified_at'] = now();
                }

                if (! $user->avatar && $googleUser->getAvatar()) {
                    $updates['avatar'] = $googleUser->getAvatar();
                }

                if ($updates !== []) {
                    $user->fill($updates)->save();
                }
            } else {
                $user = User::create([
                    'name' => $googleUser->getName() ?: Str::before($email, '@'),
                    'email' => $email,
                    'google_id' => $googleUser->getId(),
                    'avatar' => $googleUser->getAvatar(),
                    'email_verified_at' => now(),
                    'role' => null,
                    'password' => null,
                ]);
            }
        }

        Auth::login($user, true);
        $request->session()->regenerate();

        if ($user->role === null) {
            return redirect('/choose-role')
                ->with('success', 'Signed in with Google. Please choose your role.');
        }

        return redirect()->intended(route('home.redirect'))
            ->with('success', 'Welcome back!');
    }

    public function logout(Request $request)
    {
        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect('/login');
    }
}
