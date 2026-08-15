<?php

namespace App\Http\Requests\Course;

use Illuminate\Foundation\Http\FormRequest;

class MoveCourseResourceRequest extends FormRequest
{
    public function authorize(): bool
    {
        $resource = $this->route('content') ?? $this->route('material') ?? $this->route('module');

        return $resource !== null && ($this->user()?->can('update', $resource) ?? false);
    }

    public function rules(): array
    {
        return ['direction' => ['required', 'in:up,down']];
    }
}
