# Course Resources and Downloads

> Part of the [Feature Documentation](../FEATURES.md) index.

## Overview

Course resources are downloadable files or external links attached to a course.
There are two sources: **manual resources** created by an author and
**automatic resources** derived from published `file` or `ppt` content blocks.
Manual resources unlock at 100% course completion; automatic lesson resources
can unlock earlier, when their source lesson or material is complete.

## Roles

- **Instructor / Admin** — create, edit, publish and delete manual resources.
- **Student** — views unlocked resources in the learning sidebar and downloads them.

## Flow

### 1. Create a manual resource

1. Author opens the course editor and the **Resources** section.
2. Author provides a title, optional description, an external URL or a file, and
   a status of `draft` or `published`.
3. Uploaded files are stored under `course-resources/{course_id}`.
4. Uploading a new file replaces the old file and clears the external URL.
5. Switching to an external URL deletes the stored file.
6. A resource cannot be published without a file or URL.

### 2. View resources in the learning page

1. The learning page merges manual and automatic resources.
2. Draft resources are hidden.
3. Published manual resources appear only when the whole course is complete.
4. Automatic resources appear when any of the following is complete:
   - the whole course,
   - the containing material,
   - the source content block.

### 3. Download a resource

1. Student clicks a resource in the learning sidebar.
2. Manual download calls
   `GET /student/courses/{course:slug}/resources/{resource}`.
3. Automatic download calls
   `GET /student/courses/{course:slug}/resources/contents/{content}`.
4. The controller checks that the resource belongs to the course, is published,
   the student has an active enrollment and the unlock rule is satisfied.
5. Local files are streamed with a slugified title and original extension.
6. External URLs redirect to the provider.

## Rules and guards

- Title: required string, maximum 255 characters.
- Description: optional string, maximum 2000 characters.
- External URL: optional `http`/`https`, maximum 2048 characters.
- File: optional, maximum 20480 KB, allowed document/image/archive MIME types.
- Status: `draft` or `published`.
- Automatic resources come only from published `file`/`ppt` content with a URL.
- Unlocked manual resources require 100% course completion.
- Direct download of a draft or locked resource returns 404.

## Where to find it

- **Authoring UI:** `resources/js/components/organisms/Course/CourseResourcesSection.tsx`.
- **Student UI:** Resources tab in `CourseLearningTemplate.tsx`.
- **Routes:** `POST /courses/{course:slug}/resources`,
  `PUT /courses/{course:slug}/resources/{resource}`,
  `DELETE /courses/{course:slug}/resources/{resource}`,
  `GET /student/courses/{course:slug}/resources/{resource}`,
  `GET /student/courses/{course:slug}/resources/contents/{content}`.

## Key implementation files

- `app/Services/CourseResourceService.php`
- `app/Http/Controllers/Course/CourseResourceController.php`
- `app/Http/Controllers/Student/CourseResourceDownloadController.php`
- `app/Http/Controllers/Student/CourseResourceContentDownloadController.php`
- `app/Http/Requests/CourseResource/StoreCourseResourceRequest.php`
- `app/Http/Requests/CourseResource/UpdateCourseResourceRequest.php`

## Edge cases

- Deleting a manual resource deletes its stored file.
- A local file that no longer exists returns 404.
- External URLs never proxy the file; the browser is redirected.
- Automatic resources unlock earlier than manual ones by design.

## Related guides

- [Course authoring](course-authoring.md)
- [Learning and progress](learning-and-progress.md)
