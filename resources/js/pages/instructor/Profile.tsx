import { Head } from '@inertiajs/react';
import { route } from 'ziggy-js';
import Title from '@/components/atoms/Title';
import UserProfile from '@/components/organisms/UserProfile';
import UserLayout from '@/components/templates/UserLayout';
import type { User } from '@/types/user';

export default function InstructorProfile({ user }: { user: User }) {
    return (
        <>
            <Head title={`Instructor Profile - ${user.name}`} />

            <div className="space-y-6">
                <div>
                    <Title as="h3">Instructor Profile</Title>
                    <p className="mt-1 text-sm text-neutral-500">
                        Manage your account details, security information, and monitor the courses you created.
                    </p>
                </div>

                <UserProfile user={user} submitUrl={route('instructor.profile.update')} canChangeRole={false} />
            </div>
        </>
    );
}

InstructorProfile.layout = (page: React.ReactNode) => <UserLayout>{page}</UserLayout>;
