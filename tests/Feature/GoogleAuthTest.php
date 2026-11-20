<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Socialite\Facades\Socialite;
use Laravel\Socialite\Two\User as SocialiteUser;
use Mockery;
use Tests\TestCase;

class GoogleAuthTest extends TestCase
{
    use RefreshDatabase;

    public function test_guest_is_redirected_to_google(): void
    {
        $provider = Mockery::mock('Laravel\Socialite\Contracts\Provider');
        $provider->shouldReceive('redirect')
            ->once()
            ->andReturn(redirect('https://accounts.google.com/o/oauth2/auth'));

        Socialite::shouldReceive('driver')
            ->with('google')
            ->once()
            ->andReturn($provider);

        $this->get(route('auth.google.redirect'))
            ->assertRedirect('https://accounts.google.com/o/oauth2/auth');
    }

    public function test_new_google_user_is_created_and_redirected_to_choose_role(): void
    {
        $googleUser = (new SocialiteUser)
            ->setRaw([
                'id' => 'google-123',
                'name' => 'Google User',
                'email' => 'google-user@example.com',
                'avatar' => 'https://example.com/avatar.png',
            ])
            ->map([
                'id' => 'google-123',
                'name' => 'Google User',
                'email' => 'google-user@example.com',
                'avatar' => 'https://example.com/avatar.png',
            ]);

        $provider = Mockery::mock('Laravel\Socialite\Contracts\Provider');
        $provider->shouldReceive('user')->once()->andReturn($googleUser);

        Socialite::shouldReceive('driver')
            ->with('google')
            ->once()
            ->andReturn($provider);

        $response = $this->get(route('auth.google.callback'));

        $response->assertRedirect('/choose-role');

        $user = User::where('email', 'google-user@example.com')->firstOrFail();

        $this->assertSame('Google User', $user->name);
        $this->assertSame('google-123', $user->google_id);
        $this->assertSame('https://example.com/avatar.png', $user->avatar);
        $this->assertNull($user->role);
        $this->assertNull($user->password);
        $this->assertNotNull($user->email_verified_at);
        $this->assertAuthenticatedAs($user);
    }

    public function test_existing_user_is_linked_to_google_and_redirected_home(): void
    {
        $user = User::factory()->create([
            'email' => 'existing@example.com',
            'google_id' => null,
            'role' => 'student',
            'email_verified_at' => null,
            'avatar' => null,
        ]);

        $googleUser = (new SocialiteUser)
            ->setRaw([
                'id' => 'google-456',
                'name' => 'Existing User',
                'email' => 'existing@example.com',
                'avatar' => 'https://example.com/existing-avatar.png',
            ])
            ->map([
                'id' => 'google-456',
                'name' => 'Existing User',
                'email' => 'existing@example.com',
                'avatar' => 'https://example.com/existing-avatar.png',
            ]);

        $provider = Mockery::mock('Laravel\Socialite\Contracts\Provider');
        $provider->shouldReceive('user')->once()->andReturn($googleUser);

        Socialite::shouldReceive('driver')
            ->with('google')
            ->once()
            ->andReturn($provider);

        $response = $this->get(route('auth.google.callback'));

        $response->assertRedirect(route('home.redirect'));

        $user->refresh();

        $this->assertSame('google-456', $user->google_id);
        $this->assertNotNull($user->email_verified_at);
        $this->assertSame('https://example.com/existing-avatar.png', $user->avatar);
        $this->assertAuthenticatedAs($user);
    }

    public function test_existing_google_user_can_login(): void
    {
        $user = User::factory()->create([
            'email' => 'linked@example.com',
            'google_id' => 'google-789',
            'role' => 'instructor',
        ]);

        $googleUser = (new SocialiteUser)
            ->setRaw([
                'id' => 'google-789',
                'name' => 'Linked User',
                'email' => 'linked@example.com',
            ])
            ->map([
                'id' => 'google-789',
                'name' => 'Linked User',
                'email' => 'linked@example.com',
            ]);

        $provider = Mockery::mock('Laravel\Socialite\Contracts\Provider');
        $provider->shouldReceive('user')->once()->andReturn($googleUser);

        Socialite::shouldReceive('driver')
            ->with('google')
            ->once()
            ->andReturn($provider);

        $response = $this->get(route('auth.google.callback'));

        $response->assertRedirect(route('home.redirect'));
        $this->assertAuthenticatedAs($user);
        $this->assertDatabaseCount('users', 1);
    }

    public function test_google_callback_failure_redirects_to_login(): void
    {
        $provider = Mockery::mock('Laravel\Socialite\Contracts\Provider');
        $provider->shouldReceive('user')->once()->andThrow(new \Exception('OAuth error'));

        Socialite::shouldReceive('driver')
            ->with('google')
            ->once()
            ->andReturn($provider);

        $response = $this->get(route('auth.google.callback'));

        $response->assertRedirect(route('login'));
        $response->assertSessionHas('error');
        $this->assertGuest();
    }
}
