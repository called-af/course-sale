import { Head, router, useForm } from '@inertiajs/react';
import { Activity, CheckCircle2, Cpu, Database, KeyRound, Pencil, Plus, RefreshCw, Sparkles, Star, Trash2, Wand2, XCircle } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import { route } from 'ziggy-js';

import Badge from '@/components/atoms/Badge';
import Button from '@/components/atoms/Button';
import Card from '@/components/atoms/Card';
import Label from '@/components/atoms/Label';
import Modal from '@/components/atoms/Modal';
import Textarea from '@/components/atoms/Textarea';
import Toggle from '@/components/atoms/Toggle';
import InputField from '@/components/molecules/InputField';
import SelectField from '@/components/molecules/SelectField';
import AdminLayout from '@/components/templates/AdminLayout';
import { apiFetch } from '@/lib/csrf';

interface CredentialField {
    key: string;
    label: string;
    required?: boolean;
    secret?: boolean;
}

interface ConfigField {
    key: string;
    label: string;
    required?: boolean;
    type?: string;
    default?: string | number | null;
}

interface CatalogProvider {
    key: string;
    name: string;
    driver: string;
    base_url: string | null;
    description?: string;
    default_model?: string | null;
    credential_fields: CredentialField[];
    config_fields: ConfigField[];
    capabilities: string[];
}

interface CredentialState {
    has_value: boolean;
    hint: string | null;
}

interface ProviderModel {
    id: number;
    model_id: string;
    name: string;
    capabilities: string[];
    context_window: number | null;
    is_default: boolean;
    discovered_at: string | null;
}

interface Provider {
    id: number;
    name: string;
    slug: string;
    driver: string;
    preset: string | null;
    base_url: string | null;
    config: Record<string, unknown>;
    enabled: boolean;
    is_default: boolean;
    fallback_priority: number;
    timeout: number;
    max_retries: number;
    status: string;
    last_tested_at: string | null;
    last_error: string | null;
    credentials: Record<string, CredentialState>;
    models: ProviderModel[];
    default_model: string | null;
    created_at: string | null;
}

interface Usage {
    period_days: number;
    requests: number;
    successful_requests: number;
    input_tokens: number;
    output_tokens: number;
    total_tokens: number;
    avg_latency_ms: number;
    by_provider: { provider_id: number | null; provider_name: string | null; requests: number; total_tokens: number }[];
}

interface ProviderLog {
    id: number;
    provider: string | null;
    action: string;
    status: string;
    message: string | null;
    created_at: string | null;
}

interface AiPageProps {
    providers: Provider[];
    catalog: CatalogProvider[];
    drivers: Record<string, string>;
    global: {
        enabled: boolean;
        provider: string;
        base_url: string | null;
        model: string | null;
        has_api_key: boolean;
        api_key_hint: string | null;
        is_configured: boolean;
    };
    recommendation: { enabled: boolean };
    usage: Usage;
    recent_logs: ProviderLog[];
    allow_local_endpoints: boolean;
}

interface ProviderFormState {
    preset: string;
    driver: string;
    name: string;
    base_url: string;
    timeout: number;
    max_retries: number;
    fallback_priority: number;
    enabled: boolean;
    is_default: boolean;
    default_model: string;
    credentials: Record<string, string>;
    config: Record<string, string>;
}

const EMPTY_FORM: ProviderFormState = {
    preset: 'openai',
    driver: 'openai',
    name: '',
    base_url: '',
    timeout: 30,
    max_retries: 1,
    fallback_priority: 100,
    enabled: true,
    is_default: false,
    default_model: '',
    credentials: {},
    config: {},
};

function statusVariant(status: string): 'success' | 'danger' | 'warning' | 'default' {
    if (status === 'connected') return 'success';
    if (status === 'error') return 'danger';
    if (status === 'unknown') return 'warning';
    return 'default';
}

function formatNumber(value: number): string {
    return new Intl.NumberFormat('en-US').format(value);
}

