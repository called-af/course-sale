import { SearchX } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import type { ReactNode } from 'react';
import Button from '@/components/atoms/Button';
import Title from '@/components/atoms/Title';
import CourseCard from '@/components/molecules/CourseCard';
import { EASE, VIEWPORT_ONCE, entrance } from '@/lib/motion';
import type { Course } from '@/types';

interface CourseResultsProps {
    courses: Course[];
    /** Used to build the default empty message. */
    search?: string;
    emptyTitle?: string;
    emptyMessage?: ReactNode;
    onReset?: () => void;
    resetLabel?: string;
    /** Optional badge rendered above each card (e.g. a recommendation reason). */
    beforeCard?: (course: Course, index: number) => ReactNode;
    /** Show owner-only controls (preview, delete). Defaults to true. */
    manageable?: boolean;
}

export default function CourseResults({
    courses,
    search = '',
    emptyTitle = 'No courses found',
    emptyMessage,
    onReset,
    resetLabel = 'Reset Search',
    beforeCard,
    manageable = true,
}: CourseResultsProps) {
    const reduceMotion = useReducedMotion();

    if (courses.length === 0) {
        return (
            <motion.div
                initial={entrance(reduceMotion, { opacity: 0, y: 16 })}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: EASE }}
                className="flex flex-col items-center gap-4 border border-dashed border-slate-300 bg-white/60 py-24 text-center dark:border-slate-700 dark:bg-[#1e1f24]/40"
            >
                <motion.div
                    animate={reduceMotion ? undefined : { y: [0, -5, 0] }}
                    transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
                    className="flex h-14 w-14 items-center justify-center border border-slate-200 bg-slate-50 text-slate-400 dark:border-slate-700 dark:bg-[#1e1f24] dark:text-slate-500"
                >
                    <SearchX size={22} />
                </motion.div>
                <Title as="h4" className="text-gray-700 dark:text-slate-200">
                    {emptyTitle}
                </Title>
                <p className="max-w-sm px-6 text-sm text-gray-500 dark:text-slate-400">
                    {emptyMessage ??
                        (search
                            ? `We couldn't find anything for "${search}". Try another keyword or reset the search.`
                            : 'No courses are available yet. Please check back soon.')}
                </p>
                {onReset && (
                    <Button variant="outline" className="mt-1" onClick={onReset}>
                        {resetLabel}
                    </Button>
                )}
            </motion.div>
        );
    }

    return (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            <AnimatePresence initial={false} mode="popLayout">
                {courses.map((course, index) => (
                    <motion.div
                        key={course.id || course.slug}
                        layout={!reduceMotion}
                        initial={entrance(reduceMotion, { opacity: 0, y: 28, scale: 0.98 })}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={reduceMotion ? undefined : { opacity: 0, y: -12, scale: 0.96 }}
                        whileInView={{ opacity: 1, y: 0, scale: 1 }}
                        viewport={VIEWPORT_ONCE}
                        transition={{
                            duration: 0.5,
                            delay: Math.min(index, 7) * 0.06,
                            ease: EASE,
                            layout: { type: 'spring', stiffness: 260, damping: 28 },
                        }}
                        className="group relative z-0 h-full hover:z-10"
                    >
                        <motion.div
                            whileHover={reduceMotion ? undefined : { y: -6 }}
                            transition={{ type: 'spring', stiffness: 320, damping: 24 }}
                            className="flex h-full flex-col"
                        >
                            {beforeCard?.(course, index)}
                            <CourseCard course={course} manageable={manageable} />
                        </motion.div>
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
}
