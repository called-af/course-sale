<?php

namespace Tests\Feature;

use App\Models\SeoSetting;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class SeoSettingsTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_view_and_update_seo_settings(): void
    {
        /** @var User $user */
        $user = User::factory()->create(['role' => 'admin']);
        $this->actingAs($user);

        $this->get(route('admin.settings.seo'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('admin/settings/Seo')
                ->has('seo')
                ->has('robotsOptions'));

        $this->post(route('admin.settings.seo.update'), [
            'meta_title' => 'KursusIO — Belajar Digital',
            'meta_description' => 'Platform kursus online untuk meningkatkan skill digital.',
            'meta_keywords' => 'kursus online, belajar digital',
            'canonical_url' => 'https://kursusio.test',
            'robots' => 'index,follow',
            'og_title' => 'KursusIO',
            'og_description' => 'Belajar skill digital bersama mentor.',
            'og_type' => 'website',
            'twitter_card' => 'summary_large_image',
            'twitter_site' => '@kursusio',
            'google_analytics_id' => 'G-ABC1234567',
            'google_tag_manager_id' => 'GTM-ABC1234',
        ])->assertRedirect();

        $seo = SeoSetting::current();

        $this->assertSame('KursusIO — Belajar Digital', $seo->meta_title);
        $this->assertSame('@kursusio', $seo->twitter_site);
        $this->assertSame('G-ABC1234567', $seo->google_analytics_id);

        $this->get('/')
            ->assertOk()
            ->assertSee('KursusIO — Belajar Digital', false)
            ->assertSee('G-ABC1234567', false);
    }

    public function test_admin_can_upload_an_og_image(): void
    {
        Storage::fake('public');

        /** @var User $user */
        $user = User::factory()->create(['role' => 'admin']);
        $this->actingAs($user);

        // PNG 1×1 agar test tidak bergantung pada ekstensi GD.
        $png = base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+ip1sAAAAASUVORK5CYII=');

        $this->post(route('admin.settings.seo.update'), [
            'robots' => 'index,follow',
            'og_type' => 'website',
            'twitter_card' => 'summary_large_image',
            'og_image_file' => UploadedFile::fake()->createWithContent('share.png', $png),
        ])->assertRedirect();

        $seo = SeoSetting::current();

        $this->assertNotNull($seo->og_image);
        Storage::disk('public')->assertExists($seo->og_image);
    }

    public function test_non_admin_cannot_access_seo_settings(): void
    {
        /** @var User $user */
        $user = User::factory()->create(['role' => 'student']);
        $this->actingAs($user);

        $this->get(route('admin.settings.seo'))->assertForbidden();
    }
}
