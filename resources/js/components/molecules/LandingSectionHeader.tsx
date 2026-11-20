import clsx from 'clsx';
import { motion, useReducedMotion } from 'motion/react';

import Badge from '@/components/atoms/Badge';
import Title from '@/components/atoms/Title';
import { EASE, entrance, staggerContainer } from '@/lib/motion';

interface LandingSectionHeaderProps {
    badge: string;
    titleLead: string;
    titleHighlight: string;
    titleTail?: string;
    description?: string;
    align?: 'left' | 'center';
    className?: string;
    titleClassName?: string;
    descriptionClassName?: string;
}

const badgeVariants = {
    hidden: { opacity: 0, y: 10, scale: 0.96 },
    show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.45, ease: EASE } },
};

const titleVariants = {
    hidden: { opacity: 0, y: 18 },
    show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } },
};

const descriptionVariants = {
    hidden: { opacity: 0, y: 12 },
    show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE } },
};

/**
 * Shared header for landing sections. The badge, title and copy arrive as one
 * short choreography, with a single light sweep across the highlighted word.
 */
export default function LandingSectionHeader({
    badge,
    titleLead,
    titleHighlight,
    titleTail = '',
    description,
    align = 'left',
    className,
    titleClassName,
    descriptionClassName,
}: LandingSectionHeaderProps) {
    const reduceMotion = useReducedMotion();

    return (
        <motion.div
            variants={staggerContainer(0.09, 0.04)}
            initial={entrance(reduceMotion, 'hidden')}
            whileInView="show"
            viewport={{ once: true, amount: 0.35 }}
            className={clsx('flex flex-col gap-4', align === 'center' && 'items-center text-center', className)}
        >
            <motion.div variants={badgeVariants}>
                <Badge variant="purple" dot>
                    {badge}
                </Badge>
            </motion.div>

            <motion.div variants={titleVariants}>
                <Title as="h2" className={clsx('leading-tight', titleClassName)} style={{ fontSize: 'clamp(1.8rem,4vw,2.8rem)' }}>
                    {titleLead}
                    <span className="relative isolate inline-block bg-purple-400 px-2">
                        <span
                            aria-hidden
                            className="pointer-events-none absolute -inset-x-8 -inset-y-6 -z-20 rounded-full bg-purple-400/25 blur-2xl dark:bg-purple-500/25"
                        />
                        <span aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
                            <motion.span
                                initial={entrance(reduceMotion, { x: '-120%' })}
                                whileInView={{ x: '120%' }}
                                viewport={{ once: true, amount: 0.6 }}
                                transition={{ duration: 1.05, delay: 0.28, ease: EASE }}
                                className="absolute inset-y-0 -left-full w-full bg-gradient-to-r from-transparent via-white/40 to-transparent"
                            />
                        </span>
                        {titleHighlight}
                    </span>
                    {titleTail}
                </Title>
            </motion.div>

            {description && (
                <motion.p
                    variants={descriptionVariants}
                    className={clsx('max-w-md text-sm leading-relaxed text-gray-500 dark:text-slate-400', descriptionClassName)}
                >
                    {description}
                </motion.p>
            )}
        </motion.div>
    );
}
