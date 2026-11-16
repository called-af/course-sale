import { useState, useEffect } from 'react';
import { ToastContainer } from 'react-toastify';
import Navbar from '@/components/organisms/admin/AdminNavbar';
import Sidebar from '@/components/organisms/admin/AdminSidebar';
import { useInertiaToast } from '@/hooks/useInertiaToast';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    useInertiaToast();

    useEffect(() => {
        document.body.style.overflow = sidebarOpen ? 'hidden' : '';
        return () => {
            document.body.style.overflow = '';
        };
    }, [sidebarOpen]);

    return (
        <div className="flex h-dvh overflow-hidden bg-gray-100 dark:bg-[#141416]">
            <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            <div className="flex flex-1 flex-col overflow-hidden">
                <Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

                <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 lg:px-8">{children}</main>
            </div>

            <ToastContainer position="top-right" autoClose={4000} newestOnTop pauseOnHover closeOnClick />
        </div>
    );
}
