<?php

namespace App\Http\Requests\Enrollment;

use Illuminate\Foundation\Http\FormRequest;

class MarkProgressRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('view', $this->route('course')) ?? false;
    }

    public function rules(): array
    {
        return ['material_id' => ['required', 'integer', 'exists:materials,id']];
    }
}
