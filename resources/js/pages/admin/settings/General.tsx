import { Head, usePage } from '@inertiajs/react';

import Title from '@/components/atoms/Title';
import AiSettingsPanel, { type AiSettingsData } from '@/components/organisms/admin/AiSettingsPanel';
import AppearanceSettingsPanel from '@/components/organisms/admin/AppearanceSettingsPanel';
import BrandIdentityPanel from '@/components/organisms/admin/BrandIdentityPanel';
import LogoSettingsPanel from '@/components/organisms/admin/LogoSettingsPanel';
import PaymentSettingsPanel, { type PaymentSettingsData } from '@/components/organisms/admin/PaymentSettingsPanel';
import RecommendationSettingsPanel from '@/components/organisms/admin/RecommendationSettingsPanel';
import WhatsAppSettingsPanel, { type WhatsAppSettingsData } from '@/components/organisms/admin/WhatsAppSettingsPanel';
import AdminLayout from '@/components/templates/AdminLayout';

export default function General() {
    const { props } = usePage<{
        ai: AiSettingsData;
        payment: PaymentSettingsData;
        recommendation: { enabled: boolean };
        whatsapp: WhatsAppSettingsData;
        appearance: {
            palette: 'purple' | 'indigo' | 'blue' | 'teal' | 'emerald' | 'cyan' | 'rose' | 'pink' | 'orange' | 'amber';
            name: string;
            contact_email: string;
            domain: string;
            logo_url: string;
            has_custom_logo: boolean;
        };
        flash?: { success?: string; error?: string };
    }>();

    return (
        <>
            <Head title="Pengaturan Umum" />
            <div className="mx-auto max-w-6xl space-y-8">
                <div>
                    <Title as="h3">Pengaturan Umum</Title>
                    <p className="mt-1 text-sm text-neutral-500">Kelola identitas aplikasi, logo, tampilan, AI, dan gateway WhatsApp.</p>
                </div>

                <WhatsAppSettingsPanel initialWhatsApp={props.whatsapp} flash={props.flash} />

                <AiSettingsPanel initialAi={props.ai} flash={props.flash} />

                <PaymentSettingsPanel initialPayment={props.payment} flash={props.flash} />

                <RecommendationSettingsPanel initialRecommendation={props.recommendation} />

                <BrandIdentityPanel initialName={props.appearance.name} initialEmail={props.appearance.contact_email} />

                <LogoSettingsPanel initialLogoUrl={props.appearance.logo_url} hasCustomLogo={props.appearance.has_custom_logo} />

                <AppearanceSettingsPanel initialPalette={props.appearance.palette} />
            </div>
        </>
    );
}

General.layout = (page: React.ReactNode) => <AdminLayout>{page}</AdminLayout>;
