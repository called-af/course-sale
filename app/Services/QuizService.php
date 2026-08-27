<?php

namespace App\Services;

use App\Models\Course;
use App\Models\Material;
use App\Models\MaterialContent;
use App\Models\QuizAnswer;
use App\Models\QuizAttempt;
use App\Models\QuizQuestion;
use App\Models\User;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;

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
                ->each(fn($q) => $q->delete());

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
                ->get();

            $mcQuestions = $questions->where('type', 'multiple_choice');
            $totalMc = $mcQuestions->count();
            $correctMc = 0;

            $attempt = QuizAttempt::create([
                'user_id' => $user->id,
                'material_content_id' => $content->id,
                'started_at' => now(),
                'finished_at' => now(),
                'status' => 'completed',
                'score' => 0,
            ]);

            foreach ($questions as $question) {
                $userAnswer = $answers[$question->id] ?? null;
                $isCorrect = null;
                $optionId = null;
                $answerText = null;

                if ($question->type === 'multiple_choice') {
                    $optionId = is_numeric($userAnswer) ? (int) $userAnswer : null;
                    $correctOption = $question->quizOptions->firstWhere('is_correct', true);
                    if ($correctOption && $optionId === $correctOption->id) {
                        $isCorrect = true;
                        $correctMc++;
                    } else {
                        $isCorrect = false;
                    }
                } else {
                    $answerText = is_string($userAnswer) ? $userAnswer : null;
                }

                QuizAnswer::create([
                    'quiz_attempt_id' => $attempt->id,
                    'quiz_question_id' => $question->id,
                    'quiz_option_id' => $optionId,
                    'answer_text' => $answerText,
                    'is_correct' => $isCorrect,
                ]);
            }

            $percentageScore = $totalMc > 0 ? round(($correctMc / $totalMc) * 100, 2) : 100;
            $attempt->update(['score' => $percentageScore]);

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
                'attempt' => $attempt,
                'score' => $percentageScore,
                'correct' => $correctMc,
                'total' => $totalMc,
            ];
        });
    }
}
