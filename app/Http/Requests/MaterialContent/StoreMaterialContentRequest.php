<?php

namespace App\Http\Requests\MaterialContent;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

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

            'type' => [
                'required',
                Rule::in(['video', 'text', 'quiz', 'file', 'ppt']),
            ],

            'status' => ['required', 'in:draft,published'],

            'content_url' => ['nullable', 'string', 'max:2048'],
            'content_text' => ['nullable'],
            'duration' => ['nullable', 'integer', 'min:1'],

            // Uploaded files are stored on the public disk and their URL is
            // written to content_url by the service.
            'file' => array_filter([
                'nullable',
                'file',
                'max:51200', // 50 MB
                $this->input('type') === 'ppt'
                    ? 'mimes:pdf,ppt,pptx'
                    : 'mimes:pdf,doc,docx,ppt,pptx,xls,xlsx,zip,txt,csv,jpg,jpeg,png,webp',
            ]),
        ];
    }
}
