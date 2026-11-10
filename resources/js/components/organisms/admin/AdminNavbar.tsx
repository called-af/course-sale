import { router, usePage } from '@inertiajs/react';
import { Bell, CheckCircle, LogOut, Menu, Moon, Sun } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useTheme } from '@/hooks/useTheme';
import type { SharedPageProps } from '@/types/shared';

interface NavbarProps {
    onToggleSidebar: () => void;
}

export default function Navbar({ onToggleSidebar }: NavbarProps) {
    const { auth, adminReviewNotifications } = usePage<SharedPageProps>().props;
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
    const notificationRef = useRef<HTMLDivElement>(null);
    const pendingReviews = adminReviewNotifications?.courses ?? [];
    const pendingReviewCount = adminReviewNotifications?.count ?? 0;
    const { toggle, isDark } = useTheme();
    const logout = () => router.post('/logout');

    useEffect(() => {
        const closeOnOutsideClick = (event: MouseEvent) => {
            if (!notificationRef.current?.contains(event.target as Node)) {
                setIsNotificationsOpen(false);
            }
        };

        document.addEventListener('mousedown', closeOnOutsideClick);
        return () => document.removeEventListener('mousedown', closeOnOutsideClick);
    }, []);

    return (
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-neutral-100 bg-white px-5 dark:border-slate-700 dark:bg-[#1e1f24]">
            <button
                onClick={onToggleSidebar}
                className="p-2 text-neutral-400 transition-colors hover:text-neutral-700 lg:hidden dark:text-slate-500 dark:hover:text-white"
            >
                <Menu size={19} />
            </button>
            <div className="ml-auto flex items-center gap-3">
                {auth?.user?.role === 'admin' && (
                    <div ref={notificationRef} className="relative">
                        <button
                            type="button"
                            onClick={() => setIsNotificationsOpen((open) => !open)}
                            className="relative p-2 text-neutral-500 transition-colors hover:bg-purple-50 hover:text-purple-600 dark:text-slate-400 dark:hover:bg-purple-950/40 dark:hover:text-purple-400"
                            title="Courses pending approval"
                            aria-label="Courses pending approval"
                            aria-expanded={isNotificationsOpen}
                        >
                            <Bell size={18} />
                            {pendingReviewCount > 0 && (
                                <span className="absolute -top-1 -right-1 h-4 min-w-4 rounded-full bg-red-500 px-1 text-[10px] leading-4 font-bold text-white">
                                    {pendingReviewCount > 99 ? '99+' : pendingReviewCount}
                                </span>
                            )}
                        </button>

                        {isNotificationsOpen && (
                            <div className="absolute top-11 right-0 z-50 w-[min(22rem,calc(100vw-1rem))] overflow-hidden border border-neutral-200 bg-white shadow-xl dark:border-slate-700 dark:bg-[#1e1f24]">
                                <div className="flex items-center justify-between border-b border-neutral-100 px-4 py-3 dark:border-slate-800">
                                    <div>
                                        <p className="text-sm font-semibold text-neutral-800 dark:text-slate-100">Pending approvals</p>
                                        <p className="text-xs text-neutral-400 dark:text-slate-500">Courses submitted by instructors for review</p>
                                    </div>
                                    {pendingReviewCount > 0 && (
                                        <span className="text-xs font-semibold text-purple-600 dark:text-purple-400">{pendingReviewCount}</span>
                                    )}
                                </div>

                                <div className="max-h-80 overflow-y-auto">
                                    {pendingReviews.length === 0 ? (
                                        <p className="px-4 py-8 text-center text-sm text-neutral-400 dark:text-slate-500">
                                            No courses are pending review.
                                        </p>
                                    ) : (
                                        pendingReviews.map((course) => (
                                            <button
                                                key={course.id}
                                                type="button"
                                                onClick={() => {
                                                    setIsNotificationsOpen(false);
                                                    router.visit(`/admin/courses/${course.slug}`);
                                                }}
                                                className="w-full border-b border-neutral-100 px-4 py-3 text-left transition-colors last:border-0 hover:bg-purple-50 dark:border-slate-800 dark:hover:bg-slate-800"
                                            >
                                                <div className="flex items-start gap-3">
                                                    <CheckCircle size={16} className="mt-0.5 shrink-0 text-purple-500 dark:text-purple-400" />
                                                    <div className="min-w-0">
                                                        <p className="truncate text-sm font-medium text-neutral-800 dark:text-slate-100">
                                                            {course.title}
                                                        </p>
                                                        <p className="mt-0.5 text-xs text-neutral-400 dark:text-slate-500">
                                                            by {course.creator?.name ?? 'Instructor'}
                                                        </p>
                                                    </div>
                                                </div>
                                            </button>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                <div className="flex items-center gap-2.5">
                    <div className="hidden text-right leading-tight sm:block">
                        <p className="text-xs font-medium text-neutral-700 dark:text-slate-200">{auth?.user?.name}</p>
                        <p className="text-[10px] text-neutral-400 capitalize dark:text-slate-500">{auth?.user?.role}</p>
                    </div>

                    <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden bg-purple-100 text-xs font-bold text-purple-600 dark:bg-purple-950/40 dark:text-purple-400">
                        {auth?.user?.avatar_url ? (
                            <img src={auth.user.avatar_url} alt={auth.user.name} className="h-full w-full object-cover" />
                        ) : (
                            auth?.user?.name?.charAt(0)?.toUpperCase()
                        )}
                    </div>
                </div>

                <div className="h-5 w-px bg-neutral-200 dark:bg-slate-700" />

                <button
                    onClick={toggle}
                    className="p-1.5 text-neutral-400 transition-colors hover:text-neutral-700 dark:text-slate-500 dark:hover:text-white"
                    title="Toggle dark mode"
                >
                    {isDark ? <Sun size={16} /> : <Moon size={16} />}
                </button>

                <button onClick={logout} className="p-1.5 text-neutral-400 transition-colors hover:text-red-500 dark:text-slate-500" title="Logout">
                    <LogOut size={16} />
                </button>
            </div>
        </header>
    );
}
