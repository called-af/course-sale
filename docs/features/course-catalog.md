# Course Catalogue and Course Detail

> Part of the [Feature Documentation](../FEATURES.md) index.

## Overview

The catalogue lists published courses. Course detail is the main buying page:
it shows the syllabus, instructor, reviews, comments, progress for enrolled
students, a refund notice when applicable, and a checkout entry point for paid
courses. Recommendations may be shown alongside the list.

## Roles

- **Guest** — browses the public catalogue at `/course` and opens course detail.
- **Student** — browses `/courses`, sees enrollment progress and can buy a course.
- **Instructor / Admin** — use the authoring views instead; see
  [Course authoring](course-authoring.md).

## Flow

### 1. Browse the catalogue

1. Guest opens `GET /course`; signed-in users open `GET /courses`.
2. The page loads published courses, newest first, with creator, categories,
   tags and a generated thumbnail URL.
3. Recommended courses are requested for the current user or guest.
4. The user filters in the browser by text, level, course type and the
   **Recommended** toggle.
5. The user opens a course by slug.

Only courses with `status = published` are listed. Search and filters are
client-side; there are no server-side query parameters for them.

### 2. Open course detail

1. User opens `GET /course/{course:slug}`.
2. A non-published course returns 404.
3. For an authenticated user, a course view event is tracked.
4. The page loads approved reviews, rating statistics and approved comments.
5. If the viewer is a student with an active enrollment, the page also loads:
   - progress over published content blocks,
   - review eligibility (100% complete),
   - the refund-policy notice,
   - a resume link into the learning page.
6. If the viewer is a student and the course is paid, checkout methods and
   gateway status are supplied so the purchase modal can be shown.

### 3. Start learning or buying

- **Free course:** the student clicks Enroll; see
  [Enrollment and checkout](enrollment-and-checkout.md).
- **Paid course:** the student opens checkout from the detail page or from
  `/student/courses/{course:slug}/checkout`.
- **Already enrolled:** the student is sent to the learning page with the
  current lesson selected.

### 4. Recommended list

`GET /courses/recommended` returns JSON for JSON requests and otherwise
redirects to `/course?recommended=1`. See
[Recommendation engine](recommendation-engine.md) for scoring and caching.

## Rules and guards

- Course detail requires `status = published`.
- Progress is computed only from published modules → published materials →
  published content blocks.
- Review eligibility requires every published material to be complete.
- Checkout data is only sent to students for paid courses.
- Recommendations return empty when either the config flag or the admin toggle
  is disabled.
- `/course/id/{course}` redirects to the canonical slug URL.

## Where to find it

- **Public catalogue:** `resources/js/pages/course/page.tsx`.
- **Course detail:** `resources/js/pages/course/[slug]/page.tsx`.
- **Routes:** `GET /course`, `GET /courses`, `GET /course/{course:slug}`,
  `GET /course/id/{course}`, `GET /courses/recommended`,
  `GET /courses/{course:slug}`.

## Key implementation files

- `routes/web.php`
- `app/Services/RecommendationService.php`
- `app/Services/EventTrackingService.php`
- `app/Services/ReviewService.php`
- `app/Services/CommentService.php`
- `app/Services/EnrollmentService.php`
- `app/Services/Payment/PaymentService.php`

## Edge cases

- The catalog redirect target `/course?recommended=1` is not currently read by
  the listing page; use the JSON endpoint when consuming recommendations.
- Guests can request recommendation JSON; there is a guest-specific cache key.
- A user with no event history receives popular courses as a cold-start fallback.
- Course views are tracked only for authenticated users.

## Related guides

- [Course authoring](course-authoring.md)
- [Enrollment and checkout](enrollment-and-checkout.md)
- [Learning and progress](learning-and-progress.md)
- [Recommendation engine](recommendation-engine.md)
