import { ChevronDown, Mail, MessageCircle } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useEffect, useState } from 'react';

import Button from '@/components/atoms/Button';
import LandingSectionHeader from '@/components/molecules/LandingSectionHeader';
import { useBranding } from '@/hooks/useBranding';
import { useLanding } from '@/hooks/useLanding';

const EASE: [number, number, number, number] = [0.22, 0.61, 0.36, 1];

export default function FaqSection() {
    const reduceMotion = useReducedMotion();
    const { contactEmail } = useBranding();
    const { faq } = useLanding();
    const [openIndex, setOpenIndex] = useState<number | null>(0);

    useEffect(() => {
        setOpenIndex(faq.items.length > 0 ? 0 : null);
    }, [faq.items.length]);

    return (
        <section id="faq" className="relative overflow-hidden bg-gray-100 py-24 dark:bg-[#141416]">
            <div className="relative mx-auto max-w-7xl px-4 sm:px-8">
                <div className="grid gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16">
                    <motion.div
                        initial={reduceMotion ? false : { opacity: 0, x: -24 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true, amount: 0.3 }}
                        transition={{ duration: 0.6, ease: EASE }}
                        className="flex flex-col gap-8"
                    >
                        <LandingSectionHeader
                            badge={faq.badge}
                            titleLead={faq.title_lead}
                            titleHighlight={faq.title_highlight}
                            description={faq.description}
                        />

                        <div className="flex flex-col gap-4 border border-slate-200/80 bg-white p-6 dark:border-slate-700 dark:bg-[#1e1f24]">
                            <div className="flex items-center gap-3">
                                <span className="flex h-10 w-10 shrink-0 items-center justify-center border border-purple-200 bg-purple-50 text-purple-600 dark:border-purple-900/60 dark:bg-purple-950/40 dark:text-purple-300">
                                    <MessageCircle size={18} />
                                </span>
                                <div>
                                    <p className="text-sm font-semibold text-gray-900 dark:text-white">Still have questions?</p>
                                    <p className="text-xs text-gray-500 dark:text-slate-400">We usually reply within one business day.</p>
                                </div>
                            </div>

                            <a href={`mailto:${contactEmail}`} className="w-full">
                                <Button variant="primary" widthFull leftIcon={<Mail size={15} />} className="!rounded-none">
                                    Email {contactEmail}
                                </Button>
                            </a>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={reduceMotion ? false : { opacity: 0, y: 24 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, amount: 0.15 }}
                        transition={{ duration: 0.6, delay: 0.05, ease: EASE }}
                        className="flex flex-col gap-3"
                    >
                        {faq.items.map((item, index) => {
                            const isOpen = openIndex === index;

                            return (
                                <motion.div
                                    key={`${item.question}-${index}`}
                                    layout={!reduceMotion}
                                    transition={{ layout: { type: 'spring', stiffness: 260, damping: 28 } }}
                                    className="border border-slate-200/80 bg-white transition-colors duration-200 dark:border-slate-700 dark:bg-[#1e1f24]"
                                >
                                    <button
                                        type="button"
                                        onClick={() => setOpenIndex(isOpen ? null : index)}
                                        aria-expanded={isOpen}
                                        aria-controls={`faq-answer-${index}`}
                                        id={`faq-question-${index}`}
                                        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                                    >
                                        <span className="text-sm font-medium text-gray-800 dark:text-slate-100">{item.question}</span>
                                        <motion.span
                                            animate={{ rotate: isOpen ? 180 : 0 }}
                                            transition={{ type: 'spring', stiffness: 320, damping: 24 }}
                                            className="flex shrink-0 text-gray-400 dark:text-slate-500"
                                        >
                                            <ChevronDown size={16} />
                                        </motion.span>
                                    </button>

                                    <AnimatePresence initial={false}>
                                        {isOpen && (
                                            <motion.div
                                                key="answer"
                                                id={`faq-answer-${index}`}
                                                role="region"
                                                aria-labelledby={`faq-question-${index}`}
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                transition={{ duration: 0.28, ease: EASE }}
                                                className="overflow-hidden"
                                            >
                                                <p className="px-5 pb-4 text-sm leading-relaxed text-gray-500 dark:text-slate-400">{item.answer}</p>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </motion.div>
                            );
                        })}
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
