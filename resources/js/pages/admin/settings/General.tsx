import { Head, usePage } from '@inertiajs/react';

import Title from '@/components/atoms/Title';
import AppearanceSettingsPanel from '@/components/organisms/admin/AppearanceSettingsPanel';
import BrandIdentityPanel from '@/components/organisms/admin/BrandIdentityPanel';
import LogoSettingsPanel from '@/components/organisms/admin/LogoSettingsPanel';
import PaymentSettingsPanel, { type PaymentSettingsData } from '@/components/organisms/admin/PaymentSettingsPanel';
import AdminLayout from '@/components/templates/AdminLayout';

export default function General() {
    const { props } = usePage<{
        payment: PaymentSettingsData;
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
            <Head title="General Settings" />
            <div className="mx-auto max-w-6xl space-y-8">
                <div>
                    <Title as="h3">General Settings</Title>
                    <p className="mt-1 text-sm text-neutral-500">
                        Manage app identity, logo, appearance, and payments. AI and WhatsApp integrations have their own pages.
                    </p>
                </div>

                <PaymentSettingsPanel initialPayment={props.payment} flash={props.flash} />

                <BrandIdentityPanel initialName={props.appearance.name} initialEmail={props.appearance.contact_email} />

                <LogoSettingsPanel initialLogoUrl={props.appearance.logo_url} hasCustomLogo={props.appearance.has_custom_logo} />

                <AppearanceSettingsPanel initialPalette={props.appearance.palette} />
            </div>
        </>
    );
}

General.layout = (page: React.ReactNode) => <AdminLayout>{page}</AdminLayout>;
