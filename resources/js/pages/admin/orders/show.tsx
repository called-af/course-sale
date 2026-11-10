import { Head, Link, router } from '@inertiajs/react';
import { AlertTriangle, ArrowLeft, CheckCircle2, RotateCcw, ShieldAlert } from 'lucide-react';
import Button from '@/components/atoms/Button';
import AdminLayout from '@/components/templates/AdminLayout';
import { formatRupiah } from '@/lib/currency';

interface RefundRecord {
    id: number;
    refund_key?: string | null;
    amount?: number | string;
    reason?: string | null;
    status?: string;
    type?: string;
    provider_status?: string | null;
    refunded_at?: string | null;
    requester?: { name?: string } | null;
}

interface OrderPayment {
    id: number;
    status: string;
    reference?: string;
    transaction_id?: string | null;
    payment_type?: string | null;
    fraud_status?: string | null;
    midtrans_status?: string | null;
    status_code?: string | null;
    amount?: number | string;
    refunded_amount?: number | string;
    chargeback_amount?: number | string;
    payment_url?: string | null;
    paid_at?: string | null;
    settlement_time?: string | null;
    expiry_time?: string | null;
    provider?: { name?: string } | null;
    refunds?: RefundRecord[];
}

interface OrderItem {
    id: number;
    course_title: string;
    course_price?: number | string | null;
}

interface PayoutRecord {
    id: number;
    status: string;
    gross_amount?: number | string;
    platform_fee?: number | string;
    net_amount?: number | string;
    paid_at?: string | null;
    instructor?: { name?: string; email?: string } | null;
}

interface OrderDetail {
    id: number;
    order_number?: string;
    status?: string;
    total_price?: number | string | null;
    refunded_amount?: number | string | null;
    chargeback_amount?: number | string | null;
    paid_at?: string | null;
    user?: { name?: string; email?: string };
    items?: OrderItem[];
    payments?: OrderPayment[];
    payouts?: PayoutRecord[];
}

function formatDate(value?: string | null): string {
    return value ? new Date(value).toLocaleString('id-ID') : '—';
}

