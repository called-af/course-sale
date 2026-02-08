import { Head } from '@inertiajs/react';
import AdminLayout from "@/components/templates/AdminLayout"

export default function Dashboard() {
  return (
    <>
      <div>admin</div>
    </>
  );
}


Dashboard.layout = (page: React.ReactNode) => (
  <AdminLayout>{page}</AdminLayout>
)