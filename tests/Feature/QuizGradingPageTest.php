<?php

use App\Models\Course;
use App\Models\Material;
use App\Models\MaterialContent;
use App\Models\Module;
use App\Models\QuizAnswer;
use App\Models\QuizAttempt;
use App\Models\QuizQuestion;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

function makeGradingSubmission(User $instructor, User $student, array $overrides = []): array
{
    $course = Course::factory()->create([
        'creator_id' => $instructor->id,
        'status' => 'published',
        'title' => $overrides['course_title'] ?? 'Design Course',
    ]);

    $module = Module::factory()->create(['course_id' => $course->id, 'status' => 'published']);
    $material = Material::factory()->create(['module_id' => $module->id, 'status' => 'published']);

    $content = MaterialContent::factory()->create([
        'material_id' => $material->id,
        'type' => 'quiz',
        'title' => $overrides['quiz_title'] ?? 'Final Quiz',
        'status' => 'published',
    ]);

    $question = QuizQuestion::factory()->create([
        'material_content_id' => $content->id,
        'question' => 'Explain the benefit of design tokens.',
        'type' => 'essay',
        'sort_order' => 1,
    ]);

    $attempt = QuizAttempt::factory()->create([
        'user_id' => $student->id,
        'material_content_id' => $content->id,
        'started_at' => now(),
        'finished_at' => now(),
        'status' => 'completed',
        'needs_review' => true,
        'score' => null,
    ]);

    QuizAnswer::factory()->create([
        'quiz_attempt_id' => $attempt->id,
        'quiz_question_id' => $question->id,
        'quiz_option_id' => null,
        'answer_text' => 'They keep the UI consistent.',
        'is_correct' => null,
    ]);

    return compact('course', 'module', 'material', 'content', 'question', 'attempt');
}

it('lists pending quiz submissions with stats and selects the newest attempt', function () {
    $instructor = User::factory()->create(['role' => 'instructor']);
    $firstStudent = User::factory()->create(['role' => 'student', 'name' => 'First Student']);
    $secondStudent = User::factory()->create(['role' => 'student', 'name' => 'Second Student']);

    $first = makeGradingSubmission($instructor, $firstStudent, ['quiz_title' => 'First Quiz']);
    $second = makeGradingSubmission($instructor, $secondStudent, ['quiz_title' => 'Second Quiz']);

    $this->actingAs($instructor)
        ->get('/instructor/quiz-attempts')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/quiz-attempts/page')
            ->where('stats.pending', 2)
            ->where('stats.students', 2)
            ->where('stats.quizzes', 2)
            ->where('selectedAttemptId', $second['attempt']->id)
            ->has('courses', 2)
            ->has('attempts.data', 2)
            ->where('attempts.data.0.id', $second['attempt']->id));
});

it('filters quiz submissions by course and student search', function () {
    $instructor = User::factory()->create(['role' => 'instructor']);
    $student = User::factory()->create(['role' => 'student', 'name' => 'Alice Learner']);
    $otherStudent = User::factory()->create(['role' => 'student', 'name' => 'Bob Learner']);

    $design = makeGradingSubmission($instructor, $student, ['course_title' => 'Design Course']);
    $code = makeGradingSubmission($instructor, $otherStudent, ['course_title' => 'Code Course']);

    $this->actingAs($instructor)
        ->get('/instructor/quiz-attempts?course='.$code['course']->slug)
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->has('attempts.data', 1)
            ->where('attempts.data.0.id', $code['attempt']->id)
            ->where('filters.course', $code['course']->slug));

    $this->actingAs($instructor)
        ->get('/instructor/quiz-attempts?q=Alice')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->has('attempts.data', 1)
            ->where('attempts.data.0.id', $design['attempt']->id)
            ->where('filters.q', 'Alice'));
});

it('keeps each instructor quiz queue limited to their own courses', function () {
    $instructor = User::factory()->create(['role' => 'instructor']);
    $otherInstructor = User::factory()->create(['role' => 'instructor']);
    $student = User::factory()->create(['role' => 'student']);

    $mine = makeGradingSubmission($instructor, $student);
    makeGradingSubmission($otherInstructor, $student);

    $this->actingAs($instructor)
        ->get('/instructor/quiz-attempts')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('stats.pending', 1)
            ->has('attempts.data', 1)
            ->where('attempts.data.0.id', $mine['attempt']->id));
});

it('grades a submission and removes it from the pending queue', function () {
    $instructor = User::factory()->create(['role' => 'instructor']);
    $student = User::factory()->create(['role' => 'student']);
    ['attempt' => $attempt] = makeGradingSubmission($instructor, $student);

    $answer = $attempt->answers()->firstOrFail();

    $this->actingAs($instructor)
        ->put("/instructor/quiz-attempts/{$attempt->id}/grade", [
            'grades' => [$answer->id => true],
        ])
        ->assertRedirect();

    expect($attempt->fresh()->needs_review)->toBeFalse()
        ->and((float) $attempt->fresh()->score)->toBe(100.0);

    $this->actingAs($instructor)
        ->get('/instructor/quiz-attempts')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('stats.pending', 0)
            ->has('attempts.data', 0)
            ->where('selectedAttemptId', null));
});
