import UserNavbar from '@/components/molecules/User/UserNavbar';

export default function UserLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-screen bg-slate-50">
            <UserNavbar />

            <main className="p-6 sm:p-8">{children}</main>
        </div>
    );
}
