import type { CourseResource } from '@/types/course-resource';
import type { Module } from '@/types/modules';

export interface CertificateTemplateElementData {
    x?: number;
    y?: number;
    fontSize?: number;
    color?: string;
    align?: 'left' | 'center' | 'right';
    visible?: boolean;
    text?: string;
    label?: string;
    prefix?: string;
}

export interface CertificateTemplateData {
    mode?: 'default' | 'custom';
    background_path?: string | null;
    background_url?: string | null;
    primary_color?: string;
    accent_color?: string;
    bg_style?: 'dark' | 'light' | 'gradient';
    show_signature?: boolean;
    signature_name?: string;
    signature_image?: string | null;
    signature_image_url?: string | null;
    custom_title?: string;
    footer_note?: string;
    elements?: Record<string, CertificateTemplateElementData>;
}

export interface Course {
    id: number;
    slug: string;
    title: string;
    description: string | null;
    thumbnail_url: string;
    level: string | null;
    type: string;
    status: string;
    price?: number | null;

    creator_id?: number;
    creator?: {
        id?: number;
        name: string;
    };

    modules: Module[];

    categories: {
        id: number;
        name: string;
    }[];

    tags?: {
        id: number;
        name: string;
        slug?: string;
    }[];

    resources?: CourseResource[];

    certificate_template?: CertificateTemplateData | null;
}
