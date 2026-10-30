<?php

namespace Tests\Feature;

use App\Models\AppearanceSetting;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
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

    public function test_admin_can_update_the_app_identity(): void
    {
        /** @var User $user */
        $user = User::factory()->create(['role' => 'admin']);
        $this->actingAs($user);

        $this->put(route('admin.settings.identity.update'), [
            'app_name' => 'BelajarKu',
            'contact_email' => 'halo@belajarku.id',
        ])->assertRedirect();

        $setting = AppearanceSetting::current();

        $this->assertSame('BelajarKu', $setting->app_name);
        $this->assertSame('halo@belajarku.id', $setting->contact_email);

        $this->get(route('admin.settings.general'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('appearance.name', 'BelajarKu')
                ->where('appearance.contact_email', 'halo@belajarku.id')
                ->where('appearance.domain', 'belajarku.id'));
    }

    public function test_app_identity_requires_a_name(): void
    {
        /** @var User $user */
        $user = User::factory()->create(['role' => 'admin']);
        $this->actingAs($user);

        $this->put(route('admin.settings.identity.update'), [
            'app_name' => '',
        ])->assertSessionHasErrors('app_name');
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

    public function test_admin_can_upload_and_restore_the_app_logo(): void
    {
        Storage::fake('public');

        /** @var User $user */
        $user = User::factory()->create(['role' => 'admin']);
        $this->actingAs($user);

        $this->get(route('admin.settings.general'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('appearance.has_custom_logo', false)
                ->where('appearance.logo_url', '/images/logo.svg'));

        $this->post(route('admin.settings.logo.update'), [
            'logo' => UploadedFile::fake()->createWithContent(
                'brand-logo.svg',
                file_get_contents(public_path('images/logo.svg')),
            ),
        ])->assertRedirect();

        $setting = AppearanceSetting::current();

        $this->assertNotNull($setting->logo_path);
        Storage::disk('public')->assertExists($setting->logo_path);

        $this->get(route('admin.settings.general'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('appearance.has_custom_logo', true)
                ->where('appearance.logo_url', fn (string $url) => str_starts_with($url, '/storage/branding/')));

        $this->delete(route('admin.settings.logo.destroy'))
            ->assertRedirect();

        $this->assertNull($setting->fresh()->logo_path);
        Storage::disk('public')->assertMissing($setting->logo_path);
    }

    public function test_logo_upload_rejects_unsupported_files(): void
    {
        Storage::fake('public');

        /** @var User $user */
        $user = User::factory()->create(['role' => 'admin']);
        $this->actingAs($user);

        $this->post(route('admin.settings.logo.update'), [
            'logo' => UploadedFile::fake()->create('logo.pdf', 100, 'application/pdf'),
        ])->assertSessionHasErrors('logo');

        $this->assertNull(AppearanceSetting::current()->logo_path);
    }
}
