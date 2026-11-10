import { Head, router } from '@inertiajs/react';
import { CalendarClock, CheckCircle2, CircleDollarSign, Clock3, Download, Inbox, Search, ShieldAlert, Wallet, XCircle } from 'lucide-react';
import { useState } from 'react';
import Button from '@/components/atoms/Button';
import PageHeader from '@/components/molecules/PageHeader';
import AdminLayout from '@/components/templates/AdminLayout';
import { formatRupiah } from '@/lib/currency';

type InstructorState = {
    bank_complete: boolean;
    locked_until?: string | null;
    meets_minimum: boolean;
    ready: boolean;
    reason?: string | null;
};

type Payout = {
    id: number;
    status: string;
    gross_amount: number;
    platform_fee: number;
    net_amount: number;
    reference?: string | null;
    notes?: string | null;
    available_at?: string | null;
    is_available?: boolean;
    paid_at?: string | null;
    created_at?: string | null;
    instructor?: {
        id?: number;
        name?: string;
        email?: string;
        bank_name?: string | null;
        account_name?: string | null;
        account_number_masked?: string | null;
    };
    order?: { id?: number; order_number?: string; status?: string } | null;
    course?: { id?: number; title?: string; slug?: string } | null;
    instructor_state?: InstructorState;
};

type Batch = {
    instructor_id: number;
    instructor?: Payout['instructor'];
    payout_ids: number[];
    count: number;
    net_total: number;
    earliest_available_at?: string | null;
    bank_complete: boolean;
    locked_until?: string | null;
    meets_minimum: boolean;
    ready: boolean;
    reason?: string | null;
};

interface Paginator<T> {
    data: T[];
    current_page: number;
    last_page: number;
    total: number;
    from?: number | null;
    to?: number | null;
}

type Stat = { count: number; amount: number };

type PayoutSettings = {
    fee_percent: number;
    hold_days: number;
    minimum: number;
    account_lock_hours: number;
};

const EMPTY_STAT: Stat = { count: 0, amount: 0 };

const STATUS_META: Record<string, string> = {
    pending: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300',
    paid: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300',
    cancelled: 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300',
};

function formatDate(value?: string | null): string {
    return value ? new Date(value).toLocaleString('id-ID') : '—';
}

