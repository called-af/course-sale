import { Head, useForm } from '@inertiajs/react';
import { usePage } from '@inertiajs/react';
import Title from '@/components/atoms/Title';
import LoginLayout from '@/components/templates/LoginLayout';

export default function ResetPassword() {
    const page = usePage();
    const props = page.props as unknown as { token?: string; email?: string };
    const token = props.token ?? '';
    const email = props.email ?? '';

    const { data, setData, post, processing, errors } = useForm<{
        token: string;
        email: string;
        password: string;
        password_confirmation: string;
    }>({
        token,
        email,
        password: '',
        password_confirmation: '',
    });

    const submit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        post('/reset-password');
    };

    const setField = (key: keyof typeof data, value: string) => setData(key, value);

    return (
        <LoginLayout>
            <Head title="Reset Password" />
            <div className="grid min-h-screen grid-cols-1 bg-gray-100 md:grid-cols-2 dark:bg-[#141416]">
                <div className="hidden bg-cover bg-center md:block" style={{ backgroundImage: 'url("/assets/landscape.jpeg")' }} />
                <div className="flex items-center justify-center px-6">
                    <div className="w-full max-w-md space-y-5">
                        <Title as="h2">Set a new password</Title>
                        <form onSubmit={submit} className="space-y-4">
                            <input type="hidden" name="token" value={data.token} onChange={(e) => setField('token', e.target.value)} />
                            <input type="hidden" name="email" value={data.email} onChange={(e) => setField('email', e.target.value)} />

                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200" htmlFor="password">
                                    New password
                                </label>
                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    required
                                    minLength={8}
                                    value={data.password}
                                    onChange={(e) => setField('password', e.target.value)}
                                    className="w-full border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-purple-700 focus:ring-1 focus:ring-purple-700 dark:border-slate-600 dark:bg-[#1e1f24] dark:text-slate-100 dark:focus:border-purple-500"
                                />
                                {errors?.password ? <p className="mt-2 text-sm text-rose-600 dark:text-rose-400">{errors.password}</p> : null}
                            </div>

                            <div>
                                <label
                                    className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200"
                                    htmlFor="password_confirmation"
                                >
                                    Confirm new password
                                </label>
                                <input
                                    id="password_confirmation"
                                    name="password_confirmation"
                                    type="password"
                                    required
                                    value={data.password_confirmation}
                                    onChange={(e) => setField('password_confirmation', e.target.value)}
                                    className="w-full border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-purple-700 focus:ring-1 focus:ring-purple-700 dark:border-slate-600 dark:bg-[#1e1f24] dark:text-slate-100 dark:focus:border-purple-500"
                                />
                                {errors?.password_confirmation ? (
                                    <p className="mt-2 text-sm text-rose-600 dark:text-rose-400">{errors.password_confirmation}</p>
                                ) : null}
                            </div>

                            <button
                                type="submit"
                                disabled={processing}
                                className="w-full bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
                            >
                                {processing ? 'Menyimpan...' : 'Reset Password'}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </LoginLayout>
    );
}
