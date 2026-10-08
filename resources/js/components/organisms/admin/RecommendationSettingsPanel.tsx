import { Head, router, usePage } from "@inertiajs/react"
import { Bot, Sparkles } from "lucide-react"
import { route } from "ziggy-js"

import Card from "@/components/atoms/Card"
import Toggle from "@/components/atoms/Toggle"
import Title from "@/components/atoms/Title"

interface RecommendationSettingsData {
    enabled: boolean
}

interface RecommendationSettingsPanelProps {
    initialRecommendation: RecommendationSettingsData
}

export default function RecommendationSettingsPanel({
    initialRecommendation,
}: RecommendationSettingsPanelProps) {
    const { props } = usePage<{
        flash?: { success?: string; error?: string }
    }>()

    const toggleRecommendation = (checked: boolean) => {
        router.patch(route("admin.settings.recommendation.toggle"), {
            enabled: checked,
        })
    }

    return (
        <section className="space-y-6">
            <Head title="Rekomendasi Python" />

            <Card className="overflow-hidden rounded-none">
                <div className="flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-start gap-4">
                        <span className="flex h-11 w-11 shrink-0 items-center justify-center bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-300">
                            <Bot size={21} />
                        </span>
                        <div>
                            <h2 className="font-semibold text-slate-900 dark:text-white">
                                Rekomendasi Python AI
                            </h2>
                            <p className="mt-1 text-sm text-neutral-500">
                                Aktifkan atau nonaktifkan layanan rekomendasi
                                dari microservice Python.
                            </p>
                        </div>
                    </div>

                    <Toggle
                        checked={initialRecommendation.enabled}
                        onCheckedChange={toggleRecommendation}
                        label="Aktifkan atau nonaktifkan rekomendasi Python AI"
                    />
                </div>

                <div className="border-t border-neutral-200 bg-neutral-50/70 p-6 dark:border-slate-700 dark:bg-slate-900/30">
                    <div className="flex items-start gap-4">
                        <Sparkles className="mt-0.5 h-5 w-5 text-blue-600 dark:text-blue-400" />
                        <div className="space-y-2">
                            <h3 className="font-semibold text-slate-900 dark:text-white">
                                Status layanan
                            </h3>
                            <p className="text-sm leading-6 text-neutral-500">
                                {initialRecommendation.enabled
                                    ? "Kayanan aktif. Sistem akan mengambil rekomendasi dari Python microservice."
                                    : "Layanan sedang dimatikan. Rekomendasi tidak akan ditampilkan."}
                            </p>
                            {props.flash?.success && (
                                <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                                    {props.flash.success}
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </Card>
        </section>
    )
}
