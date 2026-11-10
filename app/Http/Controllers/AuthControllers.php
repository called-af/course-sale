<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;
use Inertia\Inertia;

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
            return back()->with('success', 'Link reset password telah dikirim ke email Anda.');
        }

        return back()->withErrors(['email' => 'Tidak ada akun yang ditemukan dengan alamat email tersebut.'])
            ->with('error', 'Tidak ada akun yang ditemukan dengan alamat email tersebut.');
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
                ->with('success', 'Password berhasil direset. Silakan login kembali.');
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
            return redirect()->route('login')->with('error', 'Link verifikasi tidak valid.');
        }

        if (! $user->hasVerifiedEmail()) {
            $user->markEmailAsVerified();
        }

        return redirect()
            ->route('login')
            ->with('success', 'Email berhasil diverifikasi.');
    }

    public function resendVerificationEmail(Request $request): RedirectResponse
    {
        $user = $request->user();

        if ($user->hasVerifiedEmail()) {
            return back()->with('success', 'Email Anda sudah diverifikasi.');
        }

        $user->sendEmailVerificationNotification();

        return back()->with('success', 'Email verifikasi telah dikirim.');
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

    public function logout(Request $request)
    {
        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect('/login');
    }
}
