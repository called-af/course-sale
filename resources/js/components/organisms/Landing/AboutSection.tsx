import { Link } from '@inertiajs/react';
import { ArrowUpRight, Check } from 'lucide-react';
import { motion, useInView, useReducedMotion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';

import Title from '@/components/atoms/Title';
import MarqueeLine from '@/components/molecules/MarqueeLine';
import { useBranding } from '@/hooks/useBranding';
import { useLanding } from '@/hooks/useLanding';
import { EASE, SOFT_SPRING, entrance } from '@/lib/motion';
import { withBrand } from '@/types';

const SCRAMBLE_INTERVAL = 70;
const SCRAMBLE_TICKS = 14;

/** Cycles through random numbers before settling on the real value. */
function AnimatedStat({ value }: { value: string }) {
    const ref = useRef<HTMLSpanElement>(null);
    const reduceMotion = useReducedMotion();
    const inView = useInView(ref, { once: true, amount: 0.6 });
    const [display, setDisplay] = useState(value);

    useEffect(() => {
        if (!inView) return;

        if (reduceMotion) {
            setDisplay(value);
            return;
        }

        const match = value.match(/^(\d+)(.*)$/);

        if (!match) {
            setDisplay(value);
            return;
        }

        const [, digits, suffix] = match;
        const length = digits.length;
        const min = length === 1 ? 0 : 10 ** (length - 1);
        const max = 10 ** length - 1;

        const scramble = () => String(Math.floor(Math.random() * (max - min + 1)) + min) + suffix;

        let tick = 0;
        setDisplay(scramble());

        const interval = window.setInterval(() => {
            tick += 1;

            if (tick >= SCRAMBLE_TICKS) {
                window.clearInterval(interval);
                setDisplay(value);
                return;
            }

            setDisplay(scramble());
        }, SCRAMBLE_INTERVAL);

        return () => window.clearInterval(interval);
    }, [inView, reduceMotion, value]);

    return (
        <span ref={ref} className="tabular-nums">
            {display}
        </span>
    );
}

export default function AboutSection() {
    const { name } = useBranding();
    const { about } = useLanding();
    const reduceMotion = useReducedMotion();

    const stats = about.stats;
    const highlights = about.highlights;

    return (
        <section id="about" className="relative overflow-hidden bg-[#141416] text-white dark:bg-[#0F0F11]">
            {/* Top scroll line — full width */}
            <MarqueeLine text={name} className="py-2 sm:py-3" />

            <div className="relative mx-auto mt-6 mb-6 max-w-7xl sm:mt-10 sm:mb-10">
                <div className="grid items-center gap-12 px-6 pt-14 pb-14 sm:px-10 sm:pt-16 sm:pb-16 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16 lg:px-14 lg:pt-20 lg:pb-20">
                    {/* Story */}
                    <motion.div
                        initial={entrance(reduceMotion, { opacity: 0, x: -32 })}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true, amount: 0.3 }}
                        transition={{ duration: 0.7, ease: EASE }}
                        className="flex flex-col gap-7"
                    >
                        <div className="flex flex-col gap-5">
                            <Title
                                as="h2"
                                className="max-w-xl leading-[1.12] font-semibold tracking-[-0.02em] text-white"
                                style={{ fontSize: 'clamp(2rem,4vw,3rem)' }}
                            >
                                {about.title_lead}
                                <span className="text-purple-400">{about.title_highlight}</span>
                                {about.title_tail}
                            </Title>

                            <p className="max-w-xl text-[15px] leading-relaxed text-white/45">{withBrand(about.paragraph_1, name)}</p>

                            <p className="max-w-xl text-[15px] leading-relaxed text-white/35">{withBrand(about.paragraph_2, name)}</p>
                        </div>

                        <ul className="flex flex-col gap-3">
                            {highlights.map((item, index) => (
                                <motion.li
                                    key={item}
                                    initial={entrance(reduceMotion, { opacity: 0, x: -16 })}
                                    whileInView={{ opacity: 1, x: 0 }}
                                    viewport={{ once: true, amount: 0.8 }}
                                    transition={{ duration: 0.45, delay: 0.25 + index * 0.1, ease: EASE }}
                                    className="flex items-center gap-3 text-[13px] text-white/55"
                                >
                                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-purple-400/20 bg-purple-400/10">
                                        <Check size={11} className="text-purple-300" />
                                    </span>
                                    {item}
                                </motion.li>
                            ))}
                        </ul>
                    </motion.div>

                    {/* Numbers */}
                    <motion.div
                        initial={entrance(reduceMotion, { opacity: 0, x: 32 })}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true, amount: 0.3 }}
                        transition={{ duration: 0.7, delay: 0.1, ease: EASE }}
                        className="relative border border-white/[0.08] bg-white/[0.02]"
                    >
                        <div className="flex items-center justify-between border-b border-white/[0.06] px-6 py-4 sm:px-8">
                            <span className="text-[11px] font-medium tracking-[0.18em] text-white/40 uppercase">{about.eyebrow}</span>
                            <span className="inline-flex items-center gap-2 text-[11px] text-white/40">
                                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-purple-400" />
                                {about.since_label}
                            </span>
                        </div>

                        <div className="grid grid-cols-2">
                            {stats.map((stat, index) => (
                                <motion.div
                                    key={stat.label}
                                    initial={entrance(reduceMotion, { opacity: 0, y: 16 })}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    whileHover={reduceMotion ? undefined : { y: -5 }}
                                    viewport={{ once: true, amount: 0.5 }}
                                    transition={{ duration: 0.45, delay: 0.2 + index * 0.08, ease: EASE }}
                                    className={[
                                        'flex flex-col gap-2 px-6 py-8 sm:px-8 sm:py-10',
                                        index % 2 === 1 ? 'border-l border-white/[0.06]' : '',
                                        index >= 2 ? 'border-t border-white/[0.06]' : '',
                                    ].join(' ')}
                                >
                                    <span
                                        className="text-3xl font-semibold tracking-tight text-white lg:text-4xl"
                                        style={{ fontFamily: 'Georgia, serif' }}
                                    >
                                        <AnimatedStat value={stat.value} />
                                    </span>
                                    <span className="text-[11px] tracking-[0.18em] text-white/35 uppercase">{stat.label}</span>
                                </motion.div>
                            ))}
                        </div>

                        <div className="border-t border-white/[0.06] px-6 py-5 sm:px-8">
                            <motion.div initial="rest" animate="rest" whileHover={reduceMotion ? undefined : 'hover'} className="inline-flex">
                                <Link
                                    href={about.cta_href}
                                    className="group inline-flex items-center gap-2 text-[13px] font-medium text-white/55 transition-colors hover:text-white"
                                >
                                    {about.cta_label}
                                    <motion.span
                                        variants={{ rest: { x: 0, y: 0 }, hover: { x: 3, y: -3 } }}
                                        transition={SOFT_SPRING}
                                        className="flex text-purple-300 transition-colors group-hover:text-white"
                                    >
                                        <ArrowUpRight size={14} />
                                    </motion.span>
                                </Link>
                            </motion.div>
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* Bottom scroll line — full width */}
            <MarqueeLine text={name} reverse className="py-2 sm:py-3" />
        </section>
    );
}
