import { Link, router, usePage } from '@inertiajs/react';
import { ChevronDown, LayoutDashboard, LogOut, Menu, Moon, Sun, X } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useState } from 'react';
import AppLogo from '@/components/atoms/AppLogo';
import Button from '@/components/atoms/Button';
import { useTheme } from '@/hooks/useTheme';
import { EASE, entrance, staggerContainer } from '@/lib/motion';
import type { SharedPageProps } from '@/types/shared';
import type { User } from '@/types/user';

const menus = [
    { name: 'Home', href: '/' },
    { name: 'About', href: '/#about' },
    { name: 'Courses', href: '/course' },
    { name: 'Instructors', href: '/#instructors' },
    { name: 'FAQ', href: '/#faq' },
];

const navLinkVariants = {
    rest: { y: 0 },
    hover: { y: -2 },
};

export default function Navbar() {
    const reduceMotion = useReducedMotion();
    const [open, setOpen] = useState(false);
    const [accountOpen, setAccountOpen] = useState(false);
    const { auth } = usePage<SharedPageProps>().props;
    const user = auth?.user;
    const accountMenus = getAccountMenus(user?.role);
    const { toggle, isDark } = useTheme();

    const logout = () => router.post('/logout');

    return (
        <motion.nav
            initial={entrance(reduceMotion, { opacity: 0, y: -20 })}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: EASE }}
            className="absolute z-50 w-full"
        >
            <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
                <Link href="/" className="flex items-center">
                    <AppLogo className="h-10 w-auto" />
                </Link>

                <div className="hidden items-center gap-8 lg:flex">
                    {menus.map((menu) => (
                        <motion.div
                            key={menu.name}
                            initial="rest"
                            animate="rest"
                            whileHover={reduceMotion ? undefined : 'hover'}
                            variants={navLinkVariants}
                            transition={{ type: 'spring', stiffness: 400, damping: 26 }}
                        >
                            <Link
                                href={menu.href}
                                className="relative font-medium text-gray-700 transition-colors hover:text-purple-700 dark:text-slate-300 dark:hover:text-purple-400"
                            >
                                {menu.name}
                                <motion.span
                                    variants={{ rest: { scaleX: 0 }, hover: { scaleX: 1 } }}
                                    transition={{ duration: 0.3, ease: EASE }}
                                    className="absolute inset-x-0 -bottom-1 h-0.5 origin-left bg-purple-600"
                                />
                            </Link>
                        </motion.div>
                    ))}
                </div>

                <div className="flex items-center gap-3">
                    {/* Dark mode toggle */}
                    <motion.button
                        onClick={toggle}
                        whileTap={reduceMotion ? undefined : { scale: 0.88 }}
                        className="p-2 text-gray-600 transition-colors hover:text-purple-700 dark:text-slate-400 dark:hover:text-purple-400"
                        title="Toggle dark mode"
                    >
                        <AnimatePresence mode="wait" initial={false}>
                            <motion.span
                                key={isDark ? 'sun' : 'moon'}
                                initial={entrance(reduceMotion, { opacity: 0, rotate: -90, scale: 0.6 })}
                                animate={{ opacity: 1, rotate: 0, scale: 1 }}
                                exit={reduceMotion ? undefined : { opacity: 0, rotate: 90, scale: 0.6 }}
                                transition={{ duration: 0.2, ease: EASE }}
                                className="flex"
                            >
                                {isDark ? <Sun size={18} /> : <Moon size={18} />}
                            </motion.span>
                        </AnimatePresence>
                    </motion.button>

                    {user ? (
                        <div className="relative hidden lg:block">
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
                        <motion.div
                            variants={staggerContainer(0.08)}
                            initial={entrance(reduceMotion, 'hidden')}
                            animate="show"
                            className="hidden items-center gap-3 lg:flex"
                        >
                            <motion.div variants={{ hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } }}>
                                <Link href="/login">
                                    <Button variant="outline">Sign In</Button>
                                </Link>
                            </motion.div>
                            <motion.div variants={{ hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } }}>
                                <Link href="/register">
                                    <Button>Sign Up</Button>
                                </Link>
                            </motion.div>
                        </motion.div>
                    )}

                    <motion.button
                        whileTap={reduceMotion ? undefined : { scale: 0.9 }}
                        className="p-2 text-gray-700 lg:hidden dark:text-slate-300"
                        onClick={() => setOpen(!open)}
                        aria-label={open ? 'Close menu' : 'Open menu'}
                    >
                        <AnimatePresence mode="wait" initial={false}>
                            <motion.span
                                key={open ? 'close' : 'menu'}
                                initial={entrance(reduceMotion, { opacity: 0, rotate: -45, scale: 0.7 })}
                                animate={{ opacity: 1, rotate: 0, scale: 1 }}
                                exit={reduceMotion ? undefined : { opacity: 0, rotate: 45, scale: 0.7 }}
                                transition={{ duration: 0.2, ease: EASE }}
                                className="flex"
                            >
                                {open ? <X size={24} /> : <Menu size={24} />}
                            </motion.span>
                        </AnimatePresence>
                    </motion.button>
                </div>
            </div>

            <AnimatePresence initial={false}>
                {open && (
                    <motion.div
                        initial={entrance(reduceMotion, { opacity: 0, height: 0 })}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={reduceMotion ? undefined : { opacity: 0, height: 0 }}
                        transition={{ duration: 0.32, ease: EASE }}
                        className="overflow-hidden border-t border-gray-100 bg-white lg:hidden dark:border-slate-700 dark:bg-[#1e1f24]"
                    >
                        <motion.div
                            variants={staggerContainer(0.05)}
                            initial={entrance(reduceMotion, 'hidden')}
                            animate="show"
                            className="flex flex-col gap-6 px-6 py-6"
                        >
                            <div className="flex flex-col gap-4">
                                {menus.map((menu) => (
                                    <motion.div key={menu.name} variants={{ hidden: { opacity: 0, x: -12 }, show: { opacity: 1, x: 0 } }}>
                                        <Link
                                            href={menu.href}
                                            className="block text-lg font-medium text-gray-700 transition-colors hover:text-purple-700 dark:text-slate-300 dark:hover:text-purple-400"
                                            onClick={() => setOpen(false)}
                                        >
                                            {menu.name}
                                        </Link>
                                    </motion.div>
                                ))}
                            </div>

                            <div className="flex flex-col gap-3 border-t border-gray-100 pt-4 dark:border-slate-700">
                                {!user ? (
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
                                ) : (
                                    <div className="space-y-2">
                                        {accountMenus.map((item) => (
                                            <Link
                                                key={item.href}
                                                href={item.href}
                                                onClick={() => setOpen(false)}
                                                className="flex items-center gap-2 px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-purple-50 hover:text-purple-700 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-purple-400"
                                            >
                                                <LayoutDashboard size={16} />
                                                {item.label}
                                            </Link>
                                        ))}
                                        <button
                                            type="button"
                                            onClick={logout}
                                            className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                                        >
                                            <LogOut size={16} />
                                            Logout
                                        </button>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.nav>
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
    user: User;
    items: { label: string; href: string }[];
    open: boolean;
    onToggle: () => void;
    onNavigate: () => void;
    onLogout: () => void;
}) {
    const reduceMotion = useReducedMotion();

    return (
        <>
            <motion.button
                type="button"
                onClick={onToggle}
                whileTap={reduceMotion ? undefined : { scale: 0.96 }}
                className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-gray-700 transition hover:bg-white/70 dark:text-slate-300 dark:hover:bg-slate-800"
                aria-expanded={open}
                aria-haspopup="menu"
            >
                <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-purple-100 text-xs font-bold text-purple-700 dark:bg-purple-950/40 dark:text-purple-300">
                    {user.avatar_url ? (
                        <img src={user.avatar_url} alt={user.name} className="h-full w-full object-cover" />
                    ) : (
                        user.name?.charAt(0)?.toUpperCase()
                    )}
                </div>
                <span className="max-w-32 truncate text-sm font-medium">{user.name}</span>
                <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ type: 'spring', stiffness: 320, damping: 24 }} className="flex">
                    <ChevronDown size={16} />
                </motion.span>
            </motion.button>

            <AnimatePresence initial={false}>
                {open && (
                    <motion.div
                        initial={entrance(reduceMotion, { opacity: 0, y: -8, scale: 0.97 })}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={reduceMotion ? undefined : { opacity: 0, y: -8, scale: 0.97 }}
                        transition={{ duration: 0.22, ease: EASE }}
                        style={{ transformOrigin: 'top right' }}
                        className="absolute top-full right-0 mt-2 w-52 border border-gray-100 bg-white p-2 shadow-lg dark:border-slate-700 dark:bg-[#1e1f24]"
                        role="menu"
                    >
                        {items.map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={onNavigate}
                                className="flex items-center gap-2 px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-purple-50 hover:text-purple-700 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-purple-400"
                                role="menuitem"
                            >
                                <LayoutDashboard size={16} />
                                {item.label}
                            </Link>
                        ))}
                        <div className="my-1 border-t border-gray-100 dark:border-slate-700" />
                        <button
                            type="button"
                            onClick={onLogout}
                            className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                            role="menuitem"
                        >
                            <LogOut size={16} />
                            Logout
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
