import { Link } from '@inertiajs/react';
import { Facebook, Linkedin, Mail, MapPin, Phone, Sparkles, Youtube } from 'lucide-react';

import AppLogo from '@/components/atoms/AppLogo';
import { useBranding } from '@/hooks/useBranding';

const links = {
    Product: [
        { name: 'Courses', href: '/course' },
        { name: 'Pricing', href: '/#pricing' },
        { name: 'FAQ', href: '/faq' },
        { name: 'Use Cases', href: '/course' },
    ],
    Resources: [
        { name: 'Support', href: '/contact' },
        { name: 'Contact Us', href: '/contact' },
        { name: 'Blog', href: '/blog' },
    ],
    Features: [
        { name: 'AI Recommendations', href: '/course' },
        { name: 'Certification', href: '/certificates' },
        { name: 'Interactive Quiz', href: '/course' },
        { name: 'Community', href: '/about' },
    ],
    Company: [
        { name: 'About Us', href: '/about' },
        { name: 'Blog', href: '/blog' },
        { name: 'Careers', href: '/careers' },
    ],
};

const socials = [
    { name: 'LinkedIn', href: '#', icon: Linkedin },
    { name: 'Facebook', href: '#', icon: Facebook },
    { name: 'YouTube', href: '#', icon: Youtube },
];

interface FooterProps {
    /** Render the call to action above the footer, as one continuous block. */
    withCta?: boolean;
}

export default function Footer({ withCta = false }: FooterProps) {
    const { name, contactEmail } = useBranding();

    return (
        <footer className="relative bg-[#141416] text-white">
            {/* Soft glow behind the CTA */}
            {withCta && (
                <div
                    aria-hidden
                    className="pointer-events-none absolute inset-x-0 top-0 h-[520px] bg-[radial-gradient(60%_100%_at_50%_0%,color-mix(in_srgb,var(--color-purple-500)_12%,transparent),transparent_70%)]"
                />
            )}

            <div className="relative mx-auto max-w-7xl border-x border-white/[0.06]">
                {withCta && <CtaBlock />}

                {/* Main */}
                <div className="px-6 pt-14 sm:px-10 lg:px-14">
                    <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-[1.75fr_0.6fr_repeat(4,minmax(0,1fr))] lg:gap-8">
                        {/* Brand */}
                        <div className="flex flex-col gap-5 sm:col-span-2 lg:col-span-1">
                            <Link href="/" className="flex items-center gap-2.5">
                                <AppLogo className="h-9 w-9" />
                                <span className="text-2xl font-semibold tracking-tight text-white">{name}</span>
                            </Link>

                            <div className="flex flex-col gap-3 text-[13px] leading-relaxed text-white/45">
                                <p className="flex items-start gap-2.5">
                                    <MapPin size={14} className="mt-0.5 shrink-0 text-white/30" />
                                    <span>Jl. Jend. Sudirman Kav. 52, Jakarta 12190, Indonesia</span>
                                </p>

                                <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
                                    <a href="tel:+622150505050" className="inline-flex items-center gap-2 transition-colors hover:text-white/80">
                                        <Phone size={13} className="text-white/30" />
                                        +62 21 5050 5050
                                    </a>
                                    <a
                                        href={`mailto:${contactEmail}`}
                                        className="inline-flex items-center gap-2 transition-colors hover:text-white/80"
                                    >
                                        <Mail size={13} className="text-white/30" />
                                        {contactEmail}
                                    </a>
                                </div>
                            </div>
                        </div>

                        {/* Spacer so the link columns breathe */}
                        <div aria-hidden className="hidden lg:block" />

                        {/* Link groups */}
                        {Object.entries(links).map(([group, items]) => (
                            <div key={group} className="flex flex-col gap-4">
                                <span className="text-[15px] font-semibold text-white">{group}</span>
                                <ul className="flex flex-col gap-3.5">
                                    {items.map((item) => (
                                        <li key={item.name}>
                                            <Link href={item.href} className="text-[13px] text-white/45 transition-colors hover:text-white">
                                                {item.name}
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>

                    {/* Social + legal */}
                    <div className="mt-14 flex flex-col-reverse items-center justify-between gap-6 pb-10 sm:flex-row">
                        <div className="flex items-center gap-5">
                            {socials.map(({ name, href, icon: Icon }) => (
                                <a key={name} href={href} aria-label={name} className="text-white/40 transition-colors hover:text-white">
                                    <Icon size={16} />
                                </a>
                            ))}
                        </div>

                        <div className="flex items-center gap-6 text-[13px] text-white/40">
                            <Link href="/terms" className="transition-colors hover:text-white">
                                Terms of Service
                            </Link>
                            <Link href="/privacy" className="transition-colors hover:text-white">
                                Privacy Policy
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Copyright */}
                <div className="border-t border-white/[0.06]">
                    <p className="py-6 text-center text-[13px] text-white/35">
                        © {new Date().getFullYear()} {name}. All rights reserved.
                    </p>
                </div>

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
    return (
        <section className="relative">
            {/* Divider with badge */}
            <div className="flex items-center gap-4 px-6">
                <span className="h-px flex-1 bg-white/[0.06]" />
                <span className="inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-[#141416] px-3.5 py-1.5 text-[11px] font-medium text-white/55">
                    <Sparkles size={12} className="text-purple-400" />
                    Unlock Your Potential
                </span>
                <span className="h-px flex-1 bg-white/[0.06]" />
            </div>

            <div className="px-6 pt-10 pb-16 text-center sm:pt-12 sm:pb-20">
                <h2 className="mx-auto max-w-3xl text-[clamp(2.1rem,4.6vw,3.4rem)] leading-[1.1] font-semibold tracking-[-0.02em] text-white">
                    Ready to Turn Complexity
                    <br className="hidden sm:block" /> into{' '}
                    <span className="bg-gradient-to-r from-purple-400 via-purple-300 to-purple-500 bg-clip-text text-transparent">Clarity?</span>
                </h2>

                <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
                    <Link
                        href="/register"
                        className="inline-flex h-11 min-w-[150px] items-center justify-center rounded-lg bg-white px-7 text-[13px] font-semibold text-neutral-900 shadow-[0_1px_0_rgba(255,255,255,0.4)_inset,0_8px_24px_-12px_rgba(255,255,255,0.35)] transition-colors hover:bg-white/90"
                    >
                        Start Now
                    </Link>

                    <Link
                        href="/contact"
                        className="inline-flex h-11 min-w-[150px] items-center justify-center rounded-lg border border-white/[0.12] bg-white/[0.02] px-7 text-[13px] font-semibold text-white/80 transition-colors hover:border-white/25 hover:bg-white/[0.06] hover:text-white"
                    >
                        Book a Demo
                    </Link>
                </div>
            </div>
        </section>
    );
}
