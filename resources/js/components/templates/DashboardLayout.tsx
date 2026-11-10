import UserLayout from '@/components/templates/UserLayout';

// DashboardLayout is kept as an alias for backward compatibility
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    return <UserLayout>{children}</UserLayout>;
}
