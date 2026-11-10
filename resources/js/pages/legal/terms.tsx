import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, ShieldCheck } from 'lucide-react';
import WelcomeLayout from '@/components/templates/WelcomeLayout';

export default function TermsPage({
    title,
    updated_at,
    sections,
}: {
    title: string;
    updated_at?: string | null;
    sections: { heading: string; body: string }[];
}) {
    return (
        <WelcomeLayout>
            <Head title={title} />

            <section className="relative overflow-hidden pt-32 pb-16 sm:pt-40 sm:pb-24">
                <div className="pointer-events-none absolute -top-40 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-purple-500/10 blur-3xl dark:bg-purple-500/5" />
                <div className="relative mx-auto max-w-4xl px-6 text-center sm:px-8">
                    <span className="inline-flex items-center gap-2 rounded-full border border-purple-200 bg-purple-50 px-3 py-1 text-xs font-semibold text-purple-700 dark:border-purple-900/60 dark:bg-purple-950/40 dark:text-purple-300">
                        <ShieldCheck size={14} />
                        Legal
                    </span>
                    <h1 className="mt-6 text-4xl leading-[1.1] font-semibold tracking-[-0.02em] text-slate-900 sm:text-5xl dark:text-white">
                        {title}
                    </h1>
                    {updated_at ? <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">Terakhir diperbarui: {updated_at}</p> : null}
                    <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-slate-600 dark:text-slate-400">
                        Dengan menggunakan platform belajar ini, kamu memahami dan menyetujui ketentuan yang berlaku.
                    </p>
                </div>
            </section>

            <section className="border-y border-slate-200 bg-white dark:border-slate-800 dark:bg-[#1e1f24]">
                <div className="mx-auto max-w-4xl px-6 py-14 sm:px-8 sm:py-20">
                    <div className="space-y-10">
                        {sections.map((section) => (
                            <article key={section.heading} className="space-y-3">
                                <h2 className="text-xl font-semibold text-slate-900 sm:text-2xl dark:text-white">{section.heading}</h2>
                                <p className="leading-relaxed text-slate-600 dark:text-slate-300">{section.body}</p>
                            </article>
                        ))}
                    </div>

                    <div className="mt-12 border-t border-slate-200 pt-8 dark:border-slate-700">
                        <Link
                            href="/"
                            className="inline-flex items-center gap-2 text-sm font-semibold text-purple-700 transition-colors hover:text-purple-500 dark:text-purple-400"
                        >
                            <ArrowLeft size={16} />
                            Kembali ke Beranda
                        </Link>
                    </div>
                </div>
            </section>
        </WelcomeLayout>
    );
}
