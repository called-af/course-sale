<?php

namespace App\Services\WhatsApp;

use App\Models\AppearanceSetting;
use App\Models\Course;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class WhatsAppService
{
    protected string $provider;

    protected bool $enabled = true;

    // Infobip configuration
    protected ?string $infobipBaseUrl;

    protected ?string $infobipApiKey;

    protected string $infobipFrom;

    protected string $infobipSandboxKeyword;

    // Meta Cloud API configuration
    protected ?string $accessToken;

    protected ?string $phoneNumberId;

    protected string $apiVersion;

    protected ?string $templateName;

    protected string $templateLang;

    protected int $timeout;

    public function __construct()
    {
        $this->loadConfiguration();
    }

    public function loadConfiguration(): void
    {
        $setting = null;
        try {
            if (class_exists(\App\Models\WhatsAppSetting::class) && \Illuminate\Support\Facades\Schema::hasTable('whatsapp_settings')) {
                $setting = \App\Models\WhatsAppSetting::current();
            }
        } catch (\Throwable $e) {
            // Graceful fallback if database/table is unavailable
        }

        $this->enabled = $setting ? (bool) $setting->enabled : true;
        $this->provider = $setting?->provider ?: config('services.whatsapp.provider', 'infobip');

        // Infobip settings: prioritize DB admin configuration, fallback to config/env
        $this->infobipBaseUrl = $setting?->base_url ?: config('services.whatsapp.infobip.base_url');
        $this->infobipApiKey = $setting?->api_key ?: config('services.whatsapp.infobip.api_key');
        $this->infobipFrom = (string) ($setting?->from_number ?: config('services.whatsapp.infobip.from', '447860088970'));
        $this->infobipSandboxKeyword = (string) ($setting?->sandbox_keyword ?: config('services.whatsapp.infobip.sandbox_keyword', 'ARKADANISAYSSTUFF'));

        // Meta Cloud API settings
        $this->accessToken = config('services.whatsapp.access_token');
        $this->phoneNumberId = config('services.whatsapp.phone_number_id');
        $this->apiVersion = config('services.whatsapp.api_version', 'v21.0');
        $this->templateName = config('services.whatsapp.template_name');
        $this->templateLang = config('services.whatsapp.template_lang', 'id');
        $this->timeout = (int) config('services.whatsapp.timeout', 15);
    }

    /**
     * Check if WhatsApp notifications are globally enabled.
     */
    public function isEnabled(): bool
    {
        return $this->enabled;
    }

    /**
     * Check if WhatsApp API credentials are configured.
     */
    public function isConfigured(): bool
    {
        if ($this->provider === 'infobip') {
            return ! empty($this->infobipApiKey) && ! empty($this->infobipBaseUrl);
        }

        return ! empty($this->accessToken) && ! empty($this->phoneNumberId);
    }

    /**
     * Get active provider name.
     */
    public function getProvider(): string
    {
        return $this->provider;
    }

    public function getBaseUrl(): ?string
    {
        return $this->infobipBaseUrl;
    }

    public function getSender(): string
    {
        return $this->infobipFrom;
    }

    public function getSandboxKeyword(): string
    {
        return $this->infobipSandboxKeyword;
    }

    /**
     * Normalize phone number to international format (digits only, e.g. 6281234567890).
     */
    public function formatPhoneNumber(?string $number): string
    {
        if (empty($number)) {
            return '';
        }

        // Remove all non-digits
        $digits = preg_replace('/\D+/', '', $number);

        // Convert domestic Indonesian format (08xxx) to international (628xxx)
        if (str_starts_with($digits, '08')) {
            $digits = '62'.substr($digits, 1);
        }

        return $digits;
    }

    /**
     * Send enrollment notification to the instructor.
     */
    public function sendEnrollmentNotification(User $instructor, User $student, Course $course, $enrolledAt = null): array
    {
        if (! $this->isEnabled()) {
            return [
                'success' => false,
                'error' => 'Notifikasi WhatsApp dinonaktifkan oleh administrator.',
            ];
        }

        $recipient = $this->formatPhoneNumber($instructor->whatsapp_number);

        if (empty($recipient)) {
            return [
                'success' => false,
                'error' => 'Nomor WhatsApp instructor tidak tersedia.',
            ];
        }

        // Format date
        $dateFormatted = $this->formatDate($enrolledAt);
        $dashboardUrl = url('/instructor/dashboard');
        $appName = AppearanceSetting::current()->displayName();

        // Standard text message
        $body = "Halo, *{$instructor->name}*! 🎓\n\n"
            ."Ada student baru yang baru saja enroll di course Anda:\n\n"
            ."👤 *Student:* {$student->name}\n"
            ."📚 *Course:* {$course->title}\n"
            ."🗓️ *Tanggal Enrollment:* {$dateFormatted}\n\n"
            ."Buka dashboard instructor Anda untuk memantau progress siswa:\n"
            ."🔗 {$dashboardUrl}\n\n"
            ."Salam,\n*{$appName}*";

        // If provider is Meta and template is configured, try template first
        if ($this->provider === 'meta' && ! empty($this->templateName)) {
            $templateResult = $this->sendTemplateMessage(
                $recipient,
                $this->templateName,
                $this->templateLang,
                [
                    $instructor->name,
                    $student->name,
                    $course->title,
                    $dateFormatted,
                    $dashboardUrl,
                ]
            );

            if ($templateResult['success']) {
                return $templateResult;
            }

            Log::warning('WhatsApp template delivery failed, falling back to text message', [
                'recipient' => $this->maskPhoneNumber($recipient),
                'error' => $templateResult['error'] ?? null,
            ]);
        }

        return $this->sendTextMessage($recipient, $body);
    }

    /**
     * Send test notification to instructor.
     */
    public function sendTestNotification(User $instructor, ?string $overrideNumber = null): array
    {
        $targetNumber = ! empty($overrideNumber) ? $overrideNumber : $instructor->whatsapp_number;
        $recipient = $this->formatPhoneNumber($targetNumber);

        if (empty($recipient)) {
            return [
                'success' => false,
                'error' => 'Nomor WhatsApp belum diisi atau format tidak valid.',
            ];
        }

        $appName = AppearanceSetting::current()->displayName();
        $timestamp = now()->translatedFormat('d M Y, H:i');

        $body = "Halo, *{$instructor->name}*! 🎓\n\n"
            ."Ini adalah pesan uji coba (*Test WhatsApp Notification*) dari platform *{$appName}*.\n\n"
            ."Pengaturan notifikasi WhatsApp Anda telah berhasil terhubung dan aktif.\n"
            ."Waktu Pengujian: {$timestamp}\n\n"
            .'Setiap kali ada student baru yang mendaftar pada course Anda, sistem akan otomatis mengirim notifikasi ke nomor ini.';

        // Support local simulation mode if WhatsApp API credentials are not set in .env
        if (! $this->isConfigured()) {
            if (app()->isLocal() || app()->runningUnitTests()) {
                Log::info('[SIMULATION] WhatsApp Test Notification dispatched', [
                    'provider' => $this->provider,
                    'recipient' => $this->maskPhoneNumber($recipient),
                    'instructor_id' => $instructor->id,
                    'instructor_name' => $instructor->name,
                    'message' => $body,
                ]);

                return [
                    'success' => true,
                    'is_simulated' => true,
                    'message' => "Pesan uji coba berhasil disimulasikan ke {$recipient} (dicatat di storage/logs/laravel.log).",
                ];
            }

            return [
                'success' => false,
                'error' => 'WhatsApp API belum dikonfigurasi di .env.',
            ];
        }

        $textResult = $this->sendTextMessage($recipient, $body);

        // If Meta returns error 131047 (outside 24h customer care window, requires template)
        if ($this->provider === 'meta' && ! $textResult['success'] && isset($textResult['code']) && (int) $textResult['code'] === 131047) {
            $fallbackTemplate = $this->sendTemplateMessage($recipient, 'hello_world', 'en_US', []);
            if ($fallbackTemplate['success']) {
                return [
                    'success' => true,
                    'message_id' => $fallbackTemplate['message_id'] ?? null,
                    'notice' => 'Pesan dikirim via template resmi Meta (hello_world) karena batas percakapan 24 jam belum terbuka.',
                ];
            }

            return [
                'success' => false,
                'error' => 'Meta Cloud API menolak pesan bebas (Error 131047: Re-engagement message). Untuk inisiasi pesan pertama, Meta mewajibkan pesan Template yang sudah disetujui di Meta Business Manager.',
            ];
        }

        return $textResult;
    }

    /**
     * Send raw text message via active provider (Infobip / Meta).
     */
    public function sendTextMessage(string $recipient, string $text): array
    {
        if ($this->provider === 'infobip') {
            return $this->sendInfobipTextMessage($recipient, $text);
        }

        return $this->sendMetaTextMessage($recipient, $text);
    }

    /**
     * Send text message via Infobip WhatsApp API.
     */
    public function sendInfobipTextMessage(string $recipient, string $text): array
    {
        if (! $this->isConfigured()) {
            return [
                'success' => false,
                'error' => 'Infobip WhatsApp API belum dikonfigurasi (API key atau Base URL belum diatur di Admin Panel atau .env).',
            ];
        }

        $url = rtrim($this->infobipBaseUrl, '/').'/whatsapp/1/message/text';

        $payload = [
            'from' => $this->infobipFrom,
            'to' => $recipient,
            'content' => [
                'text' => $text,
            ],
        ];

        try {
            $response = Http::withHeaders([
                'Authorization' => 'App '.$this->infobipApiKey,
                'Content-Type' => 'application/json',
                'Accept' => 'application/json',
            ])->timeout($this->timeout)->post($url, $payload);

            if ($response->successful()) {
                $data = $response->json();
                $statusGroup = $data['status']['groupName'] ?? null;
                $statusName = $data['status']['name'] ?? null;
                $statusDesc = $data['status']['description'] ?? null;

                if ($statusGroup === 'REJECTED') {
                    if ($statusName === 'REJECTED_DESTINATION_NOT_REGISTERED') {
                        return [
                            'success' => false,
                            'error' => "Nomor WhatsApp Anda ({$recipient}) belum terdaftar di Sandbox Infobip. Silakan kirim chat WhatsApp: \"{$this->infobipSandboxKeyword}\" ke nomor +{$this->infobipFrom} dari HP Anda untuk mengaktifkan sandbox.",
                        ];
                    }

                    return [
                        'success' => false,
                        'error' => "Infobip menolak pesan: {$statusDesc} ({$statusName})",
                    ];
                }

                Log::info('WhatsApp message sent via Infobip successfully', [
                    'recipient' => $this->maskPhoneNumber($recipient),
                    'message_id' => $data['messageId'] ?? null,
                ]);

                return [
                    'success' => true,
                    'message_id' => $data['messageId'] ?? null,
                    'response' => $data,
                ];
            }

            $errorBody = $response->json();
            $errorMsg = $errorBody['requestError']['serviceException']['text'] ?? $response->body();

            return [
                'success' => false,
                'error' => "Gagal kirim via Infobip: {$errorMsg}",
            ];
        } catch (\Throwable $e) {
            Log::error('Exception while calling Infobip API: '.$e->getMessage(), [
                'recipient' => $this->maskPhoneNumber($recipient),
            ]);

            return [
                'success' => false,
                'error' => $e->getMessage(),
            ];
        }
    }

    /**
     * Send raw text message via Meta WhatsApp Cloud API.
     */
    public function sendMetaTextMessage(string $recipient, string $text): array
    {
        if (! $this->isConfigured()) {
            return [
                'success' => false,
                'error' => 'WhatsApp Cloud API belum dikonfigurasi (WHATSAPP_ACCESS_TOKEN atau WHATSAPP_PHONE_NUMBER_ID kosong).',
            ];
        }

        $url = "https://graph.facebook.com/{$this->apiVersion}/{$this->phoneNumberId}/messages";

        $payload = [
            'messaging_product' => 'whatsapp',
            'recipient_type' => 'individual',
            'to' => $recipient,
            'type' => 'text',
            'text' => [
                'preview_url' => false,
                'body' => $text,
            ],
        ];

        return $this->dispatchApiRequest($url, $payload, $recipient);
    }

    /**
     * Send template message via WhatsApp Cloud API.
     */
    public function sendTemplateMessage(string $recipient, string $templateName, string $langCode, array $parameters = []): array
    {
        if (! $this->isConfigured()) {
            return [
                'success' => false,
                'error' => 'WhatsApp Cloud API belum dikonfigurasi.',
            ];
        }

        $url = "https://graph.facebook.com/{$this->apiVersion}/{$this->phoneNumberId}/messages";

        $bodyParameters = array_map(function ($param) {
            return [
                'type' => 'text',
                'text' => (string) $param,
            ];
        }, $parameters);

        $payload = [
            'messaging_product' => 'whatsapp',
            'to' => $recipient,
            'type' => 'template',
            'template' => [
                'name' => $templateName,
                'language' => [
                    'code' => $langCode,
                ],
                'components' => [
                    [
                        'type' => 'body',
                        'parameters' => $bodyParameters,
                    ],
                ],
            ],
        ];

        return $this->dispatchApiRequest($url, $payload, $recipient);
    }

    /**
     * Dispatch HTTP request to Meta Graph API.
     */
    protected function dispatchApiRequest(string $url, array $payload, string $recipient): array
    {
        try {
            $response = Http::withToken($this->accessToken)
                ->timeout($this->timeout)
                ->asJson()
                ->post($url, $payload);

            if ($response->successful()) {
                $responseData = $response->json();
                $messageId = $responseData['messages'][0]['id'] ?? null;

                Log::info('WhatsApp message sent successfully', [
                    'recipient' => $this->maskPhoneNumber($recipient),
                    'message_id' => $messageId,
                ]);

                return [
                    'success' => true,
                    'message_id' => $messageId,
                    'response' => $responseData,
                ];
            }

            $errorData = $response->json('error', []);
            $errorMessage = $errorData['message'] ?? 'HTTP '.$response->status().': '.$response->body();

            Log::error('WhatsApp Cloud API returned error', [
                'recipient' => $this->maskPhoneNumber($recipient),
                'status' => $response->status(),
                'error_code' => $errorData['code'] ?? null,
                'error_message' => $errorData['message'] ?? null,
                'error_type' => $errorData['type'] ?? null,
            ]);

            return [
                'success' => false,
                'error' => $errorMessage,
                'code' => $errorData['code'] ?? $response->status(),
            ];
        } catch (\Throwable $e) {
            Log::error('Exception while calling WhatsApp Cloud API: '.$e->getMessage(), [
                'recipient' => $this->maskPhoneNumber($recipient),
            ]);

            return [
                'success' => false,
                'error' => $e->getMessage(),
            ];
        }
    }

    /**
     * Mask phone number for safe logging.
     */
    public function maskPhoneNumber(string $number): string
    {
        $len = strlen($number);
        if ($len <= 4) {
            return '****';
        }

        return substr($number, 0, 3).str_repeat('*', max(0, $len - 6)).substr($number, -3);
    }

    /**
     * Format timestamp to readable string.
     */
    protected function formatDate($timestamp): string
    {
        try {
            if ($timestamp instanceof Carbon) {
                return $timestamp->translatedFormat('d M Y, H:i');
            }

            if (is_numeric($timestamp)) {
                return Carbon::createFromTimestamp((int) $timestamp)->translatedFormat('d M Y, H:i');
            }

            if ($timestamp) {
                return Carbon::parse($timestamp)->translatedFormat('d M Y, H:i');
            }

            return now()->translatedFormat('d M Y, H:i');
        } catch (\Throwable) {
            return (string) ($timestamp ?? now());
        }
    }
}
