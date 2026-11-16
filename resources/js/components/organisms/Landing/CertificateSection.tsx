import { Link } from '@inertiajs/react';
import { ArrowRight, Award, Check } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';

import Button from '@/components/atoms/Button';
import LandingSectionHeader from '@/components/molecules/LandingSectionHeader';
import { useBranding } from '@/hooks/useBranding';

const POINTS = [
    'Downloadable PDF, ready for LinkedIn',
    'Unique certificate number anyone can verify',
    'Recognised by our hiring and industry partners',
];

const EASE: [number, number, number, number] = [0.22, 0.61, 0.36, 1];

export default function CertificateSection() {
    const reduceMotion = useReducedMotion();
    const { name, domain } = useBranding();

    return (
        <section id="certificate" className="relative overflow-hidden bg-[#141416] py-24 text-white dark:bg-[#0F0F11]">
            <div aria-hidden className="pointer-events-none absolute top-1/3 -left-24 h-80 w-80 rounded-full bg-purple-500/10 blur-3xl" />

            <div className="relative mx-auto grid max-w-7xl items-center gap-14 px-4 sm:px-8 lg:grid-cols-2 lg:gap-20">
                <motion.div
                    initial={reduceMotion ? false : { opacity: 0, x: -32 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, amount: 0.3 }}
                    transition={{ duration: 0.7, ease: EASE }}
                    className="flex flex-col gap-7"
                >
                    <LandingSectionHeader
                        badge="Certificate"
                        titleLead="Proof of Work, "
                        titleHighlight="Not Just Points"
                        titleClassName="text-white"
                        description="Every completed course ends with a certificate you can actually use — share it, print it, or let employers verify it in seconds."
                        descriptionClassName="text-white/45"
                    />

                    <ul className="flex flex-col gap-3">
                        {POINTS.map((point, index) => (
                            <motion.li
                                key={point}
                                initial={reduceMotion ? false : { opacity: 0, x: -16 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true, amount: 0.8 }}
                                transition={{ duration: 0.45, delay: 0.15 + index * 0.1, ease: EASE }}
                                className="flex items-center gap-3 text-[13px] text-white/55"
                            >
                                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-purple-400/20 bg-purple-400/10">
                                    <Check size={11} className="text-purple-300" />
                                </span>
                                {point}
                            </motion.li>
                        ))}
                    </ul>

                    <div className="pt-2">
                        <Link href="/course">
                            <Button rightIcon={<ArrowRight size={16} />} className="px-8 py-3 text-base">
                                Start learning
                            </Button>
                        </Link>
                    </div>
                </motion.div>

                <motion.div
                    initial={reduceMotion ? false : { opacity: 0, y: 32, rotate: 1.5 }}
                    whileInView={{ opacity: 1, y: 0, rotate: -1.5 }}
                    viewport={{ once: true, amount: 0.3 }}
                    transition={{ duration: 0.7, delay: 0.1, ease: EASE }}
                    className="relative mx-auto w-full max-w-md"
                >
                    <div
                        aria-hidden
                        className="pointer-events-none absolute -inset-6 -z-10 bg-[radial-gradient(60%_60%_at_50%_50%,color-mix(in_srgb,var(--color-purple-500)_18%,transparent),transparent_75%)] blur-2xl"
                    />

                    <div className="border border-white/10 bg-white p-2 shadow-2xl">
                        <div className="border border-neutral-200 px-6 py-8 text-center text-neutral-900 sm:px-10 sm:py-10">
                            <div className="flex items-center justify-between text-[9px] font-semibold tracking-[0.2em] text-neutral-400 uppercase">
                                <span>{name}</span>
                                <span>Certificate</span>
                            </div>

                            <Award className="mx-auto mt-7 h-10 w-10 text-purple-600" strokeWidth={1.5} />

                            <p className="mt-5 text-[9px] font-semibold tracking-[0.3em] text-purple-600 uppercase">Certificate of completion</p>
                            <p className="mt-3 font-display text-3xl leading-none">Jane Doe</p>
                            <p className="mt-3 text-[11px] text-neutral-500">has successfully completed</p>
                            <p className="mt-1 text-sm font-semibold">Digital Marketing Fundamentals</p>

                            <div className="mt-9 flex items-end justify-between gap-4 text-left">
                                <div className="min-w-0">
                                    <p className="text-[9px] tracking-[0.15em] text-neutral-400 uppercase">Issued</p>
                                    <p className="mt-1 truncate border-t border-neutral-300 pt-1 text-[11px]">12 November 2026</p>
                                </div>

                                <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-full border-2 border-purple-200 text-center text-[7px] font-bold tracking-[0.08em] text-purple-600 uppercase">
                                    <Award size={14} />
                                    Verified
                                </div>

                                <div className="min-w-0 text-right">
                                    <p className="text-[9px] tracking-[0.15em] text-neutral-400 uppercase">Instructor</p>
                                    <p className="mt-1 truncate border-t border-neutral-300 pt-1 text-[11px]">A. Prameswari</p>
                                </div>
                            </div>

                            <p className="mt-8 truncate text-[8px] tracking-[0.15em] text-neutral-400 uppercase">Verify at {domain}/certificate</p>
                        </div>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}
