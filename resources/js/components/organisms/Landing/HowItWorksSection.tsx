import { Award, CreditCard, PlayCircle, Search, Sparkles } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { motion, useMotionValue, useReducedMotion, useScroll, useSpring, useTransform, type MotionValue } from 'motion/react';
import { useRef } from 'react';

import LandingSectionHeader from '@/components/molecules/LandingSectionHeader';
import { useLanding } from '@/hooks/useLanding';

import type { HowItWorksStep } from '@/types';

const STEP_ICONS: Record<string, LucideIcon> = {
    search: Search,
    'credit-card': CreditCard,
    'play-circle': PlayCircle,
    award: Award,
    sparkles: Sparkles,
};

const EASE: [number, number, number, number] = [0.22, 0.61, 0.36, 1];

interface StepItemProps {
    step: HowItWorksStep;
    index: number;
    total: number;
    progress: MotionValue<number>;
    reduceMotion: boolean;
}

/** A step "wakes up" as the scroll-linked journey reaches its position. */
function StepItem({ step, index, total, progress, reduceMotion }: StepItemProps) {
    const Icon = STEP_ICONS[step.icon] ?? Sparkles;

    const start = Math.max(0, (index - 0.6) / total);
    const end = Math.min(1, (index + 0.6) / total);
    const focus = useTransform(progress, [start, end], [0, 1]);

    const iconScale = useTransform(focus, [0, 0.6, 1], [1, 1.09, 1]);
    const glowOpacity = useTransform(focus, [0, 1], [0, 0.9]);
    const titleColor = useTransform(focus, [0, 1], ['rgba(255,255,255,0.52)', 'rgba(255,255,255,0.98)']);
    const descriptionColor = useTransform(focus, [0, 1], ['rgba(255,255,255,0.28)', 'rgba(255,255,255,0.58)']);

    return (
        <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.25 }}
            transition={{ duration: 0.55, delay: 0.08 + index * 0.11, ease: EASE }}
            className="group relative flex flex-col gap-5"
        >
            <div className="relative z-10 flex h-14 w-14 items-center justify-center">
                <motion.span aria-hidden style={{ opacity: glowOpacity }} className="absolute -inset-3 rounded-full bg-purple-500/25 blur-xl" />

                <motion.div
                    style={{ scale: iconScale }}
                    className="relative flex h-14 w-14 items-center justify-center rounded-full border border-purple-400/25 bg-[#141416] text-purple-300 transition-colors duration-300 group-hover:border-purple-400/60 group-hover:bg-purple-950/40 group-hover:text-purple-200 dark:bg-[#0F0F11]"
                >
                    <Icon size={20} strokeWidth={1.8} />

                    <motion.span
                        aria-hidden
                        style={{ opacity: glowOpacity }}
                        className="absolute -top-1.5 -right-1.5 h-6 w-6 rounded-full bg-purple-500/50 blur-md"
                    />
                    <span className="absolute -top-1.5 -right-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-purple-600 text-[10px] font-bold text-white ring-4 ring-[#141416] dark:ring-[#0F0F11]">
                        {String(index + 1).padStart(2, '0')}
                    </span>
                </motion.div>
            </div>

            <div className="flex flex-col gap-2">
                <motion.h3 style={{ color: titleColor }} className="text-base font-semibold">
                    {step.title}
                </motion.h3>
                <motion.p style={{ color: descriptionColor }} className="text-[13px] leading-relaxed">
                    {step.description}
                </motion.p>
            </div>
        </motion.div>
    );
}

export default function HowItWorksSection() {
    const timelineRef = useRef<HTMLDivElement>(null);
    const reduceMotion = useReducedMotion();
    const { how_it_works: copy } = useLanding();

    const { scrollYProgress } = useScroll({
        target: timelineRef,
        offset: ['start 0.85', 'end 0.4'],
    });

    const smoothProgress = useSpring(scrollYProgress, {
        stiffness: 110,
        damping: 28,
        restDelta: 0.001,
        skipInitialAnimation: true,
    });
    const settledProgress = useMotionValue(1);
    const progress = reduceMotion ? settledProgress : smoothProgress;

    const dotLeft = useTransform(progress, [0, 1], ['0%', '100%']);
    const dotOpacity = useTransform(progress, [0, 0.04, 0.96, 1], [0, 1, 1, 0]);
    const orbFarY = useTransform(progress, [0, 1], [0, -70]);
    const stillY = useMotionValue(0);
    const farY = reduceMotion ? stillY : orbFarY;

    return (
        <section id="how-it-works" className="relative overflow-hidden bg-[#141416] py-24 text-white dark:bg-[#0F0F11]">
            <motion.div
                aria-hidden
                style={{ y: farY }}
                className="pointer-events-none absolute -top-24 left-1/3 h-72 w-72 rounded-full bg-purple-500/10 blur-3xl"
            />

            <div className="relative mx-auto max-w-7xl px-4 sm:px-8">
                <motion.div
                    initial={reduceMotion ? false : { opacity: 0, y: 24 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.4 }}
                    transition={{ duration: 0.6, ease: EASE }}
                    className="mb-16 grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end"
                >
                    <div className="flex flex-col gap-6">
                        <LandingSectionHeader
                            badge={copy.badge}
                            titleLead={copy.title_lead}
                            titleHighlight={copy.title_highlight}
                            titleClassName="text-white"
                            description={copy.description}
                            descriptionClassName="text-white/45"
                        />
                    </div>

                    <div className="max-w-xs border-l-2 border-purple-500/60 pl-4 text-sm leading-relaxed text-white/35">{copy.note}</div>
                </motion.div>

                <div ref={timelineRef} className="relative">
                    <div aria-hidden className="absolute top-7 right-7 left-7 hidden h-px bg-white/[0.08] lg:block">
                        <motion.span
                            style={{ scaleX: progress }}
                            className="block h-full origin-left bg-gradient-to-r from-purple-500 via-purple-400/80 to-purple-300/30"
                        />
                        <motion.span
                            style={{ left: dotLeft, opacity: dotOpacity }}
                            className="absolute top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-purple-300 shadow-[0_0_14px_4px_rgba(168,85,247,0.55)]"
                        />
                    </div>

                    <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
                        {copy.steps.map((step, index) => (
                            <StepItem
                                key={`${step.title}-${index}`}
                                step={step}
                                index={index}
                                total={Math.max(1, copy.steps.length)}
                                progress={progress}
                                reduceMotion={Boolean(reduceMotion)}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
