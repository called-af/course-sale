import { Link, useForm } from '@inertiajs/react';
import Button from '@/components/atoms/Button';
import InputField from '@/components/molecules/InputField';

interface LoginFormData {
    email: string;
    password: string;
}

function GoogleIcon() {
    return (
        <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5">
            <path d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.3h6.44a5.5 5.5 0 0 1-2.39 3.61v3h3.86c2.26-2.08 3.58-5.14 3.58-8.64Z" fill="#4285F4" />
            <path
                d="M12 24c3.24 0 5.96-1.08 7.95-2.91l-3.86-3c-1.07.72-2.44 1.15-4.09 1.15-3.14 0-5.8-2.12-6.75-4.97H1.26v3.09A12 12 0 0 0 12 24Z"
                fill="#34A853"
            />
            <path
                d="M5.25 14.27A7.2 7.2 0 0 1 4.87 12c0-.79.14-1.55.38-2.27V6.64H1.26A12 12 0 0 0 0 12c0 1.94.46 3.77 1.26 5.36l3.99-3.09Z"
                fill="#FBBC05"
            />
            <path
                d="M12 4.77c1.76 0 3.34.6 4.58 1.79l3.44-3.44C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.69 1.26 6.64l3.99 3.09c.95-2.85 3.61-4.96 6.75-4.96Z"
                fill="#EA4335"
            />
        </svg>
    );
}

export default function LoginForm() {
    const { data, setData, post, processing } = useForm<LoginFormData>({
        email: '',
        password: '',
    });

    const submit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        post('/login');
    };

    return (
        <div className="space-y-4">
            <form onSubmit={submit} className="space-y-4">
                <InputField
                    label="Email"
                    name="email"
                    type="email"
                    placeholder="email@gmail.com"
                    value={data.email}
                    onChange={(e) => setData('email', e.target.value)}
                />

                <InputField
                    label="Password"
                    name="password"
                    type="password"
                    placeholder="********"
                    value={data.password}
                    onChange={(e) => setData('password', e.target.value)}
                />

                <div className="flex justify-between text-sm text-slate-600 dark:text-slate-300">
                    <Link href="/forgot-password" className="hover:text-blue-600 dark:hover:text-blue-400">
                        Forgot your password?
                    </Link>

                    <Link href="/register" className="hover:text-blue-600 dark:hover:text-blue-400">
                        Create an account
                    </Link>
                </div>

                <Button type="submit" disabled={processing} widthFull>
                    Sign in
                </Button>
            </form>

            <div className="relative">
                <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-slate-200 dark:border-slate-700" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-gray-100 px-2 text-slate-500 dark:bg-[#141416] dark:text-slate-400">Or continue with</span>
                </div>
            </div>

            <a
                href="/auth/google/redirect"
                className="flex w-full items-center justify-center gap-3 border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-[#1e1f24] dark:text-slate-200 dark:hover:bg-slate-800"
            >
                <GoogleIcon />
                Continue with Google
            </a>

            <div className="text-center text-sm text-slate-600 dark:text-slate-300">
                <Link href="/" className="hover:text-blue-600 dark:hover:text-blue-400">
                    Back to home
                </Link>
            </div>
        </div>
    );
}
