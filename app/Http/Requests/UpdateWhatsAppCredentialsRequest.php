<?php

namespace App\Http\Requests;

use App\Models\WhatsAppSetting;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class UpdateWhatsAppCredentialsRequest extends FormRequest
{
    public function authorize(): bool
    {
        Gate::authorize('manage-settings');

        return true;
    }

    public function rules(): array
    {
        $setting = WhatsAppSetting::current();
        $baseUrlChanged = $this->input('base_url') !== $setting->base_url;
        $hasExistingKey = ! empty($setting->api_key);

        return [
            'base_url' => [
                'required',
                'url',
                'max:255',
            ],
            'from_number' => [
                'required',
                'string',
                'max:50',
            ],
            'sandbox_keyword' => [
                'nullable',
                'string',
                'max:100',
            ],
            'api_key' => [
                'nullable',
                'string',
                'min:8',
                Rule::requiredIf($baseUrlChanged || ! $hasExistingKey),
            ],
            'provider' => [
                'nullable',
                'string',
                Rule::in(['infobip', 'meta']),
            ],
            'current_password' => [
                'required',
                'string',
                function (string $attribute, mixed $value, callable $fail): void {
                    if (! is_string($value) || ! Hash::check($value, $this->user()->getAuthPassword())) {
                        $fail('Password yang dimasukkan salah.');
                    }
                },
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'base_url.required' => 'Base URL Infobip wajib diisi.',
            'base_url.url' => 'Base URL harus berupa URL yang valid.',
            'base_url.max' => 'Base URL terlalu panjang.',
            'from_number.required' => 'Nomor pengirim (From Number) wajib diisi.',
            'from_number.max' => 'Nomor pengirim terlalu panjang.',
            'api_key.required' => 'API Key wajib diisi.',
            'api_key.min' => 'API Key minimal 8 karakter.',
            'current_password.required' => 'Password akun wajib diisi untuk konfirmasi keamanan.',
        ];
    }
}
