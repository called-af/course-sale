<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\WhatsAppMessage;
use App\Models\WhatsAppMessageTemplate;
use App\Models\WhatsAppProvider;
use App\Models\WhatsAppProviderLog;
use App\Models\WhatsAppSetting;
use App\Services\WhatsApp\DTO\WhatsAppMessageRequest;
use App\Services\WhatsApp\Manager;
use App\Support\PhoneNumber;
use App\Support\UrlGuard;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class WhatsAppIntegrationController extends Controller
{
    public function __construct(protected Manager $manager) {}

    public function index(): \Inertia\Response
    {
        $this->authorize('manage-settings');

        $providers = WhatsAppProvider::query()
            ->with(['credentials', 'templates' => fn ($query) => $query->orderBy('name'), 'accounts'])
            ->withCount(['messages', 'accounts', 'templates'])
            ->orderByDesc('is_default')
            ->orderBy('id')
            ->get();

        $today = now()->startOfDay();

        $todayStats = WhatsAppMessage::query()
            ->where('created_at', '>=', $today)
            ->selectRaw('COUNT(*) as total')
            ->selectRaw("COALESCE(SUM(CASE WHEN status IN ('sent','delivered','read') THEN 1 ELSE 0 END), 0) as sent")
            ->selectRaw("COALESCE(SUM(CASE WHEN status = 'delivered' THEN 1 ELSE 0 END), 0) as delivered")
            ->selectRaw("COALESCE(SUM(CASE WHEN status = 'read' THEN 1 ELSE 0 END), 0) as read_count")
            ->selectRaw("COALESCE(SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END), 0) as failed")
            ->first();

        $allTime = WhatsAppMessage::query()
            ->selectRaw('COUNT(*) as total')
            ->selectRaw("COALESCE(SUM(CASE WHEN direction = 'inbound' THEN 1 ELSE 0 END), 0) as inbound")
            ->selectRaw("COALESCE(SUM(CASE WHEN direction = 'outbound' THEN 1 ELSE 0 END), 0) as outbound")
            ->first();

        $recentMessages = WhatsAppMessage::query()
            ->with('provider:id,name')
            ->latest()
            ->limit(20)
            ->get()
            ->map(fn (WhatsAppMessage $message) => [
                'id' => $message->id,
                'provider_id' => $message->whatsapp_provider_id,
                'provider' => $message->provider?->name,
                'direction' => $message->direction,
                'type' => $message->type,
                'to' => $message->to,
                'from' => $message->from,
                'body' => Str::limit((string) $message->body, 120),
                'provider_message_id' => $message->provider_message_id,
                'status' => $message->status,
                'error_message' => $message->error_message,
                'created_at' => $message->created_at?->toIso8601String(),
            ]);

        $recentLogs = WhatsAppProviderLog::query()
            ->with('provider:id,name')
            ->latest()
            ->limit(12)
            ->get()
            ->map(fn (WhatsAppProviderLog $log) => [
                'id' => $log->id,
                'provider' => $log->provider?->name,
                'action' => $log->action,
                'status' => $log->status,
                'message' => $log->message,
                'created_at' => $log->created_at?->toIso8601String(),
            ]);

        return Inertia::render('admin/integrations/WhatsApp', [
            'providers' => $providers->map(fn (WhatsAppProvider $provider) => $this->providerPayload($provider))->values(),
            'catalog' => $this->catalogPayload(),
            'drivers' => config('whatsapp_providers.drivers', []),
            'global' => WhatsAppSetting::current()->forDisplay(),
            'stats' => [
                'today' => [
                    'total' => (int) ($todayStats->total ?? 0),
                    'sent' => (int) ($todayStats->sent ?? 0),
                    'delivered' => (int) ($todayStats->delivered ?? 0),
                    'read' => (int) ($todayStats->read_count ?? 0),
                    'failed' => (int) ($todayStats->failed ?? 0),
                ],
                'all_time' => [
                    'total' => (int) ($allTime->total ?? 0),
                    'inbound' => (int) ($allTime->inbound ?? 0),
                    'outbound' => (int) ($allTime->outbound ?? 0),
                ],
            ],
            'recent_messages' => $recentMessages,
            'recent_logs' => $recentLogs,
            'allow_local_endpoints' => (bool) config('whatsapp_providers.allow_local_endpoints', false),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $this->authorize('manage-settings');

        $data = $this->validateProvider($request);
        $preset = $this->preset($data);

        DB::transaction(function () use ($request, $data, $preset) {
            $provider = new WhatsAppProvider;
            $provider->fill([
                'name' => $data['name'],
                'slug' => $this->uniqueSlug($data['name']),
                'driver' => $data['driver'] ?? $preset['driver'] ?? 'custom',
                'base_url' => $data['base_url'] ?? ($preset['base_url'] ?? null),
                'config' => $this->buildConfig($data, $preset),
                'enabled' => (bool) ($data['enabled'] ?? true),
                'is_default' => (bool) ($data['is_default'] ?? false),
                'timeout' => (int) ($data['timeout'] ?? 15),
                'max_retries' => (int) ($data['max_retries'] ?? 1),
                'status' => 'unknown',
                'created_by' => $request->user()->id,
            ]);
            $provider->save();

            foreach ($data['credentials'] ?? [] as $key => $value) {
                if (is_string($value) && $value !== '') {
                    $provider->setCredential((string) $key, $value);
                }
            }

            $this->ensureSingleDefault($provider, (bool) ($data['is_default'] ?? false) || ! WhatsAppProvider::query()->whereKeyNot($provider->id)->exists());

            $this->audit($provider, 'created', ['name', 'driver', 'base_url', 'config', 'credentials', 'enabled', 'is_default']);
        });

        return back()->with('success', 'WhatsApp provider added successfully.');
    }

    public function update(Request $request, WhatsAppProvider $provider): RedirectResponse
    {
        $this->authorize('manage-settings');

        $data = $this->validateProvider($request, $provider);
        $preset = $this->preset($data, $provider);

        DB::transaction(function () use ($data, $preset, $provider) {
            $wasDefault = (bool) $provider->is_default;

            $provider->fill([
                'name' => $data['name'],
                'driver' => $data['driver'] ?? $preset['driver'] ?? $provider->driver,
                'base_url' => $data['base_url'] ?? $provider->base_url,
                'config' => $this->buildConfig($data, $preset, $provider->config ?? []),
                'enabled' => (bool) ($data['enabled'] ?? $provider->enabled),
                'timeout' => (int) ($data['timeout'] ?? $provider->timeout),
                'max_retries' => (int) ($data['max_retries'] ?? $provider->max_retries),
            ]);

            if (array_key_exists('is_default', $data) && (bool) $data['is_default']) {
                $provider->is_default = true;
                $provider->enabled = true;
            } elseif (array_key_exists('is_default', $data) && ! (bool) $data['is_default']) {
                $provider->is_default = false;
            }

            $provider->save();

            foreach ($data['credentials'] ?? [] as $key => $value) {
                if (is_string($value) && $value !== '') {
                    $provider->setCredential((string) $key, $value);
                }
            }

            if (array_key_exists('is_default', $data) && ! (bool) $data['is_default'] && $wasDefault) {
                $next = WhatsAppProvider::query()
                    ->where('enabled', true)
                    ->whereKeyNot($provider->id)
                    ->orderBy('id')
                    ->first();

                if ($next) {
                    $next->forceFill(['is_default' => true])->save();
                } else {
                    $provider->forceFill(['is_default' => true])->save();
                }
            } else {
                $this->ensureSingleDefault($provider, (bool) $provider->is_default);
            }

            $this->audit($provider, 'updated', array_keys($data));
        });

        return back()->with('success', 'WhatsApp provider updated.');
    }

    public function destroy(WhatsAppProvider $provider): RedirectResponse
    {
        $this->authorize('manage-settings');

        if (WhatsAppProvider::query()->count() <= 1) {
            return back()->with('error', 'At least one WhatsApp provider must remain available.');
        }

        DB::transaction(function () use ($provider) {
            $wasDefault = $provider->is_default;
            $this->audit($provider, 'deleted', ['provider']);
            $provider->delete();

            if ($wasDefault) {
                $next = WhatsAppProvider::query()->where('enabled', true)->orderBy('id')->first();
                if ($next) {
                    $next->forceFill(['is_default' => true])->save();
                }
            }
        });

        return back()->with('success', 'WhatsApp provider deleted.');
    }

    public function toggle(Request $request, WhatsAppProvider $provider): RedirectResponse
    {
        $this->authorize('manage-settings');

        $request->validate(['enabled' => ['required', 'boolean']]);
        $enabled = (bool) $request->boolean('enabled');

        DB::transaction(function () use ($provider, $enabled) {
            $provider->forceFill(['enabled' => $enabled])->save();

            if (! $enabled && $provider->is_default) {
                $provider->forceFill(['is_default' => false])->save();
                $next = WhatsAppProvider::query()->where('enabled', true)->whereKeyNot($provider->id)->first();
                if ($next) {
                    $next->forceFill(['is_default' => true])->save();
                }
            }

            if ($enabled && ! WhatsAppProvider::query()->where('is_default', true)->exists()) {
                $provider->forceFill(['is_default' => true])->save();
            }

            $this->audit($provider, $enabled ? 'enabled' : 'disabled', ['enabled']);
        });

        return back()->with('success', $enabled ? 'WhatsApp provider enabled.' : 'WhatsApp provider disabled.');
    }

    public function setDefault(WhatsAppProvider $provider): RedirectResponse
    {
        $this->authorize('manage-settings');

        DB::transaction(function () use ($provider) {
            WhatsAppProvider::query()->whereKeyNot($provider->id)->update(['is_default' => false]);
            $provider->forceFill(['is_default' => true, 'enabled' => true])->save();
            $this->audit($provider, 'set_default', ['is_default']);
        });

        return back()->with('success', 'Primary WhatsApp provider updated.');
    }

    public function test(WhatsAppProvider $provider): JsonResponse
    {
        $this->authorize('manage-settings');

        $result = $this->manager->testConnection($provider);

        return response()->json($result->toArray(), $result->success ? 200 : 422);
    }

    public function sendTest(Request $request): JsonResponse
    {
        $this->authorize('manage-settings');

        $data = $request->validate([
            'provider_id' => ['nullable', 'integer', 'exists:whatsapp_providers,id'],
            'phone_number' => ['required', 'string', 'max:50'],
            'message' => ['nullable', 'string', 'max:1000'],
        ]);

        $provider = isset($data['provider_id']) ? WhatsAppProvider::find($data['provider_id']) : $this->manager->defaultProvider();
        $recipient = PhoneNumber::normalize($data['phone_number']);

        if ($recipient === '') {
            return response()->json(['success' => false, 'error' => 'Invalid WhatsApp number.'], 422);
        }

        $body = $data['message'] ?? 'Hello! This is a test message from the WhatsApp integration dashboard.';
        $idempotencyKey = 'test-'.Str::uuid();

        $message = WhatsAppMessage::create([
            'whatsapp_provider_id' => $provider?->id,
            'direction' => 'outbound',
            'type' => 'text',
            'to' => $recipient,
            'body' => $body,
            'status' => 'queued',
            'idempotency_key' => $idempotencyKey,
            'payload' => ['test' => true],
        ]);

        try {
            $result = $this->manager->sendText(
                new WhatsAppMessageRequest($recipient, $body, $idempotencyKey),
                $provider
            );

            $message->forceFill([
                'provider_message_id' => $result->messageId,
                'status' => $result->success ? ($result->status === 'sent' ? 'sent' : $result->status) : 'failed',
                'sent_at' => $result->success ? now() : null,
                'error_message' => $result->error,
                'payload' => $result->raw,
            ])->save();

            return response()->json([
                'success' => $result->success,
                'message_id' => $result->messageId,
                'error' => $result->error,
                'provider' => $result->provider,
                'log_id' => $message->id,
            ], $result->success ? 200 : 422);
        } catch (\Throwable $exception) {
            $message->forceFill([
                'status' => 'failed',
                'error_message' => mb_substr($exception->getMessage(), 0, 1000),
            ])->save();

            return response()->json(['success' => false, 'error' => $exception->getMessage()], 422);
        }
    }

    public function messageStatus(WhatsAppProvider $provider, WhatsAppMessage $message): JsonResponse
    {
        $this->authorize('manage-settings');
        abort_unless($message->whatsapp_provider_id === $provider->id, 404);

        try {
            $status = $this->manager->getMessageStatus((string) $message->provider_message_id, $provider);
            $message->forceFill(['status' => $status->status])->save();

            return response()->json($status->toArray());
        } catch (\Throwable $exception) {
            return response()->json(['success' => false, 'error' => $exception->getMessage()], 422);
        }
    }

    public function storeTemplate(Request $request, WhatsAppProvider $provider): RedirectResponse
    {
        $this->authorize('manage-settings');

        $data = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'language' => ['required', 'string', 'max:12'],
            'category' => ['nullable', 'string', 'max:30'],
            'status' => ['nullable', 'string', Rule::in(['approved', 'pending', 'rejected', 'disabled'])],
            'components' => ['nullable', 'array'],
        ]);

        WhatsAppMessageTemplate::updateOrCreate(
            [
                'whatsapp_provider_id' => $provider->id,
                'name' => $data['name'],
                'language' => $data['language'],
            ],
            [
                'category' => $data['category'] ?? null,
                'status' => $data['status'] ?? 'approved',
                'components' => $data['components'] ?? null,
            ],
        );

        return back()->with('success', 'WhatsApp template saved.');
    }

    public function destroyTemplate(WhatsAppProvider $provider, WhatsAppMessageTemplate $template): RedirectResponse
    {
        $this->authorize('manage-settings');
        abort_unless($template->whatsapp_provider_id === $provider->id, 404);

        $template->delete();

        return back()->with('success', 'WhatsApp template deleted.');
    }

    public function importLegacy(): RedirectResponse
    {
        $this->authorize('manage-settings');

        if (WhatsAppProvider::query()->exists()) {
            return back()->with('error', 'Providers already exist. Import is only available when the list is empty.');
        }

        $legacy = WhatsAppSetting::current();
        $driver = in_array($legacy->provider, ['meta', 'infobip', 'fonnte', 'custom'], true) ? $legacy->provider : 'infobip';
        $preset = config("whatsapp_providers.providers.{$driver}", []);

        $config = [
            'preset' => $driver,
            'from' => $legacy->from_number,
            'sandbox_keyword' => $legacy->sandbox_keyword,
        ];

        if ($driver === 'meta') {
            $config['phone_number_id'] = config('services.whatsapp.phone_number_id');
            $config['api_version'] = config('services.whatsapp.api_version', 'v21.0');
        }

        $provider = WhatsAppProvider::create([
            'name' => ($preset['name'] ?? 'WhatsApp').' (legacy)',
            'slug' => $this->uniqueSlug(($preset['name'] ?? 'WhatsApp').' legacy'),
            'driver' => $driver,
            'base_url' => $legacy->base_url ?: ($preset['base_url'] ?? null),
            'config' => array_filter($config, fn ($value) => $value !== null && $value !== ''),
            'enabled' => (bool) $legacy->enabled,
            'is_default' => true,
            'status' => 'unknown',
            'created_by' => auth()->id(),
        ]);

        $credential = $driver === 'meta' ? (string) config('services.whatsapp.access_token') : (string) $legacy->api_key;
        if ($credential !== '') {
            $provider->setCredential($driver === 'meta' ? 'access_token' : 'api_key', $credential);
        }

        if ($driver === 'meta') {
            $verifyToken = (string) config('services.whatsapp.verify_token');
            $appSecret = (string) config('services.whatsapp.app_secret');

            if ($verifyToken !== '') {
                $provider->setCredential('verify_token', $verifyToken);
            }

            if ($appSecret !== '') {
                $provider->setCredential('app_secret', $appSecret);
            }
        }

        $this->audit($provider, 'imported_legacy', ['provider']);

        return back()->with('success', 'Legacy WhatsApp configuration imported as a provider.');
    }

    public function toggleGlobal(Request $request): RedirectResponse
    {
        $this->authorize('manage-settings');

        $enabled = (bool) $request->boolean('enabled');
        $setting = WhatsAppSetting::current();
        $setting->forceFill(['enabled' => $enabled])->save();

        return back()->with('success', $enabled ? 'WhatsApp notifications enabled.' : 'WhatsApp notifications disabled.');
    }

    protected function validateProvider(Request $request, ?WhatsAppProvider $provider = null): array
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'driver' => ['nullable', 'string', Rule::in(array_keys(config('whatsapp_providers.drivers', [])))],
            'preset' => ['nullable', 'string', Rule::in(array_keys(config('whatsapp_providers.providers', [])))],
            'base_url' => ['nullable', 'string', 'max:500'],
            'enabled' => ['boolean'],
            'is_default' => ['boolean'],
            'timeout' => ['nullable', 'integer', 'min:1', 'max:120'],
            'max_retries' => ['nullable', 'integer', 'min:0', 'max:5'],
            'config' => ['nullable', 'array'],
            'credentials' => ['nullable', 'array'],
            'credentials.*' => ['nullable', 'string', 'max:8000'],
        ]);

        $preset = $this->preset($data, $provider);
        $driver = $data['driver'] ?? $preset['driver'] ?? $provider?->driver ?? 'custom';

        if (! in_array($driver, array_keys(config('whatsapp_providers.drivers', [])), true)) {
            throw ValidationException::withMessages(['driver' => 'Unknown WhatsApp driver.']);
        }

        $baseUrl = $data['base_url'] ?? $preset['base_url'] ?? $provider?->base_url;

        if (blank($baseUrl)) {
            throw ValidationException::withMessages(['base_url' => 'Base URL is required for this provider.']);
        }

        $urlError = UrlGuard::error((string) $baseUrl, (bool) config('whatsapp_providers.allow_local_endpoints', false));
        if ($urlError !== null) {
            throw ValidationException::withMessages(['base_url' => $urlError]);
        }

        foreach ($preset['credential_fields'] ?? [] as $field) {
            $key = $field['key'] ?? null;
            if (! $key || ! ($field['required'] ?? false)) {
                continue;
            }

            $provided = $data['credentials'][$key] ?? null;
            $existing = $provider?->hasCredential($key) ?? false;

            if (blank($provided) && ! $existing) {
                throw ValidationException::withMessages(["credentials.{$key}" => ($field['label'] ?? $key).' is required.']);
            }
        }

        foreach ($preset['config_fields'] ?? [] as $field) {
            $key = $field['key'] ?? null;
            if (! $key || ! ($field['required'] ?? false)) {
                continue;
            }

            $provided = $data['config'][$key] ?? null;
            $existing = $provider?->configValue($key);
            $default = $field['default'] ?? null;

            if (blank($provided) && blank($existing) && blank($default)) {
                throw ValidationException::withMessages(["config.{$key}" => ($field['label'] ?? $key).' is required.']);
            }
        }

        return $data;
    }

    protected function preset(array $data, ?WhatsAppProvider $provider = null): array
    {
        $catalog = config('whatsapp_providers.providers', []);
        $key = $data['preset'] ?? $provider?->config['preset'] ?? null;

        if ($key && isset($catalog[$key])) {
            return $catalog[$key] + ['_key' => $key];
        }

        $driver = $data['driver'] ?? $provider?->driver;

        foreach ($catalog as $catalogKey => $preset) {
            if (($preset['driver'] ?? null) === $driver) {
                return $preset + ['_key' => $catalogKey];
            }
        }

        return [];
    }

    protected function buildConfig(array $data, array $preset, array $existing = []): array
    {
        $config = $existing;
        $config['preset'] = $preset['_key'] ?? ($data['preset'] ?? $existing['preset'] ?? null);

        $allowed = collect($preset['config_fields'] ?? [])->pluck('key')->all();

        foreach ($data['config'] ?? [] as $key => $value) {
            if (in_array($key, $allowed, true)) {
                $config[$key] = $value;
            }
        }

        foreach ($preset['config_fields'] ?? [] as $field) {
            $key = $field['key'] ?? null;

            if (! $key || array_key_exists($key, $config)) {
                continue;
            }

            if (array_key_exists('default', $field) && $field['default'] !== null) {
                $config[$key] = $field['default'];
            }
        }

        return array_filter($config, fn ($value) => $value !== null && $value !== '');
    }

    protected function ensureSingleDefault(WhatsAppProvider $provider, bool $makeDefault): void
    {
        if ($makeDefault) {
            WhatsAppProvider::query()->whereKeyNot($provider->id)->update(['is_default' => false]);
            $provider->forceFill(['is_default' => true])->save();

            return;
        }

        if (! WhatsAppProvider::query()->where('is_default', true)->exists()) {
            $provider->forceFill(['is_default' => true])->save();
        }
    }

    protected function providerPayload(WhatsAppProvider $provider): array
    {
        $credentials = $provider->credentials->mapWithKeys(function ($credential) {
            $value = (string) $credential->value;

            return [$credential->key => [
                'has_value' => $value !== '',
                'hint' => $value !== '' ? '••••••••'.substr($value, -4) : null,
            ]];
        })->all();

        $preset = $provider->config['preset'] ?? $this->findPresetByDriver($provider->driver);

        return [
            'id' => $provider->id,
            'name' => $provider->name,
            'slug' => $provider->slug,
            'driver' => $provider->driver,
            'preset' => $preset,
            'base_url' => $provider->base_url,
            'config' => $provider->config ?? [],
            'enabled' => (bool) $provider->enabled,
            'is_default' => (bool) $provider->is_default,
            'timeout' => (int) $provider->timeout,
            'max_retries' => (int) $provider->max_retries,
            'status' => $provider->status,
            'last_tested_at' => $provider->last_tested_at?->toIso8601String(),
            'last_error' => $provider->last_error,
            'credentials' => $credentials,
            'accounts_count' => (int) ($provider->accounts_count ?? $provider->accounts->count()),
            'messages_count' => (int) ($provider->messages_count ?? 0),
            'templates_count' => (int) ($provider->templates_count ?? $provider->templates->count()),
            'webhook_url' => route('webhooks.whatsapp', $provider->slug),
            'templates' => $provider->templates->map(fn (WhatsAppMessageTemplate $template) => [
                'id' => $template->id,
                'name' => $template->name,
                'language' => $template->language,
                'category' => $template->category,
                'status' => $template->status,
            ])->values(),
            'created_at' => $provider->created_at?->toIso8601String(),
        ];
    }

    protected function catalogPayload(): array
    {
        return collect(config('whatsapp_providers.providers', []))
            ->map(fn ($preset, $key) => ['key' => $key] + $preset)
            ->values()
            ->all();
    }

    protected function findPresetByDriver(string $driver): ?string
    {
        foreach (config('whatsapp_providers.providers', []) as $key => $preset) {
            if (($preset['driver'] ?? null) === $driver) {
                return $key;
            }
        }

        return null;
    }

    protected function uniqueSlug(string $name): string
    {
        $base = Str::slug($name) ?: 'whatsapp';
        $slug = $base;
        $counter = 2;

        while (WhatsAppProvider::withTrashed()->where('slug', $slug)->exists()) {
            $slug = $base.'-'.$counter++;
        }

        return $slug;
    }

    protected function audit(WhatsAppProvider $provider, string $action, array $fields): void
    {
        WhatsAppProviderLog::create([
            'whatsapp_provider_id' => $provider->id,
            'user_id' => auth()->id(),
            'action' => $action,
            'status' => 'success',
            'message' => 'WhatsApp provider configuration changed.',
            'context' => ['changed_fields' => array_values(array_unique($fields))],
            'ip' => request()->ip(),
        ]);
    }
}
