<?php

use App\Models\Course;
use App\Models\Enrollment;
use App\Models\Material;
use App\Models\MaterialContent;
use App\Models\MaterialContentProgress;
use App\Models\MaterialProgress;
use App\Models\Module;
use App\Models\QuizOption;
use App\Models\QuizQuestion;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

function makeStudentQuizCourse(): array
{
    $student = User::factory()->create(['role' => 'student']);
    $instructor = User::factory()->create(['role' => 'instructor']);

    $course = Course::factory()->create([
        'creator_id' => $instructor->id,
        'status' => 'published',
        'type' => 'free',
    ]);

    $module = Module::factory()->create(['course_id' => $course->id]);
    $material = Material::factory()->create(['module_id' => $module->id, 'status' => 'published']);

    $quizContent = MaterialContent::factory()->create([
        'material_id' => $material->id,
        'type' => 'quiz',
        'title' => 'Final Quiz',
        'status' => 'published',
    ]);

    $textContent = MaterialContent::factory()->create([
        'material_id' => $material->id,
        'type' => 'text',
        'title' => 'Reading',
        'status' => 'published',
    ]);

    $questions = collect();

    foreach ([1, 2] as $index) {
        $question = QuizQuestion::factory()->create([
            'material_content_id' => $quizContent->id,
            'question' => "Question {$index}",
            'type' => 'multiple_choice',
            'sort_order' => $index,
        ]);

        $wrong = QuizOption::factory()->create([
            'quiz_question_id' => $question->id,
            'option_text' => 'Wrong',
            'is_correct' => false,
        ]);

        $correct = QuizOption::factory()->create([
            'quiz_question_id' => $question->id,
            'option_text' => 'Correct',
            'is_correct' => true,
        ]);

        $questions->push(['question' => $question, 'correct' => $correct, 'wrong' => $wrong]);
    }

    Enrollment::factory()->create([
        'user_id' => $student->id,
        'course_id' => $course->id,
        'status' => 'active',
    ]);

    return compact('student', 'course', 'module', 'material', 'quizContent', 'textContent', 'questions');
}

it('saves quiz drafts, shows the score after submit, and resets the attempt', function () {
    ['student' => $student, 'course' => $course, 'quizContent' => $quizContent, 'questions' => $questions] = makeStudentQuizCourse();

    $this->actingAs($student)
        ->get("/student/courses/{$course->slug}")
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('student/course/[enroll]/page')
            ->has('contentProgress')
            ->has('quizStates'));

    $this->actingAs($student)
        ->postJson("/student/courses/{$course->slug}/quiz/{$quizContent->id}/start")
        ->assertOk()
        ->assertJsonPath('state.status', 'in_progress');

    $draftAnswers = [
        $questions[0]['question']->id => $questions[0]['correct']->id,
    ];

    $this->actingAs($student)
        ->postJson("/student/courses/{$course->slug}/quiz/{$quizContent->id}/draft", [
            'answers' => $draftAnswers,
        ])
        ->assertOk()
        ->assertJsonPath('state.answered', 1);

    $allAnswers = [
        $questions[0]['question']->id => $questions[0]['correct']->id,
        $questions[1]['question']->id => $questions[1]['wrong']->id,
    ];

    $this->actingAs($student)
        ->postJson("/student/courses/{$course->slug}/quiz/{$quizContent->id}/submit", [
            'answers' => $allAnswers,
        ])
        ->assertOk()
        ->assertJsonPath('data.score', 50)
        ->assertJsonPath('data.correct', 1);

    expect(MaterialContentProgress::where('user_id', $student->id)
        ->where('material_content_id', $quizContent->id)
        ->where('is_completed', true)
        ->exists())->toBeTrue();

    // Returning to the quiz must show the completed state with the score.
    $this->actingAs($student)
        ->get("/student/courses/{$course->slug}")
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('student/course/[enroll]/page')
            ->where("quizStates.{$quizContent->id}.status", 'completed')
            ->where("quizStates.{$quizContent->id}.score", 50));

    // A late autosave after submitting must not create a fresh attempt that
    // would hide the score behind a "continue quiz" state.
    $this->actingAs($student)
        ->postJson("/student/courses/{$course->slug}/quiz/{$quizContent->id}/draft", [
            'answers' => $allAnswers,
        ])
        ->assertOk()
        ->assertJsonPath('state.status', 'completed');

    $this->actingAs($student)
        ->postJson("/student/courses/{$course->slug}/quiz/{$quizContent->id}/reset")
        ->assertOk()
        ->assertJsonPath('state.status', 'in_progress')
        ->assertJsonPath('state.answered', 0);
});

