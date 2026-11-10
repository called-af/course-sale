import { useMemo } from 'react';
import CoursePerformanceTable from '@/components/organisms/instructor/CoursePerformanceTable';
import EnrollmentActivitySection from '@/components/organisms/instructor/EnrollmentActivitySection';
import InstructorHero from '@/components/organisms/instructor/InstructorHero';
import InstructorKpiStrip from '@/components/organisms/instructor/InstructorKpiStrip';
import InstructorSidebar from '@/components/organisms/instructor/InstructorSidebar';
import InstructorSpotlight from '@/components/organisms/instructor/InstructorSpotlight';
import type { InstructorDashboardProps } from '@/types/dashboard';

export default function InstructorDashboardTemplate({
    auth,
    instructorCourses = [],
    totalStudents = 0,
    totalEarnings = 0,
    averageRating = 0,
    recentEnrollments = [],
    totalReviews = 0,
    totalLessons = 0,
    totalCertificates = 0,
    completionRate = 0,
    statusCounts = { published: 0, review: 0, draft: 0 },
    newStudentsThisMonth = 0,
    enrollmentTrend = [],
    topCourse = null,
    recentReviews = [],
}: InstructorDashboardProps) {
    const user = auth?.user;

    const paidCourses = useMemo(() => instructorCourses.filter((course) => course.type === 'paid').length, [instructorCourses]);
    const weeklyEnrollments = useMemo(() => enrollmentTrend.reduce((total, day) => total + (day.count ?? 0), 0), [enrollmentTrend]);

    return (
        <div className="space-y-8">
            <InstructorHero
                userName={user?.name ?? 'Instructor'}
                courseCount={instructorCourses.length}
                publishedCount={statusCounts.published}
                totalStudents={totalStudents}
                averageRating={averageRating}
            />

            <InstructorKpiStrip
                courseCount={instructorCourses.length}
                publishedCount={statusCounts.published}
                draftCount={statusCounts.draft}
                totalStudents={totalStudents}
                newStudentsThisMonth={newStudentsThisMonth}
                totalEarnings={totalEarnings}
                paidCourses={paidCourses}
                averageRating={averageRating}
                totalReviews={totalReviews}
                totalCertificates={totalCertificates}
                completionRate={completionRate}
            />

            <InstructorSpotlight
                topCourse={topCourse}
                weeklyEnrollments={weeklyEnrollments}
                totalLessons={totalLessons}
                completionRate={completionRate}
                totalCertificates={totalCertificates}
            />

            <div className="grid gap-8 lg:grid-cols-3">
                <div className="space-y-8 lg:col-span-2">
                    <EnrollmentActivitySection trend={enrollmentTrend} weeklyEnrollments={weeklyEnrollments} />
                    <CoursePerformanceTable courses={instructorCourses} />
                </div>

                <InstructorSidebar
                    statusCounts={statusCounts}
                    courseCount={instructorCourses.length}
                    totalLessons={totalLessons}
                    recentEnrollments={recentEnrollments}
                    recentReviews={recentReviews}
                />
            </div>
        </div>
    );
}
