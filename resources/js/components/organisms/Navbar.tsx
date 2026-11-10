import { useForm, usePage } from '@inertiajs/react';
import { LogOut, Menu } from 'lucide-react';
import type { SharedPageProps } from '@/types/shared';

interface NavbarProps {
    onToggleSidebar?: () => void;
}

export default function Navbar({ onToggleSidebar }: NavbarProps) {
    const { post } = useForm();
    const { auth } = usePage<SharedPageProps>().props;

    const logout = () => post('/logout');

    return (
        <header className="sticky top-0 z-30">
            <div className="mx-4 mt-4 flex h-16 items-center justify-between rounded-2xl border border-white/10 bg-white/80 px-5 shadow-sm backdrop-blur-md">
                {/* Left */}
                <div className="flex items-center gap-3">
                    <button onClick={onToggleSidebar} className="text-slate-600 md:hidden">
                        <Menu size={20} />
                    </button>

                    <h1 className="font-semibold text-slate-800">Dashboard</h1>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-3">
                        {/* Avatar */}
                        <div className="h-9 w-9 overflow-hidden rounded-full bg-slate-100">
                            {auth?.user?.avatar_url ? (
                                <img src={auth.user.avatar_url} alt={auth.user.name} className="h-full w-full object-cover" />
                            ) : (
                                <div className="flex h-full w-full items-center justify-center bg-linear-to-br from-indigo-500 to-purple-600 text-sm font-semibold text-white">
                                    {auth?.user?.name?.charAt(0)}
                                </div>
                            )}
                        </div>

                        <div className="hidden text-sm leading-tight sm:block">
                            <div className="font-medium text-slate-700">{auth.user.name}</div>
                            <div className="text-xs text-slate-400 capitalize">{auth.user.role}</div>
                        </div>
                    </div>

                    <button onClick={logout} className="text-sm text-red-600 hover:text-red-700">
                        <LogOut size={18} />
                    </button>
                </div>
            </div>
        </header>
    );
}
