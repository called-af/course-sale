<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SeoSetting extends Model
{
    public const ROBOTS_OPTIONS = [
        'index,follow',
        'index,nofollow',
        'noindex,follow',
        'noindex,nofollow',
    ];

    public const OG_TYPES = [
        'website',
        'article',
        'product',
        'profile',
        'video.other',
    ];

    public const TWITTER_CARDS = [
        'summary',
        'summary_large_image',
        'app',
        'player',
    ];

    protected $table = 'seo_settings';

    protected $fillable = [
        'id',
        'meta_title',
        'meta_description',
        'meta_keywords',
        'canonical_url',
        'robots',
        'og_title',
        'og_description',
        'og_image',
        'og_type',
        'twitter_card',
        'twitter_site',
        'google_site_verification',
        'bing_site_verification',
        'google_analytics_id',
        'google_tag_manager_id',
    ];

    public static function current(): self
    {
        return self::query()->firstOrCreate(['id' => 1], [
            'robots' => 'index,follow',
            'og_type' => 'website',
            'twitter_card' => 'summary_large_image',
        ]);
    }

    /**
     * Judul yang dipakai kalau admin belum mengisi meta title.
     */
    public function fallbackTitle(): string
    {
        return AppearanceSetting::current()->displayName();
    }

    /**
     * Deskripsi default kalau admin belum mengisi meta description.
     */
    public function fallbackDescription(): string
    {
        return 'Belajar keterampilan digital bersama mentor berpengalaman di '
            .AppearanceSetting::current()->displayName().'.';
    }

    public function resolvedTitle(): string
    {
        return filled($this->meta_title) ? (string) $this->meta_title : $this->fallbackTitle();
    }

    public function resolvedDescription(): string
    {
        return filled($this->meta_description) ? (string) $this->meta_description : $this->fallbackDescription();
    }

    public function resolvedOgTitle(): string
    {
        return filled($this->og_title) ? (string) $this->og_title : $this->resolvedTitle();
    }

    public function resolvedOgDescription(): string
    {
        return filled($this->og_description) ? (string) $this->og_description : $this->resolvedDescription();
    }

    /**
     * URL gambar OG yang bisa langsung dipakai di browser (relatif atau absolut).
     */
    public function ogImageUrl(): ?string
    {
        return self::resolveMediaUrl($this->og_image);
    }

    /**
     * URL absolut untuk meta tag yang dibaca crawler.
     */
    public function absoluteOgImageUrl(): ?string
    {
        $url = $this->ogImageUrl();

        if ($url === null) {
            return null;
        }

        if (str_starts_with($url, 'http://') || str_starts_with($url, 'https://')) {
            return $url;
        }

        return url($url);
    }

    /**
     * Path penyimpanan lokal (null jika isinya URL eksternal).
     */
    public function storedOgImagePath(): ?string
    {
        if (! filled($this->og_image)) {
            return null;
        }

        $value = (string) $this->og_image;

        if (str_starts_with($value, 'http://') || str_starts_with($value, 'https://')) {
            return null;
        }

        return ltrim(str_replace('/storage/', '', $value), '/');
    }

    public static function resolveMediaUrl(?string $value): ?string
    {
        if (! filled($value)) {
            return null;
        }

        $value = trim((string) $value);

        if (str_starts_with($value, 'http://') || str_starts_with($value, 'https://') || str_starts_with($value, '/')) {
            return $value;
        }

        return '/storage/'.ltrim($value, '/');
    }

    /**
     * Payload untuk Inertia (dipakai judul halaman & preview admin).
     *
     * @return array<string, string|null>
     */
    public function toSharedArray(): array
    {
        return [
            'title' => $this->resolvedTitle(),
            'description' => $this->resolvedDescription(),
            'keywords' => $this->meta_keywords,
            'og_title' => $this->resolvedOgTitle(),
            'og_description' => $this->resolvedOgDescription(),
            'og_image_url' => $this->ogImageUrl(),
        ];
    }

    /**
     * Payload untuk form admin (nilai mentah, bukan fallback).
     *
     * @return array<string, mixed>
     */
    public function toFormArray(): array
    {
        return [
            'meta_title' => $this->meta_title,
            'meta_description' => $this->meta_description,
            'meta_keywords' => $this->meta_keywords,
            'canonical_url' => $this->canonical_url,
            'robots' => $this->robots ?: 'index,follow',
            'og_title' => $this->og_title,
            'og_description' => $this->og_description,
            'og_image' => $this->og_image,
            'og_image_url' => $this->ogImageUrl(),
            'og_type' => $this->og_type ?: 'website',
            'twitter_card' => $this->twitter_card ?: 'summary_large_image',
            'twitter_site' => $this->twitter_site,
            'google_site_verification' => $this->google_site_verification,
            'bing_site_verification' => $this->bing_site_verification,
            'google_analytics_id' => $this->google_analytics_id,
            'google_tag_manager_id' => $this->google_tag_manager_id,
        ];
    }
}
