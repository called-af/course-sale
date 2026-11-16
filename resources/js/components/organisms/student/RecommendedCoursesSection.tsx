import { Link } from '@inertiajs/react';
import { ArrowRight, Sparkles } from 'lucide-react';
import Button from '@/components/atoms/Button';
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
                <Link href="/course">
                    <Button variant="ghost" size="sm" rightIcon={<ArrowRight size={13} />} className="!rounded-none">
                        View All
                    </Button>
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
