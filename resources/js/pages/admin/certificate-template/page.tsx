import { Head } from '@inertiajs/react';
import type React from 'react';

import type { RawTemplate } from '@/components/organisms/admin/certificate-designer-utils';
import CertificateDesigner from '@/components/organisms/admin/CertificateDesigner';
import DesignerLayout from '@/components/templates/DesignerLayout';

interface PageProps {
    template: RawTemplate;
}

export default function CertificateTemplateDesignerPage({ template }: PageProps) {
    return (
        <>
            <Head title="Certificate Design" />
            <CertificateDesigner initialTemplate={template} />
        </>
    );
}

CertificateTemplateDesignerPage.layout = (page: React.ReactNode) => <DesignerLayout>{page}</DesignerLayout>;
