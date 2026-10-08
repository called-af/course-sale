import { Head, usePage } from "@inertiajs/react"

import AiSettingsPanel, {
    type AiSettingsData,
} from "@/components/organisms/admin/AiSettingsPanel"
import RecommendationSettingsPanel from "@/components/organisms/admin/RecommendationSettingsPanel"
import Title from "@/components/atoms/Title"
import AdminLayout from "@/components/templates/AdminLayout"

export default function General() {
    const { props } = usePage<{
        ai: AiSettingsData
        recommendation: { enabled: boolean }
        flash?: { success?: string; error?: string }
    }>()

    return (
        <>
            <Head title="Pengaturan Umum" />
            <div className="mx-auto max-w-6xl space-y-8">
                <div>
                    <Title as="h3">Pengaturan Umum</Title>
                    <p className="mt-1 text-sm text-neutral-500">
                        Kelola konfigurasi sistem dan layanan AI.
                    </p>
                </div>

                <AiSettingsPanel
                    initialAi={props.ai}
                    flash={props.flash}
                />

                <RecommendationSettingsPanel
                    initialRecommendation={props.recommendation}
                />
            </div>
        </>
    )
}

General.layout = (page: React.ReactNode) => (
    <AdminLayout>{page}</AdminLayout>
)
