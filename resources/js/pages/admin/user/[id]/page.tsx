import { Head } from '@inertiajs/react';
import { BookOpen, LayoutGrid, Users } from 'lucide-react';
import Badge from '@/components/atoms/Badge';
import PageHeader from '@/components/molecules/PageHeader';
import UserProfile from '@/components/organisms/UserProfile';
import AdminLayout from '@/components/templates/AdminLayout';
import type { User } from '@/types/user';

function roleVariant(role: string) {
    switch (role) {
        case 'admin':
            return 'danger';
        case 'instructor':
            return 'warning';
        default:
            return 'info';
    }
}

export default function UserDetailPage({ user }: { user: User }) {
    const isInstructorOrAdmin = user.role === 'instructor' || user.role === 'admin';
    const courses = user.created_courses ?? [];
    const totalStudents = courses.reduce((sum, c) => sum + (c.enrollments_count ?? 0), 0);
    const publishedCount = courses.filter((c) => c.status === 'published').length;

    return (
        <>
            <Head title={`${user.name} — User Detail`} />

            <div className="max-w-8xl mx-auto space-y-8">
                <PageHeader
                    breadcrumbs={[{ label: 'All Users', href: '/admin/users' }, { label: user.name }]}
                    leading={
                        <div className="h-14 w-14 overflow-hidden rounded-xl border border-white/20 bg-white/10">
                            {user.avatar_url ? (
                                <img src={user.avatar_url} alt={user.name} className="h-full w-full object-cover" />
                            ) : (
                                <div className="flex h-full w-full items-center justify-center text-xl font-bold text-white/60">
                                    {user.name.charAt(0).toUpperCase()}
                                </div>
                            )}
                        </div>
                    }
                    title={user.name}
                    titleBadge={<Badge variant={roleVariant(user.role)}>{user.role}</Badge>}
                    description={user.email}
                    stats={
                        isInstructorOrAdmin
                            ? [
                                  {
                                      icon: <LayoutGrid size={18} />,
                                      value: courses.length,
                                      label: 'Total Courses',
                                  },
                                  {
                                      icon: <Users size={18} />,
                                      value: totalStudents,
                                      label: 'Total Students',
                                  },
                                  {
                                      icon: <BookOpen size={18} />,
                                      value: publishedCount,
                                      label: 'Published',
                                  },
                              ]
                            : undefined
                    }
                />

                <UserProfile user={user} canChangeRole={true} />
            </div>
        </>
    );
}

UserDetailPage.layout = (page: React.ReactNode) => <AdminLayout>{page}</AdminLayout>;
