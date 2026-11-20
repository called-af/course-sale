import { Lock, ShieldCheck } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';

import { useLanding } from '@/hooks/useLanding';
import { EASE, entrance, staggerContainer } from '@/lib/motion';
import { paymentLogoSrc } from '@/lib/payment-logos';

const fadeUp = {
    hidden: { opacity: 0, y: 18 },
    show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE } },
};

/** Compact trust strip: payment methods and purchase guarantees. */
export default function TrustBar() {
    const reduceMotion = useReducedMotion();
    const { trust } = useLanding();

    return (
        <motion.section
            className="border-y border-slate-200 bg-white py-8 dark:border-slate-800 dark:bg-[#141416]"
            initial={entrance(reduceMotion, { opacity: 0, y: 24 })}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.6, ease: EASE }}
        >
            <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 sm:px-8 lg:flex-row lg:items-center lg:justify-between">
                <motion.div
                    variants={staggerContainer(0.04)}
                    initial={entrance(reduceMotion, 'hidden')}
                    whileInView="show"
                    viewport={{ once: true, amount: 0.4 }}
                    className="flex flex-col gap-3"
                >
                    <motion.span
                        variants={fadeUp}
                        className="inline-flex items-center gap-2 text-[11px] font-semibold tracking-[0.18em] text-gray-400 uppercase dark:text-slate-500"
                    >
                        <Lock size={12} />
                        Secure checkout
                    </motion.span>
                    <div className="flex flex-wrap items-center gap-2">
                        {trust.payment_methods.map((method, index) => {
                            const logoSrc = paymentLogoSrc(method, trust.payment_logos ?? {});

                            return (
                                <motion.span
                                    key={`${method}-${index}`}
                                    variants={fadeUp}
                                    whileHover={reduceMotion ? undefined : { y: -3, scale: 1.03 }}
                                    title={method}
                                    aria-label={method}
                                    className="flex h-8 min-w-[58px] items-center justify-center border border-slate-200 bg-white px-2 shadow-sm dark:border-slate-700 dark:bg-[#1e1f24]"
                                >
                                    {logoSrc ? (
                                        <img
                                            src={logoSrc}
                                            alt={method}
                                            loading="lazy"
                                            decoding="async"
                                            className="h-5 w-auto max-w-[68px] object-contain"
                                        />
                                    ) : (
                                        <span className="text-[11px] font-semibold text-gray-600 dark:text-slate-300">{method}</span>
                                    )}
                                </motion.span>
                            );
                        })}
                    </div>
                </motion.div>

                <motion.div
                    variants={staggerContainer(0.07)}
                    initial={entrance(reduceMotion, 'hidden')}
                    whileInView="show"
                    viewport={{ once: true, amount: 0.4 }}
                    className="flex flex-wrap items-center gap-x-6 gap-y-3 text-xs text-gray-500 dark:text-slate-400"
                >
                    {trust.guarantees.map((label, index) => (
                        <motion.span key={`${label}-${index}`} variants={fadeUp} className="inline-flex items-center gap-2">
                            <ShieldCheck size={15} className="text-purple-600 dark:text-purple-400" />
                            {label}
                        </motion.span>
                    ))}
                </motion.div>
            </div>
        </motion.section>
    );
}
