import { Head } from '@inertiajs/react';
import LoginLayout from '@/components/templates/LoginLayout';

export default function VerifyEmail() {
    return (
        <LoginLayout>
            <Head title="Verify Email" />
            <div className="flex min-h-screen flex-col items-center justify-center bg-gray-100 px-6 dark:bg-[#141416]">
                <div className="w-full max-w-md rounded-none border border-slate-200 bg-white p-8 text-center shadow-sm dark:border-slate-700 dark:bg-[#1e1f24]">
                    <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">Verify your email</h1>
                    <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
                        Refresh this page after opening the link in your verification email.
                    </p>
                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">If you've already received the link, please wait a moment.</p>
                </div>
            </div>
        </LoginLayout>
    );
}