it('does not force material completion unless all published contents are completed', function () {
    ['student' => $student, 'course' => $course, 'material' => $material] = makeStudentQuizCourse();

    $this->actingAs($student)
        ->post("/student/courses/{$course->slug}/progress", ['material_id' => $material->id])
        ->assertRedirect();

    expect(MaterialProgress::where('user_id', $student->id)
        ->where('material_id', $material->id)
        ->where('is_completed', true)
        ->exists())->toBeFalse();
});

it('rejects quiz submission when a question is still unanswered', function () {
    ['student' => $student, 'course' => $course, 'quizContent' => $quizContent, 'questions' => $questions] = makeStudentQuizCourse();

    $this->actingAs($student)
        ->postJson("/student/courses/{$course->slug}/quiz/{$quizContent->id}/submit", [
            'answers' => [
                $questions[0]['question']->id => $questions[0]['correct']->id,
            ],
        ])
        ->assertStatus(422);
});

it('marks the quiz lesson complete on submission even when the score is below 100', function () {
    ['student' => $student, 'course' => $course, 'quizContent' => $quizContent, 'questions' => $questions] = makeStudentQuizCourse();

    $this->actingAs($student)
        ->postJson("/student/courses/{$course->slug}/quiz/{$quizContent->id}/submit", [
            'answers' => [
                $questions[0]['question']->id => $questions[0]['correct']->id,
                $questions[1]['question']->id => $questions[1]['wrong']->id,
            ],
        ])
        ->assertOk()
        ->assertJsonPath('data.score', 50);

    expect(MaterialContentProgress::where('user_id', $student->id)
        ->where('material_content_id', $quizContent->id)
        ->where('is_completed', true)
        ->exists())->toBeTrue();
});

it('marks the quiz lesson complete on submission while essay answers await review', function () {
    ['student' => $student, 'course' => $course, 'quizContent' => $quizContent] = makeStudentQuizCourse();

    $essay = QuizQuestion::factory()->create([
        'material_content_id' => $quizContent->id,
        'question' => 'Explain your answer',
        'type' => 'essay',
        'sort_order' => 3,
    ]);

    $this->actingAs($student)
        ->postJson("/student/courses/{$course->slug}/quiz/{$quizContent->id}/start")
        ->assertOk();

    $answers = [
        $essay->id => 'Because the design system keeps components consistent.',
    ];

    // The quiz also contains the two multiple choice questions created by the helper.
    $mcQuestions = QuizQuestion::where('material_content_id', $quizContent->id)
        ->where('type', 'multiple_choice')
        ->with('quizOptions')
        ->get();

    foreach ($mcQuestions as $question) {
        $answers[$question->id] = $question->quizOptions->firstWhere('is_correct', true)->id;
    }

    $this->actingAs($student)
        ->postJson("/student/courses/{$course->slug}/quiz/{$quizContent->id}/submit", [
            'answers' => $answers,
        ])
        ->assertOk()
        ->assertJsonPath('data.needs_review', true)
        ->assertJsonPath('data.score', null);

    expect(MaterialContentProgress::where('user_id', $student->id)
        ->where('material_content_id', $quizContent->id)
        ->where('is_completed', true)
        ->exists())->toBeTrue();
});
