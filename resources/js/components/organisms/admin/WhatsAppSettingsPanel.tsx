import { Head, router, useForm } from "@inertiajs/react"
import { CheckCircle2, Eye, EyeOff, KeyRound, MessageSquare, Phone, Send, ShieldAlert, Sparkles } from "lucide-react"
import { useEffect, useState } from "react"
import { route } from "ziggy-js"

import Button from "@/components/atoms/Button"
import Card from "@/components/atoms/Card"
import Modal from "@/components/atoms/Modal"
import Title from "@/components/atoms/Title"
import Toggle from "@/components/atoms/Toggle"
import InputField from "@/components/molecules/InputField"
import { apiFetch } from "@/lib/csrf"

export interface WhatsAppSettingsData {
    enabled: boolean
    provider: string
    base_url: string | null
    from_number: string | null
    sandbox_keyword: string | null
    has_api_key: boolean
    api_key_hint: string | null
    is_configured: boolean
}

interface WhatsAppSettingsPanelProps {
    initialWhatsApp: WhatsAppSettingsData
    flash?: { success?: string; error?: string }
}

export default function WhatsAppSettingsPanel({
    initialWhatsApp,
    flash,
}: WhatsAppSettingsPanelProps) {
    const [showKey, setShowKey] = useState(false)
    const [isEditing, setIsEditing] = useState(false)
    const [showPasswordModal, setShowPasswordModal] = useState(false)
    const [isVerifyingPassword, setIsVerifyingPassword] = useState(false)
    const [passwordError, setPasswordError] = useState<string | null>(null)

    // Test notification state
    const [testPhone, setTestPhone] = useState("")
    const [isTesting, setIsTesting] = useState(false)
    const [testResult, setTestResult] = useState<{
        success: boolean
        message?: string
        error?: string
    } | null>(null)

    const { data, setData, processing, errors, reset } = useForm({
        enabled: initialWhatsApp.enabled,
        base_url: initialWhatsApp.base_url ?? "https://55z3yd.api.infobip.com",
        from_number: initialWhatsApp.from_number ?? "447860088970",
        sandbox_keyword: initialWhatsApp.sandbox_keyword ?? "ARKADANISAYSSTUFF",
        api_key: "",
        current_password: "",
    })

    useEffect(() => {
        if (flash?.success) {
            reset("api_key", "current_password")
            setIsEditing(false)
        }
    }, [flash?.success, reset])

    const updateEnabled = (checked: boolean) => {
        setData("enabled", checked)
        router.patch(route("admin.settings.whatsapp.toggle"), { enabled: checked })
    }

    const startEditing = () => {
        setPasswordError(null)
        setData("current_password", "")
        setShowPasswordModal(true)
    }

    const verifyPassword = async () => {
        setIsVerifyingPassword(true)
        setPasswordError(null)

        try {
            const response = await apiFetch(
                route("admin.settings.ai.verify-password"),
                {
                    method: "POST",
                    body: JSON.stringify({
                        current_password: data.current_password,
                    }),
                },
            )
            const result = await response.json()

            if (!response.ok) {
                setPasswordError(
                    result.errors?.current_password ??
                        "Password yang dimasukkan salah.",
                )
                return
            }

            setShowPasswordModal(false)
            setIsEditing(true)
        } catch {
            setPasswordError(
                "Tidak dapat memverifikasi password. Silakan coba lagi.",
            )
        } finally {
            setIsVerifyingPassword(false)
        }
    }

    const submitCredentials = (event: React.FormEvent) => {
        event.preventDefault()
        router.put(route("admin.settings.whatsapp.update"), data)
    }

    const handleTestNotification = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!testPhone.trim()) {
            setTestResult({
                success: false,
                error: "Silakan masukkan nomor WhatsApp tujuan uji coba.",
            })
            return
        }

        setIsTesting(true)
        setTestResult(null)

        try {
            const response = await apiFetch(
                route("admin.settings.whatsapp.test"),
                {
                    method: "POST",
                    body: JSON.stringify({
                        phone_number: testPhone.trim(),
                    }),
                },
            )
            const result = await response.json()

            if (response.ok && result.success) {
                setTestResult({
                    success: true,
                    message: `Pesan uji coba WhatsApp berhasil dikirim ke +${testPhone.trim()} via Infobip!`,
                })
            } else {
                setTestResult({
                    success: false,
                    error:
                        result.error ??
                        "Gagal mengirim pesan uji coba. Periksa kredensial Infobip Anda.",
                })
            }
        } catch (err: any) {
            setTestResult({
                success: false,
                error: "Terjadi kesalahan saat menghubungi server pengujian.",
            })
        } finally {
            setIsTesting(false)
        }
    }

    return (
        <section className="space-y-6">
            <Card className="overflow-hidden rounded-none">
                {/* Header Toggle */}
                <div className="flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-start gap-4">
                        <span className="flex h-11 w-11 shrink-0 items-center justify-center bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-300">
                            <MessageSquare size={21} />
                        </span>
                        <div>
                            <div className="flex items-center gap-2">
                                <h2 className="font-semibold text-slate-900 dark:text-white">
                                    Gateway WhatsApp Infobip
                                </h2>
                                <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
                                    Ready Prod (DB Managed)
                                </span>
                            </div>
                            <p className="mt-1 text-sm text-neutral-500">
                                Kelola gateway WhatsApp Infobip secara langsung dari Database & Admin Panel tanpa edit file .env di server.
                            </p>
                        </div>
                    </div>

                    <Toggle
                        checked={data.enabled}
                        onCheckedChange={updateEnabled}
                        disabled={processing}
                        label="Aktifkan atau nonaktifkan gateway WhatsApp"
                    />
                </div>

                {/* Configuration Section */}
                <div className="border-t border-neutral-200 bg-neutral-50/70 p-6 dark:border-slate-700 dark:bg-slate-900/30">
                    <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h3 className="font-semibold text-slate-900 dark:text-white">
                                Konfigurasi Infobip
                            </h3>
                            <p className="mt-1 text-sm text-neutral-500">
                                Base URL, API Key, nomor pengirim (From), dan kata kunci sandbox Infobip.
                            </p>
                        </div>
                        {!isEditing && (
                            <Button
                                type="button"
                                variant="secondary"
                                onClick={startEditing}
                            >
                                Edit mode
                            </Button>
                        )}
                    </div>

                    {!isEditing ? (
                        <div className="grid gap-4 md:grid-cols-4">
                            <div className="border border-neutral-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
                                <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">
                                    Infobip Base URL
                                </p>
                                <p className="mt-2 break-all text-sm font-medium text-slate-900 dark:text-white">
                                    {data.base_url || "Belum dikonfigurasi"}
                                </p>
                            </div>
                            <div className="border border-neutral-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
                                <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">
                                    From Number / Sender
                                </p>
                                <p className="mt-2 text-sm font-medium text-slate-900 dark:text-white">
                                    +{data.from_number || "447860088970"}
                                </p>
                            </div>
                            <div className="border border-neutral-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
                                <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">
                                    Sandbox Keyword
                                </p>
                                <p className="mt-2 text-sm font-medium text-slate-900 dark:text-white">
                                    {data.sandbox_keyword || "—"}
                                </p>
                            </div>
                            <div className="border border-neutral-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
                                <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">
                                    API Key Status
                                </p>
                                <p className="mt-2 text-sm font-medium text-slate-900 dark:text-white">
                                    {initialWhatsApp.has_api_key
                                        ? `••••••••${initialWhatsApp.api_key_hint?.slice(-4) ?? ""}`
                                        : "Belum disetel"}
                                </p>
                            </div>
                        </div>
                    ) : (
                        <form
                            onSubmit={submitCredentials}
                            className="grid gap-5 border border-neutral-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800 md:grid-cols-2"
                        >
                            <InputField
                                label="Infobip Base URL"
                                name="base_url"
                                value={data.base_url}
                                onChange={(event) =>
                                    setData("base_url", event.target.value)
                                }
                                placeholder="https://55z3yd.api.infobip.com"
                                error={errors.base_url}
                                disabled={processing}
                            />

                            <InputField
                                label="From Number (Sender ID / Sandbox Number)"
                                name="from_number"
                                value={data.from_number}
                                onChange={(event) =>
                                    setData("from_number", event.target.value)
                                }
                                placeholder="447860088970"
                                error={errors.from_number}
                                disabled={processing}
                            />

                            <InputField
                                label="Sandbox Keyword"
                                name="sandbox_keyword"
                                value={data.sandbox_keyword}
                                onChange={(event) =>
                                    setData("sandbox_keyword", event.target.value)
                                }
                                placeholder="ARKADANISAYSSTUFF"
                                error={errors.sandbox_keyword}
                                disabled={processing}
                            />

                            <div>
                                <label
                                    className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200"
                                    htmlFor="whatsapp_api_key"
                                >
                                    Infobip API Key (Terenkripsi di Database)
                                </label>
                                <div className="relative">
                                    <KeyRound className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400" />
                                    <input
                                        id="whatsapp_api_key"
                                        name="api_key"
                                        type={showKey ? "text" : "password"}
                                        value={data.api_key}
                                        onChange={(event) =>
                                            setData("api_key", event.target.value)
                                        }
                                        placeholder={
                                            initialWhatsApp.has_api_key
                                                ? `••••${initialWhatsApp.api_key_hint?.slice(-4) ?? ""}`
                                                : "Masukkan Infobip API key"
                                        }
                                        className="w-full border border-gray-300 bg-white py-2 pl-9 pr-10 text-sm text-slate-900 outline-none focus:border-emerald-700 focus:ring-1 focus:ring-emerald-700 dark:border-slate-600 dark:bg-slate-900 dark:text-white"
                                        disabled={processing}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowKey(!showKey)}
                                        className="absolute right-3 top-2 text-neutral-500 hover:text-slate-900 dark:hover:text-white"
                                        aria-label="Tampilkan atau sembunyikan API key"
                                    >
                                        {showKey ? (
                                            <EyeOff size={17} />
                                        ) : (
                                            <Eye size={17} />
                                        )}
                                    </button>
                                </div>
                                {initialWhatsApp.has_api_key && (
                                    <p className="mt-1 text-xs text-neutral-500">
                                        API key terenkripsi sudah tersimpan di database. Biarkan kosong jika tidak ingin mengubahnya.
                                    </p>
                                )}
                                {errors.api_key && (
                                    <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                                        {errors.api_key}
                                    </p>
                                )}
                            </div>

                            <div className="md:col-span-2 flex flex-col gap-3 sm:flex-row sm:justify-end">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={() => setIsEditing(false)}
                                    disabled={processing}
                                >
                                    Keluar edit mode
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={processing}
                                    isLoading={processing}
                                >
                                    Simpan konfigurasi WhatsApp
                                </Button>
                            </div>
                        </form>
                    )}

                    {/* Uji Coba Pengiriman Langsung */}
                    <div className="mt-6 border-t border-neutral-200 pt-5 dark:border-slate-700">
                        <div className="flex items-center gap-2 mb-3">
                            <Send size={16} className="text-emerald-600 dark:text-emerald-400" />
                            <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                                Uji Coba Gateway Infobip WhatsApp
                            </h4>
                        </div>
                        <p className="text-xs text-neutral-500 mb-4">
                            Kirim pesan uji coba langsung ke nomor WhatsApp Anda untuk memvalidasi kredensial Infobip yang tersimpan di DB.
                        </p>

                        <form onSubmit={handleTestNotification} className="flex flex-col sm:flex-row items-start sm:items-center gap-3 max-w-xl">
                            <div className="flex-1 w-full">
                                <input
                                    type="text"
                                    value={testPhone}
                                    onChange={(e) => setTestPhone(e.target.value)}
                                    placeholder="Contoh: 081234567890 atau 6281234567890"
                                    className="w-full border border-gray-300 bg-white py-2 px-3 text-sm text-slate-900 outline-none focus:border-emerald-700 focus:ring-1 focus:ring-emerald-700 dark:border-slate-600 dark:bg-slate-900 dark:text-white"
                                    disabled={isTesting}
                                />
                            </div>
                            <Button
                                type="submit"
                                variant="secondary"
                                disabled={isTesting || !testPhone.trim()}
                                isLoading={isTesting}
                            >
                                Kirim Uji Coba
                            </Button>
                        </form>

                        {testResult && (
                            <div className={`mt-3 p-3 text-xs flex items-start gap-2.5 ${
                                testResult.success
                                    ? "bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-800"
                                    : "bg-red-50 text-red-800 border border-red-200 dark:bg-red-950/30 dark:text-red-300 dark:border-red-800"
                            }`}>
                                {testResult.success ? (
                                    <CheckCircle2 size={16} className="shrink-0 text-emerald-600 mt-0.5" />
                                ) : (
                                    <ShieldAlert size={16} className="shrink-0 text-red-600 mt-0.5" />
                                )}
                                <div>
                                    <p className="font-semibold">{testResult.success ? "Berhasil!" : "Gagal Mengirim"}</p>
                                    <p className="mt-0.5 leading-relaxed">{testResult.message || testResult.error}</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </Card>

            {/* Modal Konfirmasi Password */}
            <Modal
                open={showPasswordModal}
                onClose={() =>
                    !isVerifyingPassword && setShowPasswordModal(false)
                }
                title="Verifikasi password akun admin"
                footer={
                    <>
                        <Button
                            variant="ghost"
                            onClick={() => setShowPasswordModal(false)}
                            disabled={isVerifyingPassword}
                        >
                            Batal
                        </Button>
                        <Button
                            onClick={verifyPassword}
                            isLoading={isVerifyingPassword}
                            disabled={!data.current_password}
                        >
                            Buka edit mode
                        </Button>
                    </>
                }
            >
                <InputField
                    label="Password akun admin"
                    name="current_password"
                    type="password"
                    value={data.current_password}
                    onChange={(event) =>
                        setData("current_password", event.target.value)
                    }
                    placeholder="Masukkan password akun admin yang sedang login"
                    error={passwordError ?? errors.current_password}
                    autoComplete="current-password"
                    disabled={isVerifyingPassword}
                />
                <p className="mt-3 text-xs text-neutral-500">
                    Verifikasi keamanan diperlukan sebelum mengubah kredensial gateway WhatsApp di database.
                </p>
            </Modal>
        </section>
    )
}
