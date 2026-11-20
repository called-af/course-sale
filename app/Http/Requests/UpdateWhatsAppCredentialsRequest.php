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
                        $fail('The password you entered is incorrect.');
                    }
                },
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'base_url.required' => 'Infobip Base URL is required.',
            'base_url.url' => 'Base URL must be a valid URL.',
            'base_url.max' => 'Base URL is too long.',
            'from_number.required' => 'Sender number (From Number) is required.',
            'from_number.max' => 'Sender number is too long.',
            'api_key.required' => 'API Key is required.',
            'api_key.min' => 'API Key must be at least 8 characters.',
            'current_password.required' => 'Account password is required for security confirmation.',
        ];
    }
}
