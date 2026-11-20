import { motion, useReducedMotion } from 'motion/react';
import Badge from '@/components/atoms/Badge';
import RatingStars from '@/components/atoms/RatingStars';
import Title from '@/components/atoms/Title';
import CommentCard from '@/components/molecules/CommentCard';
import { useLanding } from '@/hooks/useLanding';
import type { TestimonialItem } from '@/types';

interface TestimonialSectionProps {
    /** Approved reviews, provided by the server. */
    testimonials?: TestimonialItem[];
}

const EASE: [number, number, number, number] = [0.22, 0.61, 0.36, 1];

export default function TestimonialSection({ testimonials = [] }: TestimonialSectionProps) {
    const { testimonial } = useLanding();
    const reduceMotion = useReducedMotion();

    const averageRating = testimonials.length > 0 ? testimonials.reduce((total, item) => total + item.rating, 0) / testimonials.length : 0;

    return (
        <section className="relative overflow-hidden bg-gray-100 py-24 dark:bg-[#141416]">
            <div className="relative mx-auto max-w-7xl px-4 sm:px-8">
                {/* Header */}
                <motion.div
                    initial={reduceMotion ? false : { opacity: 0, y: 24 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.4 }}
                    transition={{ duration: 0.6, ease: EASE }}
                    className="mb-12 flex flex-col justify-between gap-8 lg:flex-row lg:items-end"
                >
                    <div className="flex flex-col gap-4">
                        <Badge variant="purple" dot>
                            {testimonial.badge}
                        </Badge>
                        <Title as="h2" className="leading-tight" style={{ fontSize: 'clamp(1.8rem,4vw,2.8rem)' }}>
                            {testimonial.title_lead}
                            <span className="relative isolate inline-block bg-purple-400 px-2">
                                <span
                                    aria-hidden
                                    className="pointer-events-none absolute -inset-x-8 -inset-y-6 -z-10 rounded-full bg-purple-400/25 blur-2xl dark:bg-purple-500/25"
                                />
                                {testimonial.title_highlight}
                            </span>
                        </Title>
                        <p className="max-w-md text-sm leading-relaxed text-gray-500 dark:text-slate-400">{testimonial.description}</p>
                    </div>

                    {testimonials.length > 0 && (
                        <div className="flex items-center gap-4 bg-white p-5 lg:w-80 dark:bg-[#1e1f24]">
                            <span className="font-display text-4xl leading-none text-gray-900 dark:text-white">{averageRating.toFixed(1)}</span>
                            <div className="flex flex-col gap-1.5">
                                <RatingStars value={averageRating} size={14} />
                                <span className="text-xs text-gray-500 dark:text-slate-400">
                                    Based on {testimonials.length} verified review{testimonials.length === 1 ? '' : 's'}
                                </span>
                            </div>
                        </div>
                    )}
                </motion.div>

                {/* Grid */}
                {testimonials.length > 0 ? (
                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                        {testimonials.map((item, index) => (
                            <motion.div
                                key={item.id}
                                initial={reduceMotion ? false : { opacity: 0, y: 28 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, amount: 0.15 }}
                                transition={{ duration: 0.5, delay: Math.min(index, 5) * 0.06, ease: EASE }}
                                className="group relative z-0 h-full hover:z-10"
                            >
                                <div className="h-full">
                                    <CommentCard name={item.name} role={item.role} avatar={item.avatar} comment={item.comment} rating={item.rating} />
                                </div>
                            </motion.div>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center gap-2 border border-dashed border-slate-300 bg-white/60 py-20 text-center dark:border-slate-700 dark:bg-[#1e1f24]/40">
                        <Title as="h4" className="text-gray-700 dark:text-slate-200">
                            No testimonials yet
                        </Title>
                        <p className="max-w-sm px-6 text-sm text-gray-500 dark:text-slate-400">
                            Approved course reviews will appear here automatically.
                        </p>
                    </div>
                )}
            </div>
        </section>
    );
}
