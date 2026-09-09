<?php

namespace App\Http\Requests\Comment;

use Illuminate\Foundation\Http\FormRequest;

class UpdateCommentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->role === 'student';
    }

    public function rules(): array
    {
        return [
            'body' => ['required', 'string', 'min:3', 'max:2000'],
        ];
    }

    public function messages(): array
    {
        return [
            'body.required' => 'Comment cannot be empty.',
            'body.min'      => 'Comment must be at least 3 characters.',
            'body.max'      => 'Comment cannot exceed 2000 characters.',
        ];
    }
}
