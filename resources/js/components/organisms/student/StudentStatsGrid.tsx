import { Award, BookOpen, CheckCircle, Clock, TrendingUp } from 'lucide-react';
import StatCard from '@/components/atoms/StatCard';
import { formatDuration } from '@/lib/dashboard';

interface StudentStatsGridProps {
    enrolledCount: number;
    inProgressCount: number;
    completedCount: number;
    totalCompleted: number;
    completionRate: number;
    learningMinutes: number;
    completedMaterials: number;
    totalCertificates: number;
    overallProgress: number;
}

export default function StudentStatsGrid({
    enrolledCount,
    inProgressCount,
    completedCount,
    totalCompleted,
    completionRate,
    learningMinutes,
    completedMaterials,
    totalCertificates,
    overallProgress,
}: StudentStatsGridProps) {
    return (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            <StatCard
                icon={<BookOpen size={18} />}
                label="Enrolled Courses"
                value={enrolledCount}
                subtext={`${inProgressCount} active · ${completedCount} completed`}
                tone="purple"
            />
            <StatCard
                icon={<CheckCircle size={18} />}
                label="Completed Courses"
                value={totalCompleted}
                subtext={`${completionRate}% completion rate`}
                tone="emerald"
            />
            <StatCard
                icon={<Clock size={18} />}
                label="Learning Time"
                value={formatDuration(learningMinutes)}
                subtext={`${completedMaterials} lessons completed`}
                tone="amber"
            />
            <StatCard
                icon={<Award size={18} />}
                label="Certificates"
                value={totalCertificates}
                subtext={totalCertificates > 0 ? 'Available to download' : 'Complete a course'}
                tone="indigo"
            />
            <StatCard
                icon={<TrendingUp size={18} />}
                label="Average Progress"
                value={`${overallProgress}%`}
                subtext="Across all courses"
                tone="purple"
            />
        </div>
    );
}
