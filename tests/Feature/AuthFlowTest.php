<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class AuthFlowTest extends TestCase
{
    use RefreshDatabase;

    public function test_guest_can_register_and_login_and_logout(): void
    {
        // Guest sees the registration form.
        $this->get('/register')->assertOk();

        // Create a new student account.
        $this->post('/register', [
            'name' => 'Test Student',
            'email' => 'test-student@example.com',
            'password' => 'secret123',
            'password_confirmation' => 'secret123',
        ])->assertRedirect();

        $user = User::query()->where('email', 'test-student@example.com')->firstOrFail();
        $this->assertNull($user->role);

        // Onboarding: new users pick a role (self-registration cannot pick admin).
        $this->post('/choose-role', ['role' => 'student'])->assertRedirect();

        $user->refresh();
        $this->assertSame('student', $user->role);
        $this->assertTrue(Hash::check('secret123', $user->password));

        // Guest is now redirected away from the guest-only pages.
        $this->get('/register')->assertRedirect();

        // Log in.
        $this->post('/login', [
            'email' => 'test-student@example.com',
            'password' => 'secret123',
        ])->assertRedirect();

        $this->assertAuthenticatedAs($user);

        // Log out.
        $this->post('/logout')->assertRedirect();

        $this->assertGuest();
    }

    public function test_user_can_login_and_logout(): void
    {
        $user = User::factory()->create([
            'password' => Hash::make('secret123'),
            'role' => 'student',
        ]);

        $this->post('/login', [
            'email' => $user->email,
            'password' => 'secret123',
        ])->assertRedirect();

        $this->assertAuthenticatedAs($user);

        $this->post('/logout')->assertRedirect();

        $this->assertGuest();
    }
}
