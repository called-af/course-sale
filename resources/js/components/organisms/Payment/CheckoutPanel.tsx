import { useForm } from '@inertiajs/react';
import { AlertTriangle, Check, CreditCard, Landmark, Lock, QrCode, ShieldCheck, Smartphone, Wallet } from 'lucide-react';
import Button from '@/components/atoms/Button';
import { formatRupiah } from '@/lib/currency';
import type { Course, PaymentGateway, PaymentMethod } from '@/types';

interface CheckoutPanelProps {
    course: Course;
    paymentMethods?: PaymentMethod[];
    gateway?: PaymentGateway | null;
    onSuccess?: () => void;
}

const METHOD_META: Record<string, { label: string; icon: typeof CreditCard }> = {
    credit_card: { label: 'Kartu Kredit/Debit', icon: CreditCard },
    qris: { label: 'QRIS', icon: QrCode },
    virtual_account: { label: 'Virtual Account', icon: Landmark },
    bank_transfer: { label: 'Bank Transfer', icon: Landmark },
    gopay: { label: 'GoPay', icon: Wallet },
    shopeepay: { label: 'ShopeePay', icon: Smartphone },
};

export default function CheckoutPanel({ course, paymentMethods = [], gateway, onSuccess }: CheckoutPanelProps) {
    const { post, processing } = useForm({});

    const price = Number(course.price ?? 0);
    const hasMethods = paymentMethods.length > 0;
    const midtransReady = gateway?.name === 'midtrans' && gateway?.midtrans_enabled;

    const submit = (event: React.FormEvent) => {
        event.preventDefault();

        post(`/student/courses/${course.slug}/checkout`, {
            onSuccess: () => onSuccess?.(),
        });
    };

    return (
        <form onSubmit={submit} className="space-y-6">
            {/* Order summary */}
            <section className="border border-slate-200 bg-white dark:border-slate-700 dark:bg-[#1e1f24]">
                <div className="flex items-center gap-2 border-b border-slate-100 px-4 py-3 dark:border-slate-700">
                    <span className="flex h-6 w-6 items-center justify-center bg-purple-700 text-[11px] font-bold text-white">1</span>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">Ringkasan Pesanan</h3>
                </div>

                <div className="flex gap-4 p-4">
                    {course.thumbnail_url && (
                        <img
                            src={course.thumbnail_url}
                            alt={course.title}
                            className="hidden h-20 w-32 shrink-0 border border-slate-200 object-cover sm:block dark:border-slate-700"
                        />
                    )}

                    <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-slate-900 dark:text-white">{course.title}</p>
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Akses penuh seumur hidup setelah pembayaran berhasil.</p>
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                            <span className="inline-flex items-center gap-1 bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                                <Check size={12} /> Akses permanen
                            </span>
                            <span className="inline-flex items-center gap-1 bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                                Sertifikat
                            </span>
                        </div>
                    </div>

                    <div className="shrink-0 text-right">
                        <p className="text-[11px] font-medium tracking-wide text-slate-400 uppercase dark:text-slate-500">Total</p>
                        <p className="text-lg font-bold text-slate-900 dark:text-white">{formatRupiah(price)}</p>
                    </div>
                </div>
            </section>

            {/* Payment info — the channel is chosen on Midtrans */}
            <section className="border border-slate-200 bg-white dark:border-slate-700 dark:bg-[#1e1f24]">
                <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 dark:border-slate-700">
                    <div className="flex items-center gap-2">
                        <span className="flex h-6 w-6 items-center justify-center bg-purple-700 text-[11px] font-bold text-white">2</span>
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white">Pembayaran</h3>
                    </div>
                    <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500">Diproses oleh Midtrans</span>
                </div>

                <div className="space-y-4 p-4">
                    {hasMethods ? (
                        <>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                Tidak perlu memilih sekarang. Setelah menekan tombol bayar, Anda akan memilih metode pembayaran di halaman Midtrans.
                            </p>

                            <div className="flex flex-wrap gap-2">
                                {paymentMethods.map((method) => {
                                    const meta = METHOD_META[method.code];
                                    const Icon = meta?.icon ?? CreditCard;

                                    return (
                                        <span
                                            key={method.id}
                                            className="inline-flex items-center gap-1.5 border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-[11px] font-semibold text-slate-600 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-300"
                                        >
                                            <Icon size={13} />
                                            {meta?.label ?? method.name}
                                        </span>
                                    );
                                })}
                            </div>
                        </>
                    ) : (
                        <div className="flex items-start gap-3 border border-amber-200 bg-amber-50 p-4 dark:border-amber-900/60 dark:bg-amber-950/30">
                            <AlertTriangle size={18} className="mt-0.5 shrink-0 text-amber-600 dark:text-amber-400" />
                            <div>
                                <p className="text-sm font-semibold text-amber-900 dark:text-amber-300">Belum ada metode pembayaran aktif</p>
                                <p className="mt-1 text-xs text-amber-700 dark:text-amber-400">
                                    Admin perlu mengaktifkan provider pembayaran terlebih dahulu. Silakan hubungi admin untuk menyelesaikan
                                    pendaftaran kursus ini.
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </section>

            {/* Gateway notice */}
            {gateway?.name === 'midtrans' && (
                <section
                    className={`flex items-start gap-3 border p-4 text-xs ${
                        midtransReady
                            ? 'border-sky-200 bg-sky-50 text-sky-800 dark:border-sky-900/60 dark:bg-sky-950/30 dark:text-sky-300'
                            : 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-300'
                    }`}
                >
                    <ShieldCheck size={17} className="mt-0.5 shrink-0" />
                    <p>
                        {midtransReady
                            ? `Anda akan diarahkan ke Midtrans${
                                  gateway.is_production ? '' : ' (Sandbox)'
                              } untuk memilih dan menyelesaikan pembayaran. Data kartu tidak disimpan oleh platform ini.`
                            : 'Gateway Midtrans belum dikonfigurasi pada server ini. Hubungi admin sebelum melakukan pembayaran.'}
                    </p>
                </section>
            )}

            {/* Actions */}
            <div className="space-y-3">
                <Button
                    type="submit"
                    widthFull
                    size="lg"
                    isLoading={processing}
                    disabled={processing || !hasMethods}
                    leftIcon={<Lock size={16} />}
                    className="!rounded-none"
                >
                    {processing ? 'Memproses...' : `Lanjut ke Pembayaran — ${formatRupiah(price)}`}
                </Button>

                <p className="flex items-center justify-center gap-1.5 text-center text-[11px] text-slate-400 dark:text-slate-500">
                    <ShieldCheck size={13} />
                    Pembayaran diproses aman oleh gateway resmi. Dengan melanjutkan, Anda menyetujui syarat dan ketentuan.
                </p>
            </div>
        </form>
    );
}
