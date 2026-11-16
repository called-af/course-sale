import { Head, router, useForm } from '@inertiajs/react';
import {
    CheckCircle2,
    Copy,
    Link2,
    MessageCircle,
    Pencil,
    Plus,
    RefreshCw,
    Send,
    Smartphone,
    Trash2,
    Webhook,
    XCircle,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import { route } from 'ziggy-js';

import Badge from '@/components/atoms/Badge';
import Button from '@/components/atoms/Button';
import Card from '@/components/atoms/Card';
import Label from '@/components/atoms/Label';
import Modal from '@/components/atoms/Modal';
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
    credential_fields: CredentialField[];
    config_fields: ConfigField[];
    capabilities: string[];
}

interface CredentialState {
    has_value: boolean;
    hint: string | null;
}

interface Template {
    id: number;
    name: string;
    language: string;
    category: string | null;
    status: string;
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
    timeout: number;
    max_retries: number;
    status: string;
    last_tested_at: string | null;
    last_error: string | null;
    credentials: Record<string, CredentialState>;
    accounts_count: number;
    messages_count: number;
    templates_count: number;
    webhook_url: string;
    templates: Template[];
    created_at: string | null;
}

interface MessageRow {
    id: number;
    provider_id: number | null;
    provider: string | null;
    direction: string;
    type: string;
    to: string | null;
    from: string | null;
    body: string | null;
    provider_message_id: string | null;
    status: string;
    error_message: string | null;
    created_at: string | null;
}

interface ProviderLog {
    id: number;
    provider: string | null;
    action: string;
    status: string;
    message: string | null;
    created_at: string | null;
}

interface WhatsAppPageProps {
    providers: Provider[];
    catalog: CatalogProvider[];
    drivers: Record<string, string>;
    global: {
        enabled: boolean;
        provider: string;
        base_url: string | null;
        from_number: string | null;
        sandbox_keyword: string | null;
        has_api_key: boolean;
        api_key_hint: string | null;
        is_configured: boolean;
    };
    stats: {
        today: { total: number; sent: number; delivered: number; read: number; failed: number };
        all_time: { total: number; inbound: number; outbound: number };
    };
    recent_messages: MessageRow[];
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
    enabled: boolean;
    is_default: boolean;
    credentials: Record<string, string>;
    config: Record<string, string>;
}

function statusVariant(status: string): 'success' | 'danger' | 'warning' | 'info' | 'default' {
    if (status === 'connected' || status === 'delivered' || status === 'read') return 'success';
    if (status === 'error' || status === 'failed') return 'danger';
    if (status === 'unknown' || status === 'queued' || status === 'pending') return 'warning';
    if (status === 'sent') return 'info';
    return 'default';
}

function findPreset(catalog: CatalogProvider[], provider: Provider | null): CatalogProvider | undefined {
    if (!provider) return undefined;
    return catalog.find((item) => item.key === provider.preset) ?? catalog.find((item) => item.driver === provider.driver);
}

