import { Lock, ShieldCheck } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';

const PAYMENT_METHODS = ['BCA', 'Mandiri', 'BNI', 'BRI', 'QRIS', 'GoPay', 'OVO', 'DANA', 'Visa', 'Mastercard'];

/**
 * Compact trust strip: payment methods and purchase guarantees.
 * Static labels for now; replace with gateway logos when they are available.
 */
export default function TrustBar() {
    const reduceMotion = useReducedMotion();

    return (
        <motion.section
            className="border-y border-slate-200 bg-white py-8 dark:border-slate-800 dark:bg-[#141416]"
            initial={reduceMotion ? false : { opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.6, ease: [0.22, 0.61, 0.36, 1] }}
        >
            <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 sm:px-8 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex flex-col gap-3">
                    <span className="inline-flex items-center gap-2 text-[11px] font-semibold tracking-[0.18em] text-gray-400 uppercase dark:text-slate-500">
                        <Lock size={12} />
                        Secure checkout
                    </span>
                    <div className="flex flex-wrap items-center gap-2">
                        {PAYMENT_METHODS.map((method) => (
                            <span
                                key={method}
                                className="border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-gray-600 dark:border-slate-700 dark:bg-[#1e1f24] dark:text-slate-300"
                            >
                                {method}
                            </span>
                        ))}
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-xs text-gray-500 dark:text-slate-400">
                    <span className="inline-flex items-center gap-2">
                        <ShieldCheck size={15} className="text-purple-600 dark:text-purple-400" />
                        7-day money-back guarantee
                    </span>
                    <span className="inline-flex items-center gap-2">
                        <ShieldCheck size={15} className="text-purple-600 dark:text-purple-400" />
                        Encrypted payment gateway
                    </span>
                    <span className="inline-flex items-center gap-2">
                        <ShieldCheck size={15} className="text-purple-600 dark:text-purple-400" />
                        Instant course access
                    </span>
                </div>
            </div>
        </motion.section>
    );
}
