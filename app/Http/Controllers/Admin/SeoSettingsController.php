<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\SeoSetting;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class SeoSettingsController extends Controller
{
    public function edit(): Response
    {
        $this->authorize('manage-settings');

        return Inertia::render('admin/settings/Seo', [
            'seo' => SeoSetting::current()->toFormArray(),
            'robotsOptions' => SeoSetting::ROBOTS_OPTIONS,
            'ogTypes' => SeoSetting::OG_TYPES,
            'twitterCards' => SeoSetting::TWITTER_CARDS,
        ]);
    }

    public function update(Request $request): RedirectResponse
    {
        $this->authorize('manage-settings');

        $validated = $request->validate([
            'meta_title' => ['nullable', 'string', 'max:255'],
            'meta_description' => ['nullable', 'string', 'max:500'],
            'meta_keywords' => ['nullable', 'string', 'max:255'],
            'canonical_url' => ['nullable', 'url', 'max:255'],
            'robots' => ['required', 'string', Rule::in(SeoSetting::ROBOTS_OPTIONS)],

            'og_title' => ['nullable', 'string', 'max:255'],
            'og_description' => ['nullable', 'string', 'max:500'],
            'og_image' => ['nullable', 'string', 'max:255'],
            'og_image_file' => ['nullable', 'file', 'mimes:jpg,jpeg,png,webp', 'max:4096'],
            'og_type' => ['required', 'string', Rule::in(SeoSetting::OG_TYPES)],
            'twitter_card' => ['required', 'string', Rule::in(SeoSetting::TWITTER_CARDS)],
            'twitter_site' => ['nullable', 'string', 'max:100', 'regex:/^@?[A-Za-z0-9_]{1,50}$/'],

            'google_site_verification' => ['nullable', 'string', 'max:120', 'regex:/^[A-Za-z0-9_\-]+$/'],
            'bing_site_verification' => ['nullable', 'string', 'max:120', 'regex:/^[A-Za-z0-9_\-]+$/'],
            'google_analytics_id' => ['nullable', 'string', 'max:50', 'regex:/^(G|UA|AW)-[A-Za-z0-9\-]+$/'],
            'google_tag_manager_id' => ['nullable', 'string', 'max:30', 'regex:/^GTM-[A-Za-z0-9]+$/'],
            'remove_og_image' => ['sometimes', 'boolean'],
        ], [
            'canonical_url.url' => 'Canonical URL must be a full address (https://...).',
            'og_image_file.image' => 'OG image file must be an image.',
            'twitter_site.regex' => 'Twitter/X handle may only contain letters, numbers, and underscores.',
            'google_analytics_id.regex' => 'Analytics ID must use the format G-XXXX, UA-XXXX, or AW-XXXX.',
            'google_tag_manager_id.regex' => 'Tag Manager ID must use the format GTM-XXXX.',
        ]);

        $setting = SeoSetting::current();
        $oldStoredPath = $setting->storedOgImagePath();

        $setting->fill([
            'meta_title' => $validated['meta_title'] ?? null,
            'meta_description' => $validated['meta_description'] ?? null,
            'meta_keywords' => $validated['meta_keywords'] ?? null,
            'canonical_url' => $validated['canonical_url'] ?? null,
            'robots' => $validated['robots'],
            'og_title' => $validated['og_title'] ?? null,
            'og_description' => $validated['og_description'] ?? null,
            'og_type' => $validated['og_type'],
            'twitter_card' => $validated['twitter_card'],
            'twitter_site' => $validated['twitter_site'] ?? null,
            'google_site_verification' => $validated['google_site_verification'] ?? null,
            'bing_site_verification' => $validated['bing_site_verification'] ?? null,
            'google_analytics_id' => $validated['google_analytics_id'] ?? null,
            'google_tag_manager_id' => $validated['google_tag_manager_id'] ?? null,
        ]);

        if ($request->hasFile('og_image_file')) {
            $path = $request->file('og_image_file')->store('seo', 'public');
            $setting->og_image = $path;

            if ($oldStoredPath && $oldStoredPath !== $path) {
                Storage::disk('public')->delete($oldStoredPath);
            }
        } elseif ($request->boolean('remove_og_image')) {
            $setting->og_image = null;

            if ($oldStoredPath) {
                Storage::disk('public')->delete($oldStoredPath);
            }
        } else {
            $ogImage = trim((string) ($validated['og_image'] ?? ''));

            if ($ogImage !== '' && $ogImage !== (string) $setting->og_image) {
                if ($oldStoredPath) {
                    Storage::disk('public')->delete($oldStoredPath);
                }

                $setting->og_image = $ogImage;
            }
        }

        $setting->save();

        return back()->with('success', 'SEO settings saved successfully.');
    }
}
