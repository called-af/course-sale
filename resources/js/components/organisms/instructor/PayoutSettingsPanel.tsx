import { Head, router, useForm } from '@inertiajs/react';

import Button from '@/components/atoms/Button';
import Card from '@/components/atoms/Card';
import { formatRupiah } from '@/lib/currency';

export interface PayoutSettingsData {
    bank_name: string;
    account_number: string;
    account_name: string;
    account_number_masked?: string | null;
    platform_fee_percent?: number;
    hold_days?: number;
    minimum_payout?: number;
    account_locked_until?: string | null;
    pending_total?: number;
    available_total?: number;
    paid_total?: number;
    history?: {
        id: number;
        status: string;
        net_amount: number;
        gross_amount: number;
        platform_fee: number;
        available_at?: string | null;
        is_available?: boolean;
        reference?: string | null;
        paid_at?: string | null;
        created_at?: string | null;
        course?: { id: number; title: string; slug: string } | null;
        order_number?: string | null;
    }[];
}

interface PayoutSettingsPanelProps {
    payout: PayoutSettingsData;
    payment?: { gateway: string; mode: string };
    platform_fee_percent?: number;
}

const BANKS = ['BCA', 'BNI', 'BRI', 'Mandiri', 'CIMB Niaga', 'Permata', 'Danamon', 'BTN', 'BSI', 'Bank Lainnya'];

