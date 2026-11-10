import { Link, useForm } from '@inertiajs/react';
import Button from '@/components/atoms/Button';
import InputField from '@/components/molecules/InputField';

interface RegisterFormData {
    name: string;
    email: string;
    password: string;
    password_confirmation: string;
}

export default function RegisterForm() {
    const { data, setData, post, processing } = useForm<RegisterFormData>({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
    });

    const submit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        post('/register');
    };

    return (
        <form onSubmit={submit} className="space-y-4">
            <InputField
                label="Full Name"
                name="name"
                type="text"
                placeholder="John Doe"
                value={data.name}
                onChange={(e) => setData('name', e.target.value)}
            />

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

            <InputField
                label="Confirm Password"
                name="password_confirmation"
                type="password"
                placeholder="********"
                value={data.password_confirmation}
                onChange={(e) => setData('password_confirmation', e.target.value)}
            />

            <Button type="submit" disabled={processing} widthFull>
                Create account
            </Button>

            <div className="flex justify-between text-sm text-slate-600 dark:text-slate-300">
                <Link href="/login" className="hover:text-blue-600 dark:hover:text-blue-400">
                    Already have an account?
                </Link>

                <Link href="/" className="hover:text-blue-600 dark:hover:text-blue-400">
                    Back to home
                </Link>
            </div>
        </form>
    );
}
