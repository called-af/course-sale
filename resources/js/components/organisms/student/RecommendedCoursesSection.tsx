import { Link } from '@inertiajs/react';
import { ArrowRight, Sparkles } from 'lucide-react';
import DashboardPanel from '@/components/molecules/DashboardPanel';
import RecommendedCourseCard from '@/components/molecules/RecommendedCourseCard';
import type { RecommendedCourse } from '@/types/dashboard';

interface RecommendedCoursesSectionProps {
    courses: RecommendedCourse[];
}

export default function RecommendedCoursesSection({ courses }: RecommendedCoursesSectionProps) {
    if (courses.length === 0) return null;

    return (
        <DashboardPanel
            title="Recommended Courses for You"
            description="Personal recommendations based on your learning journey."
            icon={<Sparkles size={16} />}
            action={
                <Link
                    href="/course"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-purple-700 transition hover:text-purple-800 dark:text-purple-400 dark:hover:text-purple-300"
                >
                    View All
                    <ArrowRight size={13} />
                </Link>
            }
        >
            <div className="grid gap-4 sm:grid-cols-2">
                {courses.slice(0, 4).map((course) => (
                    <RecommendedCourseCard key={course.id} course={course} />
                ))}
            </div>
        </DashboardPanel>
    );
}
