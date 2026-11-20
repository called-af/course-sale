import type { Category } from '@/types/category';
import type { CertificateTemplateData, Course } from '@/types/course';

export interface LandingSectionSettings {
    show: boolean;
}

export interface HeroSettings extends LandingSectionSettings {
    badge: string;
    title_lead: string;
    title_highlight: string;
    subtitle: string;
    primary_label: string;
    primary_href: string;
    secondary_label: string;
    secondary_href: string;
    rating: string;
    learners_label: string;
    learners_suffix: string;
    avatars: string[];
    photos: string[];
}

export interface AboutStat {
    value: string;
    label: string;
}

export interface AboutSettings extends LandingSectionSettings {
    title_lead: string;
    title_highlight: string;
    title_tail: string;
    paragraph_1: string;
    paragraph_2: string;
    highlights: string[];
    stats: AboutStat[];
    eyebrow: string;
    since_label: string;
    cta_label: string;
    cta_href: string;
}

export interface CoursesSettings extends LandingSectionSettings {
    badge: string;
    title_lead: string;
    title_highlight: string;
    description: string;
    limit: number;
    cta_label: string;
    cta_href: string;
}

export interface CareerSettings extends LandingSectionSettings {
    badge: string;
    title_lead: string;
    title_highlight: string;
    description: string;
    cta_label: string;
    cta_href: string;
}

export interface InstructorSettings extends LandingSectionSettings {
    badge: string;
    title_lead: string;
    title_highlight: string;
    description: string;
    cta_label: string;
    cta_href: string;
    mode: 'selected' | 'all';
    selected_ids: number[];
    sort: 'selected' | 'courses' | 'students' | 'name';
    limit: number;
    default_role: string;
}

export interface HowItWorksStep {
    title: string;
    description: string;
    icon: string;
}

export interface HowItWorksSettings extends LandingSectionSettings {
    badge: string;
    title_lead: string;
    title_highlight: string;
    description: string;
    note: string;
    steps: HowItWorksStep[];
}

export interface BenefitItem {
    title: string;
    description: string;
    icon: string;
}

export interface BenefitSettings extends LandingSectionSettings {
    badge: string;
    title_lead: string;
    title_highlight: string;
    description: string;
    audiences: string[];
    benefits: BenefitItem[];
}

export interface CertificateSettings extends LandingSectionSettings {
    badge: string;
    title_lead: string;
    title_highlight: string;
    description: string;
    points: string[];
    cta_label: string;
    cta_href: string;
    mode: 'latest' | 'featured';
    featured_ids: number[];
    limit: number;
    rotate: boolean;
    rotate_seconds: number;
    show_sample_when_empty: boolean;
}

export interface TestimonialSettings extends LandingSectionSettings {
    badge: string;
    title_lead: string;
    title_highlight: string;
    description: string;
    limit: number;
    min_rating: number;
}

export interface FaqEntry {
    question: string;
    answer: string;
}

export interface FaqSettings extends LandingSectionSettings {
    badge: string;
    title_lead: string;
    title_highlight: string;
    description: string;
    items: FaqEntry[];
}

export interface TrustSettings extends LandingSectionSettings {
    payment_methods: string[];
    payment_logos: Record<string, string>;
    guarantees: string[];
}

export interface CtaSettings extends LandingSectionSettings {
    title_line_1: string;
    title_line_2: string;
    title_highlight: string;
    primary_label: string;
    primary_href: string;
    secondary_label: string;
    secondary_href: string;
}

export interface FooterLink {
    label: string;
    href: string;
}

export interface FooterColumn {
    title: string;
    links: FooterLink[];
}

export interface FooterSocial {
    name: string;
    href: string;
}

export interface FooterSettings extends LandingSectionSettings {
    address: string;
    phone: string;
    email: string;
    columns: FooterColumn[];
    socials: FooterSocial[];
    legal: FooterLink[];
}

export interface LandingSettings {
    hero: HeroSettings;
    about: AboutSettings;
    courses: CoursesSettings;
    career: CareerSettings;
    instructor: InstructorSettings;
    how_it_works: HowItWorksSettings;
    benefit: BenefitSettings;
    certificate: CertificateSettings;
    testimonial: TestimonialSettings;
    faq: FaqSettings;
    trust: TrustSettings;
    cta: CtaSettings;
    footer: FooterSettings;
}

export interface TestimonialItem {
    id: number;
    name: string;
    role: string;
    avatar: string;
    comment: string;
    rating: number;
}

/** Real instructor data derived from users and their published courses. */
export interface LandingInstructor {
    id: number;
    slug: string;
    name: string;
    role: string;
    bio: string;
    avatar_url: string | null;
    expertise: string[];
    courses: number;
    students: number;
    students_label: string;
}

/** A real issued certificate safe to showcase publicly. */
export interface LandingCertificate {
    id: number;
    certificate_number: string;
    student_name: string;
    course_title: string;
    instructor_name: string;
    issued_at: string;
    verify_url: string;
    /** Resolved designer/PDF payload for this exact certificate. */
    template: CertificateTemplateData;
}

export interface LandingPageProps {
    courses: Course[];
    categories: Category[];
    testimonials: TestimonialItem[];
    instructors: LandingInstructor[];
    certificates: LandingCertificate[];
    certificateTemplate: CertificateTemplateData;
}

export interface InstructorOption {
    id: number;
    name: string;
    headline: string | null;
    avatar_url: string | null;
    courses_count: number;
}

export interface CertificateOption {
    id: number;
    certificate_number: string;
    student_name: string;
    course_title: string;
    issued_at: string;
}

/** Replaces {brand} placeholders with the current app name. */
export function withBrand(value: string, brand: string): string {
    return value.replaceAll('{brand}', brand);
}
