<?php

namespace Tests\Feature;

use App\Models\RecommendationSetting;
use App\Models\User;
use App\Services\RecommendationService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class RecommendationSettingsFeatureTest extends TestCase
{
    use RefreshDatabase;

    public function test_recommendation_can_be_disabled(): void
    {
        RecommendationSetting::create([
            'id' => 1,
            'enabled' => false,
        ]);

        $service = app(RecommendationService::class);

        $this->assertSame([], $service->getRecommendations(null, 2));
    }

    public function test_admin_can_toggle_recommendation_from_general_settings(): void
    {
        $user = User::factory()->create([
            'role' => 'admin',
            'password' => Hash::make('correct-password'),
        ]);

        $this->actingAs($user);

        $response = $this->patch(route('admin.settings.recommendation.toggle'), [
            'enabled' => false,
        ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('recommendation_settings', [
            'id' => 1,
            'enabled' => false,
        ]);
    }
}
