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

    $this->actingAs($student)
        ->postJson("/student/courses/{$course->slug}/quiz/{$quizContent->id}/reset")
        ->assertOk()
        ->assertJsonPath('state.status', 'in_progress')
        ->assertJsonPath('state.answered', 0);
});

it('requires every lesson content to be finished before a material can be marked complete', function () {
    [
        'student' => $student,
        'course' => $course,
        'material' => $material,
        'quizContent' => $quizContent,
        'textContent' => $textContent,
        'questions' => $questions,
    ] = makeStudentQuizCourse();

    $this->actingAs($student)
        ->post("/student/courses/{$course->slug}/progress", ['material_id' => $material->id])
        ->assertRedirect();

    expect(MaterialProgress::where('user_id', $student->id)
        ->where('material_id', $material->id)
        ->where('is_completed', true)
        ->exists())->toBeFalse();

    $this->actingAs($student)
        ->postJson("/student/courses/{$course->slug}/contents/{$textContent->id}/complete")
        ->assertOk()
        ->assertJsonPath('success', true);

    $this->actingAs($student)
        ->postJson("/student/courses/{$course->slug}/quiz/{$quizContent->id}/submit", [
            'answers' => [
                $questions[0]['question']->id => $questions[0]['correct']->id,
                $questions[1]['question']->id => $questions[1]['correct']->id,
            ],
        ])
        ->assertOk();

    $this->actingAs($student)
        ->post("/student/courses/{$course->slug}/progress", ['material_id' => $material->id])
        ->assertRedirect();

    expect(MaterialProgress::where('user_id', $student->id)
        ->where('material_id', $material->id)
        ->where('is_completed', true)
        ->exists())->toBeTrue();
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
