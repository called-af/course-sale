import { Head, router, useForm } from '@inertiajs/react';
import { Eye, EyeOff, KeyRound, Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';
import { route } from 'ziggy-js';

import Button from '@/components/atoms/Button';
import Card from '@/components/atoms/Card';
import Modal from '@/components/atoms/Modal';
import Toggle from '@/components/atoms/Toggle';
import InputField from '@/components/molecules/InputField';
import { apiFetch } from '@/lib/csrf';

export interface AiSettingsData {
    enabled: boolean;
    provider: string;
    base_url: string | null;
    model: string | null;
    has_api_key: boolean;
    api_key_hint: string | null;
    is_configured: boolean;
}

interface AiSettingsPanelProps {
    initialAi: AiSettingsData;
    flash?: { success?: string; error?: string };
}

export default function AiSettingsPanel({ initialAi, flash }: AiSettingsPanelProps) {
    const [showKey, setShowKey] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [isVerifyingPassword, setIsVerifyingPassword] = useState(false);
    const [passwordError, setPasswordError] = useState<string | null>(null);

    const { data, setData, processing, errors, reset } = useForm({
        enabled: initialAi.enabled,
        provider: initialAi.provider || 'nvidia',
        base_url: initialAi.base_url ?? '',
        model: initialAi.model ?? '',
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
        router.patch(route('admin.settings.ai.toggle'), { enabled: checked });
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
        router.put(route('admin.settings.ai.update'), data);
    };

    const baseUrlChanged = data.base_url !== (initialAi.base_url ?? '');

    return (
        <section className="space-y-6">
            <Head title="AI Settings" />

            <Card className="overflow-hidden rounded-none">
                <div className="flex flex-col gap-5 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-6">
                    <div className="flex items-start gap-4">
                        <span className="flex h-11 w-11 shrink-0 items-center justify-center bg-purple-100 text-purple-600 dark:bg-purple-500/20 dark:text-purple-300">
                            <Sparkles size={21} />
                        </span>
                        <div>
                            <h2 className="font-semibold text-slate-900 dark:text-white">AI Feature</h2>
                            <p className="mt-1 text-sm text-neutral-500">Enable AI integration on the platform.</p>
                        </div>
                    </div>

                    <Toggle checked={data.enabled} onCheckedChange={updateEnabled} disabled={processing} label="Enable or disable the AI feature" />
                </div>

                <div className="border-t border-neutral-200 bg-neutral-50/70 p-4 sm:p-6 dark:border-slate-700 dark:bg-[#1e1f24]">
                    <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h3 className="font-semibold text-slate-900 dark:text-white">AI Configuration</h3>
                            <p className="mt-1 text-sm text-neutral-500">Base URL, model, and API key for the AI connection.</p>
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
                                <p className="text-xs font-medium tracking-wide text-neutral-500 uppercase">AI Provider</p>
                                <p className="mt-2 text-sm font-medium text-slate-900 dark:text-white">
                                    {data.provider === 'openai' ? 'OpenAI' : 'AI Service'}
                                </p>
                            </div>
                            <div className="border border-neutral-200 bg-white p-4 dark:border-slate-700 dark:bg-[#1e1f24]">
                                <p className="text-xs font-medium tracking-wide text-neutral-500 uppercase">Base URL</p>
                                <p className="mt-2 text-sm font-medium break-all text-slate-900 dark:text-white">
                                    {data.base_url || 'Not configured'}
                                </p>
                            </div>
                            <div className="border border-neutral-200 bg-white p-4 dark:border-slate-700 dark:bg-[#1e1f24]">
                                <p className="text-xs font-medium tracking-wide text-neutral-500 uppercase">Model</p>
                                <p className="mt-2 text-sm font-medium text-slate-900 dark:text-white">{data.model || 'Not configured'}</p>
                            </div>
                            <div className="border border-neutral-200 bg-white p-4 dark:border-slate-700 dark:bg-[#1e1f24]">
                                <p className="text-xs font-medium tracking-wide text-neutral-500 uppercase">API Key</p>
                                <p className="mt-2 text-sm font-medium text-slate-900 dark:text-white">
                                    {initialAi.has_api_key ? `••••••••${initialAi.api_key_hint?.slice(-4) ?? ''}` : 'Not available'}
                                </p>
                            </div>
                        </div>
                    ) : (
                        <form
                            onSubmit={submitCredentials}
                            className="grid gap-5 border border-neutral-200 bg-white p-5 md:grid-cols-2 dark:border-slate-700 dark:bg-[#1e1f24]"
                        >
                            <div>
                                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200" htmlFor="ai_provider">
                                    AI Provider
                                </label>
                                <select
                                    id="ai_provider"
                                    name="provider"
                                    value={data.provider}
                                    onChange={(event) => setData('provider', event.target.value)}
                                    className="w-full border border-gray-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-purple-700 focus:ring-1 focus:ring-purple-700 dark:border-slate-600 dark:bg-[#1e1f24] dark:text-white"
                                    disabled={processing}
                                >
                                    <option value="nvidia">AI Service</option>
                                    <option value="openai">OpenAI</option>
                                </select>
                            </div>

                            <InputField
                                label="Base URL"
                                name="base_url"
                                value={data.base_url}
                                onChange={(event) => setData('base_url', event.target.value)}
                                placeholder="https://api.example.com/v1"
                                error={errors.base_url}
                                disabled={processing}
                            />
                            {baseUrlChanged && (
                                <p className="-mt-3 text-xs font-medium text-amber-600 md:col-span-2 dark:text-amber-400">
                                    The Base URL changed. Re-enter the API key for security.
                                </p>
                            )}

                            <InputField
                                label="Model name"
                                name="model"
                                value={data.model}
                                onChange={(event) => setData('model', event.target.value)}
                                placeholder="model-name"
                                error={errors.model}
                                disabled={processing}
                            />

                            <div>
                                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200" htmlFor="api_key">
                                    API Key
                                </label>
                                <div className="relative">
                                    <KeyRound className="absolute top-2.5 left-3 h-4 w-4 text-neutral-400" />
                                    <input
                                        id="api_key"
                                        name="api_key"
                                        type={showKey ? 'text' : 'password'}
                                        value={data.api_key}
                                        onChange={(event) => setData('api_key', event.target.value)}
                                        placeholder={initialAi.has_api_key ? `••••${initialAi.api_key_hint?.slice(-4) ?? ''}` : 'Enter API key'}
                                        className="w-full border border-gray-300 bg-white py-2 pr-10 pl-9 text-sm text-slate-900 outline-none focus:border-purple-700 focus:ring-1 focus:ring-purple-700 dark:border-slate-600 dark:bg-[#1e1f24] dark:text-white"
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
                                {initialAi.has_api_key && (
                                    <p className="mt-1 text-xs text-neutral-500">An existing API key is available. Leave blank to keep it.</p>
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
                                    Save configuration
                                </Button>
                            </div>
                        </form>
                    )}
                </div>
            </Card>

            <Modal
                open={showPasswordModal}
                onClose={() => !isVerifyingPassword && setShowPasswordModal(false)}
                title="Verify account password"
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
                    label="Account password"
                    name="current_password"
                    type="password"
                    value={data.current_password}
                    onChange={(event) => setData('current_password', event.target.value)}
                    placeholder="Enter the password of the logged-in account"
                    error={passwordError ?? errors.current_password}
                    autoComplete="current-password"
                    disabled={isVerifyingPassword}
                />
                <p className="mt-3 text-xs text-neutral-500">The password is only used to verify access before edit mode is unlocked.</p>
            </Modal>
        </section>
    );
}
