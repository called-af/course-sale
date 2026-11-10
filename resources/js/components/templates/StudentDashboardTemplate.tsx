import { Receipt } from 'lucide-react';
import { useMemo } from 'react';
import DashboardPanel from '@/components/molecules/DashboardPanel';
import ContinueLearningBanner from '@/components/organisms/student/ContinueLearningBanner';
import RecommendedCoursesSection from '@/components/organisms/student/RecommendedCoursesSection';
import StudentCoursesSection from '@/components/organisms/student/StudentCoursesSection';
import StudentHero from '@/components/organisms/student/StudentHero';
import StudentSidebar from '@/components/organisms/student/StudentSidebar';
import StudentStatsGrid from '@/components/organisms/student/StudentStatsGrid';
import { formatRupiah } from '@/lib/currency';
import type { ContinueLearningCourse, StudentDashboardProps } from '@/types/dashboard';

export default function StudentDashboardTemplate({
    auth,
    enrolledCourses = [],
    continueLearningCourse = null,
    totalCompleted = 0,
    overallProgress = 0,
    completedMaterials = 0,
    learningMinutes = 0,
    totalCertificates = 0,
    recentCertificates = [],
    weeklyActivity = [],
    averageQuizScore = null,
    quizzesCompleted = 0,
    recentActivities = [],
    recommendedCourses = [],
    orders = [],
    ai = null,
}: StudentDashboardProps) {
    const user = auth?.user;

    const inProgressList = useMemo(
        () => enrolledCourses.filter((item) => (item.course.progress_percent ?? 0) > 0 && (item.course.progress_percent ?? 0) < 100),
        [enrolledCourses],
    );

    const completedList = useMemo(() => enrolledCourses.filter((item) => (item.course.progress_percent ?? 0) === 100), [enrolledCourses]);

    const activeContinueCourse: ContinueLearningCourse | null = continueLearningCourse?.course ?? inProgressList[0]?.course ?? null;

    const completionRate = enrolledCourses.length > 0 ? Math.round((totalCompleted / enrolledCourses.length) * 100) : 0;
    const aiEnabled = Boolean(ai?.enabled);

    return (
        <div className="space-y-8">
            <StudentHero userName={user?.name ?? 'Student'} enrolledCount={enrolledCourses.length} activeCourseTitle={activeContinueCourse?.title} />

            {activeContinueCourse && (activeContinueCourse.progress_percent ?? 0) < 100 && <ContinueLearningBanner course={activeContinueCourse} />}

            <StudentStatsGrid
                enrolledCount={enrolledCourses.length}
                inProgressCount={inProgressList.length}
                completedCount={completedList.length}
                totalCompleted={totalCompleted}
                completionRate={completionRate}
                learningMinutes={learningMinutes}
                completedMaterials={completedMaterials}
                totalCertificates={totalCertificates}
                overallProgress={overallProgress}
            />

            <div className="grid gap-8 lg:grid-cols-3">
                <div className="space-y-8 lg:col-span-2">
                    <StudentCoursesSection enrolledCourses={enrolledCourses} />
                    <RecommendedCoursesSection courses={recommendedCourses} />
                </div>

                <StudentSidebar
                    totalCertificates={totalCertificates}
                    recentCertificates={recentCertificates}
                    weeklyActivity={weeklyActivity}
                    quizzesCompleted={quizzesCompleted}
                    averageQuizScore={averageQuizScore}
                    recentActivities={recentActivities}
                    aiEnabled={aiEnabled}
                />
            </div>

            {orders.length > 0 && (
                <DashboardPanel
                    title="Transaction History"
                    description="Riwayat transaksi pembayaran kursus Anda."
                    icon={<Receipt className="h-4 w-4" />}
                >
                    <div className="space-y-3">
                        {orders.map((order) => (
                            <div
                                key={order.id}
                                className="flex flex-wrap items-center justify-between gap-3 border border-slate-200 p-4 dark:border-slate-700"
                            >
                                <div>
                                    <p className="text-sm font-semibold text-slate-900 dark:text-white">{order.order_number}</p>
                                    <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{order.items?.[0]?.course_title ?? 'Course'}</p>
                                    <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">
                                        {order.created_at ? new Date(order.created_at).toLocaleDateString('id-ID') : '—'}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-bold text-slate-900 dark:text-white">{formatRupiah(order.total_price)}</p>
                                    <p className="text-xs text-slate-500 capitalize dark:text-slate-400">{order.status}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </DashboardPanel>
            )}
        </div>
    );
}