export default function AdminPayouts({
    payouts = { data: [], current_page: 1, last_page: 1, total: 0 },
    stats = { pending: EMPTY_STAT, paid: EMPTY_STAT, cancelled: EMPTY_STAT },
    filters,
    platform_fee_percent,
    payout_settings,
    batches = [],
}: {
    payouts?: Paginator<Payout>;
    stats?: { pending: Stat; paid: Stat; cancelled: Stat };
    filters?: { search?: string; status?: string | null };
    platform_fee_percent?: number;
    payout_settings?: PayoutSettings;
    batches?: Batch[];
}) {
    const [search, setSearch] = useState(filters?.search ?? '');
    const [status, setStatus] = useState(filters?.status ?? 'all');

    const settings: PayoutSettings = payout_settings ?? {
        fee_percent: platform_fee_percent ?? 20,
        hold_days: 7,
        minimum: 100000,
        account_lock_hours: 24,
    };

    const applyFilters = (nextSearch: string, nextStatus: string) => {
        router.get(
            '/admin/payouts',
            {
                search: nextSearch || undefined,
                status: nextStatus === 'all' ? undefined : nextStatus,
            },
            { preserveState: true, preserveScroll: true, replace: true, only: ['payouts', 'batches', 'filters', 'stats'] },
        );
    };

    const markPaid = (payout: Payout) => {
        const reference = window.prompt('Referensi transfer bank (opsional):', '');
        const notes = window.prompt('Catatan transfer (opsional):', '');

        if (!window.confirm(`Tandai payout ${formatRupiah(payout.net_amount)} ke ${payout.instructor?.name ?? 'instruktur'} sudah ditransfer?`)) {
            return;
        }

        router.put(`/admin/payouts/${payout.id}/pay`, { reference: reference || undefined, notes: notes || undefined }, { preserveScroll: true });
    };

    const markBatchPaid = (batch: Batch) => {
        const reference = window.prompt('Referensi transfer bank (opsional):', '');
        const notes = window.prompt('Catatan transfer (opsional):', '');

        if (
            !window.confirm(
                `Tandai batch ${formatRupiah(batch.net_total)} (${batch.count} ledger) ke ${batch.instructor?.name ?? 'instruktur'} sudah ditransfer?`,
            )
        ) {
            return;
        }

        router.put(
            '/admin/payouts/batch',
            { instructor_id: batch.instructor_id, reference: reference || undefined, notes: notes || undefined },
            { preserveScroll: true },
        );
    };

    const exportCsv = () => {
        window.location.href = '/admin/payouts/export';
    };

    const cards = [
        {
            label: 'Menunggu Transfer',
            value: stats.pending,
            icon: Clock3,
            tone: 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300',
        },
        {
            label: 'Sudah Ditransfer',
            value: stats.paid,
            icon: CircleDollarSign,
            tone: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300',
        },
        { label: 'Dibatalkan', value: stats.cancelled, icon: XCircle, tone: 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300' },
    ];

    const readyBatches = batches.filter((batch) => batch.ready);

    return (
        <AdminLayout>
            <Head title="Payout Instruktur" />

            <div className="mx-auto max-w-7xl space-y-6">
                <PageHeader
                    breadcrumbs={[{ label: 'Admin' }, { label: 'Payout Instruktur' }]}
                    title="Payout Instruktur"
                    description="Ledger pendapatan instruktur dan status transfer manual. Midtrans hanya mengirim dana ke rekening platform."
                />

                <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-300">
                    <span className="inline-flex items-center gap-1.5 border border-slate-200 bg-white px-3 py-1.5 dark:border-slate-700 dark:bg-[#1e1f24]">
                        Fee platform {settings.fee_percent}%
                    </span>
                    <span className="inline-flex items-center gap-1.5 border border-slate-200 bg-white px-3 py-1.5 dark:border-slate-700 dark:bg-[#1e1f24]">
                        <CalendarClock size={13} /> Hold {settings.hold_days} hari
                    </span>
                    <span className="inline-flex items-center gap-1.5 border border-slate-200 bg-white px-3 py-1.5 dark:border-slate-700 dark:bg-[#1e1f24]">
                        Minimum {formatRupiah(settings.minimum)}
                    </span>
                    <span className="inline-flex items-center gap-1.5 border border-slate-200 bg-white px-3 py-1.5 dark:border-slate-700 dark:bg-[#1e1f24]">
                        <ShieldAlert size={13} /> Lock ganti rekening {settings.account_lock_hours} jam
                    </span>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                    {cards.map((card) => (
                        <div key={card.label} className="border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-[#1e1f24]">
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{card.label}</p>
                                    <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">{formatRupiah(card.value.amount)}</p>
                                    <p className="mt-1 text-[11px] text-slate-400 dark:text-slate-500">{card.value.count} payout</p>
                                </div>
                                <span className={`flex h-10 w-10 shrink-0 items-center justify-center ${card.tone}`}>
                                    <card.icon size={19} />
                                </span>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="border border-slate-200/80 bg-white shadow-sm dark:border-slate-700 dark:bg-[#1e1f24]">
                    <div className="flex flex-col justify-between gap-4 border-b border-slate-100 p-5 sm:p-6 lg:flex-row lg:items-center dark:border-slate-700">
                        <div>
                            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Siap Ditransfer</h2>
                            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                                Gabungan payout per instruktur yang sudah melewati hold period. Satu transfer per instruktur.
                            </p>
                        </div>

                        <Button
                            variant="outline"
                            size="sm"
                            onClick={exportCsv}
                            disabled={readyBatches.length === 0}
                            leftIcon={<Download size={14} />}
                            title="Export CSV batch yang siap ditransfer"
                        >
                            Export CSV
                        </Button>
                    </div>

                    {batches.length === 0 ? (
                        <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
                            <span className="flex h-12 w-12 items-center justify-center bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500">
                                <Wallet size={22} />
                            </span>
                            <p className="mt-4 text-sm font-bold text-slate-700 dark:text-slate-200">Belum ada payout yang siap ditransfer</p>
                            <p className="mt-1 max-w-md text-xs text-slate-500 dark:text-slate-400">
                                Ledger akan muncul di sini setelah order lunas dan melewati hold period {settings.hold_days} hari.
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[900px] text-left text-sm">
                                <thead className="border-b border-slate-100 bg-slate-50/60 dark:border-slate-700 dark:bg-slate-800/30">
                                    <tr className="text-[11px] tracking-wide text-slate-500 uppercase dark:text-slate-400">
                                        <th className="px-5 py-3 font-semibold sm:px-6">Instruktur</th>
                                        <th className="px-4 py-3 font-semibold">Rekening</th>
                                        <th className="px-4 py-3 font-semibold">Ledger</th>
                                        <th className="px-4 py-3 text-right font-semibold">Total Net</th>
                                        <th className="px-4 py-3 font-semibold">Status</th>
                                        <th className="px-5 py-3 text-right font-semibold sm:px-6">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {batches.map((batch) => (
                                        <tr key={batch.instructor_id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30">
                                            <td className="px-5 py-4 align-top sm:px-6">
                                                <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                                                    {batch.instructor?.name ?? '—'}
                                                </p>
                                                <p className="text-[11px] text-slate-400 dark:text-slate-500">{batch.instructor?.email ?? '—'}</p>
                                            </td>
                                            <td className="px-4 py-4 align-top text-xs text-slate-600 dark:text-slate-300">
                                                <p className="font-semibold">{batch.instructor?.bank_name ?? 'Belum diatur'}</p>
                                                <p className="font-mono">{batch.instructor?.account_number_masked ?? '—'}</p>
                                                <p>{batch.instructor?.account_name ?? '—'}</p>
                                            </td>
                                            <td className="px-4 py-4 align-top text-xs text-slate-600 dark:text-slate-300">
                                                <p>{batch.count} ledger</p>
                                                {batch.earliest_available_at ? (
                                                    <p className="mt-1 text-[11px] text-slate-400 dark:text-slate-500">
                                                        Tersedia sejak {formatDate(batch.earliest_available_at)}
                                                    </p>
                                                ) : null}
                                            </td>
                                            <td className="px-4 py-4 text-right align-top">
                                                <p className="font-semibold text-slate-900 dark:text-white">{formatRupiah(batch.net_total)}</p>
                                            </td>
                                            <td className="px-4 py-4 align-top">
                                                {batch.ready ? (
                                                    <span className="inline-flex px-2 py-0.5 text-[11px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                                                        Siap ditransfer
                                                    </span>
                                                ) : (
                                                    <div className="max-w-[220px]">
                                                        <span className="inline-flex px-2 py-0.5 text-[11px] font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
                                                            Tertahan
                                                        </span>
                                                        <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">{batch.reason ?? 'Belum siap.'}</p>
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-5 py-4 text-right align-top sm:px-6">
                                                <Button
                                                    size="sm"
                                                    onClick={() => markBatchPaid(batch)}
                                                    disabled={!batch.ready}
                                                    leftIcon={<Wallet size={14} />}
                                                    title={batch.ready ? 'Tandai semua ledger siap ini sudah ditransfer' : (batch.reason ?? 'Belum siap')}
                                                >
                                                    Tandai batch
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                <div className="border border-slate-200/80 bg-white shadow-sm dark:border-slate-700 dark:bg-[#1e1f24]">
                    <div className="flex flex-col justify-between gap-4 border-b border-slate-100 p-5 sm:p-6 lg:flex-row lg:items-center dark:border-slate-700">
                        <div>
                            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Ledger Payout</h2>
                            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                                Fee platform {settings.fee_percent}% dihitung otomatis saat pembayaran lunas.
                            </p>
                        </div>

                        <div className="relative w-full sm:w-80">
                            <Search size={15} className="absolute top-1/2 left-3 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                value={search}
                                onChange={(event) => {
                                    setSearch(event.target.value);
                                    window.setTimeout(() => applyFilters(event.target.value, status), 300);
                                }}
                                placeholder="Cari instruktur, order, atau course..."
                                className="w-full border border-slate-200 bg-white py-2 pr-3 pl-9 text-sm text-slate-700 placeholder:text-slate-400 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 focus:outline-none dark:border-slate-700 dark:bg-[#1e1f24] dark:text-slate-200"
                            />
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 px-5 py-3 sm:px-6 dark:border-slate-700">
                        {[
                            { value: 'all', label: 'Semua' },
                            { value: 'pending', label: 'Pending' },
                            { value: 'paid', label: 'Sudah ditransfer' },
                            { value: 'cancelled', label: 'Dibatalkan' },
                        ].map((tab) => (
                            <button
                                key={tab.value}
                                type="button"
                                onClick={() => {
                                    setStatus(tab.value);
                                    applyFilters(search, tab.value);
                                }}
                                className={`px-3 py-1.5 text-xs font-semibold transition-colors ${
                                    status === tab.value
                                        ? 'bg-purple-600 text-white'
                                        : 'border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:bg-[#1e1f24] dark:text-slate-300 dark:hover:bg-slate-800'
                                }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {payouts.data.length === 0 ? (
                        <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
                            <span className="flex h-12 w-12 items-center justify-center bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500">
                                <Inbox size={22} />
                            </span>
                            <p className="mt-4 text-sm font-bold text-slate-700 dark:text-slate-200">Belum ada payout</p>
                            <p className="mt-1 max-w-sm text-xs text-slate-500 dark:text-slate-400">
                                Ledger akan terisi otomatis ketika ada order yang lunas.
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[960px] text-left text-sm">
                                <thead className="border-b border-slate-100 bg-slate-50/60 dark:border-slate-700 dark:bg-slate-800/30">
                                    <tr className="text-[11px] tracking-wide text-slate-500 uppercase dark:text-slate-400">
                                        <th className="px-5 py-3 font-semibold sm:px-6">Instruktur</th>
                                        <th className="px-4 py-3 font-semibold">Rekening</th>
                                        <th className="px-4 py-3 font-semibold">Order</th>
                                        <th className="px-4 py-3 text-right font-semibold">Net</th>
                                        <th className="px-4 py-3 font-semibold">Status</th>
                                        <th className="px-5 py-3 text-right font-semibold sm:px-6">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {payouts.data.map((payout) => {
                                        const state = payout.instructor_state;
                                        const canPay = Boolean(payout.is_available && state?.ready);

                                        return (
                                            <tr key={payout.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30">
                                                <td className="px-5 py-4 align-top sm:px-6">
                                                    <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                                                        {payout.instructor?.name ?? '—'}
                                                    </p>
                                                    <p className="text-[11px] text-slate-400 dark:text-slate-500">{payout.instructor?.email ?? '—'}</p>
                                                </td>
                                                <td className="px-4 py-4 align-top text-xs text-slate-600 dark:text-slate-300">
                                                    <p className="font-semibold">{payout.instructor?.bank_name ?? 'Belum diatur'}</p>
                                                    <p className="font-mono">{payout.instructor?.account_number_masked ?? '—'}</p>
                                                    <p>{payout.instructor?.account_name ?? '—'}</p>
                                                </td>
                                                <td className="px-4 py-4 align-top text-xs text-slate-600 dark:text-slate-300">
                                                    <p className="font-mono">{payout.order?.order_number ?? '—'}</p>
                                                    <p className="mt-1">{payout.course?.title ?? '—'}</p>
                                                </td>
                                                <td className="px-4 py-4 text-right align-top">
                                                    <p className="font-semibold text-slate-900 dark:text-white">{formatRupiah(payout.net_amount)}</p>
                                                    <p className="text-[11px] text-slate-400 dark:text-slate-500">
                                                        Gross {formatRupiah(payout.gross_amount)} · fee {formatRupiah(payout.platform_fee)}
                                                    </p>
                                                    {payout.status === 'pending' && !payout.is_available && payout.available_at ? (
                                                        <p className="mt-1 text-[11px] text-amber-600 dark:text-amber-300">
                                                            Tersedia {formatDate(payout.available_at)}
                                                        </p>
                                                    ) : null}
                                                </td>
                                                <td className="px-4 py-4 align-top">
                                                    <span
                                                        className={`inline-flex px-2 py-0.5 text-[11px] font-semibold ${STATUS_META[payout.status] ?? STATUS_META.pending}`}
                                                    >
                                                        {payout.status}
                                                    </span>
                                                    {payout.paid_at ? (
                                                        <p className="mt-1 text-[11px] text-slate-400 dark:text-slate-500">
                                                            {formatDate(payout.paid_at)}
                                                        </p>
                                                    ) : null}
                                                </td>
                                                <td className="px-5 py-4 text-right align-top sm:px-6">
                                                    {payout.status === 'pending' ? (
                                                        <Button
                                                            size="sm"
                                                            onClick={() => markPaid(payout)}
                                                            disabled={!canPay}
                                                            leftIcon={<Wallet size={14} />}
                                                            title={canPay ? 'Tandai sudah ditransfer' : (state?.reason ?? 'Payout belum bisa dicairkan.')}
                                                        >
                                                            Tandai ditransfer
                                                        </Button>
                                                    ) : payout.status === 'paid' ? (
                                                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">
                                                            <CheckCircle2 size={13} /> Selesai
                                                        </span>
                                                    ) : (
                                                        <span className="text-[11px] text-slate-400">—</span>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {payouts.total > 0 && (
                        <div className="flex items-center justify-between border-t border-slate-100 px-5 py-4 text-xs text-slate-500 sm:px-6 dark:border-slate-700 dark:text-slate-400">
                            <span>
                                Menampilkan {payouts.from ?? 0}–{payouts.to ?? 0} dari {payouts.total} payout
                            </span>
                            <span>
                                Halaman {payouts.current_page} / {payouts.last_page}
                            </span>
                        </div>
                    )}
                </div>
            </div>
        </AdminLayout>
    );
}
