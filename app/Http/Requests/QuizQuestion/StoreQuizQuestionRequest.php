<?php

namespace App\Http\Requests\QuizQuestion;

use Illuminate\Foundation\Http\FormRequest;

class StoreQuizQuestionRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'material_content_id' => 'required|exists:material_contents,id',

            'questions' => 'required|array|min:1',

            'questions.*.question' => 'required|string',
            'questions.*.type' => 'required|in:multiple_choice,essay',

            'questions.*.options' => 'required_if:questions.*.type,multiple_choice|array|min:2',

            'questions.*.options.*.option_text' => 'required|string',
            'questions.*.options.*.is_correct' => 'required|boolean',
        ];
    }
}
