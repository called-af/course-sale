import { Link, router, usePage } from '@inertiajs/react';
import clsx from 'clsx';
import {
    Award,
    Bell,
    BookOpen,
    CheckCircle,
    ClipboardCheck,
    Compass,
    GraduationCap,
    LayoutDashboard,
    LogOut,
    Menu,
    Moon,
    Settings,
    Sun,
    User,
    X,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import AppLogo from '@/components/atoms/AppLogo';
import { useBranding } from '@/hooks/useBranding';
import { useTheme } from '@/hooks/useTheme';
import type { SharedPageProps } from '@/types/shared';

interface UserNavbarProps {
    title?: string;
}

type NavigationItem = {
    label: string;
    href: string;
    icon: typeof LayoutDashboard;
};

function buildNavigation(role: string): NavigationItem[] {
    if (role === 'instructor') {
        return [
            { label: 'Dashboard', href: '/instructor/dashboard', icon: LayoutDashboard },
            { label: 'My Courses', href: '/instructor/courses', icon: BookOpen },
            { label: 'Quiz Submissions', href: '/instructor/quiz-attempts', icon: ClipboardCheck },
            { label: 'Settings', href: '/instructor/settings', icon: Settings },
            { label: 'Profile', href: '/instructor/profile', icon: User },
        ];
    }

    return [
        { label: 'Dashboard', href: '/student/dashboard', icon: LayoutDashboard },
        { label: 'My Learning', href: '/student/courses', icon: GraduationCap },
        { label: 'My Certificates', href: '/student/certificates', icon: Award },
        { label: 'Explore', href: '/course', icon: Compass },
        { label: 'Profile', href: '/student/profile', icon: User },
    ];
}

export default function UserNavbar({ title }: UserNavbarProps) {
    const { name: appName } = useBranding();
    const { props, url } = usePage<SharedPageProps>();
    const auth = props.auth;
    const instructorApprovalNotifications = props.instructorApprovalNotifications;
    const [menuOpen, setMenuOpen] = useState(false);
    const [notificationsOpen, setNotificationsOpen] = useState(false);
    const notificationRef = useRef<HTMLDivElement>(null);
    const navigation = buildNavigation(auth?.user?.role ?? 'student');
    const approvedCourses = instructorApprovalNotifications?.courses ?? [];
    const approvedCourseCount = instructorApprovalNotifications?.count ?? 0;
    const { toggle, isDark } = useTheme();

    const logout = () => router.post('/logout');

    // Derive page title from URL if not passed explicitly
    const pageTitle = title ?? deriveTitle(url);

    useEffect(() => {
        const closeOnOutsideClick = (event: MouseEvent) => {
            if (!notificationRef.current?.contains(event.target as Node)) {
                setNotificationsOpen(false);
            }
        };

        document.addEventListener('mousedown', closeOnOutsideClick);
        return () => document.removeEventListener('mousedown', closeOnOutsideClick);
    }, []);

    return (
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-neutral-200 bg-white px-5 dark:border-slate-700 dark:bg-[#1e1f24]">
            <div className="relative flex w-full items-center justify-between gap-4">
                <div className="flex min-w-0 items-center gap-3">
                    <Link href="/" className="flex shrink-0 items-center" title={`${appName} Home`}>
                        <AppLogo className="h-7 w-auto" />
                    </Link>

                    <button
                        onClick={() => setMenuOpen((open) => !open)}
                        className="p-2 text-neutral-400 transition-colors hover:text-neutral-700 md:hidden dark:text-slate-500 dark:hover:text-white"
                        aria-label="Toggle navigation"
                        aria-expanded={menuOpen}
                    >
                        {menuOpen ? <X size={18} /> : <Menu size={18} />}
                    </button>

                    <nav className="hidden items-center gap-1 md:flex" aria-label="Main navigation">
                        {navigation.map(({ label, href, icon: Icon }) => {
                            const active = url === href || (href !== '/' && url.startsWith(`${href}/`));

                            return (
                                <Link
                                    key={href}
                                    href={href}
                                    className={clsx(
                                        'flex items-center gap-2 px-3 py-2 text-sm font-medium transition-colors',
                                        active
                                            ? 'text-purple-700 dark:text-purple-400'
                                            : 'text-neutral-500 hover:text-neutral-800 dark:text-slate-400 dark:hover:text-white',
                                    )}
                                >
                                    <Icon size={16} />
                                    {label}
                                </Link>
                            );
                        })}
                    </nav>

                    <span className="truncate text-sm font-semibold text-neutral-800 md:hidden dark:text-slate-100">{pageTitle}</span>
                </div>

                <div className="flex shrink-0 items-center gap-3">
                    {auth?.user?.role === 'instructor' && (
                        <div ref={notificationRef} className="relative">
                            <button
                                type="button"
                                onClick={() => setNotificationsOpen((open) => !open)}
                                className="relative p-2 text-neutral-500 transition-colors hover:bg-purple-50 hover:text-purple-600 dark:text-slate-400 dark:hover:bg-purple-950/40 dark:hover:text-purple-400"
                                title="Course approvals"
                                aria-label="Course approvals"
                                aria-expanded={notificationsOpen}
                            >
                                <Bell size={18} />
                                {approvedCourseCount > 0 && (
                                    <span className="absolute -top-1 -right-1 min-w-4 bg-emerald-500 px-1 text-[10px] leading-4 font-bold text-white">
                                        {approvedCourseCount > 99 ? '99+' : approvedCourseCount}
                                    </span>
                                )}
                            </button>

                            {notificationsOpen && (
                                <div className="absolute top-11 right-0 z-50 w-[min(22rem,calc(100vw-1rem))] overflow-hidden border border-neutral-200 bg-white shadow-xl dark:border-slate-700 dark:bg-[#1e1f24]">
                                    <div className="border-b border-neutral-100 px-4 py-3 dark:border-slate-800">
                                        <p className="text-sm font-semibold text-neutral-800 dark:text-slate-100">Approved courses</p>
                                        <p className="text-xs text-neutral-400 dark:text-slate-500">Courses approved by an administrator</p>
                                    </div>
                                    <div className="max-h-80 overflow-y-auto">
                                        {approvedCourses.length === 0 ? (
                                            <p className="px-4 py-8 text-center text-sm text-neutral-400 dark:text-slate-500">
                                                No course approvals yet.
                                            </p>
                                        ) : (
                                            approvedCourses.map((course) => (
                                                <button
                                                    key={course.id}
                                                    type="button"
                                                    onClick={() => {
                                                        setNotificationsOpen(false);
                                                        router.visit(`/instructor/courses/${course.slug}`);
                                                    }}
                                                    className="flex w-full items-start gap-3 border-b border-neutral-100 px-4 py-3 text-left transition-colors last:border-0 hover:bg-emerald-50 dark:border-slate-800 dark:hover:bg-slate-800"
                                                >
                                                    <CheckCircle size={16} className="mt-0.5 shrink-0 text-emerald-500" />
                                                    <div className="min-w-0">
                                                        <p className="truncate text-sm font-medium text-neutral-800 dark:text-slate-100">
                                                            {course.title}
                                                        </p>
                                                        <p className="mt-0.5 text-xs text-emerald-600 dark:text-emerald-400">
                                                            Approved and published
                                                        </p>
                                                    </div>
                                                </button>
                                            ))
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* User pill */}
                    <Link
                        href={
                            auth?.user?.role === 'instructor'
                                ? '/instructor/profile'
                                : auth?.user?.role === 'admin'
                                  ? '/admin/profile'
                                  : '/student/profile'
                        }
                        className="flex items-center gap-2.5 p-1 transition-colors hover:bg-neutral-100 dark:hover:bg-slate-800"
                        title="Lihat Profil"
                    >
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden bg-purple-100 text-xs font-bold text-purple-600 dark:bg-purple-950/40 dark:text-purple-400">
                            {auth?.user?.avatar_url ? (
                                <img src={auth.user.avatar_url} alt={auth.user.name} className="h-full w-full object-cover" />
                            ) : (
                                auth?.user?.name?.charAt(0)?.toUpperCase()
                            )}
                        </div>

                        <div className="hidden text-right leading-tight sm:block">
                            <p className="text-xs font-medium text-neutral-700 dark:text-slate-200">{auth?.user?.name}</p>
                            <p className="text-[10px] text-neutral-400 capitalize dark:text-slate-500">{auth?.user?.role}</p>
                        </div>
                    </Link>

                    <div className="h-5 w-px bg-neutral-200 dark:bg-slate-700" />

                    <button
                        onClick={toggle}
                        className="p-1.5 text-neutral-400 transition-colors hover:text-neutral-700 dark:text-slate-500 dark:hover:text-white"
                        title="Toggle dark mode"
                    >
                        {isDark ? <Sun size={16} /> : <Moon size={16} />}
                    </button>

                    <button
                        onClick={logout}
                        className="p-1.5 text-neutral-400 transition-colors hover:text-red-500 dark:text-slate-500"
                        title="Logout"
                    >
                        <LogOut size={16} />
                    </button>
                </div>

                {menuOpen && (
                    <nav
                        className="absolute inset-x-0 top-full border-b border-neutral-100 bg-white p-3 shadow-lg md:hidden dark:border-slate-700 dark:bg-[#1e1f24]"
                        aria-label="Mobile navigation"
                    >
                        <div className="mx-auto max-w-screen-2xl space-y-1">
                            {navigation.map(({ label, href, icon: Icon }) => {
                                const active = url === href || (href !== '/' && url.startsWith(`${href}/`));

                                return (
                                    <Link
                                        key={href}
                                        href={href}
                                        onClick={() => setMenuOpen(false)}
                                        className={clsx(
                                            'flex items-center gap-3 px-3 py-2.5 text-sm font-medium transition-colors',
                                            active
                                                ? 'text-purple-700 dark:text-purple-400'
                                                : 'text-neutral-600 hover:text-neutral-800 dark:text-slate-300 dark:hover:text-white',
                                        )}
                                    >
                                        <Icon size={17} />
                                        {label}
                                    </Link>
                                );
                            })}
                        </div>
                    </nav>
                )}
            </div>
        </header>
    );
}

function deriveTitle(url: string): string {
    if (url.includes('/dashboard')) return 'Dashboard';
    if (url.includes('/courses')) return 'Courses';
    if (url.includes('/settings')) return 'Settings';
    if (url.includes('/profile')) return 'Profile';
    if (url.includes('/explore') || url === '/course') return 'Explore';
    return 'Dashboard';
}
