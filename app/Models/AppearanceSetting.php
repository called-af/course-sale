<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class AppearanceSetting extends Model
{
    public const PALETTES = [
        'purple', 'indigo', 'blue', 'teal', 'emerald',
        'cyan', 'rose', 'pink', 'orange', 'amber',
    ];

    public const DEFAULT_LOGO_URL = '/images/logo.svg';

    public const DEFAULT_APP_NAME = 'KursusIO';

    public const DEFAULT_CONTACT_EMAIL = 'hello@kursusio.com';

    protected $table = 'appearance_settings';

    protected $keyType = 'int';

    protected $fillable = [
        'id',
        'palette',
        'app_name',
        'contact_email',
        'logo_path',
    ];

    protected function casts(): array
    {
        return [
            'id' => 'integer',
        ];
    }

    public static function current(): self
    {
        return self::query()->firstOrCreate(['id' => 1], [
            'palette' => 'purple',
            'app_name' => self::DEFAULT_APP_NAME,
            'contact_email' => self::DEFAULT_CONTACT_EMAIL,
        ]);
    }

    /**
     * Brand name shown across the app (landing, dashboards, certificates, PDFs).
     */
    public function displayName(): string
    {
        return filled($this->app_name) ? (string) $this->app_name : self::DEFAULT_APP_NAME;
    }

    public function contactEmail(): string
    {
        return filled($this->contact_email)
            ? (string) $this->contact_email
            : self::DEFAULT_CONTACT_EMAIL;
    }

    /**
     * Domain used for verification URLs, derived from the contact email.
     */
    public function domain(): string
    {
        $email = $this->contactEmail();
        $domain = str_contains($email, '@') ? Str::after($email, '@') : '';

        return $domain !== '' ? $domain : 'kursusio.com';
    }

    public function getLogoUrlAttribute(): string
    {
        if (! $this->logo_path) {
            return self::DEFAULT_LOGO_URL;
        }

        // Keep the URL relative so the logo keeps working on any host/port
        // (e.g. localhost:8000, staging, or production) without depending on APP_URL.
        return '/storage/'.ltrim($this->logo_path, '/');
    }

    public function hasCustomLogo(): bool
    {
        return ! empty($this->logo_path);
    }
}
