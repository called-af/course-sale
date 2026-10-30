import { Link } from '@inertiajs/react';
import { BookOpen, Star, Users } from 'lucide-react';
import PageHeader from '@/components/molecules/PageHeader';

interface InstructorHeroProps {
    userName: string;
    courseCount: number;
    publishedCount: number;
    totalStudents: number;
    averageRating: number;
}

export default function InstructorHero({ userName, courseCount, publishedCount, totalStudents, averageRating }: InstructorHeroProps) {
    const description =
        courseCount === 0
            ? 'Create your first course and start sharing your knowledge with students.'
            : `You have ${publishedCount} published ${publishedCount === 1 ? 'course' : 'courses'} and ${totalStudents} active ${totalStudents === 1 ? 'student' : 'students'}. Keep creating impactful lessons!`;

    return (
        <PageHeader
            breadcrumbs={[{ label: 'Instructor' }, { label: 'Dashboard' }]}
            title={`Welcome back, ${userName}`}
            description={description}
            stats={[
                { icon: <BookOpen size={18} />, value: courseCount, label: 'Courses' },
                { icon: <Users size={18} />, value: totalStudents, label: 'Students' },
                { icon: <Star size={18} />, value: averageRating ? `${averageRating}` : '—', label: 'Rating' },
            ]}
            actions={
                <Link
                    href="/instructor/courses"
                    className="inline-flex items-center gap-1.5 bg-purple-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-purple-700"
                >
                    <BookOpen size={14} />
                    Manage Courses
                </Link>
            }
        />
    );
}
