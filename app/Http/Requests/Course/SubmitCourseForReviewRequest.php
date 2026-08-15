<?php

namespace App\Http\Requests\Course;

use Illuminate\Foundation\Http\FormRequest;

class SubmitCourseForReviewRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->role === 'instructor'
            && ($this->user()->can('update', $this->route('course')) ?? false);
    }

    public function rules(): array
    {
        return [];
    }
}
