import { useForm } from '@inertiajs/react';
import { route } from 'ziggy-js';
import { useState } from 'react';

import Button from '@/components/atoms/Button';
import Badge from '@/components/atoms/Badge';
import InputField from '@/components/molecules/InputField';
import SelectField from '@/components/molecules/SelectField';
import ChooseFile from '@/components/molecules/ChooseFile';
import CourseGrid from '@/components/organisms/Course/CourseGrid';

import type { User } from '@/types/user';

interface Props {
    user: User;
    submitUrl?: string;
    canChangeRole?: boolean;
}

export default function UserProfile({ user, submitUrl, canChangeRole = false }: Props) {
    const [preview, setPreview] = useState<string | null>(null);
    const [search, setSearch] = useState('');

    const { data, setData, put, processing, errors } = useForm({
        name: user.name,
        email: user.email,
        role: user.role,
        password: '',
        avatar: null as File | null,
    });

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        const targetUrl = submitUrl ?? route('admin.users.update', user.id);
        put(targetUrl, {
            forceFormData: true,
        });
    }

    function handleAvatarChange(file: File | null) {
        if (!file) return;
        setData('avatar', file);
        setPreview(URL.createObjectURL(file));
    }

    const isInstructorOrAdmin = user.role === 'instructor' || user.role === 'admin';
    const isStudent = user.role === 'student';
    const allCourses = (user.created_courses ?? []) as any[];
    const enrolledCourses = user.enrollments ?? [];
    const filteredCourses = allCourses.filter((c) => c.title.toLowerCase().includes(search.toLowerCase()));

    return (
        <div className="space-y-8">
            {/* ===== Account Edit Form ===== */}
            <form onSubmit={handleSubmit} className="grid gap-8 md:grid-cols-3">
                {/* Avatar */}
                <div className="flex flex-col gap-4 border border-gray-300 dark:border-slate-700 bg-white dark:bg-[#1e1f24] p-6">
                    <div className="text-sm font-medium text-neutral-600 dark:text-slate-300">Avatar</div>
                    <div className="flex flex-1 flex-col gap-3">
                        <ChooseFile aspect="square" value={preview ?? user.avatar_url ?? null} onChange={(file) => handleAvatarChange(file)} />
                        {errors.avatar && <p className="text-sm text-red-500">{errors.avatar}</p>}
                    </div>
                </div>

                {/* Info & Security */}
                <div className="space-y-6 md:col-span-2">
                    <div className="space-y-4 border border-gray-300 dark:border-slate-700 bg-white dark:bg-[#1e1f24] p-6">
                        <div className="text-sm font-medium text-neutral-600 dark:text-slate-300">Account Information</div>
                        <InputField label="Name" value={data.name} onChange={(e) => setData('name', e.target.value)} error={errors.name} />
                        <InputField label="Email" value={data.email} onChange={(e) => setData('email', e.target.value)} error={errors.email} />
                        {canChangeRole ? (
                            <>
                                <SelectField
                                    label="Role"
                                    value={data.role}
                                    onChange={(e) => setData('role', e.target.value as User['role'])}
                                    options={[
                                        { label: 'Student', value: 'student' },
                                        { label: 'Instructor', value: 'instructor' },
                                        { label: 'Admin', value: 'admin' },
                                    ]}
                                />
                                {errors.role && <p className="text-sm text-red-500">{errors.role}</p>}
                            </>
                        ) : (
                            <div>
                                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">Role</label>
                                <div className="flex items-center gap-2">
                                    <Badge variant="purple" className="capitalize text-xs font-semibold px-2.5 py-1">
                                        {data.role}
                                    </Badge>
                                    <span className="text-xs text-neutral-400 dark:text-slate-500">(Role akun ditetapkan sebagai {data.role})</span>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="space-y-4 border border-gray-300 dark:border-slate-700 bg-white dark:bg-[#1e1f24] p-6">
                        <div className="text-sm font-medium text-neutral-600 dark:text-slate-300">Security</div>
                        <InputField
                            label="New Password"
                            type="password"
                            placeholder="Leave blank to keep current password"
                            value={data.password}
                            onChange={(e) => setData('password', e.target.value)}
                        />
                    </div>

                    <div className="flex justify-end">
                        <Button type="submit" disabled={processing}>
                            {processing ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </div>
                </div>
            </form>

            {/* ===== Course List — instructor / admin only ===== */}
            {isInstructorOrAdmin && (
                <div className="space-y-6 border border-slate-200/80 dark:border-slate-700 bg-white dark:bg-[#1e1f24] p-6 shadow-sm sm:p-8">
                    <div className="flex flex-col justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4 sm:flex-row sm:items-center">
                        <div>
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white">All Courses ({filteredCourses.length})</h3>
                            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">Filter or search through courses by this instructor.</p>
                        </div>
                        <div className="w-full sm:w-80">
                            <InputField label="" placeholder="Search course title..." value={search} onChange={(e) => setSearch(e.target.value)} />
                        </div>
                    </div>

                    <CourseGrid courses={filteredCourses} />
                </div>
            )}

            {/* ===== Enrolled Courses — student only ===== */}
            {isStudent && (
                <div className="space-y-6 border border-slate-200/80 dark:border-slate-700 bg-white dark:bg-[#1e1f24] p-6 shadow-sm sm:p-8">
                    <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">Enrolled Courses ({enrolledCourses.length})</h3>
                        <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">Courses this student has enrolled in.</p>
                    </div>

                    {enrolledCourses.length ? (
                        <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-700">
                            {enrolledCourses.map((enrollment) => (
                                <div key={enrollment.id} className="flex items-center gap-4 bg-white dark:bg-[#1e1f24] p-4">
                                    <div className="aspect-video w-16 shrink-0 overflow-hidden bg-slate-100 dark:bg-slate-700">
                                        {enrollment.course?.thumbnail_url ? (
                                            <img
                                                src={enrollment.course.thumbnail_url}
                                                alt={enrollment.course.title}
                                                className="h-full w-full object-cover"
                                            />
                                        ) : (
                                            <span className="flex h-full w-full items-center justify-center text-[10px] text-slate-400 dark:text-slate-500">COURSE</span>
                                        )}
                                    </div>

                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">
                                            {enrollment.course?.title ?? 'Course unavailable'}
                                        </p>
                                        <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">
                                            Enrolled{' '}
                                            {enrollment.enrolled_at
                                                ? new Date(enrollment.enrolled_at).toLocaleDateString('id-ID', { dateStyle: 'medium' })
                                                : '—'}
                                        </p>
                                    </div>

                                    <Badge variant={enrollment.status === 'active' ? 'success' : 'default'}>{enrollment.status}</Badge>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="border border-dashed border-slate-200 dark:border-slate-700 py-10 text-center text-sm text-slate-400 dark:text-slate-500">
                            This student has not enrolled in any courses yet.
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
