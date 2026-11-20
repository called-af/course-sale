import { router } from '@inertiajs/react';
import { Users, Search, Calendar, CheckCircle2, Clock, UserX, X, Download, ChevronLeft, ChevronRight } from 'lucide-react';
import React, { useState, useMemo } from 'react';
import Button from '@/components/atoms/Button';
import type { EnrolledStudent, EnrolledStudentsSummary, Paginator } from '@/types';

interface EnrolledStudentsListProps {
    students?: Paginator<EnrolledStudent>;
    summary?: EnrolledStudentsSummary;
    exportUrl?: string;
}

const emptyPaginator: Paginator<EnrolledStudent> = {
    data: [],
    current_page: 1,
    last_page: 1,
    total: 0,
};

const changePage = (page: number) => {
    router.get(
        window.location.pathname,
        { page },
        {
            only: ['enrolled_students', 'enrolled_students_summary'],
            preserveState: true,
            preserveScroll: true,
        },
    );
};

export default function EnrolledStudentsList({ students = emptyPaginator, summary, exportUrl }: EnrolledStudentsListProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'in_progress' | 'not_started'>('all');
    const studentItems = useMemo(() => students.data ?? [], [students.data]);
    const perPage = students.per_page ?? 15;

    // Metrics (server-side totals stay accurate across paginated pages).
    const metrics = useMemo(() => {
        return {
            total: summary?.total ?? students.total,
            completed: summary?.completed ?? studentItems.filter((s) => s.progress_percent === 100).length,
            inProgress: summary?.in_progress ?? studentItems.filter((s) => s.progress_percent > 0 && s.progress_percent < 100).length,
            notStarted: summary?.not_started ?? studentItems.filter((s) => s.progress_percent === 0).length,
        };
    }, [summary, students.total, studentItems]);

    // Filtered students on the current page.
    const filteredStudents = useMemo(() => {
        return studentItems.filter((student) => {
            const matchesSearch =
                student.name.toLowerCase().includes(searchQuery.toLowerCase()) || student.email.toLowerCase().includes(searchQuery.toLowerCase());

            if (!matchesSearch) return false;

            if (statusFilter === 'completed') return student.progress_percent === 100;
            if (statusFilter === 'in_progress') return student.progress_percent > 0 && student.progress_percent < 100;
            if (statusFilter === 'not_started') return student.progress_percent === 0;

            return true;
        });
    }, [studentItems, searchQuery, statusFilter]);

    // Format enrollment date
    const formatDate = (dateString: string) => {
        try {
            const d = new Date(dateString);
            if (isNaN(d.getTime())) return dateString;
            return d.toLocaleDateString('en-US', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
            });
        } catch {
            return dateString;
        }
    };

    return (
        <div className="space-y-6 border border-slate-200/80 bg-white p-6 shadow-sm sm:p-8 dark:border-slate-700 dark:bg-[#1e1f24]">
            {/* Header */}
            <div className="flex flex-col justify-between gap-4 border-b border-slate-100 pb-5 sm:flex-row sm:items-center dark:border-slate-700">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center bg-purple-50 text-purple-600 dark:bg-purple-950/40 dark:text-purple-400">
                        <Users className="h-5 w-5" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h2 className="text-base font-bold text-slate-900 dark:text-white">Enrolled Students</h2>
                            <span className="border border-purple-500/30 bg-purple-500/10 px-2.5 py-0.5 text-xs font-bold text-purple-600 dark:text-purple-400">
                                {metrics.total} Students
                            </span>
                        </div>
                        <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                            A list of students enrolled in this course along with their learning progress.
                        </p>
                    </div>
                </div>

                {/* Status Badges Filter + export */}
                <div className="flex flex-wrap items-center gap-2">
                    {metrics.total > 0 && (
                        <div className="flex flex-wrap items-center gap-2 text-xs">
                            <Button
                                type="button"
                                variant={statusFilter === 'all' ? 'primary' : 'outline'}
                                size="sm"
                                onClick={() => setStatusFilter('all')}
                                className="!rounded-none"
                            >
                                All ({metrics.total})
                            </Button>
                            <Button
                                type="button"
                                variant={statusFilter === 'in_progress' ? 'primary' : 'outline'}
                                size="sm"
                                onClick={() => setStatusFilter('in_progress')}
                                className="!rounded-none"
                            >
                                In Progress ({metrics.inProgress})
                            </Button>
                            <Button
                                type="button"
                                variant={statusFilter === 'completed' ? 'primary' : 'outline'}
                                size="sm"
                                onClick={() => setStatusFilter('completed')}
                                className="!rounded-none"
                            >
                                Completed ({metrics.completed})
                            </Button>
                        </div>
                    )}

                    {exportUrl && (
                        <a href={exportUrl}>
                            <Button
                                variant="outline"
                                size="sm"
                                leftIcon={<Download size={14} />}
                                className="!rounded-none !border-emerald-200 !bg-emerald-50 !text-emerald-700 hover:!bg-emerald-100 dark:!border-emerald-900/60 dark:!bg-emerald-950/30 dark:!text-emerald-300"
                            >
                                Export CSV
                            </Button>
                        </a>
                    )}
                </div>
            </div>

            {/* Metrics Quick Overview */}
            {metrics.total > 0 && (
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                    <div className="border border-slate-100 bg-slate-50/60 p-4 dark:border-slate-700/60 dark:bg-[#1e1f24]">
                        <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Enrolled</span>
                        <div className="mt-1 flex items-baseline gap-2">
                            <span className="text-2xl font-bold text-slate-900 dark:text-white">{metrics.total}</span>
                            <span className="text-xs text-slate-400">Students</span>
                        </div>
                    </div>
                    <div className="border border-purple-100 bg-purple-50/30 p-4 dark:border-purple-900/30 dark:bg-purple-950/20">
                        <span className="text-xs font-medium text-purple-700 dark:text-purple-300">In Progress</span>
                        <div className="mt-1 flex items-baseline gap-2">
                            <span className="text-2xl font-bold text-purple-700 dark:text-purple-300">{metrics.inProgress}</span>
                            <span className="text-xs text-purple-500/70">Active</span>
                        </div>
                    </div>
                    <div className="border border-emerald-100 bg-emerald-50/30 p-4 dark:border-emerald-900/30 dark:bg-emerald-950/20">
                        <span className="text-xs font-medium text-emerald-700 dark:text-emerald-300">100% Complete</span>
                        <div className="mt-1 flex items-baseline gap-2">
                            <span className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">{metrics.completed}</span>
                            <span className="text-xs text-emerald-500/70">Passed</span>
                        </div>
                    </div>
                    <div className="border border-slate-100 bg-slate-50/60 p-4 dark:border-slate-700/60 dark:bg-[#1e1f24]">
                        <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Not Started</span>
                        <div className="mt-1 flex items-baseline gap-2">
                            <span className="text-2xl font-bold text-slate-900 dark:text-white">{metrics.notStarted}</span>
                            <span className="text-xs text-slate-400">0%</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Search Input */}
            {metrics.total > 0 && (
                <div className="relative">
                    <Search className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search this page by name or email..."
                        className="w-full border border-slate-200 bg-white py-2.5 pr-10 pl-10 text-sm text-slate-900 placeholder-slate-400 transition-colors focus:border-purple-500 focus:outline-none dark:border-slate-700 dark:bg-[#1e1f24] dark:text-white dark:placeholder-slate-500"
                    />
                    {searchQuery && (
                        <button
                            type="button"
                            onClick={() => setSearchQuery('')}
                            className="absolute top-1/2 right-3 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    )}
                </div>
            )}

            {/* Table or Empty State */}
            {metrics.total === 0 ? (
                <div className="flex flex-col items-center justify-center border border-dashed border-slate-200 py-12 text-center dark:border-slate-700">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-400 dark:bg-[#1e1f24] dark:text-slate-500">
                        <Users className="h-7 w-7" />
                    </div>
                    <h3 className="mt-4 text-sm font-bold text-slate-800 dark:text-slate-200">No Students Enrolled Yet</h3>
                    <p className="mt-1 max-w-sm text-xs text-slate-500 dark:text-slate-400">
                        When students enroll in this course, their data and learning progress will appear here automatically.
                    </p>
                </div>
            ) : filteredStudents.length === 0 ? (
                <div className="flex flex-col items-center justify-center border border-dashed border-slate-200 py-10 text-center dark:border-slate-700">
                    <UserX className="h-8 w-8 text-slate-400" />
                    <p className="mt-2 text-sm font-medium text-slate-600 dark:text-slate-400">No students match the search "{searchQuery}"</p>
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                            setSearchQuery('');
                            setStatusFilter('all');
                        }}
                        className="mt-3 !rounded-none"
                    >
                        Reset Filter
                    </Button>
                </div>
            ) : (
                <>
                    {/* Mobile: student cards */}
                    <div className="space-y-3 md:hidden">
                        {filteredStudents.map((student) => {
                            const initials = student.name
                                ? student.name
                                      .split(' ')
                                      .map((n) => n[0])
                                      .slice(0, 2)
                                      .join('')
                                      .toUpperCase()
                                : 'ST';

                            return (
                                <div key={student.id} className="border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-[#1e1f24]">
                                    <div className="flex items-start gap-3">
                                        {student.avatar_url ? (
                                            <img
                                                src={student.avatar_url}
                                                alt={student.name}
                                                className="h-10 w-10 shrink-0 border border-slate-200 object-cover dark:border-slate-700"
                                            />
                                        ) : (
                                            <div className="flex h-10 w-10 shrink-0 items-center justify-center border border-purple-200 bg-purple-100 font-bold text-purple-700 dark:border-purple-800 dark:bg-purple-950 dark:text-purple-300">
                                                {initials}
                                            </div>
                                        )}

                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">{student.name}</p>
                                            <p className="truncate text-xs text-slate-500 dark:text-slate-400">{student.email}</p>
                                            <p className="mt-1 flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                                                <Calendar className="h-3 w-3 shrink-0" />
                                                {formatDate(student.enrolled_at)}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="mt-3 space-y-1.5">
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="font-semibold text-slate-800 dark:text-slate-200">{student.progress_percent}%</span>
                                            <span className="text-[11px] text-slate-400">
                                                {student.completed_contents ?? 0} / {student.total_contents ?? 0} Contents
                                            </span>
                                        </div>
                                        <div className="h-2 w-full overflow-hidden bg-slate-100 dark:bg-slate-700">
                                            <div
                                                className={`h-full transition-all duration-300 ${
                                                    student.progress_percent === 100
                                                        ? 'bg-emerald-500'
                                                        : student.progress_percent > 0
                                                          ? 'bg-purple-600'
                                                          : 'bg-slate-300 dark:bg-slate-600'
                                                }`}
                                                style={{ width: `${student.progress_percent}%` }}
                                            />
                                        </div>
                                    </div>

                                    <div className="mt-3 flex justify-end">
                                        {student.progress_percent === 100 ? (
                                            <span className="inline-flex items-center gap-1 border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                                                <CheckCircle2 className="h-3 w-3" />
                                                Completed
                                            </span>
                                        ) : student.progress_percent > 0 ? (
                                            <span className="inline-flex items-center gap-1 border border-purple-500/30 bg-purple-500/10 px-2.5 py-1 text-xs font-semibold text-purple-600 dark:text-purple-400">
                                                <Clock className="h-3 w-3" />
                                                Active
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 border border-slate-200 bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600 dark:border-slate-700 dark:bg-[#1e1f24] dark:text-slate-400">
                                                Not Started
                                            </span>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Desktop: table */}
                    <div className="hidden overflow-x-auto border border-slate-200 md:block dark:border-slate-700">
                        <table className="w-full min-w-[720px] text-left text-sm">
                            <thead className="border-b border-slate-200 bg-slate-50 text-xs font-bold tracking-wider text-slate-600 uppercase dark:border-slate-700 dark:bg-[#1e1f24] dark:text-slate-400">
                                <tr>
                                    <th scope="col" className="px-5 py-3.5">
                                        Students
                                    </th>
                                    <th scope="col" className="px-5 py-3.5">
                                        Enrolled Date
                                    </th>
                                    <th scope="col" className="px-5 py-3.5">
                                        Learning Progress
                                    </th>
                                    <th scope="col" className="px-5 py-3.5 text-right">
                                        Status
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                                {filteredStudents.map((student) => {
                                    const initials = student.name
                                        ? student.name
                                              .split(' ')
                                              .map((n) => n[0])
                                              .slice(0, 2)
                                              .join('')
                                              .toUpperCase()
                                        : 'ST';

                                    return (
                                        <tr key={student.id} className="transition-colors hover:bg-slate-50/70 dark:hover:bg-slate-900/30">
                                            {/* Student Info */}
                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-3">
                                                    {student.avatar_url ? (
                                                        <img
                                                            src={student.avatar_url}
                                                            alt={student.name}
                                                            className="h-10 w-10 border border-slate-200 object-cover dark:border-slate-700"
                                                        />
                                                    ) : (
                                                        <div className="flex h-10 w-10 items-center justify-center border border-purple-200 bg-purple-100 font-bold text-purple-700 dark:border-purple-800 dark:bg-purple-950 dark:text-purple-300">
                                                            {initials}
                                                        </div>
                                                    )}
                                                    <div>
                                                        <div className="font-semibold text-slate-900 dark:text-white">{student.name}</div>
                                                        <div className="text-xs text-slate-500 dark:text-slate-400">{student.email}</div>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Enrolled Date */}
                                            <td className="px-5 py-4 text-xs whitespace-nowrap text-slate-600 dark:text-slate-300">
                                                <div className="flex items-center gap-1.5">
                                                    <Calendar className="h-3.5 w-3.5 text-slate-400" />
                                                    <span>{formatDate(student.enrolled_at)}</span>
                                                </div>
                                            </td>

                                            {/* Progress */}
                                            <td className="px-5 py-4">
                                                <div className="w-full max-w-[200px] space-y-1.5">
                                                    <div className="flex items-center justify-between text-xs">
                                                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                                                            {student.progress_percent}%
                                                        </span>
                                                        <span className="text-[11px] text-slate-400">
                                                            {student.completed_contents ?? 0} / {student.total_contents ?? 0} Contents
                                                        </span>
                                                    </div>
                                                    <div className="h-2 w-full overflow-hidden bg-slate-100 dark:bg-slate-700">
                                                        <div
                                                            className={`h-full transition-all duration-300 ${
                                                                student.progress_percent === 100
                                                                    ? 'bg-emerald-500'
                                                                    : student.progress_percent > 0
                                                                      ? 'bg-purple-600'
                                                                      : 'bg-slate-300 dark:bg-slate-600'
                                                            }`}
                                                            style={{ width: `${student.progress_percent}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Status */}
                                            <td className="px-5 py-4 text-right whitespace-nowrap">
                                                {student.progress_percent === 100 ? (
                                                    <span className="inline-flex items-center gap-1 border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                                                        <CheckCircle2 className="h-3 w-3" />
                                                        Completed
                                                    </span>
                                                ) : student.progress_percent > 0 ? (
                                                    <span className="inline-flex items-center gap-1 border border-purple-500/30 bg-purple-500/10 px-2.5 py-1 text-xs font-semibold text-purple-600 dark:text-purple-400">
                                                        <Clock className="h-3 w-3" />
                                                        Active
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 border border-slate-200 bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600 dark:border-slate-700 dark:bg-[#1e1f24] dark:text-slate-400">
                                                        Not Started
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </>
            )}

            {students.last_page > 1 && (
                <div className="flex flex-col gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between dark:border-slate-700">
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                        Showing {studentItems.length === 0 ? 0 : (students.current_page - 1) * perPage + 1}–
                        {Math.min(students.current_page * perPage, metrics.total)} of {metrics.total} students
                    </p>
                    <div className="flex flex-wrap items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={students.current_page === 1}
                            onClick={() => changePage(students.current_page - 1)}
                            leftIcon={<ChevronLeft className="h-4 w-4" />}
                            className="flex-1 justify-center sm:flex-none"
                        >
                            Previous
                        </Button>
                        <span className="px-2 text-xs font-medium text-slate-500 dark:text-slate-400">
                            Page {students.current_page} of {students.last_page}
                        </span>
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={students.current_page === students.last_page}
                            onClick={() => changePage(students.current_page + 1)}
                            rightIcon={<ChevronRight className="h-4 w-4" />}
                            className="flex-1 justify-center sm:flex-none"
                        >
                            Next
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
