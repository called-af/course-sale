<?php

namespace App\Http\Requests\User;

use App\Models\User;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateUserRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        // Admin routes bind {user}; the self-service profile routes do not.
        $routeUser = $this->route('user');
        $targetUserId = $routeUser instanceof User
            ? $routeUser->getKey()
            : $this->user()?->getKey();

        $rules = [
            'name' => ['sometimes', 'string', 'max:255'],
            'email' => [
                'sometimes',
                'email',
                Rule::unique('users')->ignore($targetUserId),
            ],
            'password' => ['nullable', 'min:8'],
            'avatar' => ['nullable', 'image', 'max:2048'],
            'bio' => ['nullable', 'string', 'max:1000'],
        ];

        // Only admins may change a role. Without this check a student could
        // escalate their own privileges through the profile endpoint.
        if ($this->user()?->role === 'admin') {
            $rules['role'] = ['sometimes', 'in:student,instructor,admin'];
        }

        return $rules;
    }
}
