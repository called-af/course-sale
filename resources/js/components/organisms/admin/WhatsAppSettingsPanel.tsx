import { router, useForm } from '@inertiajs/react';
import { CheckCircle2, Eye, EyeOff, KeyRound, MessageSquare, Send, ShieldAlert } from 'lucide-react';
import { useEffect, useState } from 'react';
import { route } from 'ziggy-js';

import Button from '@/components/atoms/Button';
import Card from '@/components/atoms/Card';
import Modal from '@/components/atoms/Modal';
import Toggle from '@/components/atoms/Toggle';
import InputField from '@/components/molecules/InputField';
import { apiFetch } from '@/lib/csrf';

export interface WhatsAppSettingsData {
    enabled: boolean;
    provider: string;
    base_url: string | null;
    from_number: string | null;
    sandbox_keyword: string | null;
    has_api_key: boolean;
    api_key_hint: string | null;
    is_configured: boolean;
}

interface WhatsAppSettingsPanelProps {
    initialWhatsApp: WhatsAppSettingsData;
    flash?: { success?: string; error?: string };
}

export default function WhatsAppSettingsPanel({ initialWhatsApp, flash }: WhatsAppSettingsPanelProps) {
    const [showKey, setShowKey] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [isVerifyingPassword, setIsVerifyingPassword] = useState(false);
    const [passwordError, setPasswordError] = useState<string | null>(null);

    // Test notification state
    const [testPhone, setTestPhone] = useState('');
    const [isTesting, setIsTesting] = useState(false);
    const [testResult, setTestResult] = useState<{
        success: boolean;
        message?: string;
        error?: string;
    } | null>(null);

    const { data, setData, processing, errors, reset } = useForm({
        enabled: initialWhatsApp.enabled,
        provider: initialWhatsApp.provider || 'infobip',
        base_url: initialWhatsApp.base_url ?? 'https://api.example.com',
        from_number: initialWhatsApp.from_number ?? '447860088970',
        sandbox_keyword: initialWhatsApp.sandbox_keyword ?? 'ARKADANISAYSSTUFF',
        api_key: '',
        current_password: '',
    });

    useEffect(() => {
        if (flash?.success) {
            reset('api_key', 'current_password');
            setIsEditing(false);
        }
    }, [flash?.success, reset]);

    const updateEnabled = (checked: boolean) => {
        setData('enabled', checked);
        router.patch(route('admin.settings.whatsapp.toggle'), { enabled: checked });
    };

    const startEditing = () => {
        setPasswordError(null);
        setData('current_password', '');
        setShowPasswordModal(true);
    };

    const verifyPassword = async () => {
        setIsVerifyingPassword(true);
        setPasswordError(null);

        try {
            const response = await apiFetch(route('admin.settings.ai.verify-password'), {
                method: 'POST',
                body: JSON.stringify({
                    current_password: data.current_password,
                }),
            });
            const result = await response.json();

            if (!response.ok) {
                setPasswordError(result.errors?.current_password ?? 'The password you entered is incorrect.');
                return;
            }

            setShowPasswordModal(false);
            setIsEditing(true);
        } catch {
            setPasswordError('Unable to verify the password. Please try again.');
        } finally {
            setIsVerifyingPassword(false);
        }
    };

    const submitCredentials = (event: React.FormEvent) => {
        event.preventDefault();
        router.put(route('admin.settings.whatsapp.update'), data);
    };

    const handleTestNotification = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!testPhone.trim()) {
            setTestResult({
                success: false,
                error: 'Please enter the destination WhatsApp number for the test.',
            });
            return;
        }

        setIsTesting(true);
        setTestResult(null);

        try {
            const response = await apiFetch(route('admin.settings.whatsapp.test'), {
                method: 'POST',
                body: JSON.stringify({
                    phone_number: testPhone.trim(),
                }),
            });
            const result = await response.json();

            if (response.ok && result.success) {
                setTestResult({
                    success: true,
                    message: `Test WhatsApp message sent successfully to +${testPhone.trim()} via WhatsApp Gateway!`,
                });
            } else {
                setTestResult({
                    success: false,
                    error: result.error ?? 'Failed to send the test message. Check your WhatsApp credentials.',
                });
            }
        } catch {
            setTestResult({
                success: false,
                error: 'An error occurred while contacting the test server.',
            });
        } finally {
            setIsTesting(false);
        }
    };

    return (
        <section className="space-y-6">
            <Card className="overflow-hidden rounded-none">
                {/* Header Toggle */}
                <div className="flex flex-col gap-5 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-6">
                    <div className="flex items-start gap-4">
                        <span className="flex h-11 w-11 shrink-0 items-center justify-center bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-300">
                            <MessageSquare size={21} />
                        </span>
                        <div>
                            <div className="flex flex-wrap items-center gap-2">
                                <h2 className="font-semibold text-slate-900 dark:text-white">WhatsApp Gateway</h2>
                                <span className="inline-flex items-center bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
                                    Production Ready (DB Managed)
                                </span>
                            </div>
                            <p className="mt-1 text-sm text-neutral-500">
                                Manage WhatsApp configuration directly from the Database &amp; Admin Panel without editing the .env file on the
                                server.
                            </p>
                        </div>
                    </div>

                    <Toggle
                        checked={data.enabled}
                        onCheckedChange={updateEnabled}
                        disabled={processing}
                        label="Enable or disable the WhatsApp gateway"
                    />
                </div>

                {/* Configuration Section */}
                <div className="border-t border-neutral-200 bg-neutral-50/70 p-4 sm:p-6 dark:border-slate-700 dark:bg-[#1e1f24]">
                    <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h3 className="font-semibold text-slate-900 dark:text-white">WhatsApp Configuration</h3>
                            <p className="mt-1 text-sm text-neutral-500">Base URL, API Key, sender number (From), and sandbox keyword.</p>
                        </div>
                        {!isEditing && (
                            <Button type="button" variant="secondary" onClick={startEditing} className="w-full sm:w-auto">
                                Edit mode
                            </Button>
                        )}
                    </div>

                    {!isEditing ? (
                        <div className="grid gap-4 md:grid-cols-4">
                            <div className="border border-neutral-200 bg-white p-4 dark:border-slate-700 dark:bg-[#1e1f24]">
                                <p className="text-xs font-medium tracking-wide text-neutral-500 uppercase">WhatsApp Base URL</p>
                                <p className="mt-2 text-sm font-medium break-all text-slate-900 dark:text-white">
                                    {data.base_url || 'Not configured'}
                                </p>
                            </div>
                            <div className="border border-neutral-200 bg-white p-4 dark:border-slate-700 dark:bg-[#1e1f24]">
                                <p className="text-xs font-medium tracking-wide text-neutral-500 uppercase">From Number / Sender</p>
                                <p className="mt-2 text-sm font-medium text-slate-900 dark:text-white">+{data.from_number || '447860088970'}</p>
                            </div>
                            <div className="border border-neutral-200 bg-white p-4 dark:border-slate-700 dark:bg-[#1e1f24]">
                                <p className="text-xs font-medium tracking-wide text-neutral-500 uppercase">Sandbox Keyword</p>
                                <p className="mt-2 text-sm font-medium text-slate-900 dark:text-white">{data.sandbox_keyword || '—'}</p>
                            </div>
                            <div className="border border-neutral-200 bg-white p-4 dark:border-slate-700 dark:bg-[#1e1f24]">
                                <p className="text-xs font-medium tracking-wide text-neutral-500 uppercase">API Key Status</p>
                                <p className="mt-2 text-sm font-medium text-slate-900 dark:text-white">
                                    {initialWhatsApp.has_api_key ? `••••••••${initialWhatsApp.api_key_hint?.slice(-4) ?? ''}` : 'Not set'}
                                </p>
                            </div>
                        </div>
                    ) : (
                        <form
                            onSubmit={submitCredentials}
                            className="grid gap-5 border border-neutral-200 bg-white p-5 md:grid-cols-2 dark:border-slate-700 dark:bg-[#1e1f24]"
                        >
                            <div>
                                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200" htmlFor="whatsapp_provider">
                                    WhatsApp Provider
                                </label>
                                <select
                                    id="whatsapp_provider"
                                    name="provider"
                                    value={data.provider}
                                    onChange={(event) => setData('provider', event.target.value)}
                                    className="w-full border border-gray-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-emerald-700 focus:ring-1 focus:ring-emerald-700 dark:border-slate-600 dark:bg-[#1e1f24] dark:text-white"
                                    disabled={processing}
                                >
                                    <option value="infobip">WhatsApp API</option>
                                    <option value="meta">Meta WhatsApp Cloud API</option>
                                </select>
                                <p className="mt-1 text-xs text-neutral-500">Primary gateway for WhatsApp notifications on this platform.</p>
                            </div>

                            <InputField
                                label="WhatsApp Base URL"
                                name="base_url"
                                value={data.base_url}
                                onChange={(event) => setData('base_url', event.target.value)}
                                placeholder="https://api.example.com"
                                error={errors.base_url}
                                disabled={processing}
                            />

                            <InputField
                                label="From Number (Sender ID / Sandbox Number)"
                                name="from_number"
                                value={data.from_number}
                                onChange={(event) => setData('from_number', event.target.value)}
                                placeholder="447860088970"
                                error={errors.from_number}
                                disabled={processing}
                            />

                            <InputField
                                label="Sandbox Keyword"
                                name="sandbox_keyword"
                                value={data.sandbox_keyword}
                                onChange={(event) => setData('sandbox_keyword', event.target.value)}
                                placeholder="ARKADANISAYSSTUFF"
                                error={errors.sandbox_keyword}
                                disabled={processing}
                            />

                            <div>
                                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200" htmlFor="whatsapp_api_key">
                                    WhatsApp API Key (Encrypted in Database)
                                </label>
                                <div className="relative">
                                    <KeyRound className="absolute top-2.5 left-3 h-4 w-4 text-neutral-400" />
                                    <input
                                        id="whatsapp_api_key"
                                        name="api_key"
                                        type={showKey ? 'text' : 'password'}
                                        value={data.api_key}
                                        onChange={(event) => setData('api_key', event.target.value)}
                                        placeholder={
                                            initialWhatsApp.has_api_key
                                                ? `••••${initialWhatsApp.api_key_hint?.slice(-4) ?? ''}`
                                                : 'Enter WhatsApp API key'
                                        }
                                        className="w-full border border-gray-300 bg-white py-2 pr-10 pl-9 text-sm text-slate-900 outline-none focus:border-emerald-700 focus:ring-1 focus:ring-emerald-700 dark:border-slate-600 dark:bg-[#1e1f24] dark:text-white"
                                        disabled={processing}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowKey(!showKey)}
                                        className="absolute top-2 right-3 text-neutral-500 hover:text-slate-900 dark:hover:text-white"
                                        aria-label="Show or hide API key"
                                    >
                                        {showKey ? <EyeOff size={17} /> : <Eye size={17} />}
                                    </button>
                                </div>
                                {initialWhatsApp.has_api_key && (
                                    <p className="mt-1 text-xs text-neutral-500">
                                        The encrypted API key is already stored in the database. Leave blank if you do not want to change it.
                                    </p>
                                )}
                                {errors.api_key && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.api_key}</p>}
                            </div>

                            <div className="flex flex-col gap-3 sm:flex-row sm:justify-end md:col-span-2">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={() => setIsEditing(false)}
                                    disabled={processing}
                                    className="w-full sm:w-auto"
                                >
                                    Exit edit mode
                                </Button>
                                <Button type="submit" disabled={processing} isLoading={processing} className="w-full sm:w-auto">
                                    Save WhatsApp configuration
                                </Button>
                            </div>
                        </form>
                    )}

                    {/* Direct Send Test */}
                    <div className="mt-6 border-t border-neutral-200 pt-5 dark:border-slate-700">
                        <div className="mb-3 flex items-center gap-2">
                            <Send size={16} className="text-emerald-600 dark:text-emerald-400" />
                            <h4 className="text-sm font-semibold text-slate-900 dark:text-white">Test WhatsApp Gateway</h4>
                        </div>
                        <p className="mb-4 text-xs text-neutral-500">
                            Send a test message directly to your WhatsApp number to validate the WhatsApp gateway credentials stored in the DB.
                        </p>

                        <form onSubmit={handleTestNotification} className="flex max-w-xl flex-col items-start gap-3 sm:flex-row sm:items-center">
                            <div className="w-full flex-1">
                                <input
                                    type="text"
                                    value={testPhone}
                                    onChange={(e) => setTestPhone(e.target.value)}
                                    placeholder="Example: 081234567890 or 6281234567890"
                                    className="w-full border border-gray-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-emerald-700 focus:ring-1 focus:ring-emerald-700 dark:border-slate-600 dark:bg-[#1e1f24] dark:text-white"
                                    disabled={isTesting}
                                />
                            </div>
                            <Button type="submit" variant="secondary" disabled={isTesting || !testPhone.trim()} isLoading={isTesting}>
                                Send Test
                            </Button>
                        </form>

                        {testResult && (
                            <div
                                className={`mt-3 flex items-start gap-2.5 p-3 text-xs ${
                                    testResult.success
                                        ? 'border border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300'
                                        : 'border border-red-200 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-950/30 dark:text-red-300'
                                }`}
                            >
                                {testResult.success ? (
                                    <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-emerald-600" />
                                ) : (
                                    <ShieldAlert size={16} className="mt-0.5 shrink-0 text-red-600" />
                                )}
                                <div>
                                    <p className="font-semibold">{testResult.success ? 'Success!' : 'Send Failed'}</p>
                                    <p className="mt-0.5 leading-relaxed">{testResult.message || testResult.error}</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </Card>

            {/* Password Confirmation Modal */}
            <Modal
                open={showPasswordModal}
                onClose={() => !isVerifyingPassword && setShowPasswordModal(false)}
                title="Verify admin account password"
                footer={
                    <>
                        <Button variant="ghost" onClick={() => setShowPasswordModal(false)} disabled={isVerifyingPassword}>
                            Cancel
                        </Button>
                        <Button onClick={verifyPassword} isLoading={isVerifyingPassword} disabled={!data.current_password}>
                            Unlock edit mode
                        </Button>
                    </>
                }
            >
                <InputField
                    label="Admin account password"
                    name="current_password"
                    type="password"
                    value={data.current_password}
                    onChange={(event) => setData('current_password', event.target.value)}
                    placeholder="Enter the password of the logged-in admin account"
                    error={passwordError ?? errors.current_password}
                    autoComplete="current-password"
                    disabled={isVerifyingPassword}
                />
                <p className="mt-3 text-xs text-neutral-500">
                    Security verification is required before changing the WhatsApp gateway credentials in the database.
                </p>
            </Modal>
        </section>
    );
}
