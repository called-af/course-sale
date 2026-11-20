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
use Carbon\CarbonInterface;
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

        $this->expireOverdueAttemptIfNeeded($user, $content);

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

        foreach ($contents as $content) {
            $this->expireOverdueAttemptIfNeeded($user, $content);
        }

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
        $this->expireOverdueAttemptIfNeeded($user, $content);

        $state = $this->getState($user, $content);

        if (in_array($state['status'], ['in_progress', 'none', 'expired'], true)) {
            if ($state['status'] === 'expired') {
                // Allow retry after an expired/timed-out attempt.
                return $this->reset($user, $content);
            }

            $this->resolveInProgressAttempt($user, $content);

            return $this->getState($user, $content);
        }

        return $state;
    }

    /**
     * Persist a draft answer set so the student can continue later.
     */
    public function saveDraft(User $user, MaterialContent $content, array $answers): array
    {
        return DB::transaction(function () use ($user, $content, $answers) {
            // Only autosave into an attempt that is actually in progress. Never
            // create a new attempt here — a late autosave after submitting would
            // otherwise hide the score behind a fresh "continue" state.
            $attempt = QuizAttempt::where('user_id', $user->id)
                ->where('material_content_id', $content->id)
                ->where('status', 'in_progress')
                ->latest('id')
                ->lockForUpdate()
                ->first();

            if (! $attempt) {
                return $this->getState($user, $content);
            }

            $content->loadMissing('quizQuestions.quizOptions');

            if ($this->isAttemptExpired($attempt, $content)) {
                $this->finalizeTimedOutAttempt($attempt, $content, $attempt->answers()->get()->keyBy('quiz_question_id')->all(), null, null);

                return $this->getState($user, $content);
            }

            $this->syncAttemptAnswers($attempt, $content, $answers);

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

            $attempt = $this->resolveInProgressAttempt($user, $content, lockForUpdate: true);
            $timedOut = $this->isAttemptExpired($attempt, $content);

            // A quiz can only be submitted once every question has an answer,
            // unless the attempt has timed out (then we accept partial answers).
            if (! $timedOut) {
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
            }

            $mcQuestions = $questions->where('type', 'multiple_choice');
            $essayQuestions = $questions->where('type', 'essay');
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
                    if ($optionId !== null && ! $question->quizOptions->contains('id', $optionId)) {
                        $optionId = null;
                    }
                    $correctOption = $question->quizOptions->firstWhere('is_correct', true);
                    $isCorrect = $optionId !== null && $correctOption && $optionId === $correctOption->id;

                    if ($isCorrect) {
                        $correctMc++;
                    }
                } else {
                    $answerText = is_string($userAnswer) ? $userAnswer : (is_numeric($userAnswer) ? (string) $userAnswer : null);
                    if ($answerText !== null && trim($answerText) === '') {
                        $answerText = null;
                    }
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

            $needsReview = $essayQuestions->isNotEmpty();

            // Essay answers cannot be auto-scored. Never hand out a perfect
            // score for a quiz that has no auto-gradable questions.
            $percentageScore = $needsReview
                ? null
                : ($totalMc > 0 ? round(($correctMc / $totalMc) * 100, 2) : 0);

            $finishedAt = $timedOut ? ($this->attemptDeadline($attempt, $content) ?? now()) : now();
            $timeSpent = $this->calculateTimeSpent($attempt, $finishedAt, $content);

            $attempt->update([
                'finished_at' => $finishedAt,
                'time_spent' => $timeSpent,
                'status' => 'completed',
                'score' => $percentageScore,
                'needs_review' => $needsReview,
            ]);

            // Submitting the quiz is what completes the lesson. The score does
            // not have to be perfect, and essay answers can be graded later
            // without blocking the student's progress.
            $this->markContentCompleted($user, $content);

            $material = $material ?? $content->material;
            $course = $course ?? $material?->module?->course;

            if ($percentageScore !== null) {
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
                        'timed_out' => $timedOut,
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
                        'timed_out' => $timedOut,
                    ]
                );
            }

            return [
                'attempt' => $attempt->fresh(),
                'score' => $percentageScore,
                'correct' => $correctMc,
                'total' => $totalMc,
                'total_questions' => $questions->count(),
                'needs_review' => $needsReview,
                'timed_out' => $timedOut,
                'details' => $details,
                'state' => $this->getState($user, $content),
            ];
        });
    }

    /**
     * Grade essay answers for an attempt. The grader supplies a map of
     * quiz_answer_id (or quiz_question_id) => boolean correctness.
     *
     * @param  array<int|string, bool>  $grades
     */
    public function gradeAttempt(QuizAttempt $attempt, array $grades, User $grader): QuizAttempt
    {
        return DB::transaction(function () use ($attempt, $grades, $grader) {
            $attempt->loadMissing(['answers.quizQuestion', 'materialContent.material.module.course']);

            if (! $attempt->needs_review) {
                throw ValidationException::withMessages([
                    'grades' => 'This quiz attempt does not need manual review.',
                ]);
            }

            $answers = $attempt->answers;
            $essayAnswers = $answers->filter(
                fn (QuizAnswer $answer) => $answer->quizQuestion?->type === 'essay'
            );

            foreach ($essayAnswers as $answer) {
                $value = $grades[$answer->id]
                    ?? $grades[$answer->quiz_question_id]
                    ?? null;

                if ($value === null) {
                    throw ValidationException::withMessages([
                        'grades' => 'Please grade every essay answer before saving.',
                    ]);
                }

                $answer->update(['is_correct' => filter_var($value, FILTER_VALIDATE_BOOLEAN)]);
            }

            $answers = $attempt->answers()->with('quizQuestion')->get();
            $total = $answers->count();
            $correct = $answers->where('is_correct', true)->count();
            $score = $total > 0 ? round(($correct / $total) * 100, 2) : 0;

            $attempt->update([
                'score' => $score,
                'needs_review' => false,
                'reviewed_by' => $grader->id,
                'reviewed_at' => now(),
            ]);

            $content = $attempt->materialContent;

            if ($content) {
                $this->markContentCompleted($attempt->user, $content);

                $material = $content->material;
                $course = $material?->module?->course;

                app(EventTrackingService::class)->trackQuizComplete(
                    $attempt->user,
                    $course,
                    $material,
                    $score,
                    [
                        'attempt_id' => $attempt->id,
                        'score' => $score,
                        'graded_by' => $grader->id,
                    ]
                );
            }

            return $attempt->refresh();
        });
    }

    protected function resolveInProgressAttempt(User $user, MaterialContent $content, bool $lockForUpdate = false): QuizAttempt
    {
        $query = QuizAttempt::where('user_id', $user->id)
            ->where('material_content_id', $content->id)
            ->where('status', 'in_progress')
            ->latest('id');

        if ($lockForUpdate) {
            $query->lockForUpdate();
        }

        $attempt = $query->first();

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

        $latest = $attempts->first();

        if ($latest && $latest->status === 'in_progress') {
            $answers = $this->extractAnswers($latest, $questions);
            $answered = count($answers);

            $state = [
                'status' => 'in_progress',
                'attempt_id' => $latest->id,
                'answers' => $answers,
                'answered' => $answered,
                'total_questions' => $totalQuestions,
                'total' => $totalMc,
                'correct' => null,
                'score' => null,
                'needs_review' => false,
            ];

            return array_merge($state, $this->timingState($latest, $content, inProgress: true));
        }

        if ($latest && $latest->status === 'completed') {
            $needsReview = (bool) $latest->needs_review;

            $state = [
                'status' => $needsReview ? 'pending_review' : 'completed',
                'attempt_id' => $latest->id,
                'answers' => [],
                'answered' => $totalQuestions,
                'total_questions' => $totalQuestions,
                'total' => $totalMc,
                'correct' => $latest->answers->where('is_correct', true)->count(),
                'score' => $needsReview ? null : ($latest->score !== null ? (float) $latest->score : null),
                'needs_review' => $needsReview,
            ];

            return array_merge($state, $this->timingState($latest, $content, inProgress: false));
        }

        if ($latest && $latest->status === 'expired') {
            $answers = $this->extractAnswers($latest, $questions);

            $state = [
                'status' => 'expired',
                'attempt_id' => $latest->id,
                'answers' => $answers,
                'answered' => count($answers),
                'total_questions' => $totalQuestions,
                'total' => $totalMc,
                'correct' => $latest->answers->where('is_correct', true)->count(),
                'score' => $latest->score !== null ? (float) $latest->score : null,
                'needs_review' => false,
            ];

            return array_merge($state, $this->timingState($latest, $content, inProgress: false));
        }

        return array_merge([
            'status' => 'none',
            'attempt_id' => null,
            'answers' => [],
            'answered' => 0,
            'total_questions' => $totalQuestions,
            'total' => $totalMc,
            'correct' => null,
            'score' => null,
            'needs_review' => false,
        ], $this->contentTimingDefaults($content));
    }

    /**
     * @param  SupportCollection<int, QuizQuestion>|Collection<int, QuizQuestion>  $questions
     * @return array<int, int|string>
     */
    protected function extractAnswers(QuizAttempt $attempt, $questions): array
    {
        $answers = [];

        foreach ($questions as $question) {
            $answer = $attempt->answers->firstWhere('quiz_question_id', $question->id);

            if (! $answer) {
                continue;
            }

            if ($question->type === 'multiple_choice') {
                if ($answer->quiz_option_id !== null) {
                    $answers[$question->id] = $answer->quiz_option_id;
                }
            } elseif (filled($answer->answer_text)) {
                $answers[$question->id] = $answer->answer_text;
            }
        }

        return $answers;
    }

    protected function syncAttemptAnswers(QuizAttempt $attempt, MaterialContent $content, array $answers): void
    {
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
    }

    protected function isTimedQuiz(MaterialContent $content): bool
    {
        return $content->type === 'quiz' && (int) ($content->duration ?? 0) > 0;
    }

    protected function timeLimitSeconds(MaterialContent $content): ?int
    {
        if (! $this->isTimedQuiz($content)) {
            return null;
        }

        return (int) $content->duration * 60;
    }

    protected function attemptDeadline(QuizAttempt $attempt, MaterialContent $content): ?CarbonInterface
    {
        $limit = $this->timeLimitSeconds($content);
        $startedAt = $this->asCarbon($attempt->started_at);

        if ($limit === null || $startedAt === null) {
            return null;
        }

        return $startedAt->copy()->addSeconds($limit);
    }

    protected function isAttemptExpired(QuizAttempt $attempt, MaterialContent $content): bool
    {
        $deadline = $this->attemptDeadline($attempt, $content);

        return $deadline !== null && now()->greaterThanOrEqualTo($deadline);
    }

    protected function remainingSeconds(QuizAttempt $attempt, MaterialContent $content): ?int
    {
        $deadline = $this->attemptDeadline($attempt, $content);

        if ($deadline === null) {
            return null;
        }

        return max(0, (int) now()->diffInSeconds($deadline, false));
    }

    protected function calculateTimeSpent(QuizAttempt $attempt, CarbonInterface $finishedAt, MaterialContent $content): ?int
    {
        $startedAt = $this->asCarbon($attempt->started_at);

        if ($startedAt === null) {
            return null;
        }

        $spent = max(0, (int) $startedAt->diffInSeconds($finishedAt));
        $limit = $this->timeLimitSeconds($content);

        if ($limit !== null) {
            $spent = min($spent, $limit);
        }

        return $spent;
    }

    protected function timingState(QuizAttempt $attempt, MaterialContent $content, bool $inProgress): array
    {
        $limit = $this->timeLimitSeconds($content);
        $deadline = $this->attemptDeadline($attempt, $content);
        $startedAt = $this->asCarbon($attempt->started_at);

        $remaining = null;
        if ($limit !== null) {
            $remaining = $inProgress ? $this->remainingSeconds($attempt, $content) : 0;
        }

        return [
            'is_timed' => $limit !== null,
            'duration_minutes' => $this->isTimedQuiz($content) ? (int) $content->duration : null,
            'time_limit_seconds' => $limit,
            'started_at' => $startedAt?->toIso8601String(),
            'ends_at' => $deadline?->toIso8601String(),
            'remaining_seconds' => $remaining,
            'time_spent' => $attempt->time_spent,
        ];
    }

    protected function contentTimingDefaults(MaterialContent $content): array
    {
        $limit = $this->timeLimitSeconds($content);

        return [
            'is_timed' => $limit !== null,
            'duration_minutes' => $this->isTimedQuiz($content) ? (int) $content->duration : null,
            'time_limit_seconds' => $limit,
            'started_at' => null,
            'ends_at' => null,
            'remaining_seconds' => $limit,
            'time_spent' => null,
        ];
    }

    protected function expireOverdueAttemptIfNeeded(User $user, MaterialContent $content): void
    {
        if (! $this->isTimedQuiz($content)) {
            return;
        }

        DB::transaction(function () use ($user, $content) {
            $attempt = QuizAttempt::where('user_id', $user->id)
                ->where('material_content_id', $content->id)
                ->where('status', 'in_progress')
                ->latest('id')
                ->lockForUpdate()
                ->first();

            if (! $attempt || ! $this->isAttemptExpired($attempt, $content)) {
                return;
            }

            $content->loadMissing(['quizQuestions.quizOptions', 'material.module']);
            $attempt->loadMissing('answers');

            $this->finalizeTimedOutAttempt($attempt, $content, null, null, null, persistCurrentAnswers: false);
        });
    }

    protected function finalizeTimedOutAttempt(
        QuizAttempt $attempt,
        MaterialContent $content,
        ?array $answersByQuestionId = null,
        ?Course $course = null,
        ?Material $material = null,
        bool $persistCurrentAnswers = false
    ): QuizAttempt {
        if ($attempt->status !== 'in_progress') {
            return $attempt;
        }

        $content->loadMissing('quizQuestions.quizOptions');
        $attempt->loadMissing('answers');

        // Use provided answers, or fall back to already-saved draft answers.
        if ($answersByQuestionId === null) {
            $answersByQuestionId = $attempt->answers->keyBy('quiz_question_id')->all();
        }

        $questions = $content->quizQuestions;
        $totalMc = $questions->where('type', 'multiple_choice')->count();
        $correctMc = 0;

        foreach ($questions as $question) {
            $existing = $answersByQuestionId[$question->id] ?? $attempt->answers->firstWhere('quiz_question_id', $question->id);
            $optionId = null;
            $answerText = null;
            $isCorrect = null;

            if ($question->type === 'multiple_choice') {
                $optionId = $existing instanceof QuizAnswer ? $existing->quiz_option_id : (is_numeric($existing) ? (int) $existing : null);
                $correctOption = $question->quizOptions->firstWhere('is_correct', true);
                $isCorrect = $optionId !== null && $correctOption && $optionId === $correctOption->id;
                if ($isCorrect) {
                    $correctMc++;
                }
            } else {
                $answerText = $existing instanceof QuizAnswer ? $existing->answer_text : (is_string($existing) ? $existing : null);
            }

            if ($persistCurrentAnswers || $existing instanceof QuizAnswer) {
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
            }
        }

        $needsReview = $questions->where('type', 'essay')->isNotEmpty() && $attempt->answers()->whereNotNull('answer_text')->exists();
        $percentageScore = $needsReview
            ? null
            : ($totalMc > 0 ? round(($correctMc / $totalMc) * 100, 2) : 0);

        $finishedAt = $this->attemptDeadline($attempt, $content) ?? now();

        $attempt->update([
            'finished_at' => $finishedAt,
            'time_spent' => $this->timeLimitSeconds($content),
            'status' => 'completed',
            'score' => $percentageScore,
            'needs_review' => $needsReview,
        ]);

        $this->markContentCompleted($attempt->user ?? User::find($attempt->user_id), $content);

        return $attempt->refresh();
    }

    protected function asCarbon(mixed $value): ?CarbonInterface
    {
        if ($value instanceof CarbonInterface) {
            return $value;
        }

        if ($value instanceof \DateTimeInterface) {
            return \Illuminate\Support\Carbon::instance($value);
        }

        if (is_numeric($value)) {
            return \Illuminate\Support\Carbon::createFromTimestamp((int) $value);
        }

        if (is_string($value) && $value !== '') {
            return \Illuminate\Support\Carbon::parse($value);
        }

        return null;
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

        $content->loadMissing([
            'material.module:id,course_id,status',
            'material.contents' => fn ($query) => $query->where('status', 'published')->select('id', 'material_id', 'status'),
        ]);

        app(EnrollmentService::class)->syncMaterialCompletion($user, $content->material);
    }
}
