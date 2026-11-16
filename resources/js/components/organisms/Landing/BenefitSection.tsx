import { Award, Download, Infinity as InfinityIcon, MessagesSquare, RefreshCw, ShieldCheck } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';

import Card from '@/components/atoms/Card';
import Title from '@/components/atoms/Title';
import LandingSectionHeader from '@/components/molecules/LandingSectionHeader';

interface Benefit {
    title: string;
    description: string;
    icon: LucideIcon;
}

const BENEFITS: Benefit[] = [
    {
        title: 'Lifetime access',
        description: 'Buy once and revisit every lesson whenever you need it. No subscriptions, no expiry date.',
        icon: InfinityIcon,
    },
    {
        title: 'Always up to date',
        description: 'When the industry moves, the curriculum follows. Updates are included at no extra cost.',
        icon: RefreshCw,
    },
    {
        title: 'Verified certificate',
        description: 'Finish the course and get a certificate with a unique number anyone can verify online.',
        icon: Award,
    },
    {
        title: 'Community & mentoring',
        description: 'Ask questions, share work and get feedback from instructors and fellow learners.',
        icon: MessagesSquare,
    },
    {
        title: 'Downloadable resources',
        description: 'Slides, templates, datasets and code samples are yours to keep and use in real projects.',
        icon: Download,
    },
    {
        title: '7-day money back',
        description: 'Not the right fit? Request a refund within seven days of purchase, no questions asked.',
        icon: ShieldCheck,
    },
];

const AUDIENCES = ['Career switchers', 'Working professionals', 'Students & fresh graduates'];

const EASE: [number, number, number, number] = [0.22, 0.61, 0.36, 1];

export default function BenefitSection() {
    const reduceMotion = useReducedMotion();

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
                        badge="Why learn with us"
                        titleLead="Everything You Need to "
                        titleHighlight="Keep Growing"
                        description="The support system around the course matters as much as the lessons themselves."
                    />

                    <div className="flex flex-col gap-3 lg:items-end">
                        <span className="text-[11px] font-semibold tracking-[0.18em] text-gray-400 uppercase dark:text-slate-500">Built for</span>
                        <div className="flex flex-wrap gap-2 lg:justify-end">
                            {AUDIENCES.map((audience) => (
                                <span
                                    key={audience}
                                    className="border border-slate-200/80 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 dark:border-slate-700 dark:bg-[#1e1f24] dark:text-slate-300"
                                >
                                    {audience}
                                </span>
                            ))}
                        </div>
                    </div>
                </motion.div>

                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                    {BENEFITS.map((benefit, index) => {
                        const Icon = benefit.icon;

                        return (
                            <motion.div
                                key={benefit.title}
                                initial={reduceMotion ? false : { opacity: 0, y: 28 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                whileHover={reduceMotion ? undefined : { y: -6 }}
                                viewport={{ once: true, amount: 0.2 }}
                                transition={{ duration: 0.5, delay: Math.min(index, 5) * 0.06, ease: EASE }}
                            >
                                <Card className="group flex h-full flex-col gap-4 hover:border-purple-200 dark:hover:border-purple-800">
                                    <div className="flex h-11 w-11 shrink-0 items-center justify-center border border-slate-200 bg-slate-50 text-purple-600 transition-colors duration-300 group-hover:border-purple-300 group-hover:bg-purple-50 dark:border-slate-700 dark:bg-[#1e1f24] dark:text-purple-400 dark:group-hover:border-purple-700 dark:group-hover:bg-purple-950/40">
                                        <Icon size={19} />
                                    </div>

                                    <Title as="h4" className="text-base text-gray-900 dark:text-white">
                                        {benefit.title}
                                    </Title>

                                    <p className="text-sm leading-relaxed text-gray-500 dark:text-slate-400">{benefit.description}</p>
                                </Card>
                            </motion.div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
