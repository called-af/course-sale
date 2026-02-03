import { Head } from '@inertiajs/react';
import DashboardLayout from "@/components/templates/DashboardLayout"

export default function Dashboard() {
  return (
    <>
      <div>admin</div>
    </>
  );
}


Dashboard.layout = (page: React.ReactNode) => (
  <DashboardLayout>{page}</DashboardLayout>
)