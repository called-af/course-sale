import { Award, LayoutGrid, Star, Users, Wallet } from 'lucide-react';
import KpiStrip from '@/components/molecules/KpiStrip';
import { formatRupiah } from '@/lib/dashboard';

interface InstructorKpiStripProps {
    courseCount: number;
    publishedCount: number;
    draftCount: number;
    totalStudents: number;
    newStudentsThisMonth: number;
    totalEarnings: number;
    paidCourses: number;
    averageRating: number;
    totalReviews: number;
    totalCertificates: number;
    completionRate: number;
}

export default function InstructorKpiStrip({
    courseCount,
    publishedCount,
    draftCount,
    totalStudents,
    newStudentsThisMonth,
    totalEarnings,
    paidCourses,
    averageRating,
    totalReviews,
    totalCertificates,
    completionRate,
}: InstructorKpiStripProps) {
    return (
        <KpiStrip
            items={[
                {
                    icon: <LayoutGrid size={16} />,
                    label: 'Total Courses',
                    value: courseCount,
                    sub: `${publishedCount} published · ${draftCount} draft`,
                    tint: 'bg-purple-50 text-purple-600 dark:bg-purple-950/50 dark:text-purple-400',
                },
                {
                    icon: <Users size={16} />,
                    label: 'Total Students',
                    value: totalStudents,
                    sub: `${newStudentsThisMonth} new this month`,
                    tint: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400',
                },
                {
                    icon: <Wallet size={16} />,
                    label: 'Estimated Earnings',
                    value: formatRupiah(totalEarnings),
                    sub: `${paidCourses} paid ${paidCourses === 1 ? 'course' : 'courses'}`,
                    tint: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400',
                },
                {
                    icon: <Star size={16} />,
                    label: 'Average Rating',
                    value: averageRating ? `${averageRating} / 5` : '—',
                    sub: `${totalReviews} ${totalReviews === 1 ? 'review' : 'reviews'}`,
                    tint: 'bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400',
                },
                {
                    icon: <Award size={16} />,
                    label: 'Certificates Issued',
                    value: totalCertificates,
                    sub: `${completionRate}% completion rate`,
                    tint: 'bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400',
                },
            ]}
        />
    );
}
