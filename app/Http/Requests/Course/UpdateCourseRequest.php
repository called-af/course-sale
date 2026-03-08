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
            'title.string' => 'Judul course harus berupa teks.',
            'title.max' => 'Judul course maksimal 255 karakter.',

            'description.string' => 'Deskripsi harus berupa teks.',

            'level.in' => 'Level course tidak valid.',

            'type.in' => 'Tipe course tidak valid.',

            'price.required' => 'Harga wajib diisi untuk course berbayar.',
            'price.numeric' => 'Harga harus berupa angka.',
            'price.min' => 'Harga tidak boleh negatif.',

            'thumbnail.image' => 'Thumbnail harus berupa gambar.',
            'thumbnail.max' => 'Ukuran thumbnail maksimal 2MB.',

            'status.in' => 'Status course tidak valid.',
        ];
    }
}
