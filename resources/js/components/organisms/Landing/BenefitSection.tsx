import { Award, Download, Infinity as InfinityIcon, MessagesSquare, RefreshCw, ShieldCheck, Sparkles } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';

import Card from '@/components/atoms/Card';
import Title from '@/components/atoms/Title';
import LandingSectionHeader from '@/components/molecules/LandingSectionHeader';
import { useLanding } from '@/hooks/useLanding';
import { EASE, SOFT_SPRING, entrance } from '@/lib/motion';

const BENEFIT_ICONS: Record<string, LucideIcon> = {
    infinity: InfinityIcon,
    refresh: RefreshCw,
    award: Award,
    messages: MessagesSquare,
    download: Download,
    shield: ShieldCheck,
    sparkles: Sparkles,
};

export default function BenefitSection() {
    const reduceMotion = useReducedMotion();
    const { benefit } = useLanding();

    return (
        <section id="benefits" className="relative overflow-hidden bg-gray-100 py-24 dark:bg-[#141416]">
            <div className="relative mx-auto max-w-7xl px-4 sm:px-8">
                <motion.div
                    initial={reduceMotion ? false : { opacity: 0, y: 24 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.4 }}
                    transition={{ duration: 0.6, ease: EASE }}
                    className="mb-12 flex flex-col justify-between gap-6 lg:flex-row lg:items-end"
                >
                    <LandingSectionHeader
                        badge={benefit.badge}
                        titleLead={benefit.title_lead}
                        titleHighlight={benefit.title_highlight}
                        description={benefit.description}
                    />

                    <div className="flex flex-col gap-3 lg:items-end">
                        <span className="text-[11px] font-semibold tracking-[0.18em] text-gray-400 uppercase dark:text-slate-500">Built for</span>
                        <div className="flex flex-wrap gap-2 lg:justify-end">
                            {benefit.audiences.map((audience, index) => (
                                <span
                                    key={`${audience}-${index}`}
                                    className="border border-slate-200/80 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 dark:border-slate-700 dark:bg-[#1e1f24] dark:text-slate-300"
                                >
                                    {audience}
                                </span>
                            ))}
                        </div>
                    </div>
                </motion.div>

                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                    {benefit.benefits.map((benefitItem, index) => {
                        const Icon = BENEFIT_ICONS[benefitItem.icon] ?? Sparkles;

                        return (
                            <motion.div
                                key={`${benefitItem.title}-${index}`}
                                initial={entrance(reduceMotion, { opacity: 0, y: 28 })}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, amount: 0.2 }}
                                transition={{ duration: 0.5, delay: Math.min(index, 5) * 0.06, ease: EASE }}
                                className="h-full"
                            >
                                <motion.div
                                    initial={entrance(reduceMotion, 'rest')}
                                    animate="rest"
                                    whileHover={reduceMotion ? undefined : 'hover'}
                                    variants={{ rest: { y: 0 }, hover: { y: -6 } }}
                                    transition={SOFT_SPRING}
                                    className="h-full"
                                >
                                    <Card className="group flex h-full flex-col gap-4 hover:border-purple-200 dark:hover:border-purple-800">
                                        <motion.div
                                            variants={{ rest: { rotate: 0, scale: 1 }, hover: { rotate: -8, scale: 1.06 } }}
                                            transition={SOFT_SPRING}
                                            className="flex h-11 w-11 shrink-0 items-center justify-center border border-slate-200 bg-slate-50 text-purple-600 transition-colors duration-300 group-hover:border-purple-300 group-hover:bg-purple-50 dark:border-slate-700 dark:bg-[#1e1f24] dark:text-purple-400 dark:group-hover:border-purple-700 dark:group-hover:bg-purple-950/40"
                                        >
                                            <Icon size={19} />
                                        </motion.div>

                                        <Title as="h4" className="text-base text-gray-900 dark:text-white">
                                            {benefitItem.title}
                                        </Title>

                                        <p className="text-sm leading-relaxed text-gray-500 dark:text-slate-400">{benefitItem.description}</p>
                                    </Card>
                                </motion.div>
                            </motion.div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
