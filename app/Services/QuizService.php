<?php

namespace App\Services;

use App\Models\QuizQuestion;
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
}
