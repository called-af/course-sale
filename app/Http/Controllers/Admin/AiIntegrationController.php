<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AiModel;
use App\Models\AiProvider;
use App\Models\AiProviderLog;
use App\Models\AiSetting;
use App\Models\AiSettingAudit;
use App\Models\AiUsageLog;
use App\Models\RecommendationSetting;
use App\Services\AI\CapabilityDetector;
use App\Services\AI\Exceptions\ProviderException;
use App\Services\AI\Manager;
use App\Services\AiSettings;
use App\Support\UrlGuard;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class AiIntegrationController extends Controller
{
    public function __construct(protected Manager $manager) {}

    public function index(): \Inertia\Response
    {
        $this->authorize('manage-settings');

        $providers = AiProvider::query()
            ->with(['models' => fn ($query) => $query->orderByDesc('is_default')->orderBy('model_id'), 'credentials'])
            ->orderByDesc('is_default')
            ->orderBy('fallback_priority')
            ->orderBy('id')
            ->get();

        $since = now()->subDays(30);
        $usage = AiUsageLog::query()
            ->where('created_at', '>=', $since)
            ->selectRaw('COUNT(*) as requests')
            ->selectRaw('COALESCE(SUM(CASE WHEN success = 1 THEN 1 ELSE 0 END), 0) as successful_requests')
            ->selectRaw('COALESCE(SUM(input_tokens), 0) as input_tokens')
            ->selectRaw('COALESCE(SUM(output_tokens), 0) as output_tokens')
            ->selectRaw('COALESCE(SUM(total_tokens), 0) as total_tokens')
            ->selectRaw('COALESCE(AVG(latency_ms), 0) as avg_latency_ms')
            ->first();

        $providerUsage = AiUsageLog::query()
            ->where('created_at', '>=', $since)
            ->whereNotNull('ai_provider_id')
            ->selectRaw('ai_provider_id, COUNT(*) as requests, COALESCE(SUM(total_tokens), 0) as total_tokens')
            ->groupBy('ai_provider_id')
            ->with('provider:id,name')
            ->orderByDesc('requests')
            ->get()
            ->map(fn ($row) => [
                'provider_id' => $row->ai_provider_id,
                'provider_name' => $row->provider?->name,
                'requests' => (int) $row->requests,
                'total_tokens' => (int) $row->total_tokens,
            ]);

        $recentLogs = AiProviderLog::query()
            ->with('provider:id,name')
            ->latest()
            ->limit(12)
            ->get()
            ->map(fn (AiProviderLog $log) => [
                'id' => $log->id,
                'provider' => $log->provider?->name,
                'action' => $log->action,
                'status' => $log->status,
                'message' => $log->message,
                'created_at' => $log->created_at?->toIso8601String(),
            ]);

        return Inertia::render('admin/integrations/Ai', [
            'providers' => $providers->map(fn (AiProvider $provider) => $this->providerPayload($provider))->values(),
            'catalog' => $this->catalogPayload(),
            'drivers' => config('ai_providers.drivers', []),
            'global' => app(AiSettings::class)->forDisplay(),
            'recommendation' => [
                'enabled' => RecommendationSetting::isEnabled(),
            ],
            'usage' => [
                'period_days' => 30,
                'requests' => (int) ($usage->requests ?? 0),
                'successful_requests' => (int) ($usage->successful_requests ?? 0),
                'input_tokens' => (int) ($usage->input_tokens ?? 0),
                'output_tokens' => (int) ($usage->output_tokens ?? 0),
                'total_tokens' => (int) ($usage->total_tokens ?? 0),
                'avg_latency_ms' => (int) ($usage->avg_latency_ms ?? 0),
                'by_provider' => $providerUsage,
            ],
            'recent_logs' => $recentLogs,
            'allow_local_endpoints' => (bool) config('ai_providers.allow_local_endpoints', false),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $this->authorize('manage-settings');

        $data = $this->validateProvider($request);
        $preset = $this->preset($data);

        DB::transaction(function () use ($request, $data, $preset) {
            $provider = new AiProvider;
            $provider->fill([
                'name' => $data['name'],
                'slug' => $this->uniqueSlug($data['name']),
                'driver' => $data['driver'] ?? $preset['driver'] ?? 'openai_compatible',
                'base_url' => $data['base_url'] ?? ($preset['base_url'] ?? null),
                'config' => $this->buildConfig($data, $preset),
                'enabled' => (bool) ($data['enabled'] ?? true),
                'is_default' => (bool) ($data['is_default'] ?? false),
                'fallback_priority' => (int) ($data['fallback_priority'] ?? 100),
                'timeout' => (int) ($data['timeout'] ?? 30),
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

            $this->ensureSingleDefault($provider, (bool) ($data['is_default'] ?? false) || ! AiProvider::query()->whereKeyNot($provider->id)->exists());

            $this->audit($provider, 'created', ['name', 'driver', 'base_url', 'config', 'credentials', 'enabled', 'is_default']);
        });

        return back()->with('success', 'AI provider added successfully.');
    }

    public function update(Request $request, AiProvider $provider): RedirectResponse
    {
        $this->authorize('manage-settings');

        $data = $this->validateProvider($request, $provider);
        $preset = $this->preset($data, $provider);

        DB::transaction(function () use ($data, $preset, $provider) {
            $changed = array_keys($data);

            $provider->fill([
                'name' => $data['name'],
                'driver' => $data['driver'] ?? $preset['driver'] ?? $provider->driver,
                'base_url' => $data['base_url'] ?? $provider->base_url,
                'config' => $this->buildConfig($data, $preset, $provider->config ?? []),
                'enabled' => (bool) ($data['enabled'] ?? $provider->enabled),
                'fallback_priority' => (int) ($data['fallback_priority'] ?? $provider->fallback_priority),
                'timeout' => (int) ($data['timeout'] ?? $provider->timeout),
                'max_retries' => (int) ($data['max_retries'] ?? $provider->max_retries),
            ]);

            if (isset($data['is_default']) && (bool) $data['is_default']) {
                $provider->is_default = true;
                $provider->enabled = true;
            }

            $provider->save();

            foreach ($data['credentials'] ?? [] as $key => $value) {
                if (is_string($value) && $value !== '') {
                    $provider->setCredential((string) $key, $value);
                }
            }

            $this->ensureSingleDefault($provider, (bool) $provider->is_default);

            $this->audit($provider, 'updated', $changed);
        });

        return back()->with('success', 'AI provider updated successfully.');
    }

    public function destroy(AiProvider $provider): RedirectResponse
    {
        $this->authorize('manage-settings');

        if (AiProvider::query()->count() <= 1) {
            return back()->with('error', 'At least one AI provider must remain available.');
        }

        DB::transaction(function () use ($provider) {
            $wasDefault = $provider->is_default;
            $this->audit($provider, 'deleted', ['provider']);
            $provider->delete();

            if ($wasDefault) {
                $next = AiProvider::query()->where('enabled', true)->orderBy('fallback_priority')->orderBy('id')->first();
                if ($next) {
                    $next->forceFill(['is_default' => true])->save();
                }
            }
        });

        return back()->with('success', 'AI provider deleted.');
    }

    public function toggle(Request $request, AiProvider $provider): RedirectResponse
    {
        $this->authorize('manage-settings');

        $request->validate(['enabled' => ['required', 'boolean']]);
        $enabled = (bool) $request->boolean('enabled');

        DB::transaction(function () use ($provider, $enabled) {
            $provider->forceFill(['enabled' => $enabled])->save();

            if (! $enabled && $provider->is_default) {
                $provider->forceFill(['is_default' => false])->save();
                $next = AiProvider::query()->where('enabled', true)->whereKeyNot($provider->id)->orderBy('fallback_priority')->first();
                if ($next) {
                    $next->forceFill(['is_default' => true])->save();
                }
            }

            if ($enabled && ! AiProvider::query()->where('is_default', true)->exists()) {
                $provider->forceFill(['is_default' => true])->save();
            }

            $this->audit($provider, $enabled ? 'enabled' : 'disabled', ['enabled']);
        });

        return back()->with('success', $enabled ? 'AI provider enabled.' : 'AI provider disabled.');
    }

    public function setDefault(AiProvider $provider): RedirectResponse
    {
        $this->authorize('manage-settings');

        DB::transaction(function () use ($provider) {
            AiProvider::query()->whereKeyNot($provider->id)->update(['is_default' => false]);
            $provider->forceFill(['is_default' => true, 'enabled' => true])->save();
            $this->audit($provider, 'set_default', ['is_default']);
        });

        return back()->with('success', 'Primary AI provider updated.');
    }

    public function test(AiProvider $provider): JsonResponse
    {
        $this->authorize('manage-settings');

        $result = $this->manager->testConnection($provider);

        return response()->json($result->toArray(), $result->success ? 200 : 422);
    }

    public function discoverModels(AiProvider $provider): JsonResponse
    {
        $this->authorize('manage-settings');

        try {
            $models = $this->manager->discoverModels($provider);
            $provider->refresh()->load('models');

            return response()->json([
                'success' => true,
                'models' => $provider->models->map(fn (AiModel $model) => $this->modelPayload($model))->values(),
                'discovered' => count($models),
            ]);
        } catch (ProviderException $exception) {
            return response()->json(['success' => false, 'error' => $exception->getMessage()], 422);
        }
    }

    public function storeModel(Request $request, AiProvider $provider): RedirectResponse
    {
        $this->authorize('manage-settings');

        $data = $request->validate([
            'model_id' => ['required', 'string', 'max:200'],
            'name' => ['nullable', 'string', 'max:200'],
            'capabilities' => ['nullable', 'array'],
            'capabilities.*' => ['string', Rule::in(CapabilityDetector::ALL)],
            'context_window' => ['nullable', 'integer', 'min:1', 'max:10000000'],
            'is_default' => ['boolean'],
        ]);

        DB::transaction(function () use ($provider, $data) {
            $model = AiModel::withTrashed()->firstOrNew([
                'ai_provider_id' => $provider->id,
                'model_id' => $data['model_id'],
            ]);

            $model->fill([
                'name' => $data['name'] ?? $data['model_id'],
                'capabilities' => $data['capabilities'] ?? CapabilityDetector::detect($data['model_id']),
                'context_window' => $data['context_window'] ?? CapabilityDetector::contextWindow($data['model_id']),
                'discovered_at' => now(),
            ]);
            $model->deleted_at = null;
            $model->save();

            if ((bool) ($data['is_default'] ?? false) || ! $provider->models()->where('is_default', true)->exists()) {
                $this->setDefaultModel($provider, $model);
            }
        });

        return back()->with('success', 'Model saved successfully.');
    }

    public function updateModel(Request $request, AiProvider $provider, AiModel $model): RedirectResponse
    {
        $this->authorize('manage-settings');
        abort_unless($model->ai_provider_id === $provider->id, 404);

        $data = $request->validate([
            'name' => ['nullable', 'string', 'max:200'],
            'capabilities' => ['nullable', 'array'],
            'capabilities.*' => ['string', Rule::in(CapabilityDetector::ALL)],
            'is_default' => ['boolean'],
        ]);

        if (array_key_exists('name', $data)) {
            $model->name = $data['name'];
        }

        if (array_key_exists('capabilities', $data)) {
            $model->capabilities = $data['capabilities'];
        }

        $model->save();

        if ((bool) ($data['is_default'] ?? false)) {
            $this->setDefaultModel($provider, $model);
        }

        return back()->with('success', 'Model updated.');
    }

    public function destroyModel(AiProvider $provider, AiModel $model): RedirectResponse
    {
        $this->authorize('manage-settings');
        abort_unless($model->ai_provider_id === $provider->id, 404);

        $wasDefault = $model->is_default;
        $model->delete();

        if ($wasDefault) {
            $next = $provider->models()->orderBy('model_id')->first();
            if ($next) {
                $this->setDefaultModel($provider, $next);
            }
        }

        return back()->with('success', 'Model deleted.');
    }

    public function importLegacy(): RedirectResponse
    {
        $this->authorize('manage-settings');

        if (AiProvider::query()->exists()) {
            return back()->with('error', 'Providers already exist. Import is only available when the list is empty.');
        }

        $legacy = app(AiSettings::class);
        if (! $legacy->hasApiKey()) {
            return back()->with('error', 'Legacy AI configuration does not have an API key.');
        }

        $driver = $legacy->provider() === 'openai' ? 'openai' : 'openai_compatible';
        $preset = $legacy->provider() === 'openai' ? 'openai' : 'nvidia';

        $provider = AiProvider::create([
            'name' => $legacy->provider() === 'openai' ? 'OpenAI (legacy)' : 'NVIDIA NIM (legacy)',
            'slug' => $this->uniqueSlug($legacy->provider() === 'openai' ? 'OpenAI legacy' : 'NVIDIA NIM legacy'),
            'driver' => $driver,
            'base_url' => $legacy->baseUrl(),
            'config' => ['preset' => $preset, 'default_model' => $legacy->model()],
            'enabled' => true,
            'is_default' => true,
            'status' => 'unknown',
            'created_by' => auth()->id(),
        ]);
        $provider->setCredential('api_key', (string) $legacy->apiKey());

        $this->audit($provider, 'imported_legacy', ['provider']);

        return back()->with('success', 'Legacy AI configuration imported as a provider.');
    }

    public function toggleGlobal(Request $request): RedirectResponse
    {
        $this->authorize('manage-settings');

        $enabled = (bool) $request->boolean('enabled');

        try {
            app(AiSettings::class)->setEnabled($enabled);
        } catch (\RuntimeException $exception) {
            return back()->with('error', $exception->getMessage());
        }

        AiSettingAudit::create([
            'ai_setting_id' => AiSetting::current()->id,
            'user_id' => $request->user()->id,
            'ip' => $request->ip(),
            'changed_fields' => ['enabled'],
        ]);

        return back()->with('success', $enabled ? 'AI features enabled.' : 'AI features disabled.');
    }

    protected function validateProvider(Request $request, ?AiProvider $provider = null): array
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'driver' => ['nullable', 'string', Rule::in(array_keys(config('ai_providers.drivers', [])))],
            'preset' => ['nullable', 'string', Rule::in(array_keys(config('ai_providers.providers', [])))],
            'base_url' => ['nullable', 'string', 'max:500'],
            'enabled' => ['boolean'],
            'is_default' => ['boolean'],
            'fallback_priority' => ['nullable', 'integer', 'min:0', 'max:9999'],
            'timeout' => ['nullable', 'integer', 'min:1', 'max:300'],
            'max_retries' => ['nullable', 'integer', 'min:0', 'max:5'],
            'default_model' => ['nullable', 'string', 'max:200'],
            'config' => ['nullable', 'array'],
            'credentials' => ['nullable', 'array'],
            'credentials.*' => ['nullable', 'string', 'max:8000'],
        ]);

        $preset = $this->preset($data, $provider);
        $driver = $data['driver'] ?? $preset['driver'] ?? $provider?->driver ?? 'openai_compatible';

        if (! in_array($driver, array_keys(config('ai_providers.drivers', [])), true)) {
            throw ValidationException::withMessages(['driver' => 'Unknown AI driver.']);
        }

        $baseUrl = $data['base_url'] ?? $preset['base_url'] ?? $provider?->base_url;

        if ($driver !== 'bedrock') {
            if (blank($baseUrl)) {
                throw ValidationException::withMessages(['base_url' => 'Base URL is required for this provider.']);
            }

            $urlError = UrlGuard::error((string) $baseUrl, (bool) config('ai_providers.allow_local_endpoints', false));
            if ($urlError !== null) {
                throw ValidationException::withMessages(['base_url' => $urlError]);
            }
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

    protected function preset(array $data, ?AiProvider $provider = null): array
    {
        $catalog = config('ai_providers.providers', []);
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
        $allowed[] = 'headers';
        $allowed[] = 'parameters';

        foreach ($data['config'] ?? [] as $key => $value) {
            if (in_array($key, $allowed, true)) {
                $config[$key] = $value;
            }
        }

        if (array_key_exists('default_model', $data)) {
            $config['default_model'] = $data['default_model'];
        } elseif (! isset($config['default_model']) && isset($preset['default_model'])) {
            $config['default_model'] = $preset['default_model'];
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

    protected function ensureSingleDefault(AiProvider $provider, bool $makeDefault): void
    {
        if ($makeDefault) {
            AiProvider::query()->whereKeyNot($provider->id)->update(['is_default' => false]);
            $provider->forceFill(['is_default' => true])->save();

            return;
        }

        if (! AiProvider::query()->where('is_default', true)->exists()) {
            $provider->forceFill(['is_default' => true])->save();
        }
    }

    protected function setDefaultModel(AiProvider $provider, AiModel $model): void
    {
        $provider->models()->update(['is_default' => false]);
        $model->forceFill(['is_default' => true])->save();

        $config = $provider->config ?? [];
        $config['default_model'] = $model->model_id;
        $provider->forceFill(['config' => $config])->save();
    }

    protected function providerPayload(AiProvider $provider): array
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
            'fallback_priority' => (int) $provider->fallback_priority,
            'timeout' => (int) $provider->timeout,
            'max_retries' => (int) $provider->max_retries,
            'status' => $provider->status,
            'last_tested_at' => $provider->last_tested_at?->toIso8601String(),
            'last_error' => $provider->last_error,
            'credentials' => $credentials,
            'models' => $provider->models->map(fn (AiModel $model) => $this->modelPayload($model))->values(),
            'default_model' => $provider->defaultModel(),
            'created_at' => $provider->created_at?->toIso8601String(),
        ];
    }

    protected function modelPayload(AiModel $model): array
    {
        return [
            'id' => $model->id,
            'model_id' => $model->model_id,
            'name' => $model->name,
            'capabilities' => $model->capabilities ?? [],
            'context_window' => $model->context_window,
            'is_default' => (bool) $model->is_default,
            'discovered_at' => $model->discovered_at?->toIso8601String(),
        ];
    }

    protected function catalogPayload(): array
    {
        return collect(config('ai_providers.providers', []))
            ->map(fn ($preset, $key) => ['key' => $key] + $preset)
            ->values()
            ->all();
    }

    protected function findPresetByDriver(string $driver): ?string
    {
        foreach (config('ai_providers.providers', []) as $key => $preset) {
            if (($preset['driver'] ?? null) === $driver) {
                return $key;
            }
        }

        return null;
    }

    protected function uniqueSlug(string $name): string
    {
        $base = Str::slug($name) ?: 'provider';
        $slug = $base;
        $counter = 2;

        while (AiProvider::withTrashed()->where('slug', $slug)->exists()) {
            $slug = $base.'-'.$counter++;
        }

        return $slug;
    }

    protected function audit(AiProvider $provider, string $action, array $fields): void
    {
        AiProviderLog::create([
            'ai_provider_id' => $provider->id,
            'user_id' => auth()->id(),
            'action' => $action,
            'status' => 'success',
            'message' => 'Provider configuration changed.',
            'context' => ['changed_fields' => array_values(array_unique($fields))],
            'ip' => request()->ip(),
        ]);
    }
}
