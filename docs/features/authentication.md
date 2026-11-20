# Authentication and Role Selection

> Part of the [Feature Documentation](../FEATURES.md) index.

## Overview

The platform supports email/password accounts and Google sign-in. A newly
registered account starts without a role, so the user must choose **Student** or
**Instructor** before using the rest of the application. Admin accounts are
created by an administrator and never use self-service role selection.

## Roles

- **Guest** — can register, sign in, request a password reset and use Google login.
- **New user** — has `role = null` and is redirected to the role picker.
- **Student / Instructor / Admin** — are routed to their own dashboard after sign-in.

## Flow

### 1. Register with email and password

1. Guest opens `GET /register`.
2. Guest submits name, email, password and password confirmation.
3. A user is created with `role = null`, signed in, and redirected to `/choose-role`.
4. `EnsureRoleSelected` middleware blocks all other pages until a role is chosen.

Validation: `name` is required, `email` must be unique, and `password` requires
at least 8 characters plus confirmation. Registration is throttled to 6 attempts
per minute.

### 2. Choose a role

1. The user opens `GET /choose-role`.
2. The user selects **Student** or **Instructor** and submits `POST /choose-role`.
3. The role is saved and the user is redirected to the matching dashboard.
4. `/home` also redirects by role: admin → admin dashboard, instructor →
   instructor dashboard, student → student dashboard.

Admin cannot be chosen here. A user whose role is already set cannot change it
through this screen and must contact an administrator.

### 3. Sign in and sign out

1. Guest opens `GET /login` and submits email and password.
2. On success the session is regenerated and the user is redirected to the
   intended URL or `/home`.
3. On failure the user sees `The email address or password is incorrect.`
4. Login is throttled to 6 attempts per minute.
5. `POST /logout` invalidates the session and returns the user to `/login`.

### 4. Google sign-in

1. Guest clicks the Google button, which starts `GET /auth/google/redirect`.
2. Google redirects to `GET /auth/google/callback`.
3. The system looks for an existing account by `google_id`, then by email.
4. A new account is created with a verified email, no password and `role = null`.
5. An existing email account is linked by filling its missing Google ID and avatar.
6. The user is sent to `/choose-role` if no role exists, otherwise to `/home`.

Google credentials must be configured with `GOOGLE_CLIENT_ID`,
`GOOGLE_CLIENT_SECRET` and the exact `GOOGLE_REDIRECT_URI`. Without them, the
Google redirect reaches Google and fails with `invalid_request`.

### 5. Reset a password

1. Guest opens `GET /forgot-password` and submits an email address.
2. A reset link is sent by mail.
3. Guest opens `GET /reset-password/{token}` and submits a new password.
4. A successful reset signs in the user and sets `email_verified_at` if it was empty.

The forgot-password endpoint is throttled to 6 attempts per minute.

### 6. Verify an email address

`GET /verify-email/{id}/{hash}` checks the signed ID and hash and
`POST /email/resend` sends a new verification link for a signed-in user. An
invalid link redirects to login with `The verification link is invalid.`

The application does not currently enforce a `verified` middleware on routes;
verification is available but not required to browse or enroll.

## Rules and guards

- `role` values are `student`, `instructor` and `admin`.
- Role selection accepts only `student` or `instructor`; `admin` returns 403.
- Changing an existing role is blocked with:
  `Your account role has already been set. Contact an administrator if it needs to change.`
- A Google-only account has `password = null`, so password sign-in is not useful
  until a password is set by another flow.
- Authentication endpoints use Laravel session auth and CSRF protection.

## Where to find it

- **UI:** `resources/js/pages/auth/Login.tsx`, `Register.tsx`,
  `ForgotPassword.tsx`, `ResetPassword.tsx`, `ChooseRole.tsx`.
- **Routes:** `GET/POST /login`, `GET/POST /register`, `POST /logout`,
  `GET/POST /forgot-password`, `GET/POST /reset-password`,
  `GET /verify-email/{id}/{hash}`, `POST /email/resend`,
  `GET /auth/google/redirect`, `GET /auth/google/callback`,
  `GET/POST /choose-role`, `GET /home`.

## Key implementation files

- `app/Http/Controllers/AuthControllers.php`
- `app/Http/Controllers/RoleController.php`
- `app/Http/Middleware/EnsureRoleSelected.php`
- `app/Models/User.php`
- `config/services.php` (Google OAuth)
- `docs/QUICKSTART.md` (credential setup)

## Edge cases

- The role picker UI may say the role can be changed later, but the backend
  blocks changing an already-set role.
- Role-null users are redirected to `/choose-role` before any other page.
- If Google does not return an email address, sign-in fails with a redirect and
  an error message.
- Email verification is available but not enforced as a middleware gate.

## Related guides

- [Users, profiles, roles and access control](users-and-access-control.md)
- [Settings and branding](settings-and-branding.md)
