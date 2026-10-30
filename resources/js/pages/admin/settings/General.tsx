import { Head, usePage } from "@inertiajs/react"

import AiSettingsPanel, {
    type AiSettingsData,
} from "@/components/organisms/admin/AiSettingsPanel"
import AppearanceSettingsPanel from "@/components/organisms/admin/AppearanceSettingsPanel"
import RecommendationSettingsPanel from "@/components/organisms/admin/RecommendationSettingsPanel"
import WhatsAppSettingsPanel, {
    type WhatsAppSettingsData,
} from "@/components/organisms/admin/WhatsAppSettingsPanel"
import Title from "@/components/atoms/Title"
import AdminLayout from "@/components/templates/AdminLayout"

export default function General() {
    const { props } = usePage<{
        ai: AiSettingsData
        recommendation: { enabled: boolean }
        whatsapp: WhatsAppSettingsData
        appearance: {
            palette:
                | "purple"
                | "indigo"
                | "blue"
                | "teal"
                | "emerald"
                | "cyan"
                | "rose"
                | "pink"
                | "orange"
                | "amber"
        }
        flash?: { success?: string; error?: string }
    }>()

    return (
        <>
            <Head title="Pengaturan Umum" />
            <div className="mx-auto max-w-6xl space-y-8">
                <div>
                    <Title as="h3">Pengaturan Umum</Title>
                    <p className="mt-1 text-sm text-neutral-500">
                        Kelola konfigurasi sistem, AI, dan gateway WhatsApp Infobip.
                    </p>
                </div>

                <WhatsAppSettingsPanel
                    initialWhatsApp={props.whatsapp}
                    flash={props.flash}
                />

                <AiSettingsPanel
                    initialAi={props.ai}
                    flash={props.flash}
                />

                <RecommendationSettingsPanel
                    initialRecommendation={props.recommendation}
                />

                <AppearanceSettingsPanel initialPalette={props.appearance.palette} />
            </div>
        </>
    )
}

General.layout = (page: React.ReactNode) => (
    <AdminLayout>{page}</AdminLayout>
)
