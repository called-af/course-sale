import { Head, router } from '@inertiajs/react';
import { ChevronLeft, ChevronRight, Download, Plus } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import Button from '@/components/atoms/Button';
import ConfirmationDelete from '@/components/molecules/ConfirmationDelete';
import InputField from '@/components/molecules/InputField';
import PageHeader from '@/components/molecules/PageHeader';
import SelectField from '@/components/molecules/SelectField';

import UserFormModal from '@/components/organisms/UserFormModal';
import UserTable from '@/components/organisms/UserTable';
import AdminLayout from '@/components/templates/AdminLayout';
import { useUser } from '@/hooks/useUser';
import type { User } from '@/types/user';

interface Paginator<T> {
    data: T[];
    current_page: number;
    last_page: number;
    total: number;
}

interface UserPageProps {
    users: Paginator<User>;
    filters?: { search?: string; role?: string };
}

export default function UserPage({ users, filters }: UserPageProps) {
    const {
        data,
        setData,
        processing,
        editingUser,
        deleteTarget,
        startEdit,
        closeEdit,
        submitCreate,
        submitUpdate,
        openDeleteModal,
        closeDeleteModal,
        confirmDelete,
    } = useUser();

    const [search, setSearch] = useState(filters?.search ?? '');
    const [role, setRole] = useState(filters?.role ?? '');
    const [formOpen, setFormOpen] = useState(false);
    const firstFilterRender = useRef(true);

    const userItems: User[] = users?.data ?? [];

    const exportQuery = new URLSearchParams();

    if (search) exportQuery.set('search', search);
    if (role) exportQuery.set('role', role);

    const exportQueryString = exportQuery.toString();
    const exportUrl = `/admin/users/export${exportQueryString ? `?${exportQueryString}` : ''}`;

    useEffect(() => {
        if (firstFilterRender.current) {
            firstFilterRender.current = false;
            return;
        }

        const timer = window.setTimeout(() => {
            router.get(
                '/admin/users',
                { search: search || undefined, role: role || undefined },
                {
                    only: ['users', 'filters'],
                    preserveState: true,
                    preserveScroll: true,
                },
            );
        }, 300);

        return () => window.clearTimeout(timer);
    }, [search, role]);

    function handleAddClick() {
        closeEdit();
        setFormOpen(true);
    }

    function handleEditClick(user: User) {
        startEdit(user);
        setFormOpen(true);
    }

    function handleSubmit() {
        if (editingUser) {
            submitUpdate();
        } else {
            submitCreate();
        }
        setFormOpen(false);
    }

    return (
        <>
            <Head title="User Management" />

            <div className="max-w-8xl mx-auto space-y-8">
                <PageHeader
                    breadcrumbs={[{ label: 'Admin' }, { label: 'Users' }]}
                    title="User Management"
                    description="Manage all registered users on the platform"
                    actions={
                        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center">
                            <a
                                href={exportUrl}
                                className="flex w-full items-center justify-center gap-2 border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 transition-colors hover:bg-emerald-100 sm:w-auto dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-300"
                            >
                                <Download className="h-4 w-4" /> Export CSV
                            </a>
                            <Button
                                onClick={handleAddClick}
                                leftIcon={<Plus className="h-4 w-4" />}
                                className="w-full justify-center !rounded-none sm:w-auto"
                            >
                                Add User
                            </Button>
                        </div>
                    }
                />

                {/* Content Card */}
                <div className="space-y-6 border border-slate-200/80 bg-white p-4 shadow-sm sm:p-8 dark:border-slate-700 dark:bg-[#1e1f24]">
                    <div className="flex flex-col justify-between gap-4 border-b border-slate-100 pb-4 sm:flex-row sm:items-center dark:border-slate-700">
                        <div>
                            <h2 className="text-lg font-bold text-slate-900 dark:text-white">All Users ({users?.total ?? 0})</h2>
                            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">Filter or search through all registered users.</p>
                        </div>
                        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
                            <InputField
                                label=""
                                placeholder="Search name or email..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full sm:w-64"
                            />
                            <SelectField
                                label=""
                                value={role}
                                onChange={(e) => setRole(e.target.value)}
                                options={[
                                    { label: 'All Roles', value: '' },
                                    { label: 'Admin', value: 'admin' },
                                    { label: 'Instructor', value: 'instructor' },
                                    { label: 'Student', value: 'student' },
                                ]}
                                className="w-full min-w-36 sm:w-auto"
                            />
                        </div>
                    </div>

                    <UserTable users={userItems} onEdit={handleEditClick} onDelete={openDeleteModal} />

                    {(users?.last_page ?? 1) > 1 && (
                        <div className="flex flex-col gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between dark:border-slate-700">
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                Showing {userItems.length === 0 ? 0 : (users.current_page - 1) * 10 + 1}–
                                {Math.min(users.current_page * 10, users.total)} of {users.total} users
                            </p>
                            <div className="flex flex-wrap items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={users.current_page === 1}
                                    onClick={() =>
                                        router.get(
                                            '/admin/users',
                                            { page: users.current_page - 1, search: search || undefined, role: role || undefined },
                                            { only: ['users', 'filters'], preserveState: true, preserveScroll: true },
                                        )
                                    }
                                    leftIcon={<ChevronLeft className="h-4 w-4" />}
                                    className="flex-1 justify-center sm:flex-none"
                                >
                                    Previous
                                </Button>
                                <span className="px-2 text-xs font-medium text-slate-500 dark:text-slate-400">
                                    Page {users.current_page} of {users.last_page}
                                </span>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={users.current_page === users.last_page}
                                    onClick={() =>
                                        router.get(
                                            '/admin/users',
                                            { page: users.current_page + 1, search: search || undefined, role: role || undefined },
                                            { only: ['users', 'filters'], preserveState: true, preserveScroll: true },
                                        )
                                    }
                                    rightIcon={<ChevronRight className="h-4 w-4" />}
                                    className="flex-1 justify-center sm:flex-none"
                                >
                                    Next
                                </Button>
                            </div>
                        </div>
                    )}
                </div>

                <UserFormModal
                    open={formOpen}
                    onClose={() => setFormOpen(false)}
                    onSubmit={handleSubmit}
                    processing={processing}
                    editing={!!editingUser}
                    data={data}
                    setData={setData}
                />

                <ConfirmationDelete
                    open={!!deleteTarget}
                    onClose={closeDeleteModal}
                    onConfirm={confirmDelete}
                    isLoading={processing}
                    title="Delete User"
                    message={
                        deleteTarget
                            ? `Are you sure you want to delete user "${deleteTarget.name}" (${deleteTarget.email})?`
                            : 'Are you sure you want to delete this user?'
                    }
                />
            </div>
        </>
    );
}

UserPage.layout = (page: React.ReactNode) => <AdminLayout>{page}</AdminLayout>;
