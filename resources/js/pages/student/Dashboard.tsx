import { Head, usePage } from '@inertiajs/react';
import FloatingAIChat from '@/components/ai/FloatingAIChat';
import InstructorDashboardTemplate from '@/components/templates/InstructorDashboardTemplate';
import StudentDashboardTemplate from '@/components/templates/StudentDashboardTemplate';
import UserLayout from '@/components/templates/UserLayout';
import type { InstructorDashboardProps, StudentDashboardProps } from '@/types/dashboard';

type DashboardPageProps = StudentDashboardProps & InstructorDashboardProps;

export default function Dashboard() {
    const props = usePage().props as unknown as DashboardPageProps;
    const isInstructor = props.auth?.user?.role === 'instructor';
    const aiEnabled = Boolean(props.ai?.enabled && props.ai?.is_configured);

    return (
        <>
            <Head title="Dashboard" />

            {isInstructor ? (
                <InstructorDashboardTemplate {...props} />
            ) : (
                <StudentDashboardTemplate {...props} />
            )}

            {aiEnabled && <FloatingAIChat />}
        </>
    );
}

Dashboard.layout = (page: React.ReactNode) => <UserLayout>{page}</UserLayout>;
