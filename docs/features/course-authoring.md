# Course Authoring and Approval

> Part of the [Feature Documentation](../FEATURES.md) index.

## Overview

A course is built as a hierarchy: **Course → Module → Material → Content**.
Quiz questions belong to a quiz content block, and course resources can be
added at course level. A course starts as `draft`, is submitted as `review`, and
is approved by an admin as `published`. Categories and tags are managed by admin
and attached when a course is updated.

## Roles

- **Instructor** — creates and edits their own courses, builds the curriculum,
  submits for review and can override their course certificate signature.
- **Admin** — creates and edits any course, approves reviewed courses, previews
  courses, manages categories and tags.
- **Student** — sees only published courses and active enrollments.

## Flow

### 1. Create and edit a course

1. Instructor or admin opens `/instructor/courses` or `/admin/courses`.
2. They click **New course** and submit a title.
3. The course is created with status `draft`, type `free`, a generated unique
   slug and the current user as creator.
4. The author edits title, description, level, type, price, thumbnail,
   categories and tags.
5. Changing the title regenerates the slug and redirects to the new URL.
6. A paid course requires a price; a free course clears the price.

### 2. Build the curriculum

1. Inside the course editor, the author adds modules and reorders them.
2. Each module contains materials; each material has a status.
3. Each material contains content blocks of type `video`, `text`, `quiz`,
   `file` or `ppt`.
4. Content blocks can be reordered, edited, published or deleted.
5. Quiz content blocks get one or more questions:
   - `multiple_choice` requires at least two options and at least one correct answer.
   - `essay` has no options and needs manual grading.
6. Uploaded files are stored under `materials/contents` on the public disk.

Publish gates:

- A module can be published only if it has at least one published material with
  a published content block.
- A material can be published only if it has at least one published content block.
- A course can be published only if it has title, description, level, thumbnail,
  at least one category, and at least one published module with a published
  material containing a published content block.

### 3. Submit for review and approve

1. Instructor clicks **Submit for review** on a complete draft.
2. The course status changes from `draft` to `review`.
3. Incomplete courses are rejected with a message listing the missing requirements.
4. Admin reviews the course and clicks **Approve**.
5. The status becomes `published`, and `published_at` and `approved_at` are set.
6. Students can now see the course in the catalogue and enroll.

Resubmitting a course already in `review` or `published` is rejected. Admin can
preview a course before or after publishing.

### 4. Manage categories and tags

1. Admin opens `/admin/categories` or `/admin/tags`.
2. Admin creates, renames or deletes records.
3. Category names are unique; category slugs regenerate when the name changes.
4. Deleting a category or tag detaches it from courses; courses are not deleted.
5. Authors attach categories and tags when updating a course.

### 5. Delete a course

Deleting a course soft-deletes it. The curriculum data is preserved. Force
deletion is guarded and rejected when the course has enrolled students or
purchase history.

## Rules and guards

- Course structure routes are protected by `can:update,course`.
- Instructors can update only their own courses; admins can update all courses.
- Structure routes verify the full hierarchy; a mismatched module, material or
  content returns 404.
- Only admin can approve, publish or force-delete a course.
- Move operations swap `sort_order` with the adjacent sibling; deleting a sibling
  reorders later items.
- Resource publishing requires either a file or an external URL.

## Where to find it

- **Instructor UI:** `resources/js/pages/instructor/course/...`.
- **Admin UI:** `resources/js/pages/admin/course/...`.
- **Shared components:** `CourseStructure.tsx`, `EditMaterialContent.tsx`,
  `QuizBuilder`, `CourseResourcesSection.tsx`.
- **Routes:** `/{instructor|admin}/courses`, `/{instructor|admin}/courses/{course:slug}`,
  `/{instructor|admin}/courses/{course:slug}/preview`,
  `/admin/courses/{course:slug}/approve`,
  `/instructor/courses/{course:slug}/submit-review`,
  `/admin/categories`, `/admin/tags`, plus nested module/material/content routes.

## Key implementation files

- `app/Http/Controllers/Course/CourseController.php`
- `app/Services/CourseService.php`
- `app/Services/CourseApprovalService.php`
- `app/Models/Course.php`
- `app/Policies/CoursePolicy.php`
- `app/Services/ModuleService.php`
- `app/Services/MaterialService.php`
- `app/Services/MaterialContentService.php`
- `app/Services/QuizService.php`
- `app/Services/CourseResourceService.php`
- `app/Http/Controllers/CategoryController.php`
- `app/Http/Controllers/TagController.php`

## Edge cases

- The UI uses “permanent” wording in some delete dialogs, but the operation is
  a soft delete.
- Unpublishing content changes the completion denominator for enrolled students;
  scheduled reconciliation can revoke stale material completion.
- Quiz submission completes the lesson regardless of score; essay attempts stay
  `pending_review` until graded.
- Deleting a parent course resource removes its file from disk.

## Related guides

- [Course catalogue and course detail](course-catalog.md)
- [Quizzes and grading](quizzes-and-grading.md)
- [Course resources](course-resources.md)
- [Certificates](certificates.md)
