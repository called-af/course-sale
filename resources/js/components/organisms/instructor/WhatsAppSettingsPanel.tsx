import { router, useForm } from "@inertiajs/react"
import {
    CheckCircle2,
    Clock,
    Info,
    MessageSquare,
    Phone,
    Send,
    ShieldAlert,
    Sparkles,
} from "lucide-react"
import { useState } from "react"
import { route } from "ziggy-js"

import Button from "@/components/atoms/Button"
import Card from "@/components/atoms/Card"
import InputField from "@/components/molecules/InputField"
import Toggle from "@/components/atoms/Toggle"

export interface WhatsAppSettingsData {
    whatsapp_number: string
    whatsapp_notification_enabled: boolean
    is_configured: boolean
    provider?: string
    is_local?: boolean
}

interface Props {
    settings: WhatsAppSettingsData
    instructorName?: string
}

export default function WhatsAppSettingsPanel({ settings, instructorName = "Instruktur" }: Props) {
    const [isTesting, setIsTesting] = useState(false)
    const [localError, setLocalError] = useState<string | null>(null)

    const { data, setData, put, processing, errors } = useForm({
        whatsapp_number: settings.whatsapp_number ?? "",
        whatsapp_notification_enabled: settings.whatsapp_notification_enabled ?? false,
    })

    const handleToggle = (checked: boolean) => {
        if (checked && !data.whatsapp_number.trim()) {
            setLocalError("Silakan masukkan nomor WhatsApp terlebih dahulu sebelum mengaktifkan notifikasi.")
            return
        }

        setLocalError(null)
        setData("whatsapp_notification_enabled", checked)

        // Automatically submit preference update
        router.put(
            route("instructor.settings.whatsapp.update"),
            {
                whatsapp_number: data.whatsapp_number,
                whatsapp_notification_enabled: checked,
            },
            {
                preserveScroll: true,
            }
        )
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        setLocalError(null)
        put(route("instructor.settings.whatsapp.update"), {
            preserveScroll: true,
        })
    }

    const handleTestNotification = () => {
        if (!data.whatsapp_number.trim()) {
            setLocalError("Silakan masukkan nomor WhatsApp terlebih dahulu untuk menguji pengiriman notifikasi.")
            return
        }

        setLocalError(null)
        setIsTesting(true)

        router.post(
            route("instructor.settings.whatsapp.test"),
            {
                whatsapp_number: data.whatsapp_number.trim(),
            },
            {
                preserveScroll: true,
                onFinish: () => setIsTesting(false),
            }
        )
    }

    const currentDate = new Intl.DateTimeFormat("id-ID", {
        dateStyle: "medium",
        timeStyle: "short",
    }).format(new Date())

    const effectiveError = errors.whatsapp_number || localError
    const providerLabel = settings.provider === "infobip" ? "Infobip WhatsApp Gateway" : "Meta Cloud API"

    return (
        <Card className="overflow-hidden rounded-none space-y-6">
            {/* Header with Switch */}
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-4">
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
                        <MessageSquare size={24} />
                    </span>
                    <div>
                        <div className="flex items-center gap-2.5 flex-wrap">
                            <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                                Notifikasi WhatsApp Otomatis
                            </h2>
                            {settings.is_configured ? (
                                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-0.5 text-xs font-medium text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                                    <CheckCircle2 size={12} />
                                    {providerLabel} Aktif
                                </span>
                            ) : settings.is_local ? (
                                <span
                                    className="inline-flex items-center gap-1 rounded-full bg-blue-50 dark:bg-blue-950/50 px-2.5 py-0.5 text-xs font-medium text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800"
                                    title="Kredensial belum diisi di .env. Pengujian berjalan dalam mode simulasi log lokal."
                                >
                                    <Sparkles size={12} />
                                    Mode Simulasi Lokal (Dev)
                                </span>
                            ) : (
                                <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 dark:bg-amber-950/50 px-2.5 py-0.5 text-xs font-medium text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                                    <ShieldAlert size={12} />
                                    API Belum Dikonfigurasi (.env)
                                </span>
                            )}
                        </div>
                        <p className="mt-1 text-sm text-neutral-500 dark:text-slate-400">
                            Terima pemberitahuan WhatsApp secara instan saat siswa baru mendaftar di course Anda.
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
                        {data.whatsapp_notification_enabled ? "Notifikasi Aktif" : "Notifikasi Nonaktif"}
                    </span>
                    <Toggle
                        checked={data.whatsapp_notification_enabled}
                        onCheckedChange={handleToggle}
                        disabled={processing}
                        label="Aktifkan atau nonaktifkan notifikasi WhatsApp"
                    />
                </div>
            </div>

            {/* Main Form & Configuration */}
            <div className="border-t border-neutral-200 bg-neutral-50/70 p-6 dark:border-slate-700 dark:bg-slate-900/30">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid gap-6 md:grid-cols-2">
                        {/* WhatsApp Number Input */}
                        <div className="space-y-2">
                            <InputField
                                label="Nomor WhatsApp Instruktur"
                                name="whatsapp_number"
                                placeholder="081234567890 atau +6281234567890"
                                value={data.whatsapp_number}
                                onChange={(e) => {
                                    setData("whatsapp_number", e.target.value)
                                    if (localError) setLocalError(null)
                                }}
                                error={effectiveError ?? undefined}
                                disabled={processing}
                            />
                            <p className="text-xs text-neutral-500 dark:text-slate-400 flex items-center gap-1">
                                <Phone size={12} className="shrink-0 text-neutral-400" />
                                Format didukung: <strong className="text-slate-700 dark:text-slate-300 font-mono">081234567890</strong> atau <strong className="text-slate-700 dark:text-slate-300 font-mono">+6281234567890</strong>.
                            </p>
                        </div>

                        {/* Status Summary & Quick Actions */}
                        <div className="flex flex-col justify-between border border-neutral-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-slate-400">
                                    Status Pengiriman
                                </p>
                                <div className="mt-2 space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
                                    <div className="flex items-center justify-between">
                                        <span>Status Layanan:</span>
                                        <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                                            {data.whatsapp_notification_enabled ? "Aktif" : "Nonaktif"}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span>Nomor Terdaftar:</span>
                                        <span className="font-mono text-slate-800 dark:text-slate-200">
                                            {data.whatsapp_number || "Belum diisi"}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-4 pt-3 border-t border-neutral-100 dark:border-slate-700/60 flex items-center justify-between gap-2">
                                <span className="text-[11px] text-neutral-400 dark:text-slate-500">
                                    Uji pengiriman ke nomor Anda
                                </span>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={handleTestNotification}
                                    disabled={!data.whatsapp_number.trim() || isTesting || processing}
                                    isLoading={isTesting}
                                    leftIcon={<Send size={13} />}
                                >
                                    Test WhatsApp Notification
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Action Bar */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 border-t border-neutral-200 dark:border-slate-700">
                        <div className="flex items-center gap-2 text-xs text-neutral-500 dark:text-slate-400">
                            <Info size={14} className="text-purple-600 dark:text-purple-400 shrink-0" />
                            <span>
                                {settings.provider === "infobip"
                                    ? "Infobip Sandbox: Sebelum melakukan pengujian, kirim pesan WhatsApp 'ARKADANISAYSSTUFF' ke nomor +447860088970 dari HP Anda untuk mengaktifkan sandbox penerima."
                                    : settings.is_local && !settings.is_configured
                                    ? "Lingkungan lokal: Uji coba WhatsApp akan dicatat ke storage/logs/laravel.log tanpa memotong kuota API."
                                    : "Enrollment siswa tetap berhasil meskipun pengiriman notifikasi WhatsApp mengalami gangguan."}
                            </span>
                        </div>

                        <div className="flex items-center gap-3">
                            <Button
                                type="submit"
                                disabled={processing}
                                isLoading={processing}
                                leftIcon={<CheckCircle2 size={15} />}
                            >
                                Simpan Pengaturan
                            </Button>
                        </div>
                    </div>
                </form>
            </div>

            {/* Message Preview Section */}
            <div className="p-6 bg-white dark:bg-slate-900 border border-neutral-200 dark:border-slate-800">
                <div className="flex items-center gap-2 mb-3">
                    <Sparkles size={16} className="text-purple-600 dark:text-purple-400" />
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                        Pratinjau Pesan Notifikasi Siswa Baru
                    </h3>
                </div>
                <p className="text-xs text-neutral-500 dark:text-slate-400 mb-4">
                    Berikut adalah format pesan WhatsApp yang akan Anda terima setiap kali ada siswa baru yang mendaftar ke salah satu course Anda:
                </p>

                {/* WhatsApp Chat Bubble Mockup */}
                <div className="max-w-md bg-[#e5ddd5] dark:bg-slate-950 p-4 border border-neutral-200 dark:border-slate-800 shadow-inner">
                    <div className="bg-white dark:bg-[#1f2c34] text-slate-900 dark:text-slate-100 p-3.5 shadow-sm text-xs space-y-2 rounded-tl-none rounded-2xl relative">
                        <p className="font-semibold text-slate-900 dark:text-white">
                            Halo, <span className="text-purple-700 dark:text-purple-300">*{instructorName}*</span>! 🎓
                        </p>
                        <p className="text-slate-600 dark:text-slate-300">
                            Ada student baru yang baru saja enroll di course Anda:
                        </p>
                        <div className="bg-slate-50 dark:bg-slate-900/60 p-2.5 rounded-sm border-l-2 border-emerald-500 space-y-1 font-sans">
                            <p>👤 <strong>Student:</strong> Ahmad Pratama</p>
                            <p>📚 <strong>Course:</strong> Master Fullstack Web Development Modern</p>
                            <p>🗓️ <strong>Tanggal Enrollment:</strong> {currentDate}</p>
                        </div>
                        <p className="text-slate-600 dark:text-slate-300 pt-1">
                            Buka dashboard instructor Anda untuk memantau progress siswa:
                        </p>
                        <p className="text-purple-600 dark:text-purple-400 font-mono text-[11px] underline">
                            🔗 {typeof window !== "undefined" ? window.location.origin : "https://kursus.io"}/instructor/dashboard
                        </p>
                        <div className="pt-2 text-[10px] text-slate-400 dark:text-slate-500 flex justify-between items-center border-t border-slate-100 dark:border-slate-800">
                            <span>Salam hangat, Tim KursusIO</span>
                            <span className="flex items-center gap-1">
                                <Clock size={10} /> Sekarang
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </Card>
    )
}