function findPreset(catalog: CatalogProvider[], provider: Provider | null): CatalogProvider | undefined {
    if (!provider) return undefined;
    return catalog.find((item) => item.key === provider.preset) ?? catalog.find((item) => item.driver === provider.driver);
}

function buildFormState(provider: Provider | null, catalog: CatalogProvider[]): ProviderFormState {
    if (!provider) {
        const preset = catalog[0];
        return {
            ...EMPTY_FORM,
            preset: preset?.key ?? '',
            driver: preset?.driver ?? 'openai_compatible',
            base_url: preset?.base_url ?? '',
            name: preset?.name ? `${preset.name}` : '',
            default_model: preset?.default_model ?? '',
            config: Object.fromEntries((preset?.config_fields ?? []).map((field) => [field.key, field.default != null ? String(field.default) : ''])),
        };
    }

    const preset = findPreset(catalog, provider);
    const config: Record<string, string> = {};

    for (const field of preset?.config_fields ?? []) {
        const value = provider.config?.[field.key];
        config[field.key] = value == null ? '' : typeof value === 'object' ? JSON.stringify(value) : String(value);
    }

    return {
        preset: provider.preset ?? preset?.key ?? '',
        driver: provider.driver,
        name: provider.name,
        base_url: provider.base_url ?? '',
        timeout: provider.timeout,
        max_retries: provider.max_retries,
        fallback_priority: provider.fallback_priority,
        enabled: provider.enabled,
        is_default: provider.is_default,
        default_model: provider.default_model ?? '',
        credentials: {},
        config,
    };
}

