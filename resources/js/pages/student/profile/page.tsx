import { Head } from '@inertiajs/react';
import Title from '@/components/atoms/Title';
import UserProfile from '@/components/organisms/UserProfile';
import UserLayout from '@/components/templates/UserLayout';
import type { User } from '@/types/user';

export default function StudentProfile({ user }: { user: User }) {
    return (
        <UserLayout>
            <Head title={`Profile — ${user.name}`} />

            <div className="space-y-8">
                <div>
                    <Title as="h3">Profil Saya</Title>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Kelola informasi akun, keamanan, dan avatar Anda.</p>
                </div>

                <UserProfile user={user} submitUrl="/student/profile" canChangeRole={false} />
            </div>
        </UserLayout>
    );
}
