<?php

namespace App\Http\Requests\QuizQuestion;

use Illuminate\Foundation\Http\FormRequest;

class StoreQuizQuestionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('update', $this->route('content')) ?? false;
    }

    public function rules(): array
    {
        return [
            'material_content_id' => 'nullable|exists:material_contents,id',

            'questions' => 'required|array|min:1',

            'questions.*.question' => 'required|string',
            'questions.*.image' => 'nullable|image|max:2048',
            'questions.*.type' => 'required|in:multiple_choice,essay',

            'questions.*.options' => [
                'required_if:questions.*.type,multiple_choice',
                'prohibited_if:questions.*.type,essay',
                'nullable',
                'array',
            ],

            'questions.*.options.*.option_text' => 'nullable|string',
            'questions.*.options.*.is_correct' => 'nullable|boolean',
        ];
    }

    public function withValidator($validator): void
    {
        $validator->after(function ($validator) {
            $questions = $this->input('questions', []);
            foreach ($questions as $index => $q) {
                if (($q['type'] ?? '') === 'multiple_choice') {
                    $options = $q['options'] ?? [];
                    if (! is_array($options) || count($options) < 2) {
                        $validator->errors()->add(
                            "questions.{$index}.options",
                            'Multiple choice questions must have at least 2 answer options.'
                        );
                    } else {
                        $hasEmpty = false;
                        $hasCorrect = false;
                        foreach ($options as $opt) {
                            if (! isset($opt['option_text']) || trim((string) $opt['option_text']) === '') {
                                $hasEmpty = true;
                            }
                            if (! empty($opt['is_correct'])) {
                                $hasCorrect = true;
                            }
                        }
                        if ($hasEmpty) {
                            $validator->errors()->add(
                                "questions.{$index}.options",
                                'All multiple choice options must have answer text.'
                            );
                        }
                        if (! $hasCorrect) {
                            $validator->errors()->add(
                                "questions.{$index}.options",
                                'Multiple choice questions must have at least 1 correct answer.'
                            );
                        }
                    }
                }
            }
        });
    }

    public function messages(): array
    {
        return [
            'questions.*.options.required_if' => 'Options are required for multiple choice questions.',
            'questions.*.options.prohibited_if' => 'Essay questions must not have answer options.',
        ];
    }
}
