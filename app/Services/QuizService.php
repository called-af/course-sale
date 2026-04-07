<?php

namespace App\Services;

use App\Models\QuizQuestion;
use App\Models\QuizOption;
use App\Models\QuizAttempt;
use App\Models\QuizAnswer;
use Illuminate\Support\Facades\DB;
use Exception;

class QuizService
{
    /**
     * GET QUIZ (questions + options)
     */
    public function getByMaterialContent(int $materialContentId)
    {
        return QuizQuestion::with('quizOptions')
            ->where('material_content_id', $materialContentId)
            ->orderBy('sort_order')
            ->get();
    }

    /**
     * CREATE QUIZ (bulk)
     */
    public function create(array $data)
    {
        return DB::transaction(function () use ($data) {

            foreach ($data['questions'] as $q) {

                if ($q['type'] === 'multiple_choice') {
                    if (count($q['options']) < 2) {
                        throw new Exception('Minimal 2 options');
                    }

                    if (!collect($q['options'])->contains('is_correct', true)) {
                        throw new Exception('Harus ada jawaban benar');
                    }
                }

                $question = QuizQuestion::create([
                    'material_content_id' => $data['material_content_id'],
                    'question' => $q['question'],
                    'image' => $q['image'] ?? null,
                    'sort_order' => $q['sort_order'] ?? 0,
                ]);

                foreach ($q['options'] ?? [] as $opt) {
                    QuizOption::create([
                        'quiz_question_id' => $question->id,
                        'option_text' => $opt['option_text'],
                        'is_correct' => $opt['is_correct'],
                    ]);
                }
            }

            return true;
        });
    }

    /**
     * UPDATE QUIZ (FULL SYNC)
     */
    public function update(array $data)
    {
        return DB::transaction(function () use ($data) {

            $existingQuestions = QuizQuestion::where('material_content_id', $data['material_content_id'])
                ->pluck('id')
                ->toArray();

            $incomingQuestionIds = collect($data['questions'])
                ->pluck('id')
                ->filter()
                ->toArray();

            $toDelete = array_diff($existingQuestions, $incomingQuestionIds);
            QuizQuestion::whereIn('id', $toDelete)->delete();

            foreach ($data['questions'] as $q) {

                if ($q['type'] === 'multiple_choice') {
                    if (count($q['options']) < 2) {
                        throw new Exception('Minimal 2 options');
                    }

                    if (!collect($q['options'])->contains('is_correct', true)) {
                        throw new Exception('Harus ada jawaban benar');
                    }
                }

                $question = QuizQuestion::updateOrCreate(
                    ['id' => $q['id'] ?? null],
                    [
                        'material_content_id' => $data['material_content_id'],
                        'question' => $q['question'],
                        'image' => $q['image'] ?? null,
                        'sort_order' => $q['sort_order'] ?? 0,
                    ]
                );

                $existingOptions = QuizOption::where('quiz_question_id', $question->id)
                    ->pluck('id')
                    ->toArray();

                $incomingOptionIds = collect($q['options'] ?? [])
                    ->pluck('id')
                    ->filter()
                    ->toArray();

                $optToDelete = array_diff($existingOptions, $incomingOptionIds);
                QuizOption::whereIn('id', $optToDelete)->delete();

                foreach ($q['options'] ?? [] as $opt) {
                    QuizOption::updateOrCreate(
                        ['id' => $opt['id'] ?? null],
                        [
                            'quiz_question_id' => $question->id,
                            'option_text' => $opt['option_text'],
                            'is_correct' => $opt['is_correct'],
                        ]
                    );
                }
            }

            return true;
        });
    }

    /**
     * DELETE QUIZ (by material_content)
     */
    public function deleteByMaterialContent(int $materialContentId)
    {
        return DB::transaction(function () use ($materialContentId) {

            $questions = QuizQuestion::where('material_content_id', $materialContentId)->get();

            foreach ($questions as $q) {
                QuizOption::where('quiz_question_id', $q->id)->delete();
            }

            QuizQuestion::where('material_content_id', $materialContentId)->delete();

            return true;
        });
    }

    /**
     * START QUIZ
     */
    public function start(int $userId, int $materialContentId)
    {
        return QuizAttempt::create([
            'user_id' => $userId,
            'material_content_id' => $materialContentId,
            'started_at' => now(),
            'status' => 'in_progress',
            'score' => 0,
        ]);
    }

    /**
     * SUBMIT QUIZ
     */
    public function submit(int $attemptId, array $answers)
    {
        return DB::transaction(function () use ($attemptId, $answers) {

            $attempt = QuizAttempt::findOrFail($attemptId);

            if ($attempt->status === 'completed') {
                throw new Exception('Quiz already submitted');
            }

            $score = 0;
            $total = count($answers);

            foreach ($answers as $ans) {

                $question = QuizQuestion::findOrFail($ans['question_id']);

                if ($question->material_content_id !== $attempt->material_content_id) {
                    throw new Exception('Invalid question');
                }

                $isCorrect = false;

                if (!empty($ans['option_id'])) {
                    $option = QuizOption::find($ans['option_id']);
                    $isCorrect = $option?->is_correct ?? false;
                }

                if ($isCorrect) {
                    $score++;
                }

                QuizAnswer::create([
                    'quiz_attempt_id' => $attempt->id,
                    'quiz_question_id' => $question->id,
                    'quiz_option_id' => $ans['option_id'] ?? null,
                    'answer_text' => $ans['answer_text'] ?? null,
                    'is_correct' => $isCorrect,
                ]);
            }

            $finalScore = $total > 0 ? ($score / $total) * 100 : 0;

            $attempt->update([
                'finished_at' => now(),
                'score' => $finalScore,
                'status' => 'completed',
            ]);

            return $attempt->fresh('answers');
        });
    }
}