function ProviderFormModal({
    open,
    provider,
    catalog,
    drivers,
    onClose,
}: {
    open: boolean;
    provider: Provider | null;
    catalog: CatalogProvider[];
    drivers: Record<string, string>;
    onClose: () => void;
}) {
    const form = useForm<ProviderFormState>(buildFormState(provider, catalog));
    const [jsonError, setJsonError] = useState<string | null>(null);

    useEffect(() => {
        if (!open) return;

        form.setData(buildFormState(provider, catalog));
        form.clearErrors();
        setJsonError(null);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, provider?.id]);

    const preset = useMemo(() => catalog.find((item) => item.key === form.data.preset), [catalog, form.data.preset]);

    const applyPreset = (key: string) => {
        const next = catalog.find((item) => item.key === key);

        if (!next) return;

        form.setData((data) => ({
            ...data,
            preset: key,
            driver: next.driver,
            base_url: next.base_url ?? '',
            name: data.name || next.name,
            default_model: next.default_model ?? '',
            config: Object.fromEntries(next.config_fields.map((field) => [field.key, field.default != null ? String(field.default) : ''])),
        }));
    };

    const submit = (event: React.FormEvent) => {
        event.preventDefault();
        setJsonError(null);

        const config: Record<string, unknown> = {};

        for (const field of preset?.config_fields ?? []) {
            const raw = form.data.config[field.key] ?? '';

            if (raw === '') continue;

            if (field.type === 'json') {
                try {
                    config[field.key] = JSON.parse(raw);
                } catch {
                    setJsonError(`${field.label} must be valid JSON.`);
                    return;
                }
            } else {
                config[field.key] = raw;
            }
        }

        const payload = { ...form.data, config };
        const options = {
            preserveScroll: true,
            onSuccess: () => {
                form.reset();
                onClose();
            },
        };

        if (provider) {
            form.transform(() => payload);
            form.put(route('admin.integrations.ai.update', provider.id), options);
        } else {
            form.transform(() => payload);
            form.post(route('admin.integrations.ai.store'), options);
        }
    };

    return (
        <Modal
            open={open}
            onClose={onClose}
            size="xl"
            title={provider ? `Edit provider: ${provider.name}` : 'Add AI Provider'}
            footer={
                <>
                    <Button variant="ghost" onClick={onClose} disabled={form.processing}>
                        Cancel
                    </Button>
                    <Button onClick={submit} isLoading={form.processing} disabled={form.processing}>
                        {provider ? 'Save changes' : 'Add provider'}
                    </Button>
                </>
            }
        >
            <form onSubmit={submit} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                    <SelectField
                        label="Provider preset"
                        name="preset"
                        value={form.data.preset}
                        onChange={(event) => applyPreset(event.target.value)}
                        options={[
                            ...catalog.map((item) => ({ label: item.name, value: item.key })),
                            { label: 'Custom (select driver manually)', value: '' },
                        ]}
                    />

                    <SelectField
                        label="Driver / protocol"
                        name="driver"
                        value={form.data.driver}
                        onChange={(event) => form.setData('driver', event.target.value)}
                        options={Object.entries(drivers).map(([value, label]) => ({ label, value }))}
                    />

                    <InputField
                        label="Provider name"
                        name="name"
                        value={form.data.name}
                        onChange={(event) => form.setData('name', event.target.value)}
                        placeholder="OpenAI Production"
                        error={form.errors.name}
                    />

                    <InputField
                        label="Base URL"
                        name="base_url"
                        value={form.data.base_url}
                        onChange={(event) => form.setData('base_url', event.target.value)}
                        placeholder="https://api.openai.com/v1"
                        error={form.errors.base_url}
                        disabled={form.data.driver === 'bedrock'}
                    />

                    <InputField
                        label="Default model"
                        name="default_model"
                        value={form.data.default_model}
                        onChange={(event) => form.setData('default_model', event.target.value)}
                        placeholder={preset?.default_model ?? 'gpt-4o-mini'}
                        error={form.errors.default_model}
                    />

                    <InputField
                        label="Timeout (seconds)"
                        name="timeout"
                        type="number"
                        min={1}
                        max={300}
                        value={form.data.timeout}
                        onChange={(event) => form.setData('timeout', Number(event.target.value))}
                        error={form.errors.timeout}
                    />

                    <InputField
                        label="Max retries"
                        name="max_retries"
                        type="number"
                        min={0}
                        max={5}
                        value={form.data.max_retries}
                        onChange={(event) => form.setData('max_retries', Number(event.target.value))}
                        error={form.errors.max_retries}
                    />

                    <InputField
                        label="Fallback priority"
                        name="fallback_priority"
                        type="number"
                        min={0}
                        max={9999}
                        value={form.data.fallback_priority}
                        onChange={(event) => form.setData('fallback_priority', Number(event.target.value))}
                        error={form.errors.fallback_priority}
                    />
                </div>

                {(preset?.credential_fields.length ?? 0) > 0 && (
                    <div className="border-t border-neutral-200 pt-4 dark:border-slate-700">
                        <p className="mb-3 text-sm font-semibold text-slate-900 dark:text-white">Credentials</p>
                        <div className="grid gap-4 sm:grid-cols-2">
                            {preset?.credential_fields.map((field) => {
                                const existing = provider?.credentials[field.key];

                                return (
                                    <InputField
                                        key={field.key}
                                        label={`${field.label}${field.required ? ' *' : ''}`}
                                        name={`credential_${field.key}`}
                                        type="password"
                                        autoComplete="new-password"
                                        value={form.data.credentials[field.key] ?? ''}
                                        onChange={(event) =>
                                            form.setData('credentials', {
                                                ...form.data.credentials,
                                                [field.key]: event.target.value,
                                            })
                                        }
                                        placeholder={existing?.has_value ? `Saved ${existing.hint ?? ''} — leave blank to keep` : 'Enter value'}
                                        error={form.errors[`credentials.${field.key}`]}
                                    />
                                );
                            })}
                        </div>
                        <p className="mt-2 text-xs text-neutral-500">Credentials are stored encrypted and are never sent back to the browser.</p>
                    </div>
                )}

                {(preset?.config_fields.length ?? 0) > 0 && (
                    <div className="border-t border-neutral-200 pt-4 dark:border-slate-700">
                        <p className="mb-3 text-sm font-semibold text-slate-900 dark:text-white">Additional configuration</p>
                        <div className="grid gap-4 sm:grid-cols-2">
                            {preset?.config_fields.map((field) => (
                                <div key={field.key} className={field.type === 'json' ? 'sm:col-span-2' : undefined}>
                                    <Label htmlFor={`config_${field.key}`}>{`${field.label}${field.required ? ' *' : ''}`}</Label>
                                    {field.type === 'json' ? (
                                        <Textarea
                                            id={`config_${field.key}`}
                                            name={`config_${field.key}`}
                                            rows={3}
                                            value={form.data.config[field.key] ?? ''}
                                            onChange={(event) =>
                                                form.setData('config', {
                                                    ...form.data.config,
                                                    [field.key]: event.target.value,
                                                })
                                            }
                                            placeholder="{}"
                                        />
                                    ) : (
                                        <InputField
                                            name={`config_${field.key}`}
                                            value={form.data.config[field.key] ?? ''}
                                            onChange={(event) =>
                                                form.setData('config', {
                                                    ...form.data.config,
                                                    [field.key]: event.target.value,
                                                })
                                            }
                                            error={form.errors[`config.${field.key}`]}
                                        />
                                    )}
                                </div>
                            ))}
                        </div>
                        {jsonError && <p className="mt-2 text-xs text-red-600 dark:text-red-400">{jsonError}</p>}
                    </div>
                )}

                <div className="flex flex-wrap items-center gap-6 border-t border-neutral-200 pt-4 dark:border-slate-700">
                    <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
                        <Toggle checked={form.data.enabled} onCheckedChange={(checked) => form.setData('enabled', checked)} label="Enable provider" />
                        Active
                    </label>
                    <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
                        <Toggle
                            checked={form.data.is_default}
                            onCheckedChange={(checked) => form.setData('is_default', checked)}
                            label="Set as primary provider"
                        />
                        Primary provider
                    </label>
                </div>
            </form>
        </Modal>
    );
}

