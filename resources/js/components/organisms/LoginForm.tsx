import { Link, useForm } from '@inertiajs/react';
import Button from '@/components/atoms/Button';
import InputField from '@/components/molecules/InputField';

interface LoginFormData {
    email: string;
    password: string;
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

            <div className="text-center text-sm text-slate-600 dark:text-slate-300">
                <Link href="/" className="hover:text-blue-600 dark:hover:text-blue-400">
                    Back to home
                </Link>
            </div>
        </form>
    );
}
