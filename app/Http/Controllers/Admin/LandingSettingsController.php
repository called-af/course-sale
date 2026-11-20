<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\LandingSetting;
use App\Services\LandingService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
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
            'instructorOptions' => $section === LandingSetting::SECTION_INSTRUCTOR
                ? $landing->instructorOptions()
                : [],
            'certificateOptions' => $section === LandingSetting::SECTION_CERTIFICATE
                ? $landing->certificateOptions()
                : [],
        ]);
    }

    public function update(Request $request, string $section): RedirectResponse
    {
        $this->authorize('manage-settings');
        $this->ensureSection($section);

        $content = $request->input('content');

        abort_unless(is_array($content), 422, 'Invalid landing content.');

        if ($section === LandingSetting::SECTION_HERO) {
            $content = $this->handleHeroMedia($request, $content, 'photos');
            $content = $this->handleHeroMedia($request, $content, 'avatars');
        }

        if ($section === LandingSetting::SECTION_TRUST) {
            $content = $this->handlePaymentLogos($request, $content);
        }

        $content = $this->normalizeContent($section, $content);

        Validator::make($content, $this->rules($section))->validate();

        LandingSetting::put($section, $content);

        return back()->with('success', LandingSetting::LABELS[$section].' content saved successfully.');
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

    /**
     * Store uploaded payment logos and prune files that are no longer used.
     *
     * @param  array<string, mixed>  $content
     * @return array<string, mixed>
     */
    private function handlePaymentLogos(Request $request, array $content): array
    {
        $request->validate([
            'payment_logo_files' => ['nullable', 'array', 'max:40'],
            'payment_logo_files.*' => ['file', 'mimes:png,jpg,jpeg,webp', 'max:2048'],
        ]);

        $logos = $this->cleanPaymentLogos($content['payment_logos'] ?? []);

        $allowedKeys = [];
        $methods = $content['payment_methods'] ?? [];

        if (is_array($methods)) {
            foreach ($methods as $method) {
                $key = $this->paymentMethodKey($method);

                if ($key !== '') {
                    $allowedKeys[$key] = true;
                }
            }
        }

        $uploads = $request->file('payment_logo_files', []);
        $uploads = is_array($uploads) ? $uploads : [];

        foreach ($uploads as $rawKey => $file) {
            $key = $this->paymentMethodKey((string) $rawKey);

            if ($key === '' || ! isset($allowedKeys[$key]) || ! $file->isValid()) {
                continue;
            }

            $path = $file->store('payment-logos', 'public');

            if ($path) {
                $logos[$key] = '/storage/'.$path;
            }
        }

        $content['payment_logos'] = $logos;

        $old = $this->cleanPaymentLogos(LandingSetting::content(LandingSetting::SECTION_TRUST)['payment_logos'] ?? []);

        foreach ($old as $key => $url) {
            if (($logos[$key] ?? null) !== $url) {
                $path = $this->storedPaymentLogoPath($url);

                if ($path !== null) {
                    Storage::disk('public')->delete($path);
                }
            }
        }

        return $content;
    }

    /**
     * Keep only safe logo URLs, keyed by normalized payment-method label.
     *
     * @return array<string, string>
     */
    private function cleanPaymentLogos(mixed $value): array
    {
        if (! is_array($value)) {
            return [];
        }

        $logos = [];

        foreach ($value as $key => $url) {
            $key = $this->paymentMethodKey((string) $key);

            if ($key === '' || ! is_string($url)) {
                continue;
            }

            $url = trim($url);

            if ($url === '') {
                continue;
            }

            if (Str::startsWith($url, '/storage/payment-logos/') && $this->storedPaymentLogoPath($url) === null) {
                continue;
            }

            if (! Str::startsWith($url, ['/storage/payment-logos/', 'http://', 'https://'])) {
                continue;
            }

            $logos[$key] = Str::limit($url, 500, '');
        }

        return $logos;
    }

    private function paymentMethodKey(mixed $value): string
    {
        $text = is_scalar($value) ? (string) $value : '';
        $key = preg_replace('/[^a-z0-9]/', '', Str::lower($text)) ?? '';

        return Str::limit($key, 80, '');
    }

    private function storedPaymentLogoPath(string $url): ?string
    {
        if (! Str::startsWith($url, '/storage/payment-logos/')) {
            return null;
        }

        $path = Str::after($url, '/storage/');

        return Str::startsWith($path, 'payment-logos/') && ! str_contains($path, '..') ? $path : null;
    }

    /**
     * Strip unknown keys and coerce values into the shape declared by the
     * section defaults. Only known, sanitized data reaches the database.
     *
     * @param  array<string, mixed>  $content
     * @return array<string, mixed>
     */
    private function normalizeContent(string $section, array $content): array
    {
        $defaults = LandingSetting::defaultsFor($section);
        $clean = [];

        foreach ($defaults as $key => $default) {
            if (! array_key_exists($key, $content)) {
                continue;
            }

            $value = $content[$key];

            if ($key === 'payment_logos') {
                $clean[$key] = $this->cleanPaymentLogos($value);

                continue;
            }

            $clean[$key] = match (true) {
                is_bool($default) => filter_var($value, FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE) ?? $default,
                is_int($default) => is_numeric($value) ? (int) $value : $default,
                is_string($default) => str_ends_with($key, '_href') || $key === 'href'
                    ? $this->safeHref($value)
                    : $this->cleanString($value, $this->stringLimit($key)),
                is_array($default) => $this->cleanList($key, $value),
                default => $value,
            };
        }

        return $clean;
    }

    private function cleanString(mixed $value, int $max): string
    {
        $string = is_scalar($value) ? (string) $value : '';
        $string = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/u', '', $string) ?? '';

        return Str::limit($string, $max, '');
    }

    /**
     * Keep only safe, resolvable link targets. Empty values are allowed for
     * optional footer links.
     */
    private function safeHref(mixed $value): string
    {
        $href = trim(is_scalar($value) ? (string) $value : '');

        if ($href === '') {
            return '';
        }

        return Str::startsWith($href, ['/', '#', 'http://', 'https://', 'mailto:', 'tel:'])
            ? $href
            : '#';
    }

    /**
     * @return list<mixed>
     */
    private function cleanList(string $key, mixed $value): array
    {
        if (! is_array($value) || ! array_is_list($value)) {
            return [];
        }

        if ($key === 'selected_ids' || $key === 'featured_ids') {
            return $this->positiveIds($value);
        }

        if (in_array($key, ['avatars', 'photos'], true)) {
            return $this->cleanStrings($value, 500);
        }

        if (in_array($key, ['highlights', 'points', 'audiences', 'payment_methods', 'guarantees'], true)) {
            return $this->cleanStrings($value, 180);
        }

        if ($key === 'stats') {
            return $this->cleanObjects($value, ['value' => 180, 'label' => 180]);
        }

        if ($key === 'steps' || $key === 'benefits') {
            return $this->cleanObjects($value, [
                'title' => 180,
                'description' => 700,
                'icon' => 40,
            ]);
        }

        if ($key === 'items') {
            return $this->cleanObjects($value, [
                'question' => 300,
                'answer' => 2000,
            ]);
        }

        if ($key === 'socials' || $key === 'legal') {
            return $this->cleanObjects($value, [
                'name' => 120,
                'label' => 180,
                'href' => 500,
            ], ['href']);
        }

        if ($key === 'columns') {
            return $this->cleanColumns($value);
        }

        return [];
    }

    /**
     * @param  list<mixed>  $values
     * @return list<string>
     */
    private function cleanStrings(array $values, int $max): array
    {
        return array_values(array_map(fn ($value) => $this->cleanString($value, $max), $values));
    }

    /**
     * @param  list<mixed>  $values
     * @param  array<string, int>  $fields
     * @param  list<string>  $hrefFields
     * @return list<array<string, string>>
     */
    private function cleanObjects(array $values, array $fields, array $hrefFields = []): array
    {
        $rows = [];

        foreach ($values as $value) {
            if (! is_array($value)) {
                continue;
            }

            $row = [];

            foreach ($fields as $field => $max) {
                if (! array_key_exists($field, $value)) {
                    continue;
                }

                $row[$field] = in_array($field, $hrefFields, true)
                    ? $this->safeHref($value[$field])
                    : $this->cleanString($value[$field], $max);
            }

            $rows[] = $row;
        }

        return $rows;
    }

    /**
     * @param  list<mixed>  $values
     * @return list<array<string, mixed>>
     */
    private function cleanColumns(array $values): array
    {
        $columns = [];

        foreach ($values as $value) {
            if (! is_array($value)) {
                continue;
            }

            $links = $value['links'] ?? [];
            $cleanLinks = [];

            if (is_array($links) && array_is_list($links)) {
                foreach ($links as $link) {
                    if (! is_array($link)) {
                        continue;
                    }

                    $cleanLinks[] = [
                        'label' => $this->cleanString($link['label'] ?? '', 180),
                        'href' => $this->safeHref($link['href'] ?? ''),
                    ];
                }
            }

            $columns[] = [
                'title' => $this->cleanString($value['title'] ?? '', 180),
                'links' => $cleanLinks,
            ];
        }

        return $columns;
    }

    /**
     * @return array<string, array<int, mixed>>
     */
    private function rules(string $section): array
    {
        $rules = [];

        foreach (LandingSetting::defaultsFor($section) as $key => $default) {
            $rules[$key] = match (true) {
                is_bool($default) => ['boolean'],
                is_int($default) => ['integer'],
                is_string($default) => ['string', 'max:'.$this->stringLimit($key)],
                is_array($default) => ['array'],
                default => ['nullable'],
            };
        }

        $rules['limit'] = ['integer', 'min:1', 'max:'.$this->limitMax($section)];

        if ($section === LandingSetting::SECTION_TESTIMONIAL) {
            $rules['min_rating'] = ['integer', 'min:1', 'max:5'];
        }

        if ($section === LandingSetting::SECTION_INSTRUCTOR) {
            $rules['mode'] = [Rule::in(['selected', 'all'])];
            $rules['sort'] = [Rule::in(['selected', 'courses', 'students', 'name'])];
            $rules['selected_ids'] = ['array', 'max:24'];
            $rules['selected_ids.*'] = ['integer', Rule::exists('users', 'id')];
        }

        if ($section === LandingSetting::SECTION_CERTIFICATE) {
            $rules['mode'] = [Rule::in(['latest', 'featured'])];
            $rules['featured_ids'] = ['array', 'max:12'];
            $rules['featured_ids.*'] = ['integer', Rule::exists('certificates', 'id')];
            $rules['rotate_seconds'] = ['integer', 'min:2', 'max:60'];
        }

        if ($section === LandingSetting::SECTION_HOW_IT_WORKS) {
            $rules['steps'] = ['array', 'min:1', 'max:12'];
            $rules['steps.*.title'] = ['required', 'string', 'max:180'];
            $rules['steps.*.description'] = ['required', 'string', 'max:700'];
            $rules['steps.*.icon'] = ['required', 'string', 'max:40'];
        }

        if ($section === LandingSetting::SECTION_BENEFIT) {
            $rules['benefits'] = ['array', 'min:1', 'max:12'];
            $rules['benefits.*.title'] = ['required', 'string', 'max:180'];
            $rules['benefits.*.description'] = ['required', 'string', 'max:700'];
            $rules['benefits.*.icon'] = ['required', 'string', 'max:40'];
            $rules['audiences'] = ['array', 'max:20'];
            $rules['audiences.*'] = ['string', 'max:180'];
        }

        if ($section === LandingSetting::SECTION_CERTIFICATE) {
            $rules['points'] = ['array', 'max:20'];
            $rules['points.*'] = ['string', 'max:180'];
        }

        if ($section === LandingSetting::SECTION_FAQ) {
            $rules['items'] = ['array', 'min:1', 'max:30'];
            $rules['items.*.question'] = ['required', 'string', 'max:300'];
            $rules['items.*.answer'] = ['required', 'string', 'max:2000'];
        }

        if ($section === LandingSetting::SECTION_TRUST) {
            $rules['payment_methods'] = ['array', 'max:40'];
            $rules['payment_methods.*'] = ['string', 'max:180'];
            $rules['payment_logos.*'] = ['string', 'max:500'];
            $rules['guarantees'] = ['array', 'max:20'];
            $rules['guarantees.*'] = ['string', 'max:180'];
        }

        if ($section === LandingSetting::SECTION_ABOUT) {
            $rules['highlights'] = ['array', 'max:20'];
            $rules['highlights.*'] = ['string', 'max:180'];
            $rules['stats'] = ['array', 'max:20'];
            $rules['stats.*.value'] = ['required', 'string', 'max:180'];
            $rules['stats.*.label'] = ['required', 'string', 'max:180'];
        }

        if ($section === LandingSetting::SECTION_HERO) {
            $rules['avatars'] = ['array', 'max:20'];
            $rules['avatars.*'] = ['string', 'max:500'];
            $rules['photos'] = ['array', 'max:20'];
            $rules['photos.*'] = ['string', 'max:500'];
        }

        if ($section === LandingSetting::SECTION_FOOTER) {
            $rules['columns'] = ['array', 'max:10'];
            $rules['columns.*.title'] = ['required', 'string', 'max:180'];
            $rules['columns.*.links'] = ['array', 'max:30'];
            $rules['columns.*.links.*.label'] = ['required', 'string', 'max:180'];
            $rules['columns.*.links.*.href'] = ['string', 'max:500'];
            $rules['socials'] = ['array', 'max:20'];
            $rules['socials.*.name'] = ['required', 'string', 'max:120'];
            $rules['socials.*.href'] = ['string', 'max:500'];
            $rules['legal'] = ['array', 'max:20'];
            $rules['legal.*.label'] = ['required', 'string', 'max:180'];
            $rules['legal.*.href'] = ['string', 'max:500'];
        }

        return $rules;
    }

    private function stringLimit(string $key): int
    {
        return match (true) {
            in_array($key, ['paragraph_1', 'paragraph_2', 'description'], true) => 2000,
            str_ends_with($key, '_href') || $key === 'href' => 500,
            default => 500,
        };
    }

    private function limitMax(string $section): int
    {
        return $section === LandingSetting::SECTION_CERTIFICATE ? 12 : 24;
    }

    /**
     * @return list<int>
     */
    private function positiveIds(mixed $ids): array
    {
        if (! is_array($ids)) {
            return [];
        }

        return array_values(array_unique(array_filter(
            array_map('intval', $ids),
            fn (int $id) => $id > 0,
        )));
    }

    private function ensureSection(string $section): void
    {
        abort_unless(in_array($section, LandingSetting::SECTIONS, true), 404);
    }
}
