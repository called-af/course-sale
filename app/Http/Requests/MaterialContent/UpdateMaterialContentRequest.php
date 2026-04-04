<?php

namespace App\Http\Requests\MaterialContent;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateMaterialContentRequest extends FormRequest
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
            'title' => ['sometimes', 'string', 'max:255'],

            'type' => [
                'required',
                Rule::in(['video', 'text', 'quiz', 'file', 'ppt']),
            ],

            'content_url' => ['nullable', 'string'],
            'content_text' => ['nullable', 'array'],
            'duration' => ['nullable', 'integer', 'min:1'],
        ];
    }
}
