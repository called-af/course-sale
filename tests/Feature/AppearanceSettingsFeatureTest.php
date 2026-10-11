<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class AppearanceSettingsFeatureTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_view_and_update_the_global_palette(): void
    {
        /** @var User $user */
        $user = User::factory()->create([
            'role' => 'admin',
            'password' => Hash::make('correct-password'),
        ]);
        $this->actingAs($user);

        $this->get(route('admin.settings.general'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('admin/settings/General')
                ->where('appearance.palette', 'purple'));

        $this->put(route('admin.settings.appearance.update'), ['palette' => 'blue'])
            ->assertRedirect();

        $this->assertDatabaseHas('appearance_settings', [
            'id' => 1,
            'palette' => 'blue',
        ]);
    }

    public function test_unsupported_palette_is_rejected(): void
    {
        /** @var User $user */
        $user = User::factory()->create(['role' => 'admin']);
        $this->actingAs($user);

        $this->put(route('admin.settings.appearance.update'), ['palette' => 'chartreuse'])
            ->assertSessionHasErrors('palette');

        $this->assertDatabaseMissing('appearance_settings', ['palette' => 'chartreuse']);
    }
}