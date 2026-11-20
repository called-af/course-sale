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
                'advanced',
            ])],

            'type' => ['sometimes', Rule::in(['free', 'paid'])],
            'price' => [
                'nullable',
                'numeric',
                'min:0',
                Rule::requiredIf($this->type === 'paid'),
            ],
            'category_ids' => ['sometimes', 'array'],
            'category_ids.*' => ['exists:categories,id'],
            'tag_ids' => ['sometimes', 'array'],
            'tag_ids.*' => ['exists:tags,id'],

            'thumbnail' => ['sometimes', 'image', 'max:2048'],

            'status' => ['sometimes', Rule::in([
                'draft',
                'review',
                'published',
            ])],
        ];
    }

    public function messages(): array
    {
        return [
            'title.string' => 'Course title must be text.',
            'title.max' => 'Course title may not exceed 255 characters.',

            'description.string' => 'Description must be text.',

            'level.in' => 'Course level is invalid.',

            'type.in' => 'Course type is invalid.',

            'price.required' => 'Price is required for paid courses.',
            'price.numeric' => 'Price must be a number.',
            'price.min' => 'Price must not be negative.',

            'thumbnail.image' => 'Thumbnail must be an image.',
            'thumbnail.max' => 'Thumbnail size may not exceed 2MB.',

            'status.in' => 'Course status is invalid.',
        ];
    }
}
