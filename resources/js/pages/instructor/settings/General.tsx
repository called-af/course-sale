import { Head, usePage } from '@inertiajs/react';
import Title from '@/components/atoms/Title';
import PayoutSettingsPanel, { type PayoutSettingsData } from '@/components/organisms/instructor/PayoutSettingsPanel';
import WhatsAppSettingsPanel, { type WhatsAppSettingsData } from '@/components/organisms/instructor/WhatsAppSettingsPanel';
import UserLayout from '@/components/templates/UserLayout';

export default function InstructorGeneralSettings() {
    const { props } = usePage<{
        settings: WhatsAppSettingsData;
        payout?: PayoutSettingsData;
        payment?: { gateway: string; mode: string };
        auth: {
            user: {
                id: number;
                name: string;
                email: string;
                role: string;
                avatar_url?: string | null;
            };
        };
        flash?: { success?: string; error?: string };
    }>();

    return (
        <>
            <Head title="Pengaturan Umum Instruktur" />

            <div className="space-y-6">
                <div>
                    <Title as="h3">Pengaturan Instruktur</Title>
                    <p className="mt-1 text-sm text-neutral-500">Kelola rekening payout, integrasi WhatsApp Business, dan preferensi akun Anda.</p>
                </div>

                <PayoutSettingsPanel
                    payout={props.payout ?? { bank_name: '', account_number: '', account_name: '' }}
                    payment={props.payment}
                    platform_fee_percent={props.payout?.platform_fee_percent}
                />

                <WhatsAppSettingsPanel settings={props.settings} instructorName={props.auth?.user?.name} />
            </div>
        </>
    );
}

InstructorGeneralSettings.layout = (page: React.ReactNode) => <UserLayout>{page}</UserLayout>;
