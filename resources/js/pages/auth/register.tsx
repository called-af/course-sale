import { Head } from '@inertiajs/react';
import Title from '@/components/atoms/Title';
import RegisterForm from '@/components/organisms/RegisterForm';
import LoginLayout from '@/components/templates/LoginLayout';

export default function Login() {
    return (
        <LoginLayout>
            <Head title="Sign Up" />
            <div className="grid min-h-screen grid-cols-1 bg-gray-100 md:grid-cols-2 dark:bg-[#141416]">
                <div
                    className="hidden bg-cover bg-center md:block"
                    style={{
                        backgroundImage: "url('/assets/landscape.jpeg')",
                    }}
                />
                <div className="flex items-center justify-center px-6">
                    <div className="w-full max-w-md space-y-5">
                        <Title as="h2">Sign Up to get access</Title>
                        <RegisterForm />
                    </div>
                </div>
            </div>
        </LoginLayout>
    );
}
