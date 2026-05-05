<?php

namespace App\Http\Requests\QuizQuestion;

use Illuminate\Foundation\Http\FormRequest;

class StoreQuizQuestionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'material_content_id' => 'required|exists:material_contents,id',

            'questions' => 'required|array|min:1',

            'questions.*.question' => 'required|string',
            'questions.*.image' => 'nullable|image|max:2048',
            'questions.*.type' => 'required|in:multiple_choice,essay',

            'questions.*.options' => [
                'required_if:questions.*.type,multiple_choice',
                'prohibited_if:questions.*.type,essay',
                'array',
                'min:2',
            ],

            'questions.*.options.*.option_text' => 'required_if:questions.*.type,multiple_choice|string',
            'questions.*.options.*.is_correct' => 'required_if:questions.*.type,multiple_choice|boolean',
        ];
    }

    public function messages(): array
    {
        return [
            'questions.*.options.required_if' => 'Options wajib diisi untuk soal pilihan ganda.',
            'questions.*.options.prohibited_if' => 'Soal essay tidak boleh memiliki options.',
            'questions.*.options.min' => 'Soal pilihan ganda minimal memiliki 2 pilihan jawaban.',
            'questions.*.options.*.is_correct.required_if' => 'Setiap option harus ditandai benar atau salah.',
        ];
    }
}
