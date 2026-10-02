import UserNavbar from '@/components/organisms/user/UserNavbar';
import { ToastContainer } from 'react-toastify';
import { useInertiaToast } from '@/hooks/useInertiaToast';

export default function UserLayout({ children }: { children: React.ReactNode }) {
    useInertiaToast();

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-800">
            <UserNavbar />

            <main className="p-6 sm:p-8">{children}</main>

            <ToastContainer
                position="top-right"
                autoClose={4000}
                newestOnTop
                pauseOnHover
                closeOnClick
            />
        </div>
    );
}
