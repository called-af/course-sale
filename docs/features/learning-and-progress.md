# Learning Player and Progress

> Part of the [Feature Documentation](../FEATURES.md) index.

## Overview

The learning page is available only to students with an active enrollment. It
loads published modules, materials and content blocks, lets the student resume
from a saved position, and records completion per content block. Material-level
progress is derived from content completion and reconciled by a scheduled job.
Opening the page with `GET` never writes progress.

## Roles

- **Student** — reads lessons, completes content and resumes learning.
- **Instructor / Admin** — author the published structure; see
  [Course authoring](course-authoring.md).
- **Scheduler** — reconciles material completion weekly.

## Flow

### 1. Open the learning page

1. Student opens `GET /student/courses/{course:slug}`.
2. Without an active enrollment, the page redirects to the catalogue.
3. `EnrollmentService::learningData()` loads only published modules, materials
   and content blocks, including quiz questions and options.
4. The current material and content are selected from `?material=` and
   `?content=`, falling back to the first published items.
5. Completed content and material rows are read; material completion is derived
   in memory from content completion.
6. Progress metadata is returned: total materials, completed materials, material
   percent, resume target and review eligibility.

### 2. Complete a content block

1. Text blocks auto-complete when viewed or scrolled into view.
2. Video, file and presentation viewers call
   `POST /student/courses/{course:slug}/contents/{content}/complete`.
3. Quiz blocks complete only through quiz submission; see
   [Quizzes and grading](quizzes-and-grading.md).
4. `markContentProgress()` verifies that the content, material and module are
   published and belong to the course.
5. A `MaterialContentProgress` row is marked complete.
6. `syncMaterialCompletion()` marks the material complete when all published
   contents are complete, or revokes stale material completion otherwise.
7. First-time material completion tracks a `material_complete` event and tries
   to generate a certificate.

An explicit `POST /student/courses/{course:slug}/progress` endpoint also exists;
it still derives material completion from content state rather than accepting a
blind manual flag.

### 3. Progress views

- Course detail shows progress over published **content blocks**.
- Learning page shows progress over published **materials**, plus content counts.
- Review eligibility requires every published material to be complete.
- `progress:sync-materials` runs weekly on Sunday at 03:30 to reconcile active
  enrollments.

### 4. Resume

The learning page returns a resume target based on the first incomplete published
content or material. Query parameters can open a specific lesson directly.

## Rules and guards

- Only published modules, materials and content blocks are visible.
- An unpublished or foreign content ID returns 404 on the completion endpoint.
- Quiz content cannot be completed by the generic content endpoint.
- A page view alone does not complete a lesson.
- Revoked enrollment blocks the learning page even if progress rows remain.
- A course with no published completable material can never be complete.
- Unpublishing content changes the denominator and can revoke stale completion.

## Where to find it

- **UI:** `resources/js/pages/student/course/[enroll]/page.tsx`,
  `resources/js/components/templates/CourseLearningTemplate.tsx`.
- **Routes:** `GET /student/courses/{course:slug}`,
  `POST /student/courses/{course:slug}/progress`,
  `POST /student/courses/{course:slug}/contents/{content}/complete`.

## Key implementation files

- `app/Http/Controllers/EnrollmentController.php`
- `app/Services/EnrollmentService.php`
- `app/Console/Commands/SyncMaterialProgressCommand.php`
- `app/Models/MaterialProgress.php`
- `app/Models/MaterialContentProgress.php`
- `app/Policies/CoursePolicy.php`

## Edge cases

- Learning GET is read-only by design; progress writes happen only on explicit
  completion actions.
- The scheduled reconciliation supports `--user`, `--course` and `--dry-run`.
- A material completed before content unpublishing can be revoked later.
- Course completion uses at least one published material with published content.

## Related guides

- [Course catalogue and course detail](course-catalog.md)
- [Quizzes and grading](quizzes-and-grading.md)
- [Certificates](certificates.md)
- [Course resources](course-resources.md)
