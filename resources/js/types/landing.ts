export interface HeroSettings {
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

export interface AboutSettings {
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

export interface CoursesSettings {
    badge: string;
    title_lead: string;
    title_highlight: string;
    description: string;
    limit: number;
    cta_label: string;
    cta_href: string;
}

export interface CareerSettings {
    badge: string;
    title_lead: string;
    title_highlight: string;
    description: string;
    cta_label: string;
    cta_href: string;
}

export interface TestimonialSettings {
    badge: string;
    title_lead: string;
    title_highlight: string;
    description: string;
    limit: number;
    min_rating: number;
}

export interface CtaSettings {
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

export interface FooterSettings {
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
    testimonial: TestimonialSettings;
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

/** Replaces {brand} placeholders with the current app name. */
export function withBrand(value: string, brand: string): string {
    return value.replaceAll('{brand}', brand);
}
