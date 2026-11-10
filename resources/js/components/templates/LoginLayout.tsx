import { ToastContainer } from 'react-toastify';
import { useInertiaToast } from '@/hooks/useInertiaToast';

export default function LoginLayout({ children }: { children: React.ReactNode }) {
    useInertiaToast();

    return (
        <>
            {children}

            <ToastContainer position="top-right" autoClose={4000} newestOnTop pauseOnHover closeOnClick />
        </>
    );
}
