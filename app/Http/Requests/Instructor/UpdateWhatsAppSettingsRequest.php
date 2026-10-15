<?php

namespace App\Http\Requests\Instructor;

use Illuminate\Foundation\Http\FormRequest;

class UpdateWhatsAppSettingsRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()?->hasRole(['instructor', 'admin']) ?? false;
    }

    /**
     * Prepare the data for validation.
     */
    protected function prepareForValidation(): void
    {
        if ($this->has('whatsapp_number') && is_string($this->whatsapp_number)) {
            // Strip spaces, dashes, and parentheses
            $cleaned = preg_replace('/[\s\-()]+/', '', trim($this->whatsapp_number));
            $this->merge([
                'whatsapp_number' => $cleaned !== '' ? $cleaned : null,
            ]);
        }
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'whatsapp_notification_enabled' => ['required', 'boolean'],
            'whatsapp_number' => [
                'nullable',
                'string',
                'max:25',
                'required_if:whatsapp_notification_enabled,true,1',
                'regex:/^(\+?[1-9]\d{7,14}|08\d{8,12})$/',
            ],
        ];
    }

    /**
     * Get custom error messages for validator errors.
     */
    public function messages(): array
    {
        return [
            'whatsapp_number.required_if' => 'Nomor WhatsApp wajib diisi jika notifikasi diaktifkan.',
            'whatsapp_number.regex' => 'Format nomor WhatsApp harus valid (contoh: 081234567890 atau +6281234567890).',
        ];
    }
}
