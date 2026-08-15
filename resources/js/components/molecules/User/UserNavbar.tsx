import { Link, router, usePage } from '@inertiajs/react';
import { BookOpen, Compass, GraduationCap, LayoutDashboard, LogOut, Menu, X } from 'lucide-react';
import clsx from 'clsx';
import { useState } from 'react';

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
        ];
    }

    return [
        { label: 'Dashboard', href: '/student/dashboard', icon: LayoutDashboard },
        { label: 'My Learning', href: '/student/courses', icon: GraduationCap },
        { label: 'Explore', href: '/course', icon: Compass },
    ];
}

export default function UserNavbar({ title }: UserNavbarProps) {
    const { props, url } = usePage();
    const auth = (props as any).auth;
    const [menuOpen, setMenuOpen] = useState(false);
    const navigation = buildNavigation(auth?.user?.role ?? 'student');

    const logout = () => router.post('/logout');

    // Derive page title from URL if not passed explicitly
    const pageTitle = title ?? deriveTitle(url);

    return (
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-neutral-100 bg-white px-5">
            <div className="relative flex w-full items-center justify-between gap-4">
                <div className="flex min-w-0 items-center gap-3">
                    <button
                        onClick={() => setMenuOpen((open) => !open)}
                        className="p-2 text-neutral-400 transition-colors hover:text-neutral-700 md:hidden"
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
                                        active ? 'text-purple-700' : 'text-neutral-500 hover:text-neutral-800',
                                    )}
                                >
                                    <Icon size={16} />
                                    {label}
                                </Link>
                            );
                        })}
                    </nav>

                    <span className="truncate text-sm font-semibold text-neutral-800 md:hidden">{pageTitle}</span>
                </div>

                <div className="flex shrink-0 items-center gap-3">
                    {/* User pill */}
                    <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden bg-purple-100 text-xs font-bold text-purple-600">
                            {auth?.user?.avatar_url ? (
                                <img src={auth.user.avatar_url} alt={auth.user.name} className="h-full w-full object-cover" />
                            ) : (
                                auth?.user?.name?.charAt(0)?.toUpperCase()
                            )}
                        </div>

                        <div className="hidden text-right leading-tight sm:block">
                            <p className="text-xs font-medium text-neutral-700">{auth?.user?.name}</p>
                            <p className="text-[10px] text-neutral-400 capitalize">{auth?.user?.role}</p>
                        </div>
                    </div>

                    <div className="h-5 w-px bg-neutral-200" />

                    <button onClick={logout} className="p-1.5 text-neutral-400 transition-colors hover:text-red-500" title="Logout">
                        <LogOut size={16} />
                    </button>
                </div>

                {menuOpen && (
                    <nav
                        className="absolute inset-x-0 top-full border-b border-neutral-100 bg-white p-3 shadow-lg md:hidden"
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
                                            active ? 'text-purple-700' : 'text-neutral-600 hover:text-neutral-800',
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
    if (url.includes('/profile')) return 'Profile';
    if (url.includes('/explore') || url === '/course') return 'Explore';
    return 'Dashboard';
}
