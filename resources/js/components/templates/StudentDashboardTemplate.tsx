import { useMemo } from 'react';
import ContinueLearningBanner from '@/components/organisms/student/ContinueLearningBanner';
import RecommendedCoursesSection from '@/components/organisms/student/RecommendedCoursesSection';
import StudentCoursesSection from '@/components/organisms/student/StudentCoursesSection';
import StudentHero from '@/components/organisms/student/StudentHero';
import StudentSidebar from '@/components/organisms/student/StudentSidebar';
import StudentStatsGrid from '@/components/organisms/student/StudentStatsGrid';
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
    ai = null,
}: StudentDashboardProps) {
    const user = auth?.user;

    const inProgressList = useMemo(
        () => enrolledCourses.filter((item) => (item.course.progress_percent ?? 0) > 0 && (item.course.progress_percent ?? 0) < 100),
        [enrolledCourses],
    );

    const completedList = useMemo(
        () => enrolledCourses.filter((item) => (item.course.progress_percent ?? 0) === 100),
        [enrolledCourses],
    );

    const activeContinueCourse: ContinueLearningCourse | null =
        continueLearningCourse?.course ?? inProgressList[0]?.course ?? null;

    const completionRate = enrolledCourses.length > 0 ? Math.round((totalCompleted / enrolledCourses.length) * 100) : 0;
    const aiEnabled = Boolean(ai?.enabled);

    return (
        <div className="space-y-8">
            <StudentHero
                userName={user?.name ?? 'Student'}
                enrolledCount={enrolledCourses.length}
                activeCourseTitle={activeContinueCourse?.title}
            />

            {activeContinueCourse && (activeContinueCourse.progress_percent ?? 0) < 100 && (
                <ContinueLearningBanner course={activeContinueCourse} />
            )}

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
        </div>
    );
}
