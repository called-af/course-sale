<?php

namespace App\Services;

use App\Models\Course;
use App\Models\Material;
use App\Models\MaterialContent;
use App\Models\MaterialContentProgress;
use App\Models\QuizAnswer;
use App\Models\QuizAttempt;
use App\Models\QuizQuestion;
use App\Models\User;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Collection as SupportCollection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class QuizService
{
    public function getQuestions(int $materialContentId): Collection
    {
        return QuizQuestion::with('quizOptions')
            ->where('material_content_id', $materialContentId)
            ->orderBy('sort_order')
            ->get();
    }

    public function storeQuestions(array $data): void
    {
        DB::transaction(function () use ($data) {
            $sortOrder = QuizQuestion::where('material_content_id', $data['material_content_id'])
                ->max('sort_order') ?? 0;

            foreach ($data['questions'] as $questionData) {
                $sortOrder++;

                $question = QuizQuestion::create([
                    'material_content_id' => $data['material_content_id'],
                    'question' => $questionData['question'],
                    'type' => $questionData['type'],
                    'image' => isset($questionData['image']) && $questionData['image'] instanceof \Illuminate\Http\UploadedFile
                        ? $questionData['image']->store('quiz-images', 'public')
                        : null,
                    'sort_order' => $sortOrder,
                ]);

                if ($questionData['type'] === 'multiple_choice') {
                    foreach ($questionData['options'] as $option) {
                        $question->quizOptions()->create([
                            'option_text' => $option['option_text'],
                            'is_correct' => $option['is_correct'],
                        ]);
                    }
                }
            }
        });
    }

    public function updateQuestions(array $data): void
    {
        DB::transaction(function () use ($data) {
            $materialContentId = $data['material_content_id'];

            $incomingIds = collect($data['questions'])->pluck('id')->filter()->values();

            QuizQuestion::where('material_content_id', $materialContentId)
                ->whereNotIn('id', $incomingIds)
                ->each(fn ($q) => $q->delete());

            foreach ($data['questions'] as $index => $questionData) {
                $question = isset($questionData['id'])
                    ? QuizQuestion::findOrFail($questionData['id'])
                    : new QuizQuestion(['material_content_id' => $materialContentId]);

                $question->fill([
                    'question' => $questionData['question'],
                    'type' => $questionData['type'],
                    'image' => isset($questionData['image']) && $questionData['image'] instanceof \Illuminate\Http\UploadedFile
                        ? $questionData['image']->store('quiz-images', 'public')
                        : ($question->image ?? null),
                    'sort_order' => $questionData['sort_order'] ?? $index + 1,
                ])->save();

                $this->syncOptions($question, $questionData);
            }
        });
    }

    private function syncOptions(QuizQuestion $question, array $questionData): void
    {
        if ($questionData['type'] === 'essay') {
            $question->quizOptions()->delete();

            return;
        }

        $incomingOptionIds = collect($questionData['options'] ?? [])
            ->pluck('id')
            ->filter()
            ->values();

        $question->quizOptions()
            ->whereNotIn('id', $incomingOptionIds)
            ->delete();

        foreach ($questionData['options'] as $optionData) {
            $question->quizOptions()->updateOrCreate(
                ['id' => $optionData['id'] ?? null],
                [
                    'option_text' => $optionData['option_text'],
                    'is_correct' => $optionData['is_correct'],
                ]
            );
        }
    }

    public function deleteQuestion(QuizQuestion $quizQuestion): void
    {
        DB::transaction(function () use ($quizQuestion) {
            $materialContentId = $quizQuestion->material_content_id;
            $deletedOrder = $quizQuestion->sort_order;

            $quizQuestion->delete();

            QuizQuestion::where('material_content_id', $materialContentId)
                ->where('sort_order', '>', $deletedOrder)
                ->decrement('sort_order');
        });
    }

    /**
     * Return the current quiz state for a single content.
     */
    public function getState(User $user, MaterialContent $content): array
    {
        $content->loadMissing('quizQuestions.quizOptions');

        $attempts = QuizAttempt::with('answers')
            ->where('user_id', $user->id)
            ->where('material_content_id', $content->id)
            ->orderByDesc('id')
            ->get();

        return $this->buildState($content, $attempts);
    }

    /**
     * Return quiz states for multiple contents using a single attempt query.
     *
     * @param  SupportCollection<int, MaterialContent>  $contents
     */
    public function statesFor(User $user, SupportCollection $contents): array
    {
        if ($contents->isEmpty()) {
            return [];
        }

        $contents->each(fn (MaterialContent $content) => $content->loadMissing('quizQuestions.quizOptions'));

        $attempts = QuizAttempt::with('answers')
            ->where('user_id', $user->id)
            ->whereIn('material_content_id', $contents->pluck('id'))
            ->orderByDesc('id')
            ->get()
            ->groupBy('material_content_id');

        return $contents
            ->mapWithKeys(fn (MaterialContent $content) => [
                $content->id => $this->buildState(
                    $content,
                    $attempts->get($content->id) ?? new Collection
                ),
            ])
            ->all();
    }

    /**
     * Create (or resume) an in-progress attempt and return its state.
     */
    public function start(User $user, MaterialContent $content): array
    {
        $this->resolveInProgressAttempt($user, $content);

        return $this->getState($user, $content);
    }

    /**
     * Persist a draft answer set so the student can continue later.
     */
    public function saveDraft(User $user, MaterialContent $content, array $answers): array
    {
        return DB::transaction(function () use ($user, $content, $answers) {
            $attempt = $this->resolveInProgressAttempt($user, $content);
            $content->loadMissing('quizQuestions.quizOptions');

            foreach ($content->quizQuestions as $question) {
                $raw = $answers[$question->id] ?? null;

                if ($question->type === 'multiple_choice') {
                    $optionId = is_numeric($raw) ? (int) $raw : null;
                    if ($optionId !== null && ! $question->quizOptions->contains('id', $optionId)) {
                        $optionId = null;
                    }
                    $answerText = null;
                } else {
                    $optionId = null;
                    $answerText = is_string($raw) ? $raw : (is_numeric($raw) ? (string) $raw : null);
                    if ($answerText !== null && trim($answerText) === '') {
                        $answerText = null;
                    }
                }

                if ($optionId === null && $answerText === null) {
                    QuizAnswer::where('quiz_attempt_id', $attempt->id)
                        ->where('quiz_question_id', $question->id)
                        ->delete();

                    continue;
                }

                QuizAnswer::updateOrCreate(
                    [
                        'quiz_attempt_id' => $attempt->id,
                        'quiz_question_id' => $question->id,
                    ],
                    [
                        'quiz_option_id' => $optionId,
                        'answer_text' => $answerText,
                        'is_correct' => null,
                    ]
                );
            }

            return $this->getState($user, $content);
        });
    }

    /**
     * Discard the current draft and start a fresh attempt.
     */
    public function reset(User $user, MaterialContent $content): array
    {
        return DB::transaction(function () use ($user, $content) {
            QuizAttempt::where('user_id', $user->id)
                ->where('material_content_id', $content->id)
                ->where('status', 'in_progress')
                ->get()
                ->each(function (QuizAttempt $attempt) {
                    $attempt->answers()->delete();
                    $attempt->delete();
                });

            QuizAttempt::create([
                'user_id' => $user->id,
                'material_content_id' => $content->id,
                'started_at' => now(),
                'status' => 'in_progress',
                'score' => null,
            ]);

            return $this->getState($user, $content);
        });
    }

    public function submitQuiz(
        User $user,
        MaterialContent $content,
        array $answers,
        ?Course $course = null,
        ?Material $material = null
    ): array {
        return DB::transaction(function () use ($user, $content, $answers, $course, $material) {
            $questions = QuizQuestion::with('quizOptions')
                ->where('material_content_id', $content->id)
                ->orderBy('sort_order')
                ->get();

            if ($questions->isEmpty()) {
                throw ValidationException::withMessages([
                    'answers' => 'This quiz does not have any questions yet.',
                ]);
            }

            // A quiz can only be submitted once every question has an answer.
            foreach ($questions as $question) {
                $raw = $answers[$question->id] ?? null;

                if ($question->type === 'multiple_choice') {
                    $optionId = is_numeric($raw) ? (int) $raw : null;
                    $isValidOption = $optionId !== null
                        && $question->quizOptions->contains('id', $optionId);

                    if (! $isValidOption) {
                        throw ValidationException::withMessages([
                            'answers' => 'Please answer all quiz questions before submitting.',
                        ]);
                    }
                } elseif (! is_string($raw) || trim($raw) === '') {
                    throw ValidationException::withMessages([
                        'answers' => 'Please answer all quiz questions before submitting.',
                    ]);
                }
            }

            $attempt = $this->resolveInProgressAttempt($user, $content);
            $mcQuestions = $questions->where('type', 'multiple_choice');
            $totalMc = $mcQuestions->count();
            $correctMc = 0;
            $details = [];

            foreach ($questions as $question) {
                $userAnswer = $answers[$question->id] ?? null;
                $isCorrect = null;
                $optionId = null;
                $answerText = null;

                if ($question->type === 'multiple_choice') {
                    $optionId = is_numeric($userAnswer) ? (int) $userAnswer : null;
                    $correctOption = $question->quizOptions->firstWhere('is_correct', true);
                    $isCorrect = $correctOption && $optionId === $correctOption->id;

                    if ($isCorrect) {
                        $correctMc++;
                    }
                } else {
                    $answerText = is_string($userAnswer) ? $userAnswer : null;
                }

                QuizAnswer::updateOrCreate(
                    [
                        'quiz_attempt_id' => $attempt->id,
                        'quiz_question_id' => $question->id,
                    ],
                    [
                        'quiz_option_id' => $optionId,
                        'answer_text' => $answerText,
                        'is_correct' => $isCorrect,
                    ]
                );

                $details[] = [
                    'question_id' => $question->id,
                    'type' => $question->type,
                    'selected_option_id' => $optionId,
                    'correct_option_id' => $question->quizOptions->firstWhere('is_correct', true)?->id,
                    'is_correct' => $isCorrect,
                ];
            }

            $percentageScore = $totalMc > 0 ? round(($correctMc / $totalMc) * 100, 2) : 100;

            $attempt->update([
                'finished_at' => now(),
                'status' => 'completed',
                'score' => $percentageScore,
            ]);

            $this->markContentCompleted($user, $content);

            $material = $material ?? $content->material;
            $course = $course ?? $material?->module?->course;

            $trackingService = app(EventTrackingService::class);
            $trackingService->trackQuizAttempt(
                $user,
                $course,
                $material,
                $percentageScore,
                [
                    'attempt_id' => $attempt->id,
                    'total_questions' => $questions->count(),
                    'correct_answers' => $correctMc,
                    'total_mc' => $totalMc,
                ]
            );

            $trackingService->trackQuizComplete(
                $user,
                $course,
                $material,
                $percentageScore,
                [
                    'attempt_id' => $attempt->id,
                    'score' => $percentageScore,
                ]
            );

            return [
                'attempt' => $attempt->fresh(),
                'score' => $percentageScore,
                'correct' => $correctMc,
                'total' => $totalMc,
                'total_questions' => $questions->count(),
                'details' => $details,
                'state' => $this->getState($user, $content),
            ];
        });
    }

    protected function resolveInProgressAttempt(User $user, MaterialContent $content): QuizAttempt
    {
        $attempt = QuizAttempt::where('user_id', $user->id)
            ->where('material_content_id', $content->id)
            ->where('status', 'in_progress')
            ->latest('id')
            ->first();

        if ($attempt) {
            return $attempt;
        }

        return QuizAttempt::create([
            'user_id' => $user->id,
            'material_content_id' => $content->id,
            'started_at' => now(),
            'status' => 'in_progress',
            'score' => null,
        ]);
    }

    protected function buildState(MaterialContent $content, SupportCollection $attempts): array
    {
        $questions = $content->quizQuestions;
        $totalQuestions = $questions->count();
        $totalMc = $questions->where('type', 'multiple_choice')->count();

        $inProgress = $attempts->firstWhere('status', 'in_progress');
        $completed = $attempts->firstWhere('status', 'completed');

        if ($inProgress) {
            $answers = [];
            $answered = 0;

            foreach ($questions as $question) {
                $answer = $inProgress->answers->firstWhere('quiz_question_id', $question->id);

                if (! $answer) {
                    continue;
                }

                if ($question->type === 'multiple_choice') {
                    if ($answer->quiz_option_id !== null) {
                        $answers[$question->id] = $answer->quiz_option_id;
                        $answered++;
                    }
                } elseif (filled($answer->answer_text)) {
                    $answers[$question->id] = $answer->answer_text;
                    $answered++;
                }
            }

            return [
                'status' => 'in_progress',
                'attempt_id' => $inProgress->id,
                'answers' => $answers,
                'answered' => $answered,
                'total_questions' => $totalQuestions,
                'total' => $totalMc,
                'correct' => null,
                'score' => null,
            ];
        }

        if ($completed) {
            return [
                'status' => 'completed',
                'attempt_id' => $completed->id,
                'answers' => [],
                'answered' => $totalQuestions,
                'total_questions' => $totalQuestions,
                'total' => $totalMc,
                'correct' => $completed->answers->where('is_correct', true)->count(),
                'score' => (float) $completed->score,
            ];
        }

        return [
            'status' => 'none',
            'attempt_id' => null,
            'answers' => [],
            'answered' => 0,
            'total_questions' => $totalQuestions,
            'total' => $totalMc,
            'correct' => null,
            'score' => null,
        ];
    }

    protected function markContentCompleted(User $user, MaterialContent $content): void
    {
        MaterialContentProgress::updateOrCreate(
            [
                'user_id' => $user->id,
                'material_content_id' => $content->id,
            ],
            [
                'is_completed' => true,
                'completed_at' => now(),
            ]
        );
    }
}
