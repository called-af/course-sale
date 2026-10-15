import { Head, usePage } from "@inertiajs/react"
import BreadCrumb from "@/components/atoms/BreadCrumb"
import Title from "@/components/atoms/Title"
import UserLayout from "@/components/templates/UserLayout"
import WhatsAppSettingsPanel, {
    type WhatsAppSettingsData,
} from "@/components/organisms/instructor/WhatsAppSettingsPanel"

export default function InstructorGeneralSettings() {
    const { props } = usePage<{
        settings: WhatsAppSettingsData
        auth: {
            user: {
                id: number
                name: string
                email: string
                role: string
                avatar_url?: string | null
            }
        }
        flash?: { success?: string; error?: string }
    }>()

    return (
        <>
            <Head title="Pengaturan Umum Instruktur" />

            <div className="space-y-6">

                <div>
                    <Title as="h3">Pengaturan Instruktur</Title>
                    <p className="mt-1 text-sm text-neutral-500">
                        Kelola konfigurasi sistem, integrasi WhatsApp Business, dan preferensi akun Anda.
                    </p>
                </div>

                <WhatsAppSettingsPanel
                    settings={props.settings}
                    instructorName={props.auth?.user?.name}
                />
            </div>
        </>
    )
}

InstructorGeneralSettings.layout = (page: React.ReactNode) => (
    <UserLayout>{page}</UserLayout>
)
