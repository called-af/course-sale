import { Head, Link } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import Title from '@/components/atoms/Title';
import CheckoutPanel from '@/components/organisms/Payment/CheckoutPanel';
import UserLayout from '@/components/templates/UserLayout';
import type { Course, PaymentGateway, PaymentMethod } from '@/types';

export default function CheckoutPage({
    course,
    paymentMethods = [],
    gateway,
}: {
    course: Course;
    paymentMethods: PaymentMethod[];
    gateway?: PaymentGateway;
}) {
    return (
        <UserLayout>
            <Head title={`Checkout — ${course.title}`} />

            <div className="mx-auto max-w-3xl space-y-6">
                <Link
                    href={`/course/${course.slug}`}
                    className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-purple-700 dark:text-slate-400 dark:hover:text-purple-400"
                >
                    <ArrowLeft size={16} /> Kembali ke course
                </Link>

                <div>
                    <Title as="h3">Checkout</Title>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        Periksa pesanan Anda. Metode pembayaran dipilih di halaman Midtrans setelah menekan tombol lanjut.
                    </p>
                </div>

                <CheckoutPanel course={course} paymentMethods={paymentMethods} gateway={gateway} />
            </div>
        </UserLayout>
    );
}
