import { Head } from '@inertiajs/react';
import { Filter, Sparkles, X } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useMemo, useState } from 'react';
import Badge from '@/components/atoms/Badge';
import Button from '@/components/atoms/Button';
import Title from '@/components/atoms/Title';
import InputField from '@/components/molecules/InputField';
import CourseResults from '@/components/organisms/Course/CourseResults';
import WelcomeLayout from '@/components/templates/WelcomeLayout';
import { EASE, entrance, staggerContainer } from '@/lib/motion';
import type { Course as CourseType } from '@/types';

type RecommendedCourse = CourseType & {
    recommendation_reason?: string;
    matching_tags?: string[];
    recommendation_score?: number;
};

interface CoursePageProps {
    courses: CourseType[];
    recommendedCourses?: RecommendedCourse[];
}

const fadeUp = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: EASE } },
};

const selectClassName =
    'border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-purple-700 focus:ring-1 focus:ring-purple-700 dark:border-slate-600 dark:bg-[#141416] dark:text-slate-200 dark:focus:border-purple-500 dark:focus:ring-purple-500';

export default function CoursePage({ courses = [], recommendedCourses = [] }: CoursePageProps) {
    const reduceMotion = useReducedMotion();
    const [search, setSearch] = useState('');
    const [selectedLevel, setSelectedLevel] = useState<string>('all');
    const [selectedType, setSelectedType] = useState<string>('all');
    const [onlyRecommended, setOnlyRecommended] = useState(false);

    const filteredCourses = useMemo(() => {
        const list = onlyRecommended ? recommendedCourses : courses;
        return list.filter((course) => {
            const matchSearch =
                course.title.toLowerCase().includes(search.toLowerCase()) ||
                (course.description?.toLowerCase().includes(search.toLowerCase()) ?? false) ||
                (course.creator?.name?.toLowerCase().includes(search.toLowerCase()) ?? false);

            const matchLevel = selectedLevel === 'all' || course.level?.toLowerCase() === selectedLevel.toLowerCase();

            const matchType = selectedType === 'all' || course.type?.toLowerCase() === selectedType.toLowerCase();

            return matchSearch && matchLevel && matchType;
        });
    }, [courses, recommendedCourses, onlyRecommended, search, selectedLevel, selectedType]);

    const hasActiveFilters = search !== '' || selectedLevel !== 'all' || selectedType !== 'all' || onlyRecommended;

    const resetFilters = () => {
        setSearch('');
        setSelectedLevel('all');
        setSelectedType('all');
        setOnlyRecommended(false);
    };

    const emptyMessage = hasActiveFilters
        ? onlyRecommended
            ? 'No recommended courses match the current filter. Try resetting filters.'
            : 'Try adjusting your search terms or filter options.'
        : 'No courses are available yet. Please check back soon.';

    return (
        <>
            <Head title="Explore Courses" />

            <section className="relative min-h-screen overflow-hidden bg-gray-100 pt-24 pb-20 dark:bg-[#141416]">
                <div className="relative mx-auto max-w-7xl px-4 sm:px-8">
                    {/* Header */}
                    <motion.div
                        variants={staggerContainer(0.08)}
                        initial={entrance(reduceMotion, 'hidden')}
                        whileInView="show"
                        viewport={{ once: true, amount: 0.3 }}
                        className="mb-10 flex flex-col justify-between gap-8 lg:flex-row lg:items-end"
                    >
                        <div className="flex flex-col gap-4">
                            <motion.div variants={fadeUp}>
                                <Badge variant="purple" dot>
                                    Explore Courses
                                </Badge>
                            </motion.div>
                            <motion.div variants={fadeUp}>
                                <Title as="h1" className="leading-tight" style={{ fontSize: 'clamp(1.8rem,4vw,2.8rem)' }}>
                                    Find the Course That's
                                    <span className="relative isolate ml-2 inline-block bg-purple-400 px-2">
                                        <span
                                            aria-hidden
                                            className="pointer-events-none absolute -inset-x-8 -inset-y-6 -z-10 rounded-full bg-purple-400/25 blur-2xl dark:bg-purple-500/25"
                                        />
                                        Right for You
                                    </span>
                                </Title>
                            </motion.div>
                            <motion.p variants={fadeUp} className="max-w-md text-sm leading-relaxed text-gray-500 dark:text-slate-400">
                                Browse top-rated courses taught by industry practitioners — filter by level, access type, or your personalized
                                recommendations.
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

                    {/* Filters */}
                    <motion.div
                        initial={reduceMotion ? false : { opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, amount: 0.4 }}
                        transition={{ duration: 0.5, delay: 0.05, ease: EASE }}
                        className="mb-8 flex flex-col gap-5 bg-white p-4 shadow-sm sm:flex-row sm:flex-wrap sm:items-end sm:justify-between dark:bg-[#1e1f24]"
                    >
                        <div className="flex flex-wrap items-end gap-4">
                            {/* Level Filter */}
                            <div className="flex flex-col gap-1">
                                <span className="flex items-center gap-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
                                    <Filter className="h-3 w-3" /> Level
                                </span>
                                <select value={selectedLevel} onChange={(e) => setSelectedLevel(e.target.value)} className={selectClassName}>
                                    <option value="all">All Levels</option>
                                    <option value="beginner">Beginner</option>
                                    <option value="intermediate">Intermediate</option>
                                    <option value="advanced">Advanced</option>
                                </select>
                            </div>

                            {/* Access Type Filter */}
                            <div className="flex flex-col gap-1">
                                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Type</span>
                                <select value={selectedType} onChange={(e) => setSelectedType(e.target.value)} className={selectClassName}>
                                    <option value="all">All Types</option>
                                    <option value="free">Free</option>
                                    <option value="paid">Paid</option>
                                </select>
                            </div>

                            {/* Recommended Filter */}
                            <div className="flex flex-col gap-1">
                                <span className="flex items-center gap-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
                                    <Sparkles className="h-3 w-3 text-purple-600 dark:text-purple-400" /> Recommendation
                                </span>
                                <Button
                                    type="button"
                                    variant={onlyRecommended ? 'primary' : 'outline'}
                                    size="sm"
                                    onClick={() => setOnlyRecommended((prev) => !prev)}
                                    leftIcon={<Sparkles className="h-3.5 w-3.5" />}
                                    rightIcon={
                                        recommendedCourses.length > 0 ? (
                                            <span
                                                className={`px-1.5 py-0.5 text-[10px] font-bold ${
                                                    onlyRecommended
                                                        ? 'bg-amber-400 text-slate-900'
                                                        : 'bg-purple-200 text-purple-800 dark:bg-purple-900/60 dark:text-purple-300'
                                                }`}
                                            >
                                                {recommendedCourses.length}
                                            </span>
                                        ) : undefined
                                    }
                                    className="!rounded-none"
                                >
                                    {onlyRecommended ? 'Recommended: ON' : 'Recommended for You'}
                                </Button>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <span className="text-xs text-gray-500 dark:text-slate-400">
                                {filteredCourses.length} course{filteredCourses.length === 1 ? '' : 's'}
                            </span>
                            {hasActiveFilters && (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={resetFilters}
                                    leftIcon={<X size={13} />}
                                    className="!rounded-none !text-purple-700 hover:!text-purple-900 dark:!text-purple-300 dark:hover:!text-purple-100"
                                >
                                    Reset
                                </Button>
                            )}
                        </div>
                    </motion.div>

                    {/* Recommended notice */}
                    <AnimatePresence initial={false}>
                        {onlyRecommended && (
                            <motion.div
                                initial={entrance(reduceMotion, { opacity: 0, y: 12 })}
                                animate={{ opacity: 1, y: 0 }}
                                exit={reduceMotion ? undefined : { opacity: 0, y: -8 }}
                                transition={{ duration: 0.35, ease: EASE }}
                                className="mb-6 flex items-center justify-between gap-3 border border-purple-200 bg-purple-50 p-4 text-xs text-purple-900 dark:border-purple-900/50 dark:bg-purple-950/40 dark:text-purple-200"
                            >
                                <div className="flex items-center gap-2">
                                    <Sparkles size={16} className="shrink-0 text-purple-600 dark:text-purple-400" />
                                    <span>
                                        Showing <strong>{filteredCourses.length} personalized recommendations</strong> based on your learning activity
                                        and interests.
                                    </span>
                                </div>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setOnlyRecommended(false)}
                                    leftIcon={<X size={14} />}
                                    className="!rounded-none !text-purple-700 hover:!text-purple-900 dark:!text-purple-300 dark:hover:!text-purple-100"
                                >
                                    Clear
                                </Button>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Course Grid — shared with the landing Course section */}
                    <CourseResults
                        courses={filteredCourses}
                        search={search}
                        emptyMessage={emptyMessage}
                        onReset={resetFilters}
                        resetLabel="Reset Filters"
                        beforeCard={(course) => {
                            const recommended = course as RecommendedCourse;

                            if (!onlyRecommended || !recommended.recommendation_reason) {
                                return null;
                            }

                            return (
                                <div className="mb-2 flex items-center gap-1.5 bg-purple-50 px-2.5 py-1 text-[11px] font-medium text-purple-800 dark:bg-purple-950/40 dark:text-purple-300">
                                    <Sparkles size={12} className="shrink-0 text-purple-600 dark:text-purple-400" />
                                    <span className="truncate">{recommended.recommendation_reason}</span>
                                </div>
                            );
                        }}
                    />
                </div>
            </section>
        </>
    );
}

CoursePage.layout = (page: React.ReactNode) => <WelcomeLayout>{page}</WelcomeLayout>;
