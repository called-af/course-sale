<?php

namespace App\Http\Requests\CourseResource;

use App\Models\Course;
use Illuminate\Foundation\Http\FormRequest;

class UpdateCourseResourceRequest extends FormRequest
{
    public function authorize(): bool
    {
        $course = $this->route('course');

        return $course instanceof Course && ($this->user()?->can('update', $course) ?? false);
    }

    /**
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:2000'],
            'external_url' => ['nullable', 'url:http,https', 'max:2048'],
            'file' => ['nullable', 'file', 'max:20480', 'mimes:pdf,doc,docx,ppt,pptx,xls,xlsx,csv,txt,zip,jpg,jpeg,png,webp'],
            'status' => ['required', 'in:draft,published'],
        ];
    }
}