export default function PayoutSettingsPanel({ payout, payment, platform_fee_percent }: PayoutSettingsPanelProps) {
    const { data, setData, processing, errors } = useForm({
        bank_name: payout.bank_name || 'BCA',
        account_number: payout.account_number || '',
        account_name: payout.account_name || '',
        current_password: '',
    });

    const submit = (event: React.FormEvent) => {
        event.preventDefault();
        router.put('/instructor/settings/payout', data, { preserveScroll: true });
    };

    const configured = Boolean(payout.bank_name && payout.account_number && payout.account_name);

    return (
        <section className="space-y-6">
            <Head title="Rekening Payout" />

            {payout.account_locked_until ? (
                <div className="border border-amber-200 bg-amber-50 p-4 text-xs text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-200">
                    <p className="font-semibold">Rekening baru saja diubah.</p>
                    <p className="mt-1">
                        Payout ke rekening ini dikunci hingga {new Date(payout.account_locked_until).toLocaleString('id-ID')} untuk alasan keamanan.
                    </p>
                </div>
            ) : null}

            <Card className="overflow-hidden rounded-none">
                <div className="flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-start gap-4">
                        <span className="flex h-11 w-11 shrink-0 items-center justify-center bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-300">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                className="h-6 w-6"
                            >
                                <path d="M3 10h18" />
                                <rect width="18" height="14" x="3" y="4" rx="2" />
                                <path d="M7 15h4" />
                            </svg>
                        </span>
                        <div>
                            <h2 className="font-semibold text-slate-900 dark:text-white">Rekening Payout Instruktur</h2>
                            <p className="mt-1 text-sm text-neutral-500">
                                Rekening tujuan transfer pendapatan course. Pembayaran siswa diproses melalui{' '}
                                {payment?.gateway === 'midtrans' ? 'Midtrans' : 'gateway aktif'}
                                {payment?.mode ? ` (${payment.mode})` : ''}. Setelah order lunas, {platform_fee_percent ?? 20}% akan dipotong sebagai
                                fee platform, dana ditahan {payout.hold_days ?? 7} hari sebelum bisa dicairkan, dan payout dikirim setelah total
                                mencapai {formatRupiah(payout.minimum_payout ?? 100000)}.
                            </p>
                        </div>
                    </div>

                    <span
                        className={`inline-flex items-center px-2 py-0.5 text-xs font-medium ${
                            configured
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
                                : 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'
                        }`}
                    >
                        {configured ? 'Rekening aktif' : 'Belum diatur'}
                    </span>
                </div>

                <div className="border-t border-neutral-200 bg-neutral-50/70 p-6 dark:border-slate-700 dark:bg-[#1e1f24]">
                    <form
                        onSubmit={submit}
                        className="grid max-w-2xl gap-5 border border-neutral-200 bg-white p-5 dark:border-slate-700 dark:bg-[#1e1f24]"
                    >
                        <div>
                            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200" htmlFor="payout_bank_name">
                                Nama Bank
                            </label>
                            <select
                                id="payout_bank_name"
                                name="bank_name"
                                value={data.bank_name}
                                onChange={(event) => setData('bank_name', event.target.value)}
                                className="w-full border border-gray-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-emerald-700 focus:ring-1 focus:ring-emerald-700 dark:border-slate-600 dark:bg-[#1e1f24] dark:text-white"
                                disabled={processing}
                            >
                                {BANKS.map((bank) => (
                                    <option key={bank} value={bank}>
                                        {bank}
                                    </option>
                                ))}
                            </select>
                            {errors.bank_name && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.bank_name}</p>}
                        </div>

                        <div>
                            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200" htmlFor="payout_account_number">
                                Nomor Rekening
                            </label>
                            <input
                                id="payout_account_number"
                                name="account_number"
                                type="text"
                                inputMode="numeric"
                                value={data.account_number}
                                onChange={(event) => setData('account_number', event.target.value)}
                                placeholder="Contoh: 1234567890"
                                className="w-full border border-gray-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-emerald-700 focus:ring-1 focus:ring-emerald-700 dark:border-slate-600 dark:bg-[#1e1f24] dark:text-white"
                                disabled={processing}
                            />
                            {errors.account_number && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.account_number}</p>}
                        </div>

                        <div>
                            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200" htmlFor="payout_account_name">
                                Nama Pemilik Rekening
                            </label>
                            <input
                                id="payout_account_name"
                                name="account_name"
                                type="text"
                                value={data.account_name}
                                onChange={(event) => setData('account_name', event.target.value)}
                                placeholder="Sesuai buku tabungan / KTP"
                                className="w-full border border-gray-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-emerald-700 focus:ring-1 focus:ring-emerald-700 dark:border-slate-600 dark:bg-[#1e1f24] dark:text-white"
                                disabled={processing}
                            />
                            {errors.account_name && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.account_name}</p>}
                        </div>

                        {configured ? (
                            <div>
                                <label
                                    className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200"
                                    htmlFor="payout_current_password"
                                >
                                    Password Akun
                                </label>
                                <input
                                    id="payout_current_password"
                                    name="current_password"
                                    type="password"
                                    value={data.current_password}
                                    onChange={(event) => setData('current_password', event.target.value)}
                                    placeholder="Wajib diisi jika mengubah rekening"
                                    autoComplete="current-password"
                                    className="w-full border border-gray-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-emerald-700 focus:ring-1 focus:ring-emerald-700 dark:border-slate-600 dark:bg-[#1e1f24] dark:text-white"
                                    disabled={processing}
                                />
                                {errors.current_password && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.current_password}</p>}
                                <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                                    Demi keamanan, perubahan rekening yang sudah tersimpan memerlukan password akun Anda.
                                </p>
                            </div>
                        ) : null}

                        <p className="text-xs text-neutral-500 dark:text-neutral-400">
                            Pastikan nama pemilik rekening sama dengan identitas instruktur. Perubahan rekening akan dipakai untuk pencairan
                            pendapatan berikutnya.
                        </p>

                        <div className="flex justify-end">
                            <Button type="submit" disabled={processing}>
                                Simpan rekening payout
                            </Button>
                        </div>
                    </form>
                </div>
            </Card>

            <div className="grid gap-4 sm:grid-cols-3">
                <div className="border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-[#1e1f24]">
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Menunggu pencairan</p>
                    <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">{formatRupiah(payout.pending_total)}</p>
                </div>
                <div className="border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-[#1e1f24]">
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Siap dicairkan</p>
                    <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">{formatRupiah(payout.available_total)}</p>
                </div>
                <div className="border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-[#1e1f24]">
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Sudah dicairkan</p>
                    <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">{formatRupiah(payout.paid_total)}</p>
                </div>
            </div>

            <Card className="overflow-hidden rounded-none">
                <div className="border-b border-slate-100 p-6 dark:border-slate-700">
                    <h2 className="font-semibold text-slate-900 dark:text-white">Riwayat Payout</h2>
                    <p className="mt-1 text-sm text-neutral-500">
                        Ledger pendapatan dari order lunas. Transfer dilakukan manual oleh admin ke rekening di atas.
                    </p>
                </div>

                {(payout.history?.length ?? 0) === 0 ? (
                    <p className="p-6 text-sm text-slate-500 dark:text-slate-400">Belum ada riwayat payout.</p>
                ) : (
                    <div className="divide-y divide-slate-100 dark:divide-slate-700">
                        {payout.history?.map((entry) => (
                            <div key={entry.id} className="flex flex-wrap items-center justify-between gap-3 p-4 text-sm">
                                <div>
                                    <p className="font-semibold text-slate-900 dark:text-white">{entry.course?.title ?? 'Course'}</p>
                                    <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                                        {entry.order_number ?? '—'} · {entry.status}
                                        {entry.paid_at ? ` · ${new Date(entry.paid_at).toLocaleDateString('id-ID')}` : ''}
                                        {entry.status === 'pending' && !entry.is_available && entry.available_at
                                            ? ` · tersedia ${new Date(entry.available_at).toLocaleDateString('id-ID')}`
                                            : ''}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="font-semibold text-slate-900 dark:text-white">{formatRupiah(entry.net_amount)}</p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                        Gross {formatRupiah(entry.gross_amount)} · fee {formatRupiah(entry.platform_fee)}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </Card>
        </section>
    );
}
