# Quizzes and Grading

> Part of the [Feature Documentation](../FEATURES.md) index.

## Overview

Quiz content blocks contain multiple-choice and essay questions. Students can
start, autosave, reset and submit attempts. Multiple-choice answers are scored
automatically; essay answers require manual grading by an instructor or admin.
Submitting a quiz always completes the lesson, even when the score is pending or
low.

## Roles

- **Instructor / Admin** — create quiz questions and grade essay attempts.
- **Student** — take quizzes and see results.
- **System** — auto-scores multiple-choice answers and tracks quiz events.

## Flow

### 1. Author questions

1. Author opens a quiz content block in the course editor.
2. Author adds one or more questions.
3. `multiple_choice` questions need at least two options and at least one
   correct option.
4. `essay` questions have no options.
5. The content block can be published like any other content block.

### 2. Start a quiz

1. Student opens the quiz in the learning player.
2. The app calls `POST /student/courses/{course:slug}/quiz/{content}/start`.
3. `QuizService` returns one of `none`, `in_progress`, `completed`,
   `pending_review` or `expired`.
4. An overdue timed attempt is expired and restarted as a fresh attempt.
5. Completed attempts are returned without creating a new attempt.

### 3. Answer and autosave

1. Student answers questions in the quiz runner.
2. Answers are autosaved about 450 ms after a change and on page hide/unmount.
3. `POST .../draft` updates an existing `in_progress` attempt only; it never
   creates one.
4. A timed quiz auto-submits partial answers when the timer reaches zero.

### 4. Submit

1. Student clicks **Submit**.
2. Unless the quiz timed out, every question must have a valid answer.
3. `QuizAnswer` rows are stored.
4. Multiple-choice answers are auto-scored.
5. If the quiz has any essay question:
   - score is `null`,
   - `needs_review` is `true`.
6. Otherwise the score is correct multiple-choice answers divided by total
   multiple-choice questions.
7. The attempt becomes `completed`, the content block is marked complete and
   quiz events are tracked for auto-scored attempts.

### 5. Manual grading

1. Instructor or admin opens `/instructor/quiz-attempts` or
   `/admin/quiz-attempts`.
2. The queue lists attempts with `needs_review = true`.
3. The grader assigns a boolean grade to every essay answer.
4. `PUT /{role}/quiz-attempts/{attempt}/grade` recalculates the full score.
5. The attempt is marked reviewed, `needs_review` becomes false, the content
   block is completed and a `quiz_complete` event is tracked.

### 6. Reset

`POST .../reset` deletes only in-progress attempts for that student and content,
then creates a fresh one. Completed history is kept.

## Rules and guards

- At least one question is required to submit.
- All questions must be answered unless the quiz timed out.
- Timed quizzes use `duration` in minutes; deadline is
  `started_at + duration * 60`.
- Submitting completes the lesson regardless of score.
- Essay-only attempts remain `pending_review` but still advance progress.
- Grading requires a boolean grade for every essay answer; a partial grade set
  fails the whole request.
- Instructors can grade only quizzes in their own courses.
- Invalid saved multiple-choice option IDs are normalized to null.

## Where to find it

- **Student UI:** `CourseQuizRunner.tsx` in the learning player.
- **Grading UI:** `resources/js/pages/admin/quiz-attempts/page.tsx` and the
  instructor equivalent.
- **Authoring UI:** `QuizBuilder` in the course editor.
- **Routes:** `POST /student/courses/{course:slug}/quiz/{content}/start`,
  `/draft`, `/reset`, `/submit`;
  `GET/PUT /{admin|instructor}/quiz-attempts...`;
  `/courses/{course:slug}/modules/{module}/materials/{material}/contents/{content}/quiz-questions`.

## Key implementation files

- `app/Services/QuizService.php`
- `app/Http/Controllers/EnrollmentController.php`
- `app/Http/Controllers/QuizGradingController.php`
- `app/Http/Controllers/Course/QuizController.php`
- `app/Models/QuizAttempt.php`
- `app/Models/QuizAnswer.php`

## Edge cases

- A late autosave after submission cannot create a new attempt or reveal a score.
- Timeout finishing uses the original deadline, not the current time.
- No perfect score is assigned to a quiz with no auto-gradable questions.
- Grading an attempt that does not need review fails validation.

## Related guides

- [Course authoring](course-authoring.md)
- [Learning and progress](learning-and-progress.md)
- [Certificates](certificates.md)
