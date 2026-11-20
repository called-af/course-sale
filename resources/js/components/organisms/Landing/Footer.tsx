import { Link } from '@inertiajs/react';
import { Facebook, Instagram, Linkedin, Mail, MapPin, Phone, Twitter, Youtube, type LucideIcon } from 'lucide-react';
import { motion, useMotionValue, useReducedMotion, useScroll, useTransform } from 'motion/react';
import { useRef } from 'react';

import AppLogo from '@/components/atoms/AppLogo';
import { useBranding } from '@/hooks/useBranding';
import { useLanding } from '@/hooks/useLanding';
import { EASE, SOFT_SPRING, entrance, staggerContainer } from '@/lib/motion';

const socialIcons: Record<string, LucideIcon> = {
    linkedin: Linkedin,
    facebook: Facebook,
    youtube: Youtube,
    instagram: Instagram,
    twitter: Twitter,
    x: Twitter,
};

const fadeUp = {
    hidden: { opacity: 0, y: 18 },
    show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: EASE } },
};

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

export default function Footer() {
    const footerRef = useRef<HTMLElement>(null);
    const reduceMotion = useReducedMotion();
    const { name, contactEmail } = useBranding();
    const { footer } = useLanding();

    const { scrollYProgress } = useScroll({ target: footerRef, offset: ['start end', 'end end'] });
    const wordmarkY = useTransform(scrollYProgress, [0, 1], [40, 0]);
    const still = useMotionValue(0);

    const email = footer.email || contactEmail;
    const phoneHref = `tel:${footer.phone.replace(/[^\d+]/g, '')}`;

    return (
        <footer ref={footerRef} className="relative bg-[#141416] text-white dark:bg-[#0F0F11]">
            <div className="relative mx-auto max-w-7xl">
                {/* Main */}
                <motion.div
                    variants={staggerContainer(0.06)}
                    initial={entrance(reduceMotion, 'hidden')}
                    whileInView="show"
                    viewport={{ once: true, amount: 0.1 }}
                    className="px-6 pt-14 sm:px-10 lg:px-14"
                >
                    <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8">
                        {/* Brand */}
                        <motion.div variants={fadeUp} className="flex flex-col gap-5 sm:col-span-2 lg:col-span-1">
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
                        </motion.div>

                        {/* Link groups */}
                        {footer.columns.map((column) => (
                            <motion.div key={column.title} variants={fadeUp} className="flex flex-col gap-4">
                                <span className="text-[15px] font-semibold text-white">{column.title}</span>
                                <ul className="flex flex-col gap-3.5">
                                    {column.links.map((item) => (
                                        <motion.li
                                            key={`${column.title}-${item.label}-${item.href}`}
                                            whileHover={reduceMotion ? undefined : { x: 4 }}
                                            transition={SOFT_SPRING}
                                        >
                                            <FooterLink href={item.href} className="text-[13px] text-white/45 transition-colors hover:text-white">
                                                {item.label}
                                            </FooterLink>
                                        </motion.li>
                                    ))}
                                </ul>
                            </motion.div>
                        ))}
                    </div>

                    {/* Social + legal */}
                    <motion.div variants={fadeUp} className="mt-14 flex flex-col-reverse items-center justify-between gap-6 pb-10 sm:flex-row">
                        <div className="flex items-center gap-5">
                            {footer.socials.map(({ name: socialName, href }) => {
                                const Icon = socialIcons[socialName.toLowerCase()] ?? Linkedin;

                                return (
                                    <motion.a
                                        key={`${socialName}-${href}`}
                                        href={href}
                                        aria-label={socialName}
                                        whileHover={reduceMotion ? undefined : { y: -4, scale: 1.15 }}
                                        whileTap={reduceMotion ? undefined : { scale: 0.9 }}
                                        transition={SOFT_SPRING}
                                        className="text-white/40 transition-colors hover:text-white"
                                    >
                                        <Icon size={16} />
                                    </motion.a>
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
                    </motion.div>
                </motion.div>

                {/* Copyright */}
                <motion.p
                    initial={entrance(reduceMotion, { opacity: 0 })}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="py-6 text-center text-[13px] text-white/35"
                >
                    © {new Date().getFullYear()} {name}. All rights reserved.
                </motion.p>

                {/* Oversized wordmark */}
                <div aria-hidden className="relative h-[140px] overflow-hidden border-t border-white/[0.06] select-none sm:h-[230px]">
                    <motion.span
                        style={{ y: reduceMotion ? still : wordmarkY }}
                        className="absolute inset-x-0 bottom-0 -mb-[0.16em] block bg-gradient-to-b from-white/[0.08] to-white/0 bg-clip-text text-center text-[clamp(3.5rem,15vw,12rem)] leading-[0.78] font-black tracking-[-0.05em] whitespace-nowrap text-transparent"
                    >
                        {name.toUpperCase()}
                    </motion.span>
                </div>
            </div>
        </footer>
    );
}
