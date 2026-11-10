import { Head, useForm } from '@inertiajs/react';
import { usePage } from '@inertiajs/react';
import { Loader2 } from 'lucide-react';
import Button from '@/components/atoms/Button';
import Toggle from '@/components/atoms/Toggle';
import UserLayout from '@/components/templates/UserLayout';

export default function StudentSettings() {
    const { auth } = usePage().props as unknown as {
        auth?: { user?: { id?: number; whatsapp_number?: string | null; whatsapp_notification_enabled?: boolean } };
    };

    const user = auth?.user;
    const whatsappNumber = user?.whatsapp_number ?? '';
    const whatsappNotificationEnabled = Boolean(user?.whatsapp_notification_enabled);

    const { data, setData, put, processing, errors, recentlySuccessful } = useForm({
        whatsapp_number: whatsappNumber,
        whatsapp_notification_enabled: whatsappNotificationEnabled,
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        put('/student/settings/whatsapp', {
            preserveScroll: true,
        });
    };

    return (
        <UserLayout>
            <Head title="Pengaturan" />

            <div className="mx-auto max-w-3xl space-y-8">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Pengaturan</h1>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Kelola preferensi notifikasi WhatsApp Anda.</p>
                </div>

                <form onSubmit={submit} className="space-y-6 border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-[#1e1f24]">
                    <div className="space-y-2">
                        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Notifikasi WhatsApp</h2>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            Kami mengirimkan pengingatan kelas dan notifikasi progres belajar melalui WhatsApp.
                        </p>
                    </div>

                    <div className="flex items-start justify-between gap-4 border-t border-slate-100 pt-4 dark:border-slate-700">
                        <div>
                            <p className="text-sm font-semibold text-slate-900 dark:text-white">Aktifkan notifikasi WhatsApp</p>
                            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">Notifikasi dikirim ke nomor yang terdaftar.</p>
                        </div>
                        <Toggle
                            checked={data.whatsapp_notification_enabled}
                            onCheckedChange={(checked: boolean) => setData('whatsapp_notification_enabled', checked)}
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-200" htmlFor="whatsapp_number">
                            Nomor WhatsApp
                        </label>
                        <input
                            id="whatsapp_number"
                            name="whatsapp_number"
                            type="tel"
                            value={data.whatsapp_number}
                            onChange={(e) => setData('whatsapp_number', e.target.value)}
                            placeholder="081234567890"
                            className="w-full border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-purple-700 focus:ring-1 focus:ring-purple-700 dark:border-slate-600 dark:bg-[#141416] dark:text-slate-100 dark:focus:border-purple-500"
                        />
                        {errors?.whatsapp_number ? <p className="text-sm text-rose-600 dark:text-rose-400">{errors.whatsapp_number}</p> : null}
                    </div>

                    <div className="flex justify-end">
                        <Button type="submit" disabled={processing}>
                            {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Simpan'}
                        </Button>
                    </div>
                    {recentlySuccessful ? <p className="text-sm text-emerald-600 dark:text-emerald-400">Pengaturan berhasil disimpan.</p> : null}
                </form>
            </div>
        </UserLayout>
    );
}
