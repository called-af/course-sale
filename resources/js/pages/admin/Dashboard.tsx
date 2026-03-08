import { Head } from "@inertiajs/react"
import AdminLayout from "@/components/templates/AdminLayout"
import {
  Users,
  BookOpen,
  DollarSign,
  TrendingUp,
  ArrowUpRight,
} from "lucide-react"

export default function Dashboard() {
  return (
    <>
      <Head title="Admin Dashboard" />

      <div className="space-y-8">
        {/* ===== Hero Section ===== */}
        <div className="rounded-3xl p-8 bg-linear-to-br from-indigo-600 via-purple-600 to-blue-600 text-white shadow-xl">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <h1 className="text-3xl font-bold">
                Welcome back, Admin 👋
              </h1>
              <p className="text-indigo-100 mt-2 text-sm">
                Here’s your platform performance overview today.
              </p>
            </div>

            <div className="flex gap-3">
              <button className="px-4 py-2 bg-white/20 backdrop-blur rounded-xl text-sm hover:bg-white/30 transition">
                View Reports
              </button>
              <button className="px-4 py-2 bg-white text-indigo-700 rounded-xl text-sm font-semibold hover:bg-indigo-50 transition">
                + Add Course
              </button>
            </div>
          </div>
        </div>

        {/* ===== KPI Cards ===== */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
          <KpiCard
            title="Total Users"
            value="1,284"
            change="+12%"
            icon={<Users size={18} />}
          />
          <KpiCard
            title="Total Courses"
            value="86"
            change="+4%"
            icon={<BookOpen size={18} />}
          />
          <KpiCard
            title="Monthly Revenue"
            value="$12,430"
            change="+18%"
            icon={<DollarSign size={18} />}
          />
          <KpiCard
            title="Growth Rate"
            value="24%"
            change="+3.2%"
            icon={<TrendingUp size={18} />}
          />
        </div>

        {/* ===== Main Grid ===== */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Revenue Section */}
          <div className="xl:col-span-2 bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-slate-800">
                Revenue Overview
              </h2>
              <button className="text-sm text-indigo-600 hover:underline flex items-center gap-1">
                Details <ArrowUpRight size={14} />
              </button>
            </div>

            {/* Chart Placeholder */}
            <div className="h-64 rounded-2xl bg-slate-50 border border-dashed border-slate-200 flex items-center justify-center text-slate-400 text-sm">
              Revenue Chart Area
            </div>
          </div>

          {/* Top Courses */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
            <h2 className="text-lg font-semibold text-slate-800 mb-4">
              Top Courses
            </h2>

            <div className="space-y-4">
              <CourseItem
                title="Laravel Mastery"
                students="320 students"
              />
              <CourseItem
                title="React Advanced"
                students="270 students"
              />
              <CourseItem
                title="Next.js Fullstack"
                students="198 students"
              />
            </div>
          </div>
        </div>

        {/* ===== Bottom Section ===== */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Recent Enrollments */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
            <h2 className="text-lg font-semibold text-slate-800 mb-4">
              Recent Enrollments
            </h2>

            <div className="space-y-3">
              <EnrollmentItem
                name="John Doe"
                course="React Advanced"
              />
              <EnrollmentItem
                name="Sarah"
                course="Laravel Mastery"
              />
              <EnrollmentItem
                name="Michael"
                course="Next.js Fullstack"
              />
            </div>
          </div>

          {/* Activity Timeline */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
            <h2 className="text-lg font-semibold text-slate-800 mb-4">
              Activity
            </h2>

            <div className="space-y-4 text-sm text-slate-600">
              <TimelineItem text="New course created" time="2 hours ago" />
              <TimelineItem text="User upgraded to premium" time="5 hours ago" />
              <TimelineItem text="New review submitted" time="Yesterday" />
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

Dashboard.layout = (page: React.ReactNode) => (
  <AdminLayout>{page}</AdminLayout>
)

/* ================= Components ================= */

function KpiCard({
  title,
  value,
  change,
  icon,
}: {
  title: string
  value: string
  change: string
  icon: React.ReactNode
}) {
  return (
    <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100 hover:shadow-md transition">
      <div className="flex items-center justify-between">
        <div className="text-slate-500 text-sm">{title}</div>
        <div className="h-8 w-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
          {icon}
        </div>
      </div>

      <div className="mt-3">
        <div className="text-2xl font-bold text-slate-800">
          {value}
        </div>
        <div className="text-xs text-emerald-600 mt-1">
          {change} from last month
        </div>
      </div>
    </div>
  )
}

function CourseItem({ title, students }: { title: string; students: string }) {
  return (
    <div className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition">
      <div>
        <div className="text-sm font-medium text-slate-700">
          {title}
        </div>
        <div className="text-xs text-slate-400">
          {students}
        </div>
      </div>
      <span className="text-xs text-indigo-600 font-medium">
        View
      </span>
    </div>
  )
}

function EnrollmentItem({ name, course }: { name: string; course: string }) {
  return (
    <div className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition">
      <div>
        <div className="text-sm font-medium text-slate-700">
          {name}
        </div>
        <div className="text-xs text-slate-400">
          Enrolled in {course}
        </div>
      </div>
      <span className="text-xs text-slate-400">
        Just now
      </span>
    </div>
  )
}

function TimelineItem({ text, time }: { text: string; time: string }) {
  return (
    <div className="flex gap-3">
      <div className="w-2 h-2 mt-2 bg-indigo-500 rounded-full" />
      <div>
        <div>{text}</div>
        <div className="text-xs text-slate-400">
          {time}
        </div>
      </div>
    </div>
  )
}