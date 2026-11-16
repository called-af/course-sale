import { Award, CreditCard, PlayCircle, Search } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';

import LandingSectionHeader from '@/components/molecules/LandingSectionHeader';

interface Step {
    title: string;
    description: string;
    icon: LucideIcon;
}

const STEPS: Step[] = [
    {
        title: 'Pick your course',
        description: 'Browse by category or search directly. Every course page shows the full curriculum before you commit.',
        icon: Search,
    },
    {
        title: 'Checkout securely',
        description: 'Pay with a bank transfer, e-wallet or card. Your seat is confirmed the moment payment clears.',
        icon: CreditCard,
    },
    {
        title: 'Learn at your pace',
        description: 'Lifetime access to every lesson, resource and future update — on desktop or mobile.',
        icon: PlayCircle,
    },
    {
        title: 'Earn your certificate',
        description: 'Finish the course and download a verifiable certificate you can add to your CV and LinkedIn.',
        icon: Award,
    },
];

const EASE: [number, number, number, number] = [0.22, 0.61, 0.36, 1];

export default function HowItWorksSection() {
    const reduceMotion = useReducedMotion();

    return (
        <section id="how-it-works" className="relative overflow-hidden bg-[#141416] py-24 text-white dark:bg-[#0F0F11]">
            <div aria-hidden className="pointer-events-none absolute -top-24 left-1/3 h-72 w-72 rounded-full bg-purple-500/10 blur-3xl" />

            <div className="relative mx-auto max-w-7xl px-4 sm:px-8">
                {/* Header */}
                <motion.div
                    initial={reduceMotion ? false : { opacity: 0, y: 24 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.4 }}
                    transition={{ duration: 0.6, ease: EASE }}
                    className="mb-16 grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end"
                >
                    <LandingSectionHeader
                        badge="How it works"
                        titleLead="From Sign Up to "
                        titleHighlight="Certificate"
                        titleClassName="text-white"
                        description="Four simple steps. No hidden fees, no complicated enrolment."
                        descriptionClassName="text-white/45"
                    />

                    <div className="max-w-xs border-l-2 border-purple-500/60 pl-4 text-sm leading-relaxed text-white/35">
                        Most learners finish their first lesson within ten minutes of checkout.
                    </div>
                </motion.div>

                {/* Timeline */}
                <div className="relative">
                    {/* Connector line — draws itself on scroll */}
                    <div aria-hidden className="absolute top-7 right-7 left-7 hidden h-px bg-white/[0.08] lg:block">
                        <motion.span
                            initial={reduceMotion ? false : { scaleX: 0 }}
                            whileInView={{ scaleX: 1 }}
                            viewport={{ once: true, amount: 0.5 }}
                            transition={{ duration: 1.1, delay: 0.2, ease: EASE }}
                            className="block h-full origin-left bg-gradient-to-r from-purple-500 via-purple-400/70 to-purple-500/20"
                        />
                    </div>

                    <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
                        {STEPS.map((step, index) => {
                            const Icon = step.icon;

                            return (
                                <motion.div
                                    key={step.title}
                                    initial={reduceMotion ? false : { opacity: 0, y: 28 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true, amount: 0.2 }}
                                    transition={{ duration: 0.5, delay: index * 0.12, ease: EASE }}
                                    className="group relative flex flex-col gap-5"
                                >
                                    {/* Icon node with step number */}
                                    <motion.div
                                        initial={reduceMotion ? false : { scale: 0.6, opacity: 0 }}
                                        whileInView={{ scale: 1, opacity: 1 }}
                                        viewport={{ once: true, amount: 0.2 }}
                                        transition={{ type: 'spring', stiffness: 320, damping: 22, delay: 0.15 + index * 0.12 }}
                                        className="relative z-10 flex h-14 w-14 items-center justify-center rounded-full border border-purple-400/25 bg-[#141416] text-purple-300 transition-colors duration-300 group-hover:border-purple-400/60 group-hover:bg-purple-950/40 group-hover:text-purple-200 dark:bg-[#0F0F11]"
                                    >
                                        <Icon size={20} />

                                        <span className="absolute -top-1.5 -right-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-purple-600 text-[10px] font-bold text-white ring-4 ring-[#141416] dark:ring-[#0F0F11]">
                                            0{index + 1}
                                        </span>
                                    </motion.div>

                                    <div className="flex flex-col gap-2">
                                        <h3 className="text-base font-semibold text-white transition-colors duration-300 group-hover:text-purple-200">
                                            {step.title}
                                        </h3>
                                        <p className="text-[13px] leading-relaxed text-white/40">{step.description}</p>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </section>
    );
}
