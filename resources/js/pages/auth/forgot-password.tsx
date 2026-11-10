import { Head, useForm } from '@inertiajs/react';
import Title from '@/components/atoms/Title';
import LoginLayout from '@/components/templates/LoginLayout';

export default function ForgotPassword() {
    return (
        <LoginLayout>
            <Head title="Reset Password" />
            <div className="grid min-h-screen grid-cols-1 bg-gray-100 md:grid-cols-2 dark:bg-[#141416]">
                <div className="hidden bg-cover bg-center md:block" style={{ backgroundImage: 'url("/assets/landscape.jpeg")' }} />
                <div className="flex items-center justify-center px-6">
                    <div className="w-full max-w-md space-y-5">
                        <Title as="h2">Reset your password</Title>
                        <p className="text-sm text-slate-600 dark:text-slate-300">
                            Masukkan alamat email akunmu. Kita akan mengirimkan tautan untuk mereset password.
                        </p>
                        <ForgotPasswordForm />
                    </div>
                </div>
            </div>
        </LoginLayout>
    );
}

function ForgotPasswordForm() {
    const { data, setData, post, processing, errors } = useForm<{ email: string }>({
        email: '',
    });

    const submit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        post('/forgot-password');
    };

    return (
        <form onSubmit={submit} className="space-y-4">
            <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200" htmlFor="email">
                    Email
                </label>
                <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={data.email}
                    onChange={(e) => setData('email', e.target.value)}
                    className="w-full border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-purple-700 focus:ring-1 focus:ring-purple-700 dark:border-slate-600 dark:bg-[#1e1f24] dark:text-slate-100 dark:focus:border-purple-500"
                />
                {errors?.email ? <p className="mt-2 text-sm text-rose-600 dark:text-rose-400">{errors.email}</p> : null}
            </div>

            <button
                type="submit"
                disabled={processing}
                className="w-full bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
            >
                {processing ? 'Mengirim...' : 'Kirim Link Reset'}
            </button>

            <p className="text-center text-sm text-slate-600 dark:text-slate-300">
                <a href="/login" className="font-medium text-purple-700 hover:underline dark:text-purple-400">
                    Back to sign in
                </a>
            </p>
        </form>
    );
}
