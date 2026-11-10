import { Head, Link, router } from '@inertiajs/react';
import { AlertTriangle, ArrowLeft, CheckCircle2, CreditCard, RefreshCw, RotateCcw, ShieldAlert } from 'lucide-react';
import { useEffect } from 'react';
import Button from '@/components/atoms/Button';
import UserLayout from '@/components/templates/UserLayout';
import { formatRupiah } from '@/lib/currency';

type PaymentProps = {
    order?: {
        id: number;
        order_number: string;
        total_price: number;
        refunded_amount?: number;
        chargeback_amount?: number;
        status: string;
        currency: string;
        expires_at: string | null;
        paid_at: string | null;
    };
    payment?: {
        id: number;
        status: string;
        amount: number;
        currency: string;
        reference?: string;
        payment_url?: string | null;
        payment_type?: string | null;
        transaction_id?: string | null;
        refunded_amount?: number;
        chargeback_amount?: number;
        paid_at?: string | null;
    };
    course?: { id: number; title: string; slug: string; thumbnail_url: string | null };
    gateway?: {
        payment_url: string | null;
    };
};

const STATUS_LABELS: Record<string, string> = {
    pending: 'Menunggu pembayaran',
    paid: 'Lunas',
    failed: 'Gagal',
    expired: 'Kedaluwarsa',
    refunded: 'Direfund',
    partial_refund: 'Refund sebagian',
    chargeback: 'Chargeback',
};

export default function PaymentPage(props: PaymentProps) {
    const { order, payment, course, gateway } = props;
    const status = order?.status ?? 'pending';
    const isPaid = status === 'paid';
    const isRefunded = status === 'refunded' || payment?.status === 'refunded';
    const isPartialRefund = payment?.status === 'partial_refund';
    const isChargeback = status === 'chargeback' || payment?.status === 'chargeback';
    const isFailed = status === 'expired' || status === 'failed';
    const isOnline = Boolean(gateway?.payment_url) && payment?.status === 'pending' && status === 'pending';
    const statusLabel = STATUS_LABELS[status] ?? status;

    // Poll the status page while the payment is still pending so students do
    // not have to know that they must press "check status" after returning.
    useEffect(() => {
        if (!isOnline) return;

        const timer = window.setInterval(() => {
            router.reload({ only: ['order', 'payment', 'gateway'] });
        }, 12000);

        return () => window.clearInterval(timer);
    }, [isOnline]);

    return (
        <UserLayout>
            <Head title={`Pembayaran — ${order?.order_number ?? ''}`} />

            <div className="mx-auto max-w-3xl space-y-6">
                <Link
                    href="/student/courses"
                    className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-purple-700 dark:text-slate-400 dark:hover:text-purple-400"
                >
                    <ArrowLeft size={16} /> Kembali ke pembelajaran saya
                </Link>

                <div className="border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-[#1e1f24]">
                    {isRefunded ? (
                        <div className="flex flex-col items-center gap-4 py-8 text-center">
                            <RotateCcw className="text-sky-500" size={48} />
                            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Pembayaran telah direfund</h1>
                            <p className="max-w-md text-sm text-slate-500 dark:text-slate-400">
                                Dana sudah dikembalikan ke channel pembayaran Anda. Akses course untuk order ini sudah dicabut.
                            </p>
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                Nominal refund:{' '}
                                <span className="font-semibold text-slate-900 dark:text-white">
                                    {formatRupiah(Number(order?.refunded_amount ?? payment?.refunded_amount ?? order?.total_price ?? 0))}
                                </span>
                            </p>
                            <Link href="/student/courses">
                                <Button variant="outline">Kembali ke pembelajaran saya</Button>
                            </Link>
                        </div>
                    ) : isChargeback ? (
                        <div className="flex flex-col items-center gap-4 py-8 text-center">
                            <ShieldAlert className="text-rose-500" size={48} />
                            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Pembayaran terkena chargeback</h1>
                            <p className="max-w-md text-sm text-slate-500 dark:text-slate-400">
                                Penerbit kartu atau penyedia pembayaran menarik kembali dana untuk order ini. Akses course sudah dicabut. Hubungi
                                admin jika Anda merasa ini sebuah kesalahan.
                            </p>
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                Nominal chargeback:{' '}
                                <span className="font-semibold text-slate-900 dark:text-white">
                                    {formatRupiah(Number(order?.chargeback_amount ?? payment?.chargeback_amount ?? order?.total_price ?? 0))}
                                </span>
                            </p>
                        </div>
                    ) : isPaid || isPartialRefund ? (
                        <div className="flex flex-col items-center gap-4 py-8 text-center">
                            <CheckCircle2 className="text-emerald-500" size={48} />
                            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Pembayaran berhasil</h1>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Anda sekarang memiliki akses penuh ke course ini.</p>
                            {isPartialRefund ? (
                                <p className="text-xs text-sky-700 dark:text-sky-300">
                                    Sebagian pembayaran telah direfund: {formatRupiah(Number(payment?.refunded_amount ?? 0))}
                                </p>
                            ) : null}
                            {course ? (
                                <Link href={`/student/courses/${course.slug}`} className="mt-2">
                                    <Button>Mulai belajar</Button>
                                </Link>
                            ) : null}
                        </div>
                    ) : (
                        <>
                            <div className="flex items-center gap-3">
                                <CreditCard className="text-purple-600 dark:text-purple-400" size={22} />
                                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Selesaikan pembayaran</h1>
                            </div>

                            <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
                                {formatRupiah(Number(payment?.amount ?? order?.total_price ?? 0))}
                            </p>
                            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Nomor order: {order?.order_number}</p>
                            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                Status: <span className="font-semibold">{statusLabel}</span>
                            </p>
                            {payment?.payment_type ? (
                                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Channel: {payment.payment_type}</p>
                            ) : null}

                            {isOnline ? (
                                <div className="mt-6 border border-purple-200 bg-purple-50 p-5 text-sm text-purple-950 dark:border-purple-900/60 dark:bg-purple-950/30 dark:text-purple-100">
                                    <p className="font-semibold">Lanjutkan pembayaran melalui halaman Midtrans yang aman.</p>
                                    <p className="mt-1 text-xs">
                                        Pilih metode pembayaran (QRIS, VA, e-wallet, kartu) di halaman Midtrans. Halaman ini akan mengecek status
                                        secara otomatis.
                                    </p>
                                    <div className="mt-4 flex flex-wrap gap-3">
                                        <a href={gateway?.payment_url ?? '#'} target="_blank" rel="noopener noreferrer">
                                            <Button type="button">Bayar sekarang</Button>
                                        </a>
                                        <Button type="button" variant="outline" onClick={() => router.reload()} leftIcon={<RefreshCw size={15} />}>
                                            Cek status pembayaran
                                        </Button>
                                    </div>
                                </div>
                            ) : null}

                            {isFailed ? (
                                <div className="mt-6 border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-300">
                                    <p className="flex items-center gap-2 font-semibold">
                                        <AlertTriangle size={16} /> Pembayaran tidak selesai.
                                    </p>
                                    <p className="mt-1 text-xs">Silakan buat order baru untuk melanjutkan pembelian.</p>
                                    {course ? (
                                        <Link href={`/student/courses/${course.slug}/checkout`} className="mt-3 inline-block font-semibold underline">
                                            Ulangi checkout
                                        </Link>
                                    ) : null}
                                </div>
                            ) : null}
                        </>
                    )}
                </div>
            </div>
        </UserLayout>
    );
}
