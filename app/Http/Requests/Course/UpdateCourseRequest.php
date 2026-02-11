<?php

namespace App\Http\Requests\Course;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateCourseRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()->can('update', $this->route('course'));
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
            'description' => ['sometimes', 'string'],

            'level' => ['sometimes', Rule::in([
                'beginner',
                'intermediate',
                'advanced'
            ])],

            'type' => ['sometimes', Rule::in(['free', 'paid'])],
            'price' => [
                'nullable',
                'numeric',
                'min:0',
                Rule::requiredIf($this->type === 'paid'),
            ],

            'thumbnail' => ['sometimes', 'image', 'max:2048'],

            'status' => ['sometimes', Rule::in([
                'draft',
                'review',
                'published'
            ])],
        ];
    }

    // public function messages()
    // {
    //     return [
    //         "title.max" => "Maksimal 255 kata",
    //         "level.in" => "level tidak ada dalam database"
    //     ];
    // }
}
