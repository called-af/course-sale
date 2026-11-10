import { ToastContainer } from 'react-toastify';
import UserNavbar from '@/components/organisms/user/UserNavbar';
import { useInertiaToast } from '@/hooks/useInertiaToast';

export default function UserLayout({ children }: { children: React.ReactNode }) {
    useInertiaToast();

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-[#141416]">
            <UserNavbar />

            <main className="px-4 py-6 sm:px-6 lg:px-8">{children}</main>

            <ToastContainer position="top-right" autoClose={4000} newestOnTop pauseOnHover closeOnClick />
        </div>
    );
}
