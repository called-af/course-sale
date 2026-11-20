import { Link } from '@inertiajs/react';
import { ArrowRight } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import Badge from '@/components/atoms/Badge';
import Button from '@/components/atoms/Button';
import Title from '@/components/atoms/Title';
import InputField from '@/components/molecules/InputField';
import CourseResults from '@/components/organisms/Course/CourseResults';
import { useCourse } from '@/hooks/useCourse';
import { useLanding } from '@/hooks/useLanding';
import { EASE, entrance, staggerContainer } from '@/lib/motion';
import type { Course } from '@/types';

interface CourseSectionProps {
    courses: Course[];
}

const fadeUp = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: EASE } },
};

export default function CourseSection({ courses }: CourseSectionProps) {
    const reduceMotion = useReducedMotion();
    const { courses: copy } = useLanding();
    const { search, setSearch, filteredCourses } = useCourse(undefined, courses);

    return (
        <section className="relative overflow-hidden bg-gray-100 py-24 dark:bg-[#141416]" id="courses">
            <div className="relative mx-auto max-w-7xl px-4 sm:px-8">
                {/* Header */}
                <motion.div
                    variants={staggerContainer(0.08)}
                    initial={entrance(reduceMotion, 'hidden')}
                    whileInView="show"
                    viewport={{ once: true, amount: 0.3 }}
                    className="mb-12 flex flex-col justify-between gap-8 lg:flex-row lg:items-end"
                >
                    <div className="flex flex-col gap-4">
                        <motion.div variants={fadeUp}>
                            <Badge variant="purple" dot>
                                {copy.badge}
                            </Badge>
                        </motion.div>
                        <motion.div variants={fadeUp}>
                            <Title as="h2" className="leading-tight" style={{ fontSize: 'clamp(1.8rem,4vw,2.8rem)' }}>
                                {copy.title_lead}
                                <span className="relative isolate inline-block bg-purple-400 px-2">
                                    <span
                                        aria-hidden
                                        className="pointer-events-none absolute -inset-x-8 -inset-y-6 -z-10 rounded-full bg-purple-400/25 blur-2xl dark:bg-purple-500/25"
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
                                    {copy.title_highlight}
                                </span>
                            </Title>
                        </motion.div>
                        <motion.p variants={fadeUp} className="max-w-md text-sm leading-relaxed text-gray-500 dark:text-slate-400">
                            {copy.description}
                        </motion.p>
                    </div>

                    <motion.div variants={fadeUp} className="w-full bg-white p-4 shadow-sm lg:w-80 dark:bg-[#1e1f24]">
                        <InputField
                            label="Search Courses"
                            placeholder="Search title or instructor..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </motion.div>
                </motion.div>

                {/* Courses */}
                <CourseResults courses={filteredCourses} search={search} onReset={search ? () => setSearch('') : undefined} manageable={false} />

                {/* CTA */}
                {filteredCourses.length > 0 && (
                    <motion.div
                        initial={entrance(reduceMotion, { opacity: 0, y: 16 })}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, amount: 0.6 }}
                        transition={{ duration: 0.5, delay: 0.1, ease: EASE }}
                        className="mt-12 flex justify-center"
                    >
                        <Link href={copy.cta_href}>
                            <Button variant="outline" rightIcon={<ArrowRight size={16} />} className="px-8 py-3 text-base">
                                {copy.cta_label}
                            </Button>
                        </Link>
                    </motion.div>
                )}
            </div>
        </section>
    );
}
