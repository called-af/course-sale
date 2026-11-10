import { Link, router, usePage } from '@inertiajs/react';
import clsx from 'clsx';
import { LayoutDashboard, BookOpen, GraduationCap, LogOut, ExternalLink, Settings, User } from 'lucide-react';
import AppLogo from '@/components/atoms/AppLogo';
import type { SharedPageProps } from '@/types/shared';

interface SidebarProps {
    role: 'instructor' | 'student';
}

function buildMenus(role: string) {
    const prefix = role === 'instructor' ? '/instructor' : '/student';

    if (role === 'instructor') {
        return [
            { label: 'Dashboard', href: `${prefix}/dashboard`, icon: LayoutDashboard },
            { label: 'My Courses', href: `${prefix}/courses`, icon: BookOpen },
            { label: 'Settings', href: `${prefix}/settings`, icon: Settings },
            { label: 'Profile', href: `${prefix}/profile`, icon: User },
        ];
    }

    return [
        { label: 'Dashboard', href: `${prefix}/dashboard`, icon: LayoutDashboard },
        { label: 'My Learning', href: `${prefix}/courses`, icon: GraduationCap },
        { label: 'Explore', href: '/course', icon: BookOpen },
    ];
}

export default function Sidebar({ role }: SidebarProps) {
    const { url, props } = usePage<SharedPageProps>();
    const auth = props.auth;
    const menus = buildMenus(role);

    const logout = () => router.post('/logout');

    return (
        <aside className="hidden min-h-screen w-64 shrink-0 flex-col md:flex" style={{ background: '#141416' }}>
            {/* Logo */}
            <div className="flex h-16 shrink-0 items-center justify-between px-5" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <Link href="/" className="flex items-center">
                    <AppLogo className="h-7 w-auto" />
                </Link>
                <Link href="/" target="_blank" className="p-1.5 text-white/20 transition-colors hover:text-white/60" title="View site">
                    <ExternalLink size={14} />
                </Link>
            </div>

            {/* Nav */}
            <nav className="flex-1 space-y-0.5 px-3 py-5">
                <p className="mb-2 px-3 text-[10px] font-semibold tracking-[0.15em] text-white/20 uppercase">Menu</p>
                {menus.map((item) => {
                    const Icon = item.icon;
                    const active = url === item.href || url.startsWith(item.href + '/');

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={clsx(
                                'group relative flex items-center gap-3 px-3 py-2.5 text-sm transition-all duration-150',
                                active ? 'text-white' : 'text-white/40 hover:text-white/80',
                            )}
                        >
                            {active && <span className="absolute inset-0" style={{ background: 'rgba(255,255,255,0.06)' }} />}
                            {active && <span className="absolute top-1 bottom-1 left-0 w-0.5 bg-purple-500" />}
                            <Icon
                                size={15}
                                className={clsx(
                                    'relative shrink-0 transition-colors',
                                    active ? 'text-purple-400' : 'text-white/25 group-hover:text-white/50',
                                )}
                            />
                            <span className="relative">{item.label}</span>
                        </Link>
                    );
                })}
            </nav>

            {/* User footer */}
            <div className="shrink-0 px-3 py-3" style={{ borderTop: '1px solid rgba(255,255,255,0.05)', background: '#0a0a0a' }}>
                <div className="flex items-center gap-3 px-2 py-2.5">
                    <div
                        className="flex h-8 w-8 shrink-0 items-center justify-center text-xs font-bold text-purple-300"
                        style={{ background: 'rgba(139,92,246,0.15)' }}
                    >
                        {auth?.user?.name?.[0]?.toUpperCase() ?? 'U'}
                    </div>
                    <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-medium text-white/80">{auth?.user?.name}</p>
                        <p className="truncate text-[10px] text-white/25 capitalize">{auth?.user?.role}</p>
                    </div>
                    <button onClick={logout} className="shrink-0 p-1.5 text-white/20 transition-colors hover:text-red-400" title="Logout">
                        <LogOut size={14} />
                    </button>
                </div>
            </div>
        </aside>
    );
}
