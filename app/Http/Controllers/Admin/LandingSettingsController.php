<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\LandingSetting;
use App\Services\LandingService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class LandingSettingsController extends Controller
{
    public function edit(string $section, LandingService $landing): Response
    {
        $this->authorize('manage-settings');
        $this->ensureSection($section);

        return Inertia::render('admin/landing/Settings', [
            'section' => $section,
            'label' => LandingSetting::LABELS[$section],
            'content' => LandingSetting::content($section),
            'testimonials' => $section === LandingSetting::SECTION_TESTIMONIAL
                ? $landing->testimonials()
                : [],
        ]);
    }

    public function update(Request $request, string $section): RedirectResponse
    {
        $this->authorize('manage-settings');
        $this->ensureSection($section);

        $content = $request->input('content');

        abort_unless(is_array($content), 422, 'Konten landing tidak valid.');

        if ($section === LandingSetting::SECTION_HERO) {
            $content = $this->handleHeroMedia($request, $content, 'photos');
            $content = $this->handleHeroMedia($request, $content, 'avatars');
        }

        LandingSetting::put($section, $content);

        return back()->with('success', 'Konten '.LandingSetting::LABELS[$section].' berhasil disimpan.');
    }

    /**
     * Add uploaded hero media (photos or avatars) to the hero content and
     * clean up removed files. Existing values may be remote URLs or uploaded
     * storage paths; both are preserved unless replaced.
     *
     * @param  array<string, mixed>  $content
     * @return array<string, mixed>
     */
    private function handleHeroMedia(Request $request, array $content, string $key): array
    {
        $request->validate([
            $key => ['nullable', 'array'],
            $key.'.*' => ['file', 'mimes:jpg,jpeg,png,webp,gif', 'max:4096'],
        ]);

        $media = is_array($content[$key] ?? null) ? $content[$key] : [];
        $media = array_values(array_filter($media, fn ($value) => is_string($value) && trim($value) !== ''));

        $oldRaw = LandingSetting::content(LandingSetting::SECTION_HERO)[$key] ?? [];
        $old = is_array($oldRaw) ? $oldRaw : [];

        $uploads = $request->file($key, []);
        $uploads = is_array($uploads) ? array_filter($uploads) : [];

        foreach ($uploads as $file) {
            if (! $file->isValid()) {
                continue;
            }

            $media[] = '/storage/'.$file->store('landing/'.$key, 'public');
        }

        $content[$key] = $media;

        $prefix = '/storage/landing/'.$key.'/';

        foreach ($old as $oldValue) {
            if (is_string($oldValue) && ! in_array($oldValue, $media, true) && Str::startsWith($oldValue, $prefix)) {
                Storage::disk('public')->delete(Str::after($oldValue, '/storage/'));
            }
        }

        return $content;
    }

    private function ensureSection(string $section): void
    {
        abort_unless(in_array($section, LandingSetting::SECTIONS, true), 404);
    }
}
