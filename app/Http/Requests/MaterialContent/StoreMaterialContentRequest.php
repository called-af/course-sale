<?php

namespace App\Http\Requests\MaterialContent;

use Illuminate\Foundation\Http\FormRequest;

class StoreMaterialContentRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()?->can('create', [\App\Models\MaterialContent::class, $this->route('material')]) ?? false;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:255'],
            'sort_order' => ['nullable', 'integer', 'min:1'],
            'status' => ['required', 'in:draft,published'],
        ];
    }
}
