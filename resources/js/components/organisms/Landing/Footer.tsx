import { Link } from '@inertiajs/react';
import { Facebook, Instagram, Linkedin, Mail, MapPin, Phone, Twitter, Youtube, type LucideIcon } from 'lucide-react';

import AppLogo from '@/components/atoms/AppLogo';
import Button from '@/components/atoms/Button';
import { useBranding } from '@/hooks/useBranding';
import { useLanding } from '@/hooks/useLanding';

const socialIcons: Record<string, LucideIcon> = {
    linkedin: Linkedin,
    facebook: Facebook,
    youtube: Youtube,
    instagram: Instagram,
    twitter: Twitter,
    x: Twitter,
};

interface FooterProps {
    /** Render the call to action above the footer, as one continuous block. */
    withCta?: boolean;
}

function isExternal(href: string): boolean {
    return href.startsWith('http') || href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('#');
}

function FooterLink({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) {
    if (isExternal(href)) {
        return (
            <a href={href} className={className}>
                {children}
            </a>
        );
    }

    return (
        <Link href={href} className={className}>
            {children}
        </Link>
    );
}

export default function Footer({ withCta = false }: FooterProps) {
    const { name, contactEmail } = useBranding();
    const { footer } = useLanding();

    const email = footer.email || contactEmail;
    const phoneHref = `tel:${footer.phone.replace(/[^\d+]/g, '')}`;

    return (
        <footer className="relative bg-[#141416] text-white dark:bg-[#0F0F11]">
            {/* Soft glow behind the CTA */}
            {withCta && (
                <div
                    aria-hidden
                    className="pointer-events-none absolute inset-x-0 top-0 h-[520px] bg-[radial-gradient(60%_100%_at_50%_0%,color-mix(in_srgb,var(--color-purple-500)_12%,transparent),transparent_70%)]"
                />
            )}

            <div className="relative mx-auto max-w-7xl">
                {withCta && <CtaBlock />}

                {/* Main */}
                <div className="px-6 pt-14 sm:px-10 lg:px-14">
                    <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8">
                        {/* Brand */}
                        <div className="flex flex-col gap-5 sm:col-span-2 lg:col-span-1">
                            <Link href="/" className="flex items-center gap-2.5">
                                <AppLogo className="h-9 w-9" />
                                <span className="text-2xl font-semibold tracking-tight text-white">{name}</span>
                            </Link>

                            <div className="flex flex-col gap-3 text-[13px] leading-relaxed text-white/45">
                                {footer.address && (
                                    <p className="flex items-start gap-2.5">
                                        <MapPin size={14} className="mt-0.5 shrink-0 text-white/30" />
                                        <span>{footer.address}</span>
                                    </p>
                                )}

                                <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
                                    {footer.phone && (
                                        <a href={phoneHref} className="inline-flex items-center gap-2 transition-colors hover:text-white/80">
                                            <Phone size={13} className="text-white/30" />
                                            {footer.phone}
                                        </a>
                                    )}
                                    {email && (
                                        <a href={`mailto:${email}`} className="inline-flex items-center gap-2 transition-colors hover:text-white/80">
                                            <Mail size={13} className="text-white/30" />
                                            {email}
                                        </a>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Link groups */}
                        {footer.columns.map((column) => (
                            <div key={column.title} className="flex flex-col gap-4">
                                <span className="text-[15px] font-semibold text-white">{column.title}</span>
                                <ul className="flex flex-col gap-3.5">
                                    {column.links.map((item) => (
                                        <li key={`${column.title}-${item.label}-${item.href}`}>
                                            <FooterLink href={item.href} className="text-[13px] text-white/45 transition-colors hover:text-white">
                                                {item.label}
                                            </FooterLink>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>

                    {/* Social + legal */}
                    <div className="mt-14 flex flex-col-reverse items-center justify-between gap-6 pb-10 sm:flex-row">
                        <div className="flex items-center gap-5">
                            {footer.socials.map(({ name: socialName, href }) => {
                                const Icon = socialIcons[socialName.toLowerCase()] ?? Linkedin;

                                return (
                                    <a
                                        key={`${socialName}-${href}`}
                                        href={href}
                                        aria-label={socialName}
                                        className="text-white/40 transition-colors hover:text-white"
                                    >
                                        <Icon size={16} />
                                    </a>
                                );
                            })}
                        </div>

                        <div className="flex items-center gap-6 text-[13px] text-white/40">
                            {footer.legal.map((item) => (
                                <FooterLink key={`${item.label}-${item.href}`} href={item.href} className="transition-colors hover:text-white">
                                    {item.label}
                                </FooterLink>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Copyright */}
                <p className="py-6 text-center text-[13px] text-white/35">
                    © {new Date().getFullYear()} {name}. All rights reserved.
                </p>

                {/* Oversized wordmark */}
                <div aria-hidden className="relative h-[140px] overflow-hidden border-t border-white/[0.06] select-none sm:h-[230px]">
                    <span className="absolute inset-x-0 bottom-0 -mb-[0.16em] block bg-gradient-to-b from-white/[0.08] to-white/0 bg-clip-text text-center text-[clamp(3.5rem,15vw,12rem)] leading-[0.78] font-black tracking-[-0.05em] whitespace-nowrap text-transparent">
                        {name.toUpperCase()}
                    </span>
                </div>
            </div>
        </footer>
    );
}

function CtaBlock() {
    const { cta } = useLanding();

    return (
        <section className="relative">
            <div className="px-6 pt-10 pb-16 text-center sm:pt-12 sm:pb-20">
                <h2 className="mx-auto max-w-3xl text-[clamp(2.1rem,4.6vw,3.4rem)] leading-[1.1] font-semibold tracking-[-0.02em] text-white">
                    {cta.title_line_1}
                    <br className="hidden sm:block" /> {cta.title_line_2}{' '}
                    <span className="bg-gradient-to-r from-purple-400 via-purple-300 to-purple-500 bg-clip-text text-transparent">
                        {cta.title_highlight}
                    </span>
                </h2>

                <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
                    <FooterLink href={cta.primary_href}>
                        <Button variant="primary" className="min-w-[150px] bg-[#141416] px-8 py-3 text-base hover:bg-gray-700 focus:ring-gray-500">
                            {cta.primary_label}
                        </Button>
                    </FooterLink>

                    <FooterLink href={cta.secondary_href}>
                        <Button
                            variant="outline"
                            className="min-w-[150px] !border-neutral-200/80 !bg-white/80 px-6 py-3 text-base !text-neutral-700 hover:!border-neutral-300 hover:!bg-neutral-50 hover:!text-neutral-900"
                        >
                            {cta.secondary_label}
                        </Button>
                    </FooterLink>
                </div>
            </div>
        </section>
    );
}
