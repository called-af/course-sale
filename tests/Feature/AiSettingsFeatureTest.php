<?php

namespace Tests\Feature;

use App\Models\AiSetting;
use App\Models\User;
use App\Services\AiSettings;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class AiSettingsFeatureTest extends TestCase
{
    use RefreshDatabase;

    public function test_service_rejects_base_url_change_without_new_key(): void
    {
        AiSetting::create([
            'id' => 1,
            'enabled' => true,
            'base_url' => 'https://ai.example.test/v1',
            'model' => 'assistant',
            'api_key' => 'old-secret',
        ]);

        $this->expectException(\RuntimeException::class);
        app(AiSettings::class)->saveCredentials([
            'base_url' => 'https://ai.example.test/v2',
            'model' => 'new-model',
            'api_key' => '',
        ]);
    }

    public function test_invalid_current_password_does_not_change_settings(): void
    {
        $setting = AiSetting::create([
            'id' => 1,
            'enabled' => false,
            'base_url' => 'https://old.example.test/v1',
            'model' => 'old-model',
            'api_key' => 'old-secret',
        ]);

        $user = User::factory()->create([
            'role' => 'admin',
            'password' => Hash::make('correct-password'),
        ]);
        $this->actingAs($user);
        $this->withSession(['_token' => 'test-csrf-token']);

        $response = $this->put(route('admin.settings.ai.update'), [
            '_token' => 'test-csrf-token',
            'base_url' => 'https://new.example.test/v1',
            'model' => 'new-model',
            'api_key' => 'new-secret',
            'current_password' => 'wrong-password',
        ]);

        $response->assertSessionHasErrors('current_password');
        $this->assertSame('https://old.example.test/v1', $setting->fresh()->base_url);
    }

    public function test_password_verification_opens_edit_mode_only_for_correct_password(): void
    {
        /** @var User $user */
        $user = User::factory()->create([
            'role' => 'admin',
            'password' => Hash::make('correct-password'),
        ]);
        $this->actingAs($user);
        $this->withSession(['_token' => 'test-csrf-token']);

        $wrongResponse = $this->post(route('admin.settings.ai.verify-password'), [
            '_token' => 'test-csrf-token',
            'current_password' => 'wrong-password',
        ]);
        $wrongResponse->assertStatus(422);
        $wrongResponse->assertJsonPath('errors.current_password', 'Password yang dimasukkan salah.');

        $correctResponse = $this->post(route('admin.settings.ai.verify-password'), [
            '_token' => 'test-csrf-token',
            'current_password' => 'correct-password',
        ]);
        $correctResponse->assertOk();
        $correctResponse->assertJson(['success' => true]);
    }

    public function test_toggle_requires_complete_configuration(): void
    {
        $setting = AiSetting::create([
            'id' => 1,
            'enabled' => false,
            'base_url' => null,
            'model' => null,
            'api_key' => null,
        ]);

        $this->expectException(\RuntimeException::class);
        app(AiSettings::class)->setEnabled(true);
    }
}
