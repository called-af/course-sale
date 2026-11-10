<?php

namespace App\Http\Requests\Comment;

use Illuminate\Foundation\Http\FormRequest;

class StoreCommentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->role === 'student';
    }

    public function rules(): array
    {
        return [
            'body' => ['required', 'string', 'min:3', 'max:2000'],
            'parent_id' => ['nullable', 'integer', 'exists:comments,id'],
        ];
    }

    public function messages(): array
    {
        return [
            'body.required' => 'Comment cannot be empty.',
            'body.min' => 'Comment must be at least 3 characters.',
            'body.max' => 'Comment cannot exceed 2000 characters.',
            'parent_id.exists' => 'The comment you are replying to does not exist.',
        ];
    }
}
