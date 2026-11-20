# Reviews, Comments and Moderation

> Part of the [Feature Documentation](../FEATURES.md) index.

## Overview

Course detail shows approved reviews with rating statistics and approved
comment threads. Students with an active enrollment can post comments; a review
is available only after the course is 100% complete. Admin can approve, reject
or delete reviews and comments.

## Roles

- **Student** — writes, edits and deletes their own review and comments.
- **Admin** — moderates all reviews and comments.
- **Public visitor** — reads approved reviews and comments on course detail.

## Flow

### 1. Read reviews and comments

1. Course detail calls `ReviewService::getCourseReviews()`.
2. Only approved reviews are shown; rating average and count are recalculated
   from approved reviews.
3. `CommentService::getCourseComments()` returns approved top-level comments
   with approved replies.
4. The author can still see their own rejected review for editing.

### 2. Write a review

1. Student completes every published material in a course.
2. On course detail, the review form becomes available.
3. Student submits a rating from 1 to 5 and an optional comment up to 2000 chars.
4. `ReviewService::storeOrUpdate()` requires an active enrollment and 100% completion.
5. The row is created or updated by `(user_id, course_id)`, so there is one
   review per student per course.
6. Course rating statistics are recalculated.

A review without full completion returns a JSON 422 error.

### 3. Write a comment

1. Student with an active enrollment opens the discussion on course detail.
2. Student submits a body of 3–2000 characters and an optional `parent_id`.
3. `parent_id` must belong to the same course and must itself be a top-level
   comment.
4. Replies are stored one level deep; nested replies are rejected.
5. Student can edit or delete their own comment.
6. Deleting a parent comment deletes its replies.

### 4. Moderate

1. Admin opens `/admin/reviews` or `/admin/comments`.
2. Admin approves or rejects an item with `PUT .../approve` or `.../reject`.
3. Admin can delete an item permanently.
4. Review changes recalculate course rating statistics.
5. Public lists include only approved items.

## Rules and guards

- Review eligibility: active enrollment plus 100% published-material completion.
- One review per `(user_id, course_id)`.
- Rating must be an integer from 1 to 5.
- Comment body must be 3–2000 characters.
- Comments support one reply level only.
- Ownership is enforced for student edit/delete.
- Admin moderation routes require `auth` and `role:admin`.
- New rows default to `is_approved = true` in the database, but public queries
  always filter by approved status.

## Where to find it

- **UI:** `ReviewForm.tsx`, `ReviewCard.tsx`, `CommentThread.tsx` on course detail.
- **Admin UI:** `resources/js/pages/admin/reviews/page.tsx`,
  `resources/js/pages/admin/comments/page.tsx`.
- **Routes:** `POST/DELETE /student/courses/{course:slug}/reviews...`,
  `POST/PUT/DELETE /student/courses/{course:slug}/comments...`,
  `GET /admin/reviews`, `PUT /admin/reviews/{review}/{approve|reject}`,
  `DELETE /admin/reviews/{review}`, and the equivalent comment routes.

## Key implementation files

- `app/Http/Controllers/ReviewController.php`
- `app/Http/Controllers/CommentController.php`
- `app/Services/ReviewService.php`
- `app/Services/CommentService.php`
- `app/Http/Requests/Review/StoreReviewRequest.php`
- `app/Http/Requests/Comment/StoreCommentRequest.php`
- `app/Http/Requests/Comment/UpdateCommentRequest.php`

## Edge cases

- A rejected review may remain visible to its author but not to the public.
- Review and comment ownership failures return JSON 422.
- Deleting a review recalculates rating; deleting a comment does not.
- Course rating recalculation is a no-op if the course was soft-deleted.

## Related guides

- [Course catalogue and course detail](course-catalog.md)
- [Learning and progress](learning-and-progress.md)
- [Landing page](landing-page.md)
