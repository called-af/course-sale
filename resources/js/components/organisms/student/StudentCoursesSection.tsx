import { Link } from '@inertiajs/react';
import { BookOpen, Compass } from 'lucide-react';
import { useMemo, useState } from 'react';
import Button from '@/components/atoms/Button';
import TabButton from '@/components/atoms/TabButton';
import DashboardPanel from '@/components/molecules/DashboardPanel';
import EnrolledCourseCard from '@/components/molecules/EnrolledCourseCard';
import SearchInput from '@/components/molecules/SearchInput';
import type { ContinueLearningEnrollment } from '@/types/dashboard';

type CourseTab = 'all' | 'in_progress' | 'completed' | 'not_started';

interface StudentCoursesSectionProps {
    enrolledCourses: ContinueLearningEnrollment[];
}

export default function StudentCoursesSection({ enrolledCourses }: StudentCoursesSectionProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState<CourseTab>('all');

    const inProgressList = useMemo(
        () => enrolledCourses.filter((item) => (item.course.progress_percent ?? 0) > 0 && (item.course.progress_percent ?? 0) < 100),
        [enrolledCourses],
    );

    const completedList = useMemo(() => enrolledCourses.filter((item) => (item.course.progress_percent ?? 0) === 100), [enrolledCourses]);

    const notStartedList = useMemo(() => enrolledCourses.filter((item) => (item.course.progress_percent ?? 0) === 0), [enrolledCourses]);

    const filteredCourses = useMemo(() => {
        let baseList = enrolledCourses;
        if (activeTab === 'in_progress') baseList = inProgressList;
        else if (activeTab === 'completed') baseList = completedList;
        else if (activeTab === 'not_started') baseList = notStartedList;

        if (!searchQuery.trim()) return baseList;

        const query = searchQuery.toLowerCase();

        return baseList.filter((item) => {
            const title = item.course.title?.toLowerCase() ?? '';
            const creator = item.course.creator?.name?.toLowerCase() ?? '';
            return title.includes(query) || creator.includes(query);
        });
    }, [enrolledCourses, activeTab, inProgressList, completedList, notStartedList, searchQuery]);

    const emptyTitle = searchQuery
        ? 'No courses match your search'
        : activeTab === 'completed'
          ? 'No completed courses yet'
          : activeTab === 'in_progress'
            ? 'No courses in progress'
            : 'You are not enrolled in any courses yet';

    return (
        <DashboardPanel
            title="My Courses"
            description="Track your progress and continue learning your course lessons."
            action={<SearchInput value={searchQuery} onChange={setSearchQuery} placeholder="Search my courses..." />}
            bodyClassName="p-5 sm:p-6"
        >
            <div className="flex flex-wrap items-center gap-1.5">
                <TabButton active={activeTab === 'all'} onClick={() => setActiveTab('all')} label={`All (${enrolledCourses.length})`} />
                <TabButton
                    active={activeTab === 'in_progress'}
                    onClick={() => setActiveTab('in_progress')}
                    label={`In Progress (${inProgressList.length})`}
                />
                <TabButton
                    active={activeTab === 'completed'}
                    onClick={() => setActiveTab('completed')}
                    label={`Completed (${completedList.length})`}
                />
                {notStartedList.length > 0 && (
                    <TabButton
                        active={activeTab === 'not_started'}
                        onClick={() => setActiveTab('not_started')}
                        label={`Not Started (${notStartedList.length})`}
                    />
                )}
            </div>

            <div className="mt-5">
                {filteredCourses.length > 0 ? (
                    <div className="grid gap-4 sm:grid-cols-2">
                        {filteredCourses.map((item) => (
                            <EnrolledCourseCard key={item.course.id} course={item.course} />
                        ))}
                    </div>
                ) : (
                    <div className="border border-dashed border-slate-200 py-12 text-center dark:border-slate-700">
                        <div className="mx-auto flex h-12 w-12 items-center justify-center bg-slate-100 text-slate-400 dark:bg-slate-700 dark:text-slate-300">
                            <BookOpen size={20} />
                        </div>
                        <p className="mt-3 text-sm font-semibold text-slate-700 dark:text-slate-200">{emptyTitle}</p>
                        <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                            {searchQuery
                                ? 'Try another keyword to find courses.'
                                : 'Visit the catalog to discover courses that match your interests.'}
                        </p>
                        {enrolledCourses.length === 0 && (
                            <div className="mt-4">
                                <Link href="/course">
                                    <Button size="sm" leftIcon={<Compass size={14} />} className="!rounded-none">
                                        Explore Course Catalog
                                    </Button>
                                </Link>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </DashboardPanel>
    );
}
