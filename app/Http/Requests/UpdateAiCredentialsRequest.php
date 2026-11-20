<?php

namespace App\Http\Requests;

use App\Models\AiSetting;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class UpdateAiCredentialsRequest extends FormRequest
{
    public function authorize(): bool
    {
        Gate::authorize('manage-settings');

        return true;
    }

    public function rules(): array
    {
        $setting = AiSetting::current();
        $baseUrlChanged = $this->input('base_url') !== $setting->base_url;
        $hasExistingKey = ! empty($setting->api_key);

        return [
            'base_url' => [
                'required',
                'url',
                'max:255',
                function (string $attribute, mixed $value, callable $fail): void {
                    $this->validateSecureHttpsUrl($value, $fail);
                },
            ],
            'model' => ['required', 'string', 'max:100'],
            'api_key' => [
                'nullable',
                'string',
                'min:8',
                Rule::requiredIf($baseUrlChanged || ! $hasExistingKey),
            ],
            'provider' => [
                'nullable',
                'string',
                Rule::in(['nvidia', 'openai']),
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
            'base_url.required' => 'Base URL is required.',
            'base_url.url' => 'Base URL is invalid.',
            'base_url.max' => 'Base URL is too long.',
            'base_url.secure_https_url' => 'Base URL must use secure HTTPS.',
            'model.required' => 'Model name is required.',
            'model.max' => 'Model name is too long.',
            'api_key.required' => 'API key is required for the initial configuration.',
            'api_key.min' => 'API key must be at least 8 characters.',
            'current_password.required' => 'Password confirmation is required.',
        ];
    }

    private function validateSecureHttpsUrl(mixed $value, callable $fail): void
    {
        if (! is_string($value) || ! str_starts_with(strtolower($value), 'https://')) {
            $fail('Base URL must use HTTPS.');

            return;
        }

        $host = parse_url($value, PHP_URL_HOST);
        if (! $host) {
            $fail('Base URL does not have a valid host.');

            return;
        }

        $resolved = @gethostbyname($host);
        if (! $resolved || $resolved === $host) {
            $fail('The Base URL host cannot be reached.');

            return;
        }

        $ip = inet_pton($resolved);
        if ($ip !== false) {
            $address = inet_ntop($ip);
            $octets = array_map('intval', explode('.', $address));
            if ($octets[0] === 10
                || ($octets[0] === 172 && $octets[1] >= 16 && $octets[1] <= 31)
                || ($octets[0] === 192 && $octets[1] === 168)
                || $octets[0] === 127
                || $octets[0] === 0
                || ($octets[0] === 169 && $octets[1] === 254)
            ) {
                $fail('Base URL must not point to a private or reserved host.');
            }
        }
    }
}
