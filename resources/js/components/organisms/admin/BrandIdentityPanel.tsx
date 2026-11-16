import { useForm } from '@inertiajs/react';
import { Check, LoaderCircle, Save } from 'lucide-react';

import { route } from 'ziggy-js';
import Button from '@/components/atoms/Button';

interface BrandIdentityPanelProps {
    initialName: string;
    initialEmail: string;
}

export default function BrandIdentityPanel({ initialName, initialEmail }: BrandIdentityPanelProps) {
    const { data, setData, put, processing, errors, recentlySuccessful } = useForm<{
        app_name: string;
        contact_email: string;
    }>({
        app_name: initialName,
        contact_email: initialEmail,
    });

    const submit = (event: React.FormEvent) => {
        event.preventDefault();

        put(route('admin.settings.identity.update'), {
            preserveScroll: true,
        });
    };

    return (
        <section className="space-y-5" aria-labelledby="identity-heading">
            <div>
                <h2 id="identity-heading" className="text-lg font-semibold text-slate-900 dark:text-white">
                    Identitas aplikasi
                </h2>
                <p className="mt-1 text-sm text-neutral-500">
                    Nama ini dipakai di landing page, dashboard, navbar, footer, dan sertifikat. Ubah sekali di sini, semua halaman ikut berubah.
                </p>
            </div>

            <form
                onSubmit={submit}
                className="grid gap-5 border border-neutral-200 bg-white p-5 md:grid-cols-2 dark:border-slate-700 dark:bg-[#1e1f24]"
            >
                <div className="space-y-1.5">
                    <label htmlFor="app_name" className="text-sm font-medium text-slate-900 dark:text-white">
                        Nama aplikasi
                    </label>
                    <input
                        id="app_name"
                        type="text"
                        value={data.app_name}
                        onChange={(event) => setData('app_name', event.target.value)}
                        placeholder="Contoh: KursusIO"
                        className="w-full border border-neutral-300 bg-white px-3 py-2 text-sm text-slate-900 transition outline-none focus:border-purple-700 focus:ring-1 focus:ring-purple-700 dark:border-slate-600 dark:bg-[#1e1f24] dark:text-white"
                    />
                    {errors.app_name && <p className="text-xs text-red-600 dark:text-red-400">{errors.app_name}</p>}
                </div>

                <div className="space-y-1.5">
                    <label htmlFor="contact_email" className="text-sm font-medium text-slate-900 dark:text-white">
                        Email kontak
                    </label>
                    <input
                        id="contact_email"
                        type="email"
                        value={data.contact_email}
                        onChange={(event) => setData('contact_email', event.target.value)}
                        placeholder="hello@domain.com"
                        className="w-full border border-neutral-300 bg-white px-3 py-2 text-sm text-slate-900 transition outline-none focus:border-purple-700 focus:ring-1 focus:ring-purple-700 dark:border-slate-600 dark:bg-[#1e1f24] dark:text-white"
                    />
                    {errors.contact_email && <p className="text-xs text-red-600 dark:text-red-400">{errors.contact_email}</p>}
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center md:col-span-2">
                    <Button
                        type="submit"
                        leftIcon={processing ? <LoaderCircle size={16} className="animate-spin" /> : <Save size={16} />}
                        disabled={processing}
                        className="w-full sm:w-auto"
                    >
                        Simpan identitas
                    </Button>

                    {recentlySuccessful && (
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                            <Check size={14} />
                            Tersimpan
                        </span>
                    )}
                </div>
            </form>
        </section>
    );
}
