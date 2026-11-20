import { ToastContainer } from 'react-toastify';

import { useInertiaToast } from '@/hooks/useInertiaToast';

/**
 * Full-screen shell for focused design tools (e.g. the certificate designer).
 * It intentionally omits the admin navbar/sidebar so the tool keeps a single,
 * self-contained header instead of stacking two navigation bars.
 */
export default function DesignerLayout({ children }: { children: React.ReactNode }) {
    useInertiaToast();

    return (
        <div className="h-dvh overflow-hidden bg-[#f1f1f4] dark:bg-[#101013]">
            {children}

            <ToastContainer position="top-right" autoClose={4000} newestOnTop pauseOnHover closeOnClick />
        </div>
    );
}