function buildFormState(provider: Provider | null, catalog: CatalogProvider[]): ProviderFormState {
    if (!provider) {
        const preset = catalog[0];

        return {
            preset: preset?.key ?? '',
            driver: preset?.driver ?? 'custom',
            name: preset?.name ? `${preset.name}` : '',
            base_url: preset?.base_url ?? '',
            timeout: 15,
            max_retries: 1,
            enabled: true,
            is_default: false,
            credentials: {},
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
        enabled: provider.enabled,
        is_default: provider.is_default,
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

    useEffect(() => {
        if (!open) return;

        form.setData(buildFormState(provider, catalog));
        form.clearErrors();
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
            config: Object.fromEntries(
                next.config_fields.map((field) => [field.key, field.default != null ? String(field.default) : '']),
            ),
        }));
    };

    const submit = (event: React.FormEvent) => {
        event.preventDefault();

        const payload = { ...form.data };
        const options = {
            preserveScroll: true,
            onSuccess: () => {
                form.reset();
                onClose();
            },
        };

        form.transform(() => payload);

        if (provider) {
            form.put(route('admin.integrations.whatsapp.update', provider.id), options);
        } else {
            form.post(route('admin.integrations.whatsapp.store'), options);
        }
    };

    return (
        <Modal
            open={open}
            onClose={onClose}
            size="xl"
            title={provider ? `Edit provider: ${provider.name}` : 'Tambah provider WhatsApp'}
            footer={
                <>
                    <Button variant="ghost" onClick={onClose} disabled={form.processing}>
                        Batal
                    </Button>
                    <Button onClick={submit} isLoading={form.processing} disabled={form.processing}>
                        {provider ? 'Simpan perubahan' : 'Tambah provider'}
                    </Button>
                </>
            }
        >
            <form onSubmit={submit} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                    <SelectField
                        label="Preset provider"
                        name="preset"
                        value={form.data.preset}
                        onChange={(event) => applyPreset(event.target.value)}
                        options={[
                            ...catalog.map((item) => ({ label: item.name, value: item.key })),
                            { label: 'Custom (pilih driver manual)', value: '' },
                        ]}
                    />

                    <SelectField
                        label="Driver"
                        name="driver"
                        value={form.data.driver}
                        onChange={(event) => form.setData('driver', event.target.value)}
                        options={Object.entries(drivers).map(([value, label]) => ({ label, value }))}
                    />

                    <InputField
                        label="Nama provider"
                        name="name"
                        value={form.data.name}
                        onChange={(event) => form.setData('name', event.target.value)}
                        placeholder="Meta Production"
                        error={form.errors.name}
                    />

                    <InputField
                        label="Base URL"
                        name="base_url"
                        value={form.data.base_url}
                        onChange={(event) => form.setData('base_url', event.target.value)}
                        placeholder="https://graph.facebook.com"
                        error={form.errors.base_url}
                    />

                    <InputField
                        label="Timeout (detik)"
                        name="timeout"
                        type="number"
                        min={1}
                        max={120}
                        value={form.data.timeout}
                        onChange={(event) => form.setData('timeout', Number(event.target.value))}
                        error={form.errors.timeout}
                    />

                    <InputField
                        label="Maks. retry"
                        name="max_retries"
                        type="number"
                        min={0}
                        max={5}
                        value={form.data.max_retries}
                        onChange={(event) => form.setData('max_retries', Number(event.target.value))}
                        error={form.errors.max_retries}
                    />
                </div>

                {(preset?.credential_fields.length ?? 0) > 0 && (
                    <div className="border-t border-neutral-200 pt-4 dark:border-slate-700">
                        <p className="mb-3 text-sm font-semibold text-slate-900 dark:text-white">Kredensial</p>
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
                                        placeholder={existing?.has_value ? `Tersimpan ${existing.hint ?? ''} — kosongkan untuk mempertahankan` : 'Masukkan nilai'}
                                        error={form.errors[`credentials.${field.key}`]}
                                    />
                                );
                            })}
                        </div>
                        <p className="mt-2 text-xs text-neutral-500">Kredensial disimpan terenkripsi dan tidak pernah dikirim kembali ke browser.</p>
                    </div>
                )}

                {(preset?.config_fields.length ?? 0) > 0 && (
                    <div className="border-t border-neutral-200 pt-4 dark:border-slate-700">
                        <p className="mb-3 text-sm font-semibold text-slate-900 dark:text-white">Konfigurasi provider</p>
                        <div className="grid gap-4 sm:grid-cols-2">
                            {preset?.config_fields.map((field) => (
                                <div key={field.key}>
                                    <Label htmlFor={`config_${field.key}`}>{`${field.label}${field.required ? ' *' : ''}`}</Label>
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
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div className="flex flex-wrap items-center gap-6 border-t border-neutral-200 pt-4 dark:border-slate-700">
                    <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
                        <Toggle checked={form.data.enabled} onCheckedChange={(checked) => form.setData('enabled', checked)} label="Aktifkan provider" />
                        Aktif
                    </label>
                    <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
                        <Toggle checked={form.data.is_default} onCheckedChange={(checked) => form.setData('is_default', checked)} label="Jadikan provider utama" />
                        Provider utama
                    </label>
                </div>
            </form>
        </Modal>
    );
}

function TemplatesModal({ provider, onClose }: { provider: Provider | null; onClose: () => void }) {
    const [name, setName] = useState('');
    const [language, setLanguage] = useState('id');
    const [category, setCategory] = useState('UTILITY');
    const [status, setStatus] = useState('approved');

    const addTemplate = () => {
        if (!provider || name.trim() === '') return;

        router.post(
            route('admin.integrations.whatsapp.templates.store', provider.id),
            { name: name.trim(), language, category, status },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setName('');
                    onClose();
                },
            },
        );
    };

    return (
        <Modal
            open={provider !== null}
            onClose={onClose}
            size="lg"
            title={provider ? `Template — ${provider.name}` : 'Template'}
            footer={
                <Button variant="ghost" onClick={onClose}>
                    Tutup
                </Button>
            }
        >
            {provider && (
                <div className="space-y-5">
                    <div className="space-y-2">
                        {provider.templates.length === 0 && <p className="text-sm text-neutral-500">Belum ada template terdaftar.</p>}
                        {provider.templates.map((template) => (
                            <div key={template.id} className="flex items-center justify-between gap-3 border border-neutral-200 p-3 dark:border-slate-700">
                                <div className="min-w-0">
                                    <p className="truncate text-sm font-medium text-slate-900 dark:text-white">{template.name}</p>
                                    <p className="text-xs text-neutral-500">
                                        {template.language} · {template.category ?? 'uncategorized'}
                                    </p>
                                </div>
                                <div className="flex shrink-0 items-center gap-2">
                                    <Badge variant={statusVariant(template.status)}>{template.status}</Badge>
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        leftIcon={<Trash2 size={14} />}
                                        onClick={() => router.delete(route('admin.integrations.whatsapp.templates.destroy', [provider.id, template.id]), { preserveScroll: true })}
                                    >
                                        Hapus
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="border-t border-neutral-200 pt-4 dark:border-slate-700">
                        <p className="mb-3 text-sm font-semibold text-slate-900 dark:text-white">Tambah template</p>
                        <div className="grid gap-3 sm:grid-cols-2">
                            <InputField label="Nama template" name="template_name" value={name} onChange={(event) => setName(event.target.value)} placeholder="order_confirmation" />
                            <InputField label="Bahasa" name="template_language" value={language} onChange={(event) => setLanguage(event.target.value)} placeholder="id" />
                            <InputField label="Kategori" name="template_category" value={category} onChange={(event) => setCategory(event.target.value)} placeholder="UTILITY" />
                            <SelectField
                                label="Status"
                                name="template_status"
                                value={status}
                                onChange={(event) => setStatus(event.target.value)}
                                options={[
                                    { label: 'Approved', value: 'approved' },
                                    { label: 'Pending', value: 'pending' },
                                    { label: 'Rejected', value: 'rejected' },
                                    { label: 'Disabled', value: 'disabled' },
                                ]}
                            />
                        </div>
                        <Button className="mt-3" onClick={addTemplate} disabled={name.trim() === ''} leftIcon={<Plus size={15} />}>
                            Simpan template
                        </Button>
                    </div>
                </div>
            )}
        </Modal>
    );
}

function SendTestCard({ providers }: { providers: Provider[] }) {
    const [providerId, setProviderId] = useState('');
    const [phone, setPhone] = useState('');
    const [message, setMessage] = useState('Halo! Ini adalah pesan uji coba dari dashboard integrasi WhatsApp.');
    const [processing, setProcessing] = useState(false);

    const send = async (event: React.FormEvent) => {
        event.preventDefault();
        setProcessing(true);

        try {
            const response = await apiFetch(route('admin.integrations.whatsapp.send-test'), {
                method: 'POST',
                body: JSON.stringify({
                    provider_id: providerId ? Number(providerId) : null,
                    phone_number: phone,
                    message,
                }),
            });
            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(result.error ?? 'Pesan gagal dikirim.');
            }

            toast.success(`Pesan terkirim via ${result.provider ?? 'provider'}.`);
            router.reload({ only: ['recent_messages', 'recent_logs', 'stats'] });
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Pesan gagal dikirim.');
        } finally {
            setProcessing(false);
        }
    };

    return (
        <Card className="rounded-none">
            <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-300">
                    <Send size={19} />
                </span>
                <div>
                    <h2 className="font-semibold text-slate-900 dark:text-white">Kirim pesan uji coba</h2>
                    <p className="text-sm text-neutral-500">Verifikasi kredensial dan koneksi provider secara langsung.</p>
                </div>
            </div>

            <form onSubmit={send} className="mt-4 grid gap-3 sm:grid-cols-2">
                <SelectField
                    label="Provider"
                    name="provider_id"
                    value={providerId}
                    onChange={(event) => setProviderId(event.target.value)}
                    options={[
                        { label: 'Provider utama (default)', value: '' },
                        ...providers.map((provider) => ({ label: `${provider.name}${provider.is_default ? ' (utama)' : ''}`, value: String(provider.id) })),
                    ]}
                />
                <InputField
                    label="Nomor WhatsApp"
                    name="phone_number"
                    value={phone}
                    onChange={(event) => setPhone(event.target.value)}
                    placeholder="08123456789"
                    required
                />
                <div className="sm:col-span-2">
                    <Label htmlFor="test_message">Pesan</Label>
                    <textarea
                        id="test_message"
                        value={message}
                        onChange={(event) => setMessage(event.target.value)}
                        rows={2}
                        className="w-full resize-y border border-gray-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-purple-700 focus:ring-1 focus:ring-purple-700 dark:border-slate-600 dark:bg-[#141416] dark:text-white"
                    />
                </div>
                <div className="sm:col-span-2">
                    <Button type="submit" isLoading={processing} disabled={processing || phone.trim() === ''} leftIcon={<Send size={15} />}>
                        Kirim pesan
                    </Button>
                </div>
            </form>
        </Card>
    );
}

function ProviderCard({
    provider,
    onEdit,
    onTemplates,
}: {
    provider: Provider;
    onEdit: () => void;
    onTemplates: () => void;
}) {
    const [testing, setTesting] = useState(false);

    const testConnection = async () => {
        setTesting(true);

        try {
            const response = await apiFetch(route('admin.integrations.whatsapp.test', provider.id), { method: 'POST' });
            const result = await response.json();

            if (!response.ok || !result.success) {
                toast.error(result.message ?? result.error ?? 'Koneksi gagal.');
            } else {
                toast.success(result.message ?? 'Koneksi berhasil.');
                router.reload({ only: ['providers'] });
            }
        } catch {
            toast.error('Tidak dapat menguji koneksi.');
        } finally {
            setTesting(false);
        }
    };

    const copyWebhook = async () => {
        try {
            await navigator.clipboard.writeText(provider.webhook_url);
            toast.success('URL webhook disalin.');
        } catch {
            toast.error('Tidak dapat menyalin URL.');
        }
    };

    return (
        <Card className="space-y-4 rounded-none">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex min-w-0 items-start gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-300">
                        <Smartphone size={19} />
                    </span>
                    <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-semibold text-slate-900 dark:text-white">{provider.name}</h3>
                            {provider.is_default && <Badge variant="purple">Utama</Badge>}
                            <Badge variant={provider.enabled ? 'success' : 'default'}>{provider.enabled ? 'Aktif' : 'Nonaktif'}</Badge>
                            <Badge variant={statusVariant(provider.status)}>{provider.status}</Badge>
                        </div>
                        <p className="mt-1 truncate text-xs text-neutral-500">
                            {provider.driver} · {provider.base_url || '—'}
                        </p>
                        {provider.last_error && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{provider.last_error}</p>}
                    </div>
                </div>

                <Toggle
                    checked={provider.enabled}
                    onCheckedChange={(checked) =>
                        router.patch(route('admin.integrations.whatsapp.toggle', provider.id), { enabled: checked }, { preserveScroll: true })
                    }
                    label={`Aktifkan ${provider.name}`}
                />
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
                <div className="border border-neutral-200 p-3 dark:border-slate-700">
                    <p className="text-[10px] font-semibold tracking-wider text-neutral-500 uppercase">Pesan</p>
                    <p className="mt-1 text-lg font-semibold text-slate-900 dark:text-white">{provider.messages_count}</p>
                </div>
                <div className="border border-neutral-200 p-3 dark:border-slate-700">
                    <p className="text-[10px] font-semibold tracking-wider text-neutral-500 uppercase">Template</p>
                    <p className="mt-1 text-lg font-semibold text-slate-900 dark:text-white">{provider.templates_count}</p>
                </div>
                <div className="border border-neutral-200 p-3 dark:border-slate-700">
                    <p className="text-[10px] font-semibold tracking-wider text-neutral-500 uppercase">Akun</p>
                    <p className="mt-1 text-lg font-semibold text-slate-900 dark:text-white">{provider.accounts_count}</p>
                </div>
            </div>

            <div className="flex flex-col gap-2 border border-neutral-200 bg-neutral-50 p-3 dark:border-slate-700 dark:bg-[#18181b]">
                <div className="flex items-center gap-2 text-xs font-medium text-neutral-500">
                    <Webhook size={14} /> Webhook URL
                </div>
                <div className="flex items-center gap-2">
                    <code className="min-w-0 flex-1 truncate text-xs text-slate-700 dark:text-slate-300">{provider.webhook_url}</code>
                    <Button size="sm" variant="ghost" onClick={copyWebhook} leftIcon={<Copy size={14} />}>
                        Copy
                    </Button>
                </div>
            </div>

            <div className="flex flex-wrap gap-2 border-t border-neutral-200 pt-4 dark:border-slate-700">
                <Button size="sm" variant="outline" onClick={onEdit} leftIcon={<Pencil size={14} />}>
                    Edit
                </Button>
                <Button size="sm" variant="outline" onClick={testConnection} isLoading={testing} leftIcon={<RefreshCw size={14} />}>
                    Test
                </Button>
                <Button size="sm" variant="outline" onClick={onTemplates} leftIcon={<MessageCircle size={14} />}>
                    Template
                </Button>
                {!provider.is_default && (
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={() => router.put(route('admin.integrations.whatsapp.default', provider.id), {}, { preserveScroll: true })}
                    >
                        Jadikan utama
                    </Button>
                )}
                <Button
                    size="sm"
                    variant="danger"
                    leftIcon={<Trash2 size={14} />}
                    onClick={() => {
                        if (window.confirm(`Hapus provider ${provider.name}?`)) {
                            router.delete(route('admin.integrations.whatsapp.destroy', provider.id), { preserveScroll: true });
                        }
                    }}
                >
                    Hapus
                </Button>
            </div>
        </Card>
    );
}

export default function WhatsAppIntegrations({
    providers,
    catalog,
    drivers,
    global,
    stats,
    recent_messages,
    recent_logs,
    allow_local_endpoints,
}: WhatsAppPageProps) {
    const [formOpen, setFormOpen] = useState(false);
    const [editing, setEditing] = useState<Provider | null>(null);
    const [templateProvider, setTemplateProvider] = useState<Provider | null>(null);
    const [checking, setChecking] = useState<number | null>(null);

    const openCreate = () => {
        setEditing(null);
        setFormOpen(true);
    };

    const openEdit = (provider: Provider) => {
        setEditing(provider);
        setFormOpen(true);
    };

    const checkStatus = async (message: MessageRow) => {
        if (!message.provider_id || !message.provider_message_id) return;

        setChecking(message.id);

        try {
            const response = await apiFetch(
                route('admin.integrations.whatsapp.messages.status', [message.provider_id, message.id]),
                { method: 'POST' },
            );
            const result = await response.json();

            if (!response.ok || result.success === false) {
                throw new Error(result.error ?? 'Status tidak tersedia.');
            }

            toast.success(`Status: ${result.status ?? 'unknown'}`);
            router.reload({ only: ['recent_messages', 'recent_logs', 'stats'] });
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Gagal mengambil status.');
        } finally {
            setChecking(null);
        }
    };

    return (
        <>
            <Head title="Integrasi WhatsApp" />
            <div className="mx-auto max-w-6xl space-y-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Integrasi WhatsApp</h1>
                        <p className="mt-1 text-sm text-neutral-500">Kelola gateway, kredensial, webhook, template, dan status pengiriman.</p>
                    </div>
                    <Button onClick={openCreate} leftIcon={<Plus size={16} />} className="w-full sm:w-auto">
                        Tambah provider
                    </Button>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <Card className="rounded-none">
                        <p className="text-xs font-semibold tracking-wider text-neutral-500 uppercase">Pesan hari ini</p>
                        <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">{stats.today.total}</p>
                        <p className="mt-1 text-[11px] text-neutral-500">
                            {stats.today.sent} terkirim · {stats.today.failed} gagal
                        </p>
                    </Card>
                    <Card className="rounded-none">
                        <p className="text-xs font-semibold tracking-wider text-neutral-500 uppercase">Delivered</p>
                        <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">{stats.today.delivered}</p>
                    </Card>
                    <Card className="rounded-none">
                        <p className="text-xs font-semibold tracking-wider text-neutral-500 uppercase">Read</p>
                        <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">{stats.today.read}</p>
                    </Card>
                    <Card className="rounded-none">
                        <p className="text-xs font-semibold tracking-wider text-neutral-500 uppercase">Total sepanjang waktu</p>
                        <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">{stats.all_time.total}</p>
                        <p className="mt-1 text-[11px] text-neutral-500">
                            {stats.all_time.outbound} keluar · {stats.all_time.inbound} masuk
                        </p>
                    </Card>
                </div>

                <Card className="space-y-4 rounded-none">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-start gap-3">
                            <span className="flex h-10 w-10 shrink-0 items-center justify-center bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-300">
                                <MessageCircle size={19} />
                            </span>
                            <div>
                                <h2 className="font-semibold text-slate-900 dark:text-white">Notifikasi WhatsApp</h2>
                                <p className="text-sm text-neutral-500">Aktifkan pengiriman notifikasi melalui gateway terpilih.</p>
                            </div>
                        </div>
                        <Toggle
                            checked={global.enabled}
                            onCheckedChange={(checked) =>
                                router.patch(route('admin.integrations.whatsapp.global'), { enabled: checked }, { preserveScroll: true })
                            }
                            label="Aktifkan notifikasi WhatsApp"
                        />
                    </div>

                    {!global.is_configured && providers.length === 0 && (
                        <div className="flex flex-col gap-3 border-t border-neutral-200 pt-5 dark:border-slate-700 sm:flex-row sm:items-center sm:justify-between">
                            <p className="text-sm text-neutral-500">Konfigurasi WhatsApp lama dapat diimpor sebagai provider baru.</p>
                            <Button
                                variant="outline"
                                onClick={() => router.post(route('admin.integrations.whatsapp.import-legacy'), {}, { preserveScroll: true })}
                            >
                                Import konfigurasi lama
                            </Button>
                        </div>
                    )}

                    {!allow_local_endpoints && (
                        <p className="border-t border-neutral-200 pt-4 text-xs text-neutral-500 dark:border-slate-700">
                            Endpoint lokal/privat diblokir oleh proteksi SSRF. Set <code>WHATSAPP_ALLOW_LOCAL_ENDPOINTS=true</code> untuk gateway
                            lokal.
                        </p>
                    )}
                </Card>

                <SendTestCard providers={providers} />

                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Provider terdaftar</h2>
                        <span className="text-sm text-neutral-500">{providers.length} provider</span>
                    </div>

                    {providers.length === 0 ? (
                        <Card className="rounded-none text-center">
                            <Link2 className="mx-auto h-8 w-8 text-neutral-400" />
                            <p className="mt-3 font-medium text-slate-900 dark:text-white">Belum ada provider WhatsApp</p>
                            <p className="mt-1 text-sm text-neutral-500">Tambahkan Meta Cloud API, Infobip, Fonnte, atau gateway kustom.</p>
                            <Button className="mt-4" onClick={openCreate} leftIcon={<Plus size={16} />}>
                                Tambah provider
                            </Button>
                        </Card>
                    ) : (
                        <div className="space-y-4">
                            {providers.map((provider) => (
                                <ProviderCard
                                    key={provider.id}
                                    provider={provider}
                                    onEdit={() => openEdit(provider)}
                                    onTemplates={() => setTemplateProvider(provider)}
                                />
                            ))}
                        </div>
                    )}
                </div>

                <Card className="rounded-none">
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Pesan terbaru</h2>
                    <div className="mt-4 overflow-x-auto">
                        <table className="w-full min-w-[720px] text-left text-sm">
                            <thead>
                                <tr className="border-b border-neutral-200 text-xs tracking-wider text-neutral-500 uppercase dark:border-slate-700">
                                    <th className="py-2 pr-3 font-semibold">Arah</th>
                                    <th className="py-2 pr-3 font-semibold">Provider</th>
                                    <th className="py-2 pr-3 font-semibold">Penerima</th>
                                    <th className="py-2 pr-3 font-semibold">Isi</th>
                                    <th className="py-2 pr-3 font-semibold">Status</th>
                                    <th className="py-2 font-semibold">Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recent_messages.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="py-6 text-center text-neutral-500">
                                            Belum ada pesan.
                                        </td>
                                    </tr>
                                )}
                                {recent_messages.map((message) => (
                                    <tr key={message.id} className="border-b border-neutral-100 dark:border-slate-800">
                                        <td className="py-2 pr-3 text-xs text-neutral-500">{message.direction}</td>
                                        <td className="py-2 pr-3 text-xs text-neutral-500">{message.provider ?? 'Legacy'}</td>
                                        <td className="py-2 pr-3 text-xs text-slate-700 dark:text-slate-200">{message.to ?? message.from ?? '—'}</td>
                                        <td className="max-w-xs truncate py-2 pr-3 text-xs text-neutral-500">{message.body ?? message.type}</td>
                                        <td className="py-2 pr-3">
                                            <Badge variant={statusVariant(message.status)}>{message.status}</Badge>
                                            {message.error_message && <p className="mt-1 max-w-[180px] truncate text-[10px] text-red-500">{message.error_message}</p>}
                                        </td>
                                        <td className="py-2">
                                            {message.provider_id && message.provider_message_id ? (
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    isLoading={checking === message.id}
                                                    onClick={() => checkStatus(message)}
                                                    leftIcon={<RefreshCw size={13} />}
                                                >
                                                    Cek
                                                </Button>
                                            ) : (
                                                <span className="text-xs text-neutral-400">—</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>

                <Card className="rounded-none">
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Log terbaru</h2>
                    <div className="mt-4 space-y-3">
                        {recent_logs.length === 0 && <p className="text-sm text-neutral-500">Belum ada aktivitas.</p>}
                        {recent_logs.map((log) => (
                            <div key={log.id} className="flex items-start gap-2">
                                {log.status === 'success' ? (
                                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                                ) : (
                                    <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-500" />
                                )}
                                <div className="min-w-0 flex-1">
                                    <p className="truncate text-sm text-slate-700 dark:text-slate-200">
                                        <span className="font-medium">{log.provider ?? 'Legacy'}</span> · {log.action}
                                    </p>
                                    {log.message && <p className="truncate text-xs text-neutral-500">{log.message}</p>}
                                </div>
                                <span className="shrink-0 text-[10px] text-neutral-400">{log.status}</span>
                            </div>
                        ))}
                    </div>
                </Card>
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

            <TemplatesModal provider={templateProvider} onClose={() => setTemplateProvider(null)} />
        </>
    );
}

WhatsAppIntegrations.layout = (page: React.ReactNode) => <AdminLayout>{page}</AdminLayout>;
