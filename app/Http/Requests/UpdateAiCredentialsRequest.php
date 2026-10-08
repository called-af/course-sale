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
            'base_url.required' => 'Base URL wajib diisi.',
            'base_url.url' => 'Base URL tidak valid.',
            'base_url.max' => 'Base URL terlalu panjang.',
            'base_url.secure_https_url' => 'Base URL harus memakai HTTPS yang aman.',
            'model.required' => 'Nama model wajib diisi.',
            'model.max' => 'Nama model terlalu panjang.',
            'api_key.required' => 'API key wajib diisi untuk konfigurasi pertama.',
            'api_key.min' => 'API key minimal 8 karakter.',
            'current_password.required' => 'Konfirmasi password wajib diisi.',
        ];
    }

    private function validateSecureHttpsUrl(mixed $value, callable $fail): void
    {
        if (! is_string($value) || ! str_starts_with(strtolower($value), 'https://')) {
            $fail('Base URL harus memakai HTTPS.');

            return;
        }

        $host = parse_url($value, PHP_URL_HOST);
        if (! $host) {
            $fail('Base URL tidak memiliki host yang valid.');

            return;
        }

        $resolved = @gethostbyname($host);
        if (! $resolved || $resolved === $host) {
            $fail('Host Base URL tidak dapat diakses.');

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
                $fail('Base URL tidak boleh mengarah ke host pribadi atau reserved.');
            }
        }
    }
}
