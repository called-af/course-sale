import { Head, router, useForm } from '@inertiajs/react';
import { route } from 'ziggy-js';

import Button from '@/components/atoms/Button';
import Card from '@/components/atoms/Card';
import InputField from '@/components/molecules/InputField';

export interface PaymentSettingsData {
    gateway: string;
    currency: string;
    platform_fee_percent?: number;
    payout_hold_days?: number;
    payout_minimum?: number;
    payout_account_lock_hours?: number;
    mode?: 'production' | 'sandbox';
    configured?: boolean;
    healthy?: boolean;
    webhook_url?: string;
    diagnostics?: {
        mode: string;
        app_env: string;
        configured: boolean;
        server_key_kind: string | null;
        snap_base_url: string;
        api_base_url: string;
        merchant_id_configured: boolean;
        client_key_configured: boolean;
        webhook_url: string;
        refundable_channels: string[];
        healthy: boolean;
        issues: string[];
    };
    available: {
        midtrans: boolean;
    };
}

interface PaymentSettingsPanelProps {
    initialPayment: PaymentSettingsData;
    flash?: { success?: string; error?: string };
}

export default function PaymentSettingsPanel({ initialPayment }: PaymentSettingsPanelProps) {
    const { data, setData, processing, errors } = useForm({
        gateway: 'midtrans',
        currency: initialPayment.currency || 'IDR',
        platform_fee_percent: initialPayment.platform_fee_percent ?? 20,
        payout_hold_days: initialPayment.payout_hold_days ?? 7,
        payout_minimum: initialPayment.payout_minimum ?? 100000,
        payout_account_lock_hours: initialPayment.payout_account_lock_hours ?? 24,
    });

    const submit = (event: React.FormEvent) => {
        event.preventDefault();
        router.put(route('admin.settings.payment.update'), data);
    };

    const configured = Boolean(initialPayment.configured);
    const mode = initialPayment.mode === 'production' ? 'Production' : 'Sandbox';
    const diagnostics = initialPayment.diagnostics;
    const issues = diagnostics?.issues ?? [];

    return (
        <section className="space-y-6">
            <Head title="Payment Settings" />

            <Card className="overflow-hidden rounded-none">
                <div className="flex flex-col gap-5 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-6">
                    <div className="flex items-start gap-4">
                        <span className="flex h-11 w-11 shrink-0 items-center justify-center bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-300">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                className="h-6 w-6"
                            >
                                <rect width="20" height="14" x="2" y="5" rx="2" ry="2" />
                                <line x1="22" x2="16" y1="12" y2="12" />
                            </svg>
                        </span>
                        <div>
                            <h2 className="font-semibold text-slate-900 dark:text-white">Payment Gateway</h2>
                            <p className="mt-1 text-sm text-neutral-500">Midtrans is the only payment gateway for course orders and checkout.</p>
                        </div>
                    </div>

                    <div>
                        <span
                            className={`inline-flex items-center px-2 py-0.5 text-xs font-medium ${
                                configured
                                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
                                    : 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'
                            }`}
                        >
                            {configured ? `Midtrans ${mode} Ready` : 'Midtrans is not configured'}
                        </span>
                    </div>
                </div>

                <div className="border-t border-neutral-200 bg-neutral-50/70 p-4 sm:p-6 dark:border-slate-700 dark:bg-[#1e1f24]">
                    <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h3 className="font-semibold text-slate-900 dark:text-white">Midtrans Configuration</h3>
                            <p className="mt-1 text-sm text-neutral-500">
                                Credentials are stored as environment variables on the server, not in the database.
                            </p>
                        </div>
                    </div>

                    <form
                        onSubmit={submit}
                        className="grid max-w-2xl gap-5 border border-neutral-200 bg-white p-5 dark:border-slate-700 dark:bg-[#1e1f24]"
                    >
                        <div className="border border-slate-200 bg-slate-50 p-4 text-sm dark:border-slate-700 dark:bg-[#141416]">
                            <div className="flex items-center justify-between gap-3">
                                <span className="font-semibold text-slate-900 dark:text-white">Midtrans</span>
                                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{mode}</span>
                            </div>
                            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                Credit card, QRIS, Virtual Account, GoPay, and other channels enabled in the Midtrans dashboard.
                            </p>
                        </div>

                        <input type="hidden" name="gateway" value="midtrans" />

                        <InputField
                            label="Currency"
                            name="currency"
                            value={data.currency}
                            onChange={(event) => setData('currency', event.target.value)}
                            placeholder="IDR"
                            error={errors.currency}
                            disabled={processing}
                            readOnly
                        />

                        <InputField
                            label="Platform Fee (%)"
                            name="platform_fee_percent"
                            type="number"
                            min={0}
                            max={100}
                            step={0.01}
                            value={data.platform_fee_percent}
                            onChange={(event) => setData('platform_fee_percent', event.target.value === '' ? 0 : Number(event.target.value))}
                            error={errors.platform_fee_percent}
                            disabled={processing}
                        />
                        <p className="text-xs text-neutral-500 dark:text-neutral-400">
                            Percentage of the platform fee deducted from instructor earnings when a course order is paid. Instructors receive the
                            remainder after this fee.
                        </p>

                        <div className="grid gap-4 sm:grid-cols-3">
                            <InputField
                                label="Hold (days)"
                                name="payout_hold_days"
                                type="number"
                                min={0}
                                max={90}
                                value={data.payout_hold_days}
                                onChange={(event) => setData('payout_hold_days', event.target.value === '' ? 0 : Number(event.target.value))}
                                error={errors.payout_hold_days}
                                disabled={processing}
                            />
                            <InputField
                                label="Minimum Payout (IDR)"
                                name="payout_minimum"
                                type="number"
                                min={0}
                                step={1000}
                                value={data.payout_minimum}
                                onChange={(event) => setData('payout_minimum', event.target.value === '' ? 0 : Number(event.target.value))}
                                error={errors.payout_minimum}
                                disabled={processing}
                            />
                            <InputField
                                label="Account Change Lock (hours)"
                                name="payout_account_lock_hours"
                                type="number"
                                min={0}
                                max={168}
                                value={data.payout_account_lock_hours}
                                onChange={(event) => setData('payout_account_lock_hours', event.target.value === '' ? 0 : Number(event.target.value))}
                                error={errors.payout_account_lock_hours}
                                disabled={processing}
                            />
                        </div>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400">
                            Funds are held for the configured number of days after an order is paid before they can be withdrawn. Payouts are only
                            sent once an instructor's total payout reaches the minimum. Newly changed bank accounts are locked for the configured
                            number of hours for security.
                        </p>

                        <div className="space-y-2 border border-sky-200 bg-sky-50 p-4 text-xs text-sky-900 dark:border-sky-900/60 dark:bg-sky-950/30 dark:text-sky-200">
                            <p className="font-semibold">Required environment variables</p>
                            <ul className="list-inside list-disc space-y-1 font-mono">
                                <li>MIDTRANS_SERVER_KEY</li>
                                <li>MIDTRANS_CLIENT_KEY</li>
                                <li>MIDTRANS_IS_PRODUCTION=true (when live)</li>
                                <li>MIDTRANS_SNAP_BASE_URL / MIDTRANS_API_BASE_URL</li>
                            </ul>
                            <p className="pt-1">
                                Midtrans Notification URL:{' '}
                                <span className="font-mono break-all">{initialPayment.webhook_url ?? '/payments/midtrans/webhook'}</span>
                            </p>
                        </div>

                        {diagnostics ? (
                            <div
                                className={`space-y-2 border p-4 text-xs ${
                                    issues.length === 0
                                        ? 'border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-200'
                                        : 'border-rose-200 bg-rose-50 text-rose-900 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-200'
                                }`}
                            >
                                <p className="font-semibold">
                                    {issues.length === 0 ? 'Configuration diagnosis: healthy' : 'Configuration diagnosis: issues found'}
                                </p>
                                <div className="grid gap-1 sm:grid-cols-2">
                                    <p>
                                        APP_ENV: <span className="font-mono">{diagnostics.app_env}</span>
                                    </p>
                                    <p>
                                        Mode: <span className="font-mono">{diagnostics.mode}</span>
                                    </p>
                                    <p>
                                        Key type: <span className="font-mono">{diagnostics.server_key_kind ?? '—'}</span>
                                    </p>
                                    <p>
                                        Merchant ID: <span className="font-mono">{diagnostics.merchant_id_configured ? 'set' : 'not set'}</span>
                                    </p>
                                    <p className="break-all">
                                        Snap: <span className="font-mono">{diagnostics.snap_base_url}</span>
                                    </p>
                                    <p className="break-all">
                                        API: <span className="font-mono">{diagnostics.api_base_url}</span>
                                    </p>
                                </div>
                                {issues.length > 0 ? (
                                    <ul className="list-inside list-disc space-y-1">
                                        {issues.map((issue) => (
                                            <li key={issue}>{issue}</li>
                                        ))}
                                    </ul>
                                ) : null}
                                <p className="pt-1">
                                    Refundable API channels: <span className="font-mono">{diagnostics.refundable_channels.join(', ')}</span>
                                </p>
                            </div>
                        ) : null}

                        {!configured ? (
                            <p className="text-xs font-medium text-amber-700 dark:text-amber-300">
                                Set MIDTRANS_SERVER_KEY on the server and re-run the payment seeder. Payment methods will not appear until Midtrans is
                                configured.
                            </p>
                        ) : null}

                        {errors.gateway && <p className="text-xs text-red-600 dark:text-red-400">{errors.gateway}</p>}

                        <div className="flex">
                            <Button type="submit" disabled={processing} className="w-full sm:w-auto">
                                Save payment settings
                            </Button>
                        </div>
                    </form>
                </div>
            </Card>
        </section>
    );
}
