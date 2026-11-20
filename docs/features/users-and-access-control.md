# Users, Profiles and Access Control

> Part of the [Feature Documentation](../FEATURES.md) index.

## Overview

The platform uses three roles: **student**, **instructor** and **admin**. Admin
manages users and exports them; every signed-in user can edit their own profile.
Deleting a user soft-deletes the row, removes sessions and revokes all
enrollments.

## Roles

- **Admin** — creates, updates, deletes and exports users; changes roles.
- **Instructor** — can view enrolled students for their own courses and export them.
- **Student** — manages their own profile and WhatsApp number.
- **New user** — must choose a role before using the application.

## Flow

### 1. Admin manages users

1. Admin opens `/admin/users` and searches or filters by role.
2. Admin creates a user with name, email, password and role.
3. Admin updates a user; the email uniqueness rule ignores the target user.
4. Admin exports users as CSV with ID, name, email, role, verification time and
   registration time.
5. Admin deletes a user.
6. The platform deletes sessions, revokes the user's enrollments and soft-deletes
   the user.

Admin cannot delete their own account.

### 2. Users edit their profiles

- Student opens `/student/profile` and can update name, email, bio, avatar,
  password and WhatsApp number.
- Instructor opens `/instructor/profile` and can update the same fields plus
  headline and payout-related settings under `/instructor/settings`.
- Admin opens `/admin/profile`.

Updating an email must not conflict with another user. Students cannot escalate
their role through the profile endpoint.

### 3. Instructor views enrolled students

1. Instructor opens a course they own.
2. The **Students** tab lists active enrolled students, 15 per page.
3. Progress is aggregated in one grouped query.
4. Instructor exports students as CSV from the course students export route.
5. Soft-deleted students are excluded.

### 4. Role-based access

- **Admin** — all courses, users, orders, payouts, settings and moderation.
- **Instructor** — own courses, own quiz grading, own students, own payout settings.
- **Student** — own enrollments, learning, progress, reviews, comments and certificates.
- **Course policy** — admin can view all courses; instructor can view own; student
  can view a course only with an active enrollment.

## Rules and guards

- Create user: `name` required, `email` required and unique, `password` at least
  8 characters, `role` one of `student`, `instructor`, `admin`.
- Update user: partial name, email, password, avatar, bio and headline; avatar is
  an image up to 2048 KB.
- Role changes are admin-only.
- Self-delete is blocked with `You cannot delete your own account.`
- Role selection accepts only `student` or `instructor`; changing an existing
  role requires admin intervention.
- Soft-deleted users lose sessions and active enrollment access.

## Where to find it

- **Admin UI:** `resources/js/pages/admin/user/page.tsx`,
  `resources/js/pages/admin/user/[id]/page.tsx`, `admin/Profile.tsx`.
- **Student UI:** `resources/js/pages/student/Profile.tsx`, `student/settings`.
- **Instructor UI:** `instructor/Profile.tsx`, `instructor/settings/General.tsx`.
- **Routes:** `/admin/users`, `/admin/users/export`, `/admin/profile`,
  `/student/profile`, `/student/settings`, `/instructor/profile`,
  `/instructor/settings`, `GET/POST /choose-role`.

## Key implementation files

- `app/Services/UserService.php`
- `app/Http/Controllers/UserController.php`
- `app/Http/Requests/StoreUserRequest.php`
- `app/Http/Requests/UpdateUserRequest.php`
- `app/Policies/UserPolicy.php`
- `app/Policies/CoursePolicy.php`
- `app/Http/Middleware/RoleMiddleware.php`
- `app/Http/Middleware/EnsureRoleSelected.php`
- `app/Models/User.php`

## Edge cases

- Instructors cannot browse arbitrary user lists; they only see their own students.
- A role-locked account cannot change role from the role picker.
- Deleting a user does not hard-delete the row; historical references remain.
- CSV export includes decrypted or plain profile fields only; payment credentials
  are not exported.

## Related guides

- [Authentication and role selection](authentication.md)
- [Course authoring](course-authoring.md)
- [Settings and branding](settings-and-branding.md)
