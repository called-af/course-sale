import { Quote } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import RatingStars from '@/components/atoms/RatingStars';
import { EASE, SOFT_SPRING, entrance } from '@/lib/motion';

interface CommentCardProps {
    name: string;
    role: string;
    avatar: string;
    comment: string;
    rating: number;
}

export default function CommentCard({ name, role, avatar, comment, rating }: CommentCardProps) {
    const reduceMotion = useReducedMotion();

    return (
        <motion.div
            initial={entrance(reduceMotion, 'rest')}
            animate="rest"
            whileHover={reduceMotion ? undefined : 'hover'}
            variants={{ rest: { y: 0 }, hover: { y: -4 } }}
            transition={SOFT_SPRING}
            className="relative flex h-full flex-col gap-4 overflow-hidden rounded-lg bg-white p-6 transition-colors duration-300 hover:bg-gray-50 dark:bg-[#1e1f24] dark:hover:bg-[#25262b]"
        >
            <motion.span
                aria-hidden
                variants={{ rest: { scaleX: 0 }, hover: { scaleX: 1 } }}
                transition={{ duration: 0.5, ease: EASE }}
                className="absolute inset-x-0 top-0 h-0.5 origin-left bg-purple-500"
            />

            <motion.div
                variants={{ rest: { rotate: 0, scale: 1 }, hover: { rotate: -12, scale: 1.08 } }}
                transition={SOFT_SPRING}
                className="pointer-events-none absolute top-5 right-5"
            >
                <Quote aria-hidden size={30} className="text-slate-100 dark:text-slate-800" />
            </motion.div>

            <RatingStars value={rating} size={13} />

            <p className="flex-1 text-sm leading-relaxed text-gray-600 dark:text-slate-300">"{comment}"</p>

            <div className="flex items-center gap-3 border-t border-gray-100 pt-4 dark:border-slate-700">
                <motion.img
                    src={avatar}
                    alt={name}
                    variants={{ rest: { scale: 1 }, hover: { scale: 1.08 } }}
                    transition={SOFT_SPRING}
                    className="h-10 w-10 object-cover"
                />
                <div>
                    <div className="text-sm font-semibold text-gray-900 dark:text-white">{name}</div>
                    <div className="text-xs text-gray-500 dark:text-slate-400">{role}</div>
                </div>
            </div>
        </motion.div>
    );
}
