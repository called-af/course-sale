import { motion, useReducedMotion } from 'motion/react';

import Button from '@/components/atoms/Button';
import SectionLink from '@/components/molecules/SectionLink';
import { useLanding } from '@/hooks/useLanding';
import { EASE, entrance, staggerContainer } from '@/lib/motion';

const fadeUp = {
    hidden: { opacity: 0, y: 18 },
    show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: EASE } },
};

export default function CtaSection() {
    const reduceMotion = useReducedMotion();
    const { cta } = useLanding();

    return (
        <section className="relative bg-[#141416] text-white dark:bg-[#0F0F11]">
            <div
                aria-hidden
                className="pointer-events-none absolute inset-x-0 top-0 h-[520px] bg-[radial-gradient(60%_100%_at_50%_0%,color-mix(in_srgb,var(--color-purple-500)_12%,transparent),transparent_70%)]"
            />

            <div className="relative mx-auto max-w-7xl">
                <motion.div
                    variants={staggerContainer(0.1, 0.05)}
                    initial={entrance(reduceMotion, 'hidden')}
                    whileInView="show"
                    viewport={{ once: true, amount: 0.3 }}
                    className="px-6 pt-10 pb-16 text-center sm:pt-12 sm:pb-20"
                >
                    <motion.h2
                        variants={fadeUp}
                        className="mx-auto max-w-3xl text-[clamp(2.1rem,4.6vw,3.4rem)] leading-[1.1] font-semibold tracking-[-0.02em] text-white"
                    >
                        {cta.title_line_1}
                        <br className="hidden sm:block" /> {cta.title_line_2}{' '}
                        <span className="relative isolate inline-block bg-gradient-to-r from-purple-400 via-purple-300 to-purple-500 bg-clip-text text-transparent">
                            <span aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
                                <motion.span
                                    initial={entrance(reduceMotion, { x: '-120%' })}
                                    whileInView={{ x: '120%' }}
                                    viewport={{ once: true, amount: 0.6 }}
                                    transition={{ duration: 1.05, delay: 0.3, ease: EASE }}
                                    className="absolute inset-y-0 -left-full w-full bg-gradient-to-r from-transparent via-white/20 to-transparent"
                                />
                            </span>
                            {cta.title_highlight}
                        </span>
                    </motion.h2>

                    <motion.div variants={fadeUp} className="mt-9 flex flex-wrap items-center justify-center gap-3">
                        <SectionLink href={cta.primary_href}>
                            <Button
                                variant="primary"
                                className="min-w-[150px] bg-[#141416] px-8 py-3 text-base hover:bg-gray-700 focus:ring-gray-500"
                            >
                                {cta.primary_label}
                            </Button>
                        </SectionLink>

                        <SectionLink href={cta.secondary_href}>
                            <Button
                                variant="outline"
                                className="min-w-[150px] !border-neutral-200/80 !bg-white/80 px-6 py-3 text-base !text-neutral-700 hover:!border-neutral-300 hover:!bg-neutral-50 hover:!text-neutral-900"
                            >
                                {cta.secondary_label}
                            </Button>
                        </SectionLink>
                    </motion.div>
                </motion.div>
            </div>
        </section>
    );
}