export default function AdminOrderShow({ order, refundable = false }: { order: OrderDetail; refundable?: boolean }) {
    const payments = order?.payments ?? [];
    const payouts = order?.payouts ?? [];

    const markPaid = () => {
        const reason = window.prompt('Alasan konfirmasi pembayaran (minimal 3 karakter):');

        if (!reason) return;

        router.put(`/admin/orders/${order.order_number}/pay`, { reason }, { preserveScroll: true });
    };

    const forcePaid = () => {
        const reason = window.prompt('Alasan override manual. Status akan diverifikasi ke Midtrans terlebih dahulu:');

        if (!reason) return;

        if (!window.confirm('Override hanya untuk pembayaran yang benar-benar diterima. Lanjutkan?')) return;

        router.put(`/admin/orders/${order.order_number}/pay`, { reason, override: true }, { preserveScroll: true });
    };

    const refund = () => {
        const reason = window.prompt('Alasan refund:');

        if (!reason) return;

        const amount = window.prompt('Nominal refund. Kosongkan untuk refund penuh:');
        const payload: { reason: string; amount?: number } = { reason };

        if (amount && Number(amount) > 0) {
            payload.amount = Number(amount);
        }

        if (!window.confirm('Refund pesanan ini dan cabut akses course jika refund penuh?')) return;

        router.post(`/admin/orders/${order.order_number}/refund`, payload, { preserveScroll: true });
    };

    return (
        <AdminLayout>
            <Head title={`Order ${order?.order_number ?? ''}`} />

            <div className="mx-auto max-w-5xl space-y-6">
                <Link
                    href="/admin/orders"
                    className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-purple-700 dark:text-slate-400 dark:hover:text-purple-400"
                >
                    <ArrowLeft size={16} /> Kembali ke orders
                </Link>

                <div className="border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-[#1e1f24]">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Order {order?.order_number}</h1>
                            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Status: {order?.status}</p>
                            <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">{formatRupiah(order?.total_price)}</p>
                            {Number(order?.refunded_amount ?? 0) > 0 ? (
                                <p className="mt-1 text-xs text-sky-700 dark:text-sky-300">Direfund: {formatRupiah(order?.refunded_amount)}</p>
                            ) : null}
                            {Number(order?.chargeback_amount ?? 0) > 0 ? (
                                <p className="mt-1 text-xs text-rose-700 dark:text-rose-300">Chargeback: {formatRupiah(order?.chargeback_amount)}</p>
                            ) : null}
                        </div>

                        <div className="flex flex-wrap gap-2">
                            {order?.status === 'pending' ? (
                                <>
                                    <Button onClick={markPaid} leftIcon={<CheckCircle2 size={16} />}>
                                        Verifikasi &amp; Konfirmasi
                                    </Button>
                                    <Button variant="outline" onClick={forcePaid} leftIcon={<AlertTriangle size={16} />}>
                                        Override
                                    </Button>
                                </>
                            ) : null}
                            {order?.status === 'paid' && refundable ? (
                                <Button variant="danger" onClick={refund} leftIcon={<RotateCcw size={16} />}>
                                    Refund
                                </Button>
                            ) : null}
                            {order?.status === 'paid' && !refundable ? (
                                <span className="inline-flex items-center gap-1.5 border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-300">
                                    <ShieldAlert size={14} /> Refund via dashboard Midtrans
                                </span>
                            ) : null}
                        </div>
                    </div>

                    <div className="mt-6 grid gap-4 sm:grid-cols-2">
                        <div>
                            <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase dark:text-slate-400">Siswa</p>
                            <p className="mt-1 text-sm font-medium text-slate-900 dark:text-white">
                                {order?.user?.name ?? '—'} <span className="text-slate-500">({order?.user?.email ?? '—'})</span>
                            </p>
                        </div>
                        <div>
                            <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase dark:text-slate-400">Dibayar pada</p>
                            <p className="mt-1 text-sm font-medium text-slate-900 dark:text-white">{formatDate(order?.paid_at)}</p>
                        </div>
                    </div>

                    <h2 className="mt-8 text-lg font-semibold text-slate-900 dark:text-white">Item</h2>
                    <div className="mt-4 space-y-3">
                        {(order?.items ?? []).map((item) => (
                            <div key={item.id} className="flex items-center justify-between border border-slate-100 p-4 dark:border-slate-700">
                                <div>
                                    <p className="text-sm font-semibold text-slate-900 dark:text-white">{item.course_title}</p>
                                    <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">Course</p>
                                </div>
                                <p className="text-sm font-semibold text-slate-900 dark:text-white">{formatRupiah(item.course_price)}</p>
                            </div>
                        ))}
                    </div>

                    <h2 className="mt-8 text-lg font-semibold text-slate-900 dark:text-white">Transaksi Midtrans</h2>
                    <div className="mt-4 space-y-4">
                        {payments.length === 0 ? (
                            <p className="text-sm text-slate-500 dark:text-slate-400">Belum ada percobaan pembayaran.</p>
                        ) : (
                            payments.map((payment) => (
                                <div key={payment.id} className="border border-slate-100 p-4 text-sm dark:border-slate-700">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <div>
                                            <p className="font-mono text-xs text-slate-700 dark:text-slate-300">{payment.reference}</p>
                                            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                                {payment.provider?.name ?? 'Midtrans'} · {payment.status}
                                                {payment.payment_type ? ` · ${payment.payment_type}` : ''}
                                            </p>
                                        </div>
                                        <span className="font-semibold text-slate-900 dark:text-white">{formatRupiah(payment.amount)}</span>
                                    </div>

                                    <dl className="mt-4 grid gap-3 text-xs sm:grid-cols-2 lg:grid-cols-3">
                                        <div>
                                            <dt className="text-slate-400 dark:text-slate-500">Transaction ID</dt>
                                            <dd className="mt-0.5 font-mono break-all text-slate-700 dark:text-slate-300">
                                                {payment.transaction_id ?? '—'}
                                            </dd>
                                        </div>
                                        <div>
                                            <dt className="text-slate-400 dark:text-slate-500">Midtrans status</dt>
                                            <dd className="mt-0.5 text-slate-700 dark:text-slate-300">
                                                {payment.midtrans_status ?? '—'} {payment.status_code ? `(${payment.status_code})` : ''}
                                            </dd>
                                        </div>
                                        <div>
                                            <dt className="text-slate-400 dark:text-slate-500">Fraud status</dt>
                                            <dd className="mt-0.5 text-slate-700 dark:text-slate-300">{payment.fraud_status ?? '—'}</dd>
                                        </div>
                                        <div>
                                            <dt className="text-slate-400 dark:text-slate-500">Settlement</dt>
                                            <dd className="mt-0.5 text-slate-700 dark:text-slate-300">{formatDate(payment.settlement_time)}</dd>
                                        </div>
                                        <div>
                                            <dt className="text-slate-400 dark:text-slate-500">Refunded</dt>
                                            <dd className="mt-0.5 text-slate-700 dark:text-slate-300">{formatRupiah(payment.refunded_amount)}</dd>
                                        </div>
                                        <div>
                                            <dt className="text-slate-400 dark:text-slate-500">Chargeback</dt>
                                            <dd className="mt-0.5 text-slate-700 dark:text-slate-300">{formatRupiah(payment.chargeback_amount)}</dd>
                                        </div>
                                    </dl>

                                    {(payment.refunds?.length ?? 0) > 0 ? (
                                        <div className="mt-4 space-y-2 border-t border-slate-100 pt-3 dark:border-slate-700">
                                            <p className="text-[11px] font-semibold tracking-wide text-slate-500 uppercase dark:text-slate-400">
                                                Riwayat refund
                                            </p>
                                            {payment.refunds?.map((refundRecord) => (
                                                <div
                                                    key={refundRecord.id}
                                                    className="flex flex-wrap items-center justify-between gap-2 bg-slate-50 px-3 py-2 text-xs dark:bg-slate-800/40"
                                                >
                                                    <div>
                                                        <p className="font-semibold text-slate-700 dark:text-slate-200">
                                                            {formatRupiah(refundRecord.amount)} · {refundRecord.type ?? 'manual'} ·{' '}
                                                            {refundRecord.status}
                                                        </p>
                                                        <p className="mt-0.5 text-slate-500 dark:text-slate-400">
                                                            {refundRecord.reason ?? '—'}{' '}
                                                            {refundRecord.requester?.name ? `· oleh ${refundRecord.requester.name}` : ''}
                                                        </p>
                                                    </div>
                                                    <span className="font-mono text-[10px] text-slate-400">{refundRecord.refund_key}</span>
                                                </div>
                                            ))}
                                        </div>
                                    ) : null}
                                </div>
                            ))
                        )}
                    </div>

                    <h2 className="mt-8 text-lg font-semibold text-slate-900 dark:text-white">Payout Instruktur</h2>
                    <div className="mt-4 space-y-3">
                        {payouts.length === 0 ? (
                            <p className="text-sm text-slate-500 dark:text-slate-400">Belum ada ledger payout untuk order ini.</p>
                        ) : (
                            payouts.map((payout) => (
                                <div
                                    key={payout.id}
                                    className="flex flex-wrap items-center justify-between gap-3 border border-slate-100 p-4 text-sm dark:border-slate-700"
                                >
                                    <div>
                                        <p className="font-semibold text-slate-900 dark:text-white">{payout.instructor?.name ?? '—'}</p>
                                        <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                                            {payout.instructor?.email ?? '—'} · {payout.status}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-semibold text-slate-900 dark:text-white">{formatRupiah(payout.net_amount)}</p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">
                                            Gross {formatRupiah(payout.gross_amount)} · fee {formatRupiah(payout.platform_fee)}
                                        </p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
