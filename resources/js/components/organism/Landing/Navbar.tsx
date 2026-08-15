import { useState } from 'react';
import { Link, router, usePage } from '@inertiajs/react';
import Button from '@/components/atoms/Button';
import { ChevronDown, LayoutDashboard, LogOut, Menu, X } from 'lucide-react';

const menus = [
    { name: 'Home', href: '/' },
    { name: 'About', href: '/#about' },
    { name: 'Courses', href: '/course' },
];

export default function Navbar() {
    const [open, setOpen] = useState(false);
    const [accountOpen, setAccountOpen] = useState(false);
    const { auth } = usePage().props as any;
    const user = auth?.user;
    const accountMenus = getAccountMenus(user?.role);

    const logout = () => router.post('/logout');

    return (
        <nav className="absolute z-50 w-full">
            <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
                <Link href="/" className="flex items-center">
                    <img src="/images/logo.png" alt="Logo" className="h-10 w-auto" />
                </Link>

                <div className="hidden items-center gap-8 lg:flex">
                    {menus.map((menu) => (
                        <Link key={menu.name} href={menu.href} className="font-medium text-gray-700 hover:text-purple-700">
                            {menu.name}
                        </Link>
                    ))}
                </div>

                {user ? (
                    <div className="relative">
                        <AccountMenu
                            user={user}
                            items={accountMenus}
                            open={accountOpen}
                            onToggle={() => setAccountOpen((value) => !value)}
                            onNavigate={() => setAccountOpen(false)}
                            onLogout={logout}
                        />
                    </div>
                ) : (
                    <div className="hidden items-center gap-3 lg:flex">
                        <Link href="/login">
                            <Button variant="outline">Sign In</Button>
                        </Link>
                        <Link href="/register">
                            <Button>Sign Up</Button>
                        </Link>
                    </div>
                )}

                <button className="p-2 text-gray-700 lg:hidden" onClick={() => setOpen(!open)}>
                    {open ? <X size={24} /> : <Menu size={24} />}
                </button>
            </div>

            {open && (
                <div className="flex flex-col gap-6 border-t border-gray-100 bg-white px-6 py-6 lg:hidden">
                    <div className="flex flex-col gap-4">
                        {menus.map((menu) => (
                            <Link
                                key={menu.name}
                                href={menu.href}
                                className="text-lg font-medium text-gray-700 hover:text-purple-700"
                                onClick={() => setOpen(false)}
                            >
                                {menu.name}
                            </Link>
                        ))}
                    </div>

                    <div className="flex flex-col gap-3 border-t border-gray-100 pt-4">
                        {!user && (
                            <>
                                <Link href="/login" onClick={() => setOpen(false)}>
                                    <Button variant="outline" widthFull>
                                        Sign In
                                    </Button>
                                </Link>
                                <Link href="/register" onClick={() => setOpen(false)}>
                                    <Button widthFull>Sign Up</Button>
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            )}
        </nav>
    );
}

function getAccountMenus(role?: string) {
    if (role === 'instructor') {
        return [
            { label: 'Dashboard', href: '/instructor/dashboard' },
            { label: 'My Courses', href: '/instructor/courses' },
        ];
    }

    if (role === 'admin') {
        return [
            { label: 'Dashboard', href: '/admin/dashboard' },
            { label: 'Courses', href: '/admin/courses' },
        ];
    }

    return [
        { label: 'Dashboard', href: '/student/dashboard' },
        { label: 'My Learning', href: '/student/courses' },
    ];
}

function AccountMenu({
    user,
    items,
    open,
    onToggle,
    onNavigate,
    onLogout,
}: {
    user: any;
    items: { label: string; href: string }[];
    open: boolean;
    onToggle: () => void;
    onNavigate: () => void;
    onLogout: () => void;
}) {
    return (
        <>
            <button
                type="button"
                onClick={onToggle}
                className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-gray-700 transition hover:bg-white/70"
                aria-expanded={open}
                aria-haspopup="menu"
            >
                <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-purple-100 text-xs font-bold text-purple-700">
                    {user.avatar_url ? (
                        <img src={user.avatar_url} alt={user.name} className="h-full w-full object-cover" />
                    ) : (
                        user.name?.charAt(0)?.toUpperCase()
                    )}
                </div>
                <span className="max-w-32 truncate text-sm font-medium">{user.name}</span>
                <ChevronDown size={16} className={open ? 'rotate-180 transition-transform' : 'transition-transform'} />
            </button>

            {open && (
                <div className="absolute top-full right-0 mt-2 w-52 border border-gray-100 bg-white p-2 shadow-lg" role="menu">
                    {items.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            onClick={onNavigate}
                            className="flex items-center gap-2 px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-purple-50 hover:text-purple-700"
                            role="menuitem"
                        >
                            <LayoutDashboard size={16} />
                            {item.label}
                        </Link>
                    ))}
                    <div className="my-1 border-t border-gray-100" />
                    <button
                        type="button"
                        onClick={onLogout}
                        className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm font-medium text-red-600 hover:bg-red-50"
                        role="menuitem"
                    >
                        <LogOut size={16} />
                        Logout
                    </button>
                </div>
            )}
        </>
    );
}
