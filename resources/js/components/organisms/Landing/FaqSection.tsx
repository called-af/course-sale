import { ChevronDown, Mail, MessageCircle } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useState } from 'react';

import Button from '@/components/atoms/Button';
import LandingSectionHeader from '@/components/molecules/LandingSectionHeader';
import { useBranding } from '@/hooks/useBranding';

interface FaqItem {
    question: string;
    answer: string;
}

/** Static content for now — answers to the questions that block most purchases. */
const FAQS: FaqItem[] = [
    {
        question: 'How long do I have access to a course?',
        answer: 'Forever. Once you enrol, the course stays in your account with no expiry date, including all future updates to its lessons and resources.',
    },
    {
        question: 'Do I get a certificate when I finish?',
        answer: 'Yes. Every course issues a certificate with a unique number as soon as you complete the final lesson. You can download the PDF and share a public verification link.',
    },
    {
        question: 'What payment methods are supported?',
        answer: 'Bank transfer (BCA, Mandiri, BNI, BRI), e-wallets (GoPay, OVO, DANA, ShopeePay), QRIS, and credit or debit cards. All payments are processed through a secure payment gateway.',
    },
    {
        question: 'Can I get a refund if the course is not for me?',
        answer: 'You can request a refund within seven days of purchase as long as you have not completed more than a small portion of the course. Refunds are processed back to your original payment method.',
    },
    {
        question: 'Are the lessons live or recorded?',
        answer: 'Lessons are recorded so you can learn on your own schedule. Some courses also include live Q&A sessions and community discussions with the instructor.',
    },
    {
        question: 'Can I download the course materials?',
        answer: 'Yes, where the instructor provides them. Slides, templates, code samples and datasets attached to a lesson are available to download from your dashboard.',
    },
    {
        question: 'Do I need prior experience to start?',
        answer: 'Each course page lists its level and prerequisites. Beginner courses start from the fundamentals, while advanced courses assume you already know the basics.',
    },
    {
        question: 'Can I access courses on my phone?',
        answer: 'Yes. The platform is responsive and works in any modern mobile browser, so you can continue watching lessons on the go.',
    },
];

const EASE: [number, number, number, number] = [0.22, 0.61, 0.36, 1];

export default function FaqSection() {
    const reduceMotion = useReducedMotion();
    const { contactEmail } = useBranding();
    const [openIndex, setOpenIndex] = useState<number | null>(0);

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
                            badge="FAQ"
                            titleLead="Questions, "
                            titleHighlight="Answered"
                            description="Still unsure about something? These are the things learners ask us most often before enrolling."
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
                        {FAQS.map((faq, index) => {
                            const isOpen = openIndex === index;

                            return (
                                <div
                                    key={faq.question}
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
                                        <span className="text-sm font-medium text-gray-800 dark:text-slate-100">{faq.question}</span>
                                        <ChevronDown
                                            size={16}
                                            className={`shrink-0 text-gray-400 transition-transform duration-300 dark:text-slate-500 ${
                                                isOpen ? 'rotate-180' : ''
                                            }`}
                                        />
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
                                                <p className="px-5 pb-4 text-sm leading-relaxed text-gray-500 dark:text-slate-400">{faq.answer}</p>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            );
                        })}
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
