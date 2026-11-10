import { Link } from '@inertiajs/react';
import { ArrowRight } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import Badge from '@/components/atoms/Badge';
import Button from '@/components/atoms/Button';
import Title from '@/components/atoms/Title';
import { useLanding } from '@/hooks/useLanding';

import type { CategorySectionProps } from '@/types/category';

const EASE: [number, number, number, number] = [0.22, 0.61, 0.36, 1];

export default function CategorySection({ categories }: CategorySectionProps) {
    const reduceMotion = useReducedMotion();
    const { career } = useLanding();

    return (
        <section className="relative overflow-hidden bg-gray-100 py-24 dark:bg-[#141416]">
            <div className="relative mx-auto max-w-7xl px-4 sm:px-8">
                {/* Header */}
                <motion.div
                    initial={reduceMotion ? false : { opacity: 0, y: 24 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.4 }}
                    transition={{ duration: 0.6, ease: EASE }}
                    className="mb-12 flex flex-col justify-between gap-6 lg:flex-row lg:items-end"
                >
                    <div className="flex flex-col gap-4">
                        <Badge variant="purple" dot>
                            {career.badge}
                        </Badge>
                        <Title as="h2" className="leading-tight" style={{ fontSize: 'clamp(1.8rem,4vw,2.8rem)' }}>
                            {career.title_lead}
                            <span className="relative isolate inline-block bg-purple-400 px-2">
                                <span
                                    aria-hidden
                                    className="pointer-events-none absolute -inset-x-8 -inset-y-6 -z-10 rounded-full bg-purple-400/25 blur-2xl dark:bg-purple-500/25"
                                />
                                {career.title_highlight}
                            </span>
                        </Title>
                    </div>

                    <p className="max-w-xs text-sm leading-relaxed text-gray-500 lg:text-right dark:text-slate-400">{career.description}</p>
                </motion.div>

                {/* Grid */}
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                    {categories.map((category, index) => (
                        <motion.div
                            key={category.id}
                            initial={reduceMotion ? false : { opacity: 0, y: 28 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, amount: 0.2 }}
                            transition={{ duration: 0.5, delay: index * 0.07, ease: EASE }}
                            className="group relative z-0 hover:z-10"
                        >
                            <motion.article
                                whileHover={reduceMotion ? undefined : { y: -6 }}
                                transition={{ type: 'spring', stiffness: 320, damping: 24 }}
                                className="relative flex h-full flex-col gap-5 border border-slate-200/80 bg-white p-8 transition-colors duration-300 focus-within:border-purple-300 hover:border-purple-200 hover:bg-gray-50 dark:border-slate-700 dark:bg-[#141416] dark:focus-within:border-purple-600 dark:hover:border-purple-800 dark:hover:bg-[#1e1f24]"
                            >
                                {/* Accent line that grows on hover */}
                                <span
                                    aria-hidden
                                    className="absolute inset-x-0 top-0 h-0.5 origin-left scale-x-0 bg-purple-500 transition-transform duration-500 group-hover:scale-x-100"
                                />

                                {/* Icon */}
                                <div className="flex h-12 w-12 shrink-0 items-center justify-center border border-slate-200 bg-slate-50 text-2xl transition-colors duration-300 group-hover:border-purple-300 group-hover:bg-purple-50 dark:border-slate-700 dark:bg-[#1e1f24] dark:group-hover:border-purple-600 dark:group-hover:bg-purple-950/40">
                                    {category.img_url ? (
                                        <img src={category.img_url} alt="" className="h-6 w-6 object-cover" />
                                    ) : (
                                        <span aria-hidden>📚</span>
                                    )}
                                </div>

                                <div className="flex flex-col gap-1">
                                    <Title
                                        as="h4"
                                        className="text-gray-900 transition-colors group-hover:text-purple-700 dark:text-white dark:group-hover:text-purple-400"
                                    >
                                        {category.name}
                                    </Title>
                                    <span className="text-xs font-medium tracking-widest text-purple-500 uppercase">Category</span>
                                </div>

                                <p className="text-sm leading-relaxed text-gray-500 dark:text-slate-400">
                                    {category.desc ?? 'Explore a variety of courses in this category.'}
                                </p>

                                <div className="mt-auto pt-4">
                                    <Link
                                        href={`/courses?category=${category.slug}`}
                                        className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 transition-colors group-hover:text-purple-600 dark:text-slate-400 dark:group-hover:text-purple-400"
                                    >
                                        View Courses
                                        <ArrowRight size={15} className="transition-transform duration-300 group-hover:translate-x-1" />
                                    </Link>
                                </div>
                            </motion.article>
                        </motion.div>
                    ))}
                </div>

                {/* CTA */}
                <motion.div
                    initial={reduceMotion ? false : { opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.6 }}
                    transition={{ duration: 0.5, delay: 0.1, ease: EASE }}
                    className="mt-10 flex justify-center"
                >
                    <Link href={career.cta_href}>
                        <Button variant="outline" rightIcon={<ArrowRight size={16} />} className="px-8 py-3 text-base">
                            {career.cta_label}
                        </Button>
                    </Link>
                </motion.div>
            </div>
        </section>
    );
}
