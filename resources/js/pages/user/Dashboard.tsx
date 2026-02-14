import { Head, usePage } from "@inertiajs/react"
import DashboardLayout from "@/components/templates/DashboardLayout"

export default function Dashboard() {
  const { auth } = usePage().props as any
  const role = auth.user.role

  return (
    <>
      <Head title="Dashboard" />

      <div className="space-y-6">
        <h1 className="text-2xl font-semibold">
          Welcome back, {auth.user.name}
        </h1>

        {role === "admin" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card title="Total Users" value="1,245" />
            <Card title="Total Courses" value="86" />
            <Card title="Revenue" value="Rp 24.500.000" />
          </div>
        )}

        {role === "instructor" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card title="My Courses" value="12" />
            <Card title="Total Students" value="340" />
            <Card title="Earnings" value="Rp 8.200.000" />
          </div>
        )}

        {role === "student" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card title="Enrolled Courses" value="5" />
            <Card title="Completed" value="2" />
            <Card title="Progress" value="65%" />
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm p-4">
          <h2 className="font-medium mb-3">Recent Activity</h2>
          <p className="text-sm text-gray-500">
            No recent activity yet.
          </p>
        </div>
      </div>
    </>
  )
}

Dashboard.layout = (page: React.ReactNode) => (
  <DashboardLayout>{page}</DashboardLayout>
)

function Card({ title, value }: { title: string; value: string }) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-4">
      <p className="text-sm text-gray-500">{title}</p>
      <p className="text-xl font-semibold mt-1">{value}</p>
    </div>
  )
}
