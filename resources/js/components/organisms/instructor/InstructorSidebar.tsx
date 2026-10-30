import { FileText, LayoutGrid, MessageSquare, UserPlus } from 'lucide-react';
import DashboardPanel from '@/components/molecules/DashboardPanel';
import RecentEnrollmentsList from '@/components/molecules/RecentEnrollmentsList';
import RecentReviewsList from '@/components/molecules/RecentReviewsList';
import StatusBreakdown from '@/components/molecules/StatusBreakdown';
import type { CourseStatusCounts, RecentEnrollment, RecentReview } from '@/types/dashboard';

interface InstructorSidebarProps {
    statusCounts: CourseStatusCounts;
    courseCount: number;
    totalLessons: number;
    recentEnrollments: RecentEnrollment[];
    recentReviews: RecentReview[];
}

export default function InstructorSidebar({
    statusCounts,
    courseCount,
    totalLessons,
    recentEnrollments,
    recentReviews,
}: InstructorSidebarProps) {
    const statusRows = [
        { key: 'published', label: 'Published', color: 'bg-emerald-500', value: statusCounts.published ?? 0 },
        { key: 'review', label: 'In Review', color: 'bg-blue-500', value: statusCounts.review ?? 0 },
        { key: 'draft', label: 'Draft', color: 'bg-amber-500', value: statusCounts.draft ?? 0 },
    ];

    return (
        <div className="space-y-8">
            <DashboardPanel title="Course Status" description="Publication breakdown." icon={<LayoutGrid size={15} />}>
                <StatusBreakdown items={statusRows} total={courseCount} />
                <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs dark:border-slate-700">
                    <span className="text-slate-400 dark:text-slate-500">Total lessons</span>
                    <span className="inline-flex items-center gap-1 font-bold text-slate-700 dark:text-slate-200">
                        <FileText size={12} /> {totalLessons}
                    </span>
                </div>
            </DashboardPanel>

            <DashboardPanel
                title="Recent Enrollments"
                description="Students who recently joined your classes."
                icon={<UserPlus size={15} />}
            >
                <RecentEnrollmentsList enrollments={recentEnrollments} />
            </DashboardPanel>

            <DashboardPanel
                title="Recent Reviews"
                description="What students say about your courses."
                icon={<MessageSquare size={15} />}
            >
                <RecentReviewsList reviews={recentReviews} />
            </DashboardPanel>
        </div>
    );
}
