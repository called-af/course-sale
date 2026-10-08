import { Head, router, useForm } from "@inertiajs/react"
import { Eye, EyeOff, KeyRound, Sparkles } from "lucide-react"
import { useEffect, useState } from "react"
import { route } from "ziggy-js"

import Button from "@/components/atoms/Button"
import Card from "@/components/atoms/Card"
import Toggle from "@/components/atoms/Toggle"
import Title from "@/components/atoms/Title"
import Modal from "@/components/atoms/Modal"
import InputField from "@/components/molecules/InputField"
import { apiFetch } from "@/lib/csrf"

export interface AiSettingsData {
    enabled: boolean
    base_url: string | null
    model: string | null
    has_api_key: boolean
    api_key_hint: string | null
    is_configured: boolean
}

interface AiSettingsPanelProps {
    initialAi: AiSettingsData
    flash?: { success?: string; error?: string }
}

export default function AiSettingsPanel({
    initialAi,
    flash,
}: AiSettingsPanelProps) {
    const [showKey, setShowKey] = useState(false)
    const [isEditing, setIsEditing] = useState(false)
    const [showPasswordModal, setShowPasswordModal] = useState(false)
    const [isVerifyingPassword, setIsVerifyingPassword] = useState(false)
    const [passwordError, setPasswordError] = useState<string | null>(null)

    const { data, setData, processing, errors, reset } = useForm({
        enabled: initialAi.enabled,
        base_url: initialAi.base_url ?? "",
        model: initialAi.model ?? "",
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
        router.patch(route("admin.settings.ai.toggle"), { enabled: checked })
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
        router.put(route("admin.settings.ai.update"), data)
    }

    const baseUrlChanged =
        data.base_url !== (initialAi.base_url ?? "")

    return (
        <section className="space-y-6">
            <Head title="Pengaturan AI" />

            <Card className="overflow-hidden rounded-none">
                <div className="flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-start gap-4">
                        <span className="flex h-11 w-11 shrink-0 items-center justify-center bg-purple-100 text-purple-600 dark:bg-purple-500/20 dark:text-purple-300">
                            <Sparkles size={21} />
                        </span>
                        <div>
                            <h2 className="font-semibold text-slate-900 dark:text-white">
                                Fitur AI
                            </h2>
                            <p className="mt-1 text-sm text-neutral-500">
                               Aktifkan integrasi AI pada sistem.
                            </p>
                        </div>
                    </div>

                    <Toggle
                        checked={data.enabled}
                        onCheckedChange={updateEnabled}
                        disabled={processing}
                        label="Aktifkan atau nonaktifkan fitur AI"
                    />
                </div>

                <div className="border-t border-neutral-200 bg-neutral-50/70 p-6 dark:border-slate-700 dark:bg-slate-900/30">
                    <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h3 className="font-semibold text-slate-900 dark:text-white">
                                Konfigurasi AI
                            </h3>
                            <p className="mt-1 text-sm text-neutral-500">
                                Base URL, model, dan API key untuk koneksi AI.
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
                        <div className="grid gap-4 md:grid-cols-3">
                            <div className="border border-neutral-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
                                <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">
                                    Base URL
                                </p>
                                <p className="mt-2 break-all text-sm font-medium text-slate-900 dark:text-white">
                                    {data.base_url || "Belum dikonfigurasi"}
                                </p>
                            </div>
                            <div className="border border-neutral-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
                                <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">
                                    Model
                                </p>
                                <p className="mt-2 text-sm font-medium text-slate-900 dark:text-white">
                                    {data.model || "Belum dikonfigurasi"}
                                </p>
                            </div>
                            <div className="border border-neutral-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
                                <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">
                                    API Key
                                </p>
                                <p className="mt-2 text-sm font-medium text-slate-900 dark:text-white">
                                    {initialAi.has_api_key
                                        ? `••••••••${initialAi.api_key_hint?.slice(-4) ?? ""}`
                                        : "Tidak tersedia"}
                                </p>
                            </div>
                        </div>
                    ) : (
                        <form
                            onSubmit={submitCredentials}
                            className="grid gap-5 border border-neutral-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800 md:grid-cols-2"
                        >
                            <InputField
                                label="Base URL"
                                name="base_url"
                                value={data.base_url}
                                onChange={(event) =>
                                    setData("base_url", event.target.value)
                                }
                                placeholder="https://api.example.com/v1"
                                error={errors.base_url}
                                disabled={processing}
                            />
                            {baseUrlChanged && (
                                <p className="-mt-3 text-xs font-medium text-amber-600 dark:text-amber-400 md:col-span-2">
                                    Base URL berubah. API key wajib diisi ulang
                                    untuk keamanan.
                                </p>
                            )}

                            <InputField
                                label="Nama model"
                                name="model"
                                value={data.model}
                                onChange={(event) =>
                                    setData("model", event.target.value)
                                }
                                placeholder="model-name"
                                error={errors.model}
                                disabled={processing}
                            />

                            <div>
                                <label
                                    className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200"
                                    htmlFor="api_key"
                                >
                                    API Key
                                </label>
                                <div className="relative">
                                    <KeyRound className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400" />
                                    <input
                                        id="api_key"
                                        name="api_key"
                                        type={showKey ? "text" : "password"}
                                        value={data.api_key}
                                        onChange={(event) =>
                                            setData("api_key", event.target.value)
                                        }
                                        placeholder={
                                            initialAi.has_api_key
                                                ? `••••${initialAi.api_key_hint?.slice(-4) ?? ""}`
                                                : "Masukkan API key"
                                        }
                                        className="w-full border border-gray-300 bg-white py-2 pl-9 pr-10 text-sm text-slate-900 outline-none focus:border-purple-700 focus:ring-1 focus:ring-purple-700 dark:border-slate-600 dark:bg-slate-900 dark:text-white"
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
                                {initialAi.has_api_key && (
                                    <p className="mt-1 text-xs text-neutral-500">
                                        API key lama tersedia. Biarkan kosong
                                        untuk mempertahankannya.
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
                                    Simpan konfigurasi
                                </Button>
                            </div>
                        </form>
                    )}
                </div>
            </Card>

            <Modal
                open={showPasswordModal}
                onClose={() =>
                    !isVerifyingPassword && setShowPasswordModal(false)
                }
                title="Verifikasi password akun"
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
                    label="Password akun"
                    name="current_password"
                    type="password"
                    value={data.current_password}
                    onChange={(event) =>
                        setData("current_password", event.target.value)
                    }
                    placeholder="Masukkan password akun yang sedang login"
                    error={passwordError ?? errors.current_password}
                    autoComplete="current-password"
                    disabled={isVerifyingPassword}
                />
                <p className="mt-3 text-xs text-neutral-500">
                    Password hanya digunakan untuk memverifikasi akses sebelum
                    fitur edit dibuka.
                </p>
            </Modal>
        </section>
    )
}
