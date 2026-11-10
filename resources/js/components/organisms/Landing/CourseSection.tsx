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
import type { Course } from '@/types';

interface CourseSectionProps {
    courses: Course[];
}

const EASE: [number, number, number, number] = [0.22, 0.61, 0.36, 1];

export default function CourseSection({ courses }: CourseSectionProps) {
    const reduceMotion = useReducedMotion();
    const { courses: copy } = useLanding();
    const { search, setSearch, filteredCourses } = useCourse(undefined, courses);

    return (
        <section className="relative overflow-hidden bg-gray-100 py-24 dark:bg-[#141416]" id="courses">
            <div className="relative mx-auto max-w-7xl px-4 sm:px-8">
                {/* Header */}
                <motion.div
                    initial={reduceMotion ? false : { opacity: 0, y: 24 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.3 }}
                    transition={{ duration: 0.6, ease: EASE }}
                    className="mb-12 flex flex-col justify-between gap-8 lg:flex-row lg:items-end"
                >
                    <div className="flex flex-col gap-4">
                        <Badge variant="purple" dot>
                            {copy.badge}
                        </Badge>
                        <Title as="h2" className="leading-tight" style={{ fontSize: 'clamp(1.8rem,4vw,2.8rem)' }}>
                            {copy.title_lead}
                            <span className="relative isolate inline-block bg-purple-400 px-2">
                                <span
                                    aria-hidden
                                    className="pointer-events-none absolute -inset-x-8 -inset-y-6 -z-10 rounded-full bg-purple-400/25 blur-2xl dark:bg-purple-500/25"
                                />
                                {copy.title_highlight}
                            </span>
                        </Title>
                        <p className="max-w-md text-sm leading-relaxed text-gray-500 dark:text-slate-400">{copy.description}</p>
                    </div>

                    <div className="w-full bg-white p-4 shadow-sm lg:w-80 dark:bg-[#1e1f24]">
                        <InputField
                            label="Search Courses"
                            placeholder="Search title or instructor..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </motion.div>

                {/* Courses */}
                <CourseResults courses={filteredCourses} search={search} onReset={search ? () => setSearch('') : undefined} manageable={false} />

                {/* CTA */}
                {filteredCourses.length > 0 && (
                    <motion.div
                        initial={reduceMotion ? false : { opacity: 0, y: 16 }}
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