function ModelsModal({ provider, onClose }: { provider: Provider | null; onClose: () => void }) {
    const [modelId, setModelId] = useState('');
    const [name, setName] = useState('');
    const [contextWindow, setContextWindow] = useState('');
    const [capabilities, setCapabilities] = useState<string[]>(['text']);
    const [processing, setProcessing] = useState(false);

    const capabilityOptions = [
        'text',
        'streaming',
        'vision',
        'tools',
        'structured_output',
        'json_mode',
        'embeddings',
        'audio_input',
        'audio_output',
        'image_generation',
    ];

    const addModel = () => {
        if (!provider || modelId.trim() === '') return;

        setProcessing(true);
        router.post(
            route('admin.integrations.ai.models.store', provider.id),
            {
                model_id: modelId.trim(),
                name: name.trim() || null,
                capabilities,
                context_window: contextWindow ? Number(contextWindow) : null,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setModelId('');
                    setName('');
                    setContextWindow('');
                    setCapabilities(['text']);
                    onClose();
                },
                onFinish: () => setProcessing(false),
            },
        );
    };

    const discover = async () => {
        if (!provider) return;

        setProcessing(true);

        try {
            const response = await apiFetch(route('admin.integrations.ai.models.discover', provider.id), { method: 'POST' });
            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(result.error ?? 'Failed to discover models.');
            }

            toast.success(`${result.discovered ?? 0} models discovered.`);
            router.reload({ only: ['providers'] });
            onClose();
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to discover models.');
        } finally {
            setProcessing(false);
        }
    };

    return (
        <Modal
            open={provider !== null}
            onClose={onClose}
            size="lg"
            title={provider ? `Models — ${provider.name}` : 'Models'}
            footer={
                <>
                    <Button variant="ghost" onClick={onClose}>
                        Close
                    </Button>
                    <Button variant="outline" onClick={discover} isLoading={processing} leftIcon={<RefreshCw size={15} />}>
                        Discover
                    </Button>
                </>
            }
        >
            {provider && (
                <div className="space-y-5">
                    <div className="space-y-2">
                        {provider.models.length === 0 && <p className="text-sm text-neutral-500">No models yet. Run discover or add one manually.</p>}
                        {provider.models.map((model) => (
                            <div
                                key={model.id}
                                className="flex flex-col gap-2 border border-neutral-200 p-3 sm:flex-row sm:items-center sm:justify-between dark:border-slate-700"
                            >
                                <div className="min-w-0">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span className="text-sm font-medium text-slate-900 dark:text-white">{model.name || model.model_id}</span>
                                        {model.is_default && <Badge variant="purple">default</Badge>}
                                    </div>
                                    <p className="truncate text-xs text-neutral-500">{model.model_id}</p>
                                    <div className="mt-1 flex flex-wrap gap-1">
                                        {model.capabilities.map((capability) => (
                                            <span
                                                key={capability}
                                                className="bg-neutral-100 px-1.5 py-0.5 text-[10px] text-neutral-600 dark:bg-slate-800 dark:text-slate-300"
                                            >
                                                {capability}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                                <div className="flex shrink-0 gap-1">
                                    {!model.is_default && (
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            leftIcon={<Star size={14} />}
                                            onClick={() =>
                                                router.put(
                                                    route('admin.integrations.ai.models.update', [provider.id, model.id]),
                                                    { is_default: true },
                                                    { preserveScroll: true },
                                                )
                                            }
                                        >
                                            Default
                                        </Button>
                                    )}
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        leftIcon={<Trash2 size={14} />}
                                        onClick={() => {
                                            if (window.confirm(`Delete model ${model.model_id}?`)) {
                                                router.delete(route('admin.integrations.ai.models.destroy', [provider.id, model.id]), {
                                                    preserveScroll: true,
                                                });
                                            }
                                        }}
                                    >
                                        Remove
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="border-t border-neutral-200 pt-4 dark:border-slate-700">
                        <p className="mb-3 text-sm font-semibold text-slate-900 dark:text-white">Add model manually</p>
                        <div className="space-y-3">
                            <InputField
                                label="Model ID"
                                name="model_id"
                                value={modelId}
                                onChange={(event) => setModelId(event.target.value)}
                                placeholder="gpt-4o-mini"
                            />
                            <div className="grid gap-3 sm:grid-cols-2">
                                <InputField
                                    label="Display name"
                                    name="model_name"
                                    value={name}
                                    onChange={(event) => setName(event.target.value)}
                                    placeholder="Optional"
                                />
                                <InputField
                                    label="Context window"
                                    name="context_window"
                                    type="number"
                                    min={1}
                                    value={contextWindow}
                                    onChange={(event) => setContextWindow(event.target.value)}
                                    placeholder="Optional"
                                />
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {capabilityOptions.map((capability) => {
                                    const active = capabilities.includes(capability);

                                    return (
                                        <button
                                            key={capability}
                                            type="button"
                                            onClick={() =>
                                                setCapabilities((current) =>
                                                    active ? current.filter((item) => item !== capability) : [...current, capability],
                                                )
                                            }
                                            className={`border px-2 py-1 text-xs transition-colors ${
                                                active
                                                    ? 'border-purple-500 bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300'
                                                    : 'border-neutral-300 text-neutral-600 hover:border-purple-300 dark:border-slate-600 dark:text-slate-300'
                                            }`}
                                        >
                                            {capability}
                                        </button>
                                    );
                                })}
                            </div>
                            <Button onClick={addModel} disabled={processing || modelId.trim() === ''} leftIcon={<Plus size={15} />}>
                                Save model
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </Modal>
    );
}

function ProviderCard({ provider, onEdit, onManageModels }: { provider: Provider; onEdit: () => void; onManageModels: () => void }) {
    const [testing, setTesting] = useState(false);
    const [discovering, setDiscovering] = useState(false);

    const testConnection = async () => {
        setTesting(true);

        try {
            const response = await apiFetch(route('admin.integrations.ai.test', provider.id), { method: 'POST' });
            const result = await response.json();

            if (!response.ok || !result.success) {
                toast.error(result.message ?? result.error ?? 'Connection failed.');
            } else {
                toast.success(result.message ?? 'Connection successful.');
                router.reload({ only: ['providers', 'recent_logs'] });
            }
        } catch {
            toast.error('Unable to test connection.');
        } finally {
            setTesting(false);
        }
    };

    const discover = async () => {
        setDiscovering(true);

        try {
            const response = await apiFetch(route('admin.integrations.ai.models.discover', provider.id), { method: 'POST' });
            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(result.error ?? 'Failed to discover models.');
            }

            toast.success(`${result.discovered ?? 0} models discovered.`);
            router.reload({ only: ['providers'] });
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to discover models.');
        } finally {
            setDiscovering(false);
        }
    };

    return (
        <Card className="space-y-4 rounded-none">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex min-w-0 items-start gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center bg-purple-100 text-purple-600 dark:bg-purple-500/20 dark:text-purple-300">
                        <Cpu size={19} />
                    </span>
                    <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-semibold text-slate-900 dark:text-white">{provider.name}</h3>
                            {provider.is_default && <Badge variant="purple">Primary</Badge>}
                            <Badge variant={provider.enabled ? 'success' : 'default'}>{provider.enabled ? 'Active' : 'Inactive'}</Badge>
                            <Badge variant={statusVariant(provider.status)}>{provider.status}</Badge>
                        </div>
                        <p className="mt-1 truncate text-xs text-neutral-500">
                            {provider.driver} · {provider.base_url || 'base URL not required'}
                        </p>
                        <p className="mt-1 text-xs text-neutral-500">
                            Default model: <span className="font-medium text-slate-700 dark:text-slate-200">{provider.default_model || '—'}</span>
                        </p>
                        {provider.last_error && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{provider.last_error}</p>}
                    </div>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                    <Toggle
                        checked={provider.enabled}
                        onCheckedChange={(checked) =>
                            router.patch(route('admin.integrations.ai.toggle', provider.id), { enabled: checked }, { preserveScroll: true })
                        }
                        label={`Enable ${provider.name}`}
                    />
                </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
                <div className="border border-neutral-200 p-3 dark:border-slate-700">
                    <p className="text-[10px] font-semibold tracking-wider text-neutral-500 uppercase">Registered models</p>
                    <p className="mt-1 text-lg font-semibold text-slate-900 dark:text-white">{provider.models.length}</p>
                </div>
                <div className="border border-neutral-200 p-3 dark:border-slate-700">
                    <p className="text-[10px] font-semibold tracking-wider text-neutral-500 uppercase">Timeout</p>
                    <p className="mt-1 text-lg font-semibold text-slate-900 dark:text-white">{provider.timeout}s</p>
                </div>
                <div className="border border-neutral-200 p-3 dark:border-slate-700">
                    <p className="text-[10px] font-semibold tracking-wider text-neutral-500 uppercase">Fallback priority</p>
                    <p className="mt-1 text-lg font-semibold text-slate-900 dark:text-white">{provider.fallback_priority}</p>
                </div>
            </div>

            <div className="flex flex-wrap gap-2 border-t border-neutral-200 pt-4 dark:border-slate-700">
                <Button size="sm" variant="outline" onClick={onEdit} leftIcon={<Pencil size={14} />}>
                    Edit
                </Button>
                <Button size="sm" variant="outline" onClick={testConnection} isLoading={testing} leftIcon={<Activity size={14} />}>
                    Test
                </Button>
                <Button size="sm" variant="outline" onClick={discover} isLoading={discovering} leftIcon={<Wand2 size={14} />}>
                    Discover
                </Button>
                <Button size="sm" variant="outline" onClick={onManageModels} leftIcon={<Database size={14} />}>
                    Models
                </Button>
                {!provider.is_default && (
                    <Button
                        size="sm"
                        variant="outline"
                        leftIcon={<Star size={14} />}
                        onClick={() => router.put(route('admin.integrations.ai.default', provider.id), {}, { preserveScroll: true })}
                    >
                        Set as primary
                    </Button>
                )}
                <Button
                    size="sm"
                    variant="danger"
                    leftIcon={<Trash2 size={14} />}
                    onClick={() => {
                        if (window.confirm(`Delete provider ${provider.name}?`)) {
                            router.delete(route('admin.integrations.ai.destroy', provider.id), { preserveScroll: true });
                        }
                    }}
                >
                    Delete
                </Button>
            </div>
        </Card>
    );
}

export default function AiIntegrations({
    providers,
    catalog,
    drivers,
    global,
    recommendation,
    usage,
    recent_logs,
    allow_local_endpoints,
}: AiPageProps) {
    const [formOpen, setFormOpen] = useState(false);
    const [editing, setEditing] = useState<Provider | null>(null);
    const [modelProvider, setModelProvider] = useState<Provider | null>(null);

    const openCreate = () => {
        setEditing(null);
        setFormOpen(true);
    };

    const openEdit = (provider: Provider) => {
        setEditing(provider);
        setFormOpen(true);
    };

    const successRate = usage.requests > 0 ? Math.round((usage.successful_requests / usage.requests) * 100) : 0;

    return (
        <>
            <Head title="AI Integration" />
            <div className="mx-auto max-w-6xl space-y-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">AI Integration</h1>
                        <p className="mt-1 text-sm text-neutral-500">Manage providers, models, encrypted credentials, fallback, and AI usage.</p>
                    </div>
                    <Button onClick={openCreate} leftIcon={<Plus size={16} />} className="w-full sm:w-auto">
                        Add provider
                    </Button>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <Card className="rounded-none">
                        <p className="text-xs font-semibold tracking-wider text-neutral-500 uppercase">Requests ({usage.period_days} days)</p>
                        <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">{formatNumber(usage.requests)}</p>
                    </Card>
                    <Card className="rounded-none">
                        <p className="text-xs font-semibold tracking-wider text-neutral-500 uppercase">Success rate</p>
                        <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">{successRate}%</p>
                    </Card>
                    <Card className="rounded-none">
                        <p className="text-xs font-semibold tracking-wider text-neutral-500 uppercase">Total tokens</p>
                        <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">{formatNumber(usage.total_tokens)}</p>
                        <p className="mt-1 text-[11px] text-neutral-500">
                            in {formatNumber(usage.input_tokens)} · out {formatNumber(usage.output_tokens)}
                        </p>
                    </Card>
                    <Card className="rounded-none">
                        <p className="text-xs font-semibold tracking-wider text-neutral-500 uppercase">Average latency</p>
                        <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">{formatNumber(usage.avg_latency_ms)} ms</p>
                    </Card>
                </div>

                <Card className="space-y-5 rounded-none">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-start gap-3">
                            <span className="flex h-10 w-10 shrink-0 items-center justify-center bg-purple-100 text-purple-600 dark:bg-purple-500/20 dark:text-purple-300">
                                <Sparkles size={19} />
                            </span>
                            <div>
                                <h2 className="font-semibold text-slate-900 dark:text-white">AI Features</h2>
                                <p className="text-sm text-neutral-500">Enable the AI assistant across the application.</p>
                            </div>
                        </div>
                        <Toggle
                            checked={global.enabled}
                            onCheckedChange={(checked) =>
                                router.patch(route('admin.integrations.ai.global'), { enabled: checked }, { preserveScroll: true })
                            }
                            label="Enable AI features"
                        />
                    </div>

                    <div className="flex flex-col gap-4 border-t border-neutral-200 pt-5 sm:flex-row sm:items-center sm:justify-between dark:border-slate-700">
                        <div>
                            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Course recommendation system</h3>
                            <p className="text-sm text-neutral-500">Show personalized course recommendations on the student dashboard.</p>
                        </div>
                        <Toggle
                            checked={recommendation.enabled}
                            onCheckedChange={(checked) =>
                                router.patch(route('admin.integrations.ai.recommendation'), { enabled: checked }, { preserveScroll: true })
                            }
                            label="Enable recommendations"
                        />
                    </div>

                    {!global.is_configured && providers.length === 0 && (
                        <div className="flex flex-col gap-3 border-t border-neutral-200 pt-5 sm:flex-row sm:items-center sm:justify-between dark:border-slate-700">
                            <p className="text-sm text-neutral-500">
                                Legacy AI configuration detected and can be imported into the new provider system.
                            </p>
                            <Button
                                variant="outline"
                                onClick={() => router.post(route('admin.integrations.ai.import-legacy'), {}, { preserveScroll: true })}
                            >
                                Import legacy configuration
                            </Button>
                        </div>
                    )}

                    {!allow_local_endpoints && (
                        <p className="border-t border-neutral-200 pt-4 text-xs text-neutral-500 dark:border-slate-700">
                            Local/private endpoints are blocked by SSRF protection. Set <code>AI_ALLOW_LOCAL_ENDPOINTS=true</code> for local Ollama,
                            LM Studio, vLLM, or LiteLLM.
                        </p>
                    )}
                </Card>

                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Registered providers</h2>
                        <span className="text-sm text-neutral-500">{providers.length} providers</span>
                    </div>

                    {providers.length === 0 ? (
                        <Card className="rounded-none text-center">
                            <KeyRound className="mx-auto h-8 w-8 text-neutral-400" />
                            <p className="mt-3 font-medium text-slate-900 dark:text-white">No AI providers yet</p>
                            <p className="mt-1 text-sm text-neutral-500">Add your first provider to start using the AI assistant.</p>
                            <Button className="mt-4" onClick={openCreate} leftIcon={<Plus size={16} />}>
                                Add provider
                            </Button>
                        </Card>
                    ) : (
                        <div className="space-y-4">
                            {providers.map((provider) => (
                                <ProviderCard
                                    key={provider.id}
                                    provider={provider}
                                    onEdit={() => openEdit(provider)}
                                    onManageModels={() => setModelProvider(provider)}
                                />
                            ))}
                        </div>
                    )}
                </div>

                <div className="grid gap-4 lg:grid-cols-2">
                    <Card className="rounded-none">
                        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Usage by provider</h2>
                        <div className="mt-4 space-y-3">
                            {usage.by_provider.length === 0 && <p className="text-sm text-neutral-500">No usage yet.</p>}
                            {usage.by_provider.map((row) => (
                                <div key={`${row.provider_id ?? 'legacy'}`} className="flex items-center justify-between gap-3">
                                    <span className="truncate text-sm text-slate-700 dark:text-slate-200">{row.provider_name ?? 'Legacy'}</span>
                                    <span className="shrink-0 text-xs text-neutral-500">
                                        {formatNumber(row.requests)} req · {formatNumber(row.total_tokens)} token
                                    </span>
                                </div>
                            ))}
                        </div>
                    </Card>

                    <Card className="rounded-none">
                        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Recent logs</h2>
                        <div className="mt-4 space-y-3">
                            {recent_logs.length === 0 && <p className="text-sm text-neutral-500">No activity yet.</p>}
                            {recent_logs.map((log) => (
                                <div key={log.id} className="flex items-start gap-2">
                                    {log.status === 'success' ? (
                                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                                    ) : (
                                        <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-500" />
                                    )}
                                    <div className="min-w-0">
                                        <p className="truncate text-sm text-slate-700 dark:text-slate-200">
                                            <span className="font-medium">{log.provider ?? 'Legacy'}</span> · {log.action}
                                        </p>
                                        {log.message && <p className="truncate text-xs text-neutral-500">{log.message}</p>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>
                </div>
            </div>

            <ProviderFormModal
                open={formOpen}
                provider={editing}
                catalog={catalog}
                drivers={drivers}
                onClose={() => {
                    setFormOpen(false);
                    setEditing(null);
                }}
            />

            <ModelsModal provider={modelProvider} onClose={() => setModelProvider(null)} />
        </>
    );
}

AiIntegrations.layout = (page: React.ReactNode) => <AdminLayout>{page}</AdminLayout>;
