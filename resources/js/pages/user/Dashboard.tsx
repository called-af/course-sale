import { Head, usePage } from "@inertiajs/react"
import UserLayout from "@/components/templates/UserLayout"
import {
  BookOpen,
  CheckCircle,
  Clock,
  TrendingUp,
  Users,
  LayoutGrid,
  DollarSign,
  Star,
} from "lucide-react"

export default function Dashboard() {
  const { auth } = usePage().props as any
  const role = auth.user.role

  return (
    <>
      <Head title="Dashboard" />

      <div className="space-y-8">

        {/* Welcome Banner */}
        <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-purple-950 to-slate-900 text-white p-6 sm:p-8 shadow-xl">
          <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute right-20 -top-10 w-48 h-48 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
          <div className="relative z-10">
            <p className="text-purple-300 text-sm font-medium mb-1">Welcome back 👋</p>
            <h1 className="text-2xl sm:text-3xl font-bold text-white">{auth.user.name}</h1>
            <p className="text-slate-400 text-sm mt-1">
              {role === "instructor"
                ? "Manage your courses and track your students' progress."
                : "Keep up the momentum — your next lesson is waiting."}
            </p>
          </div>
        </div>

        {/* Stats */}
        {role === "instructor" ? <InstructorStats /> : <StudentStats />}

        {/* Main content */}
        {role === "instructor" ? <InstructorContent /> : <StudentContent />}

      </div>
    </>
  )
}

Dashboard.layout = (page: React.ReactNode) => (
  <UserLayout>{page}</UserLayout>
)

/* ─────────────────────────────────────────────
   INSTRUCTOR
───────────────────────────────────────────── */

function InstructorStats() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard icon={<LayoutGrid size={18} />} label="My Courses" value="—" color="purple" />
      <StatCard icon={<Users size={18} />} label="Total Students" value="—" color="indigo" />
      <StatCard icon={<DollarSign size={18} />} label="Earnings" value="—" color="emerald" />
      <StatCard icon={<Star size={18} />} label="Avg. Rating" value="—" color="amber" />
    </div>
  )
}

function InstructorContent() {
  return (
    <div className="grid lg:grid-cols-2 gap-6">
      <Section title="My Courses" description="Courses you've created.">
        <EmptyState message="No courses created yet." />
      </Section>
      <Section title="Recent Enrollments" description="Latest students who joined your courses.">
        <EmptyState message="No enrollments yet." />
      </Section>
    </div>
  )
}

/* ─────────────────────────────────────────────
   STUDENT
───────────────────────────────────────────── */

function StudentStats() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard icon={<BookOpen size={18} />} label="Enrolled Courses" value="—" color="indigo" />
      <StatCard icon={<CheckCircle size={18} />} label="Completed" value="—" color="emerald" />
      <StatCard icon={<Clock size={18} />} label="Hours Learned" value="—" color="amber" />
      <StatCard icon={<TrendingUp size={18} />} label="Overall Progress" value="—" color="purple" />
    </div>
  )
}

function StudentContent() {
  return (
    <div className="grid lg:grid-cols-2 gap-6">
      <Section title="Continue Learning" description="Pick up where you left off.">
        <EmptyState message="No courses in progress yet." />
      </Section>
      <Section title="Recent Activity" description="Your latest learning actions.">
        <EmptyState message="No recent activity yet." />
      </Section>
    </div>
  )
}

/* ─────────────────────────────────────────────
   SHARED SUB-COMPONENTS
───────────────────────────────────────────── */

function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode
  label: string
  value: string
  color: "indigo" | "emerald" | "amber" | "purple"
}) {
  const colors = {
    indigo:  "bg-indigo-50  text-indigo-600",
    emerald: "bg-emerald-50 text-emerald-600",
    amber:   "bg-amber-50   text-amber-600",
    purple:  "bg-purple-50  text-purple-600",
  }

  return (
    <div className="bg-white border border-slate-100 shadow-xs p-5 hover:shadow-md transition">
      <div className={`w-9 h-9 flex items-center justify-center mb-3 ${colors[color]}`}>
        {icon}
      </div>
      <p className="text-2xl font-bold text-slate-800">{value}</p>
      <p className="text-xs text-slate-400 mt-0.5">{label}</p>
    </div>
  )
}

function Section({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children: React.ReactNode
}) {
  return (
    <div className="bg-white border border-slate-100 shadow-xs p-6 space-y-4">
      <div>
        <h2 className="text-base font-semibold text-slate-800">{title}</h2>
        <p className="text-xs text-slate-400 mt-0.5">{description}</p>
      </div>
      {children}
    </div>
  )
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="py-10 flex items-center justify-center text-sm text-slate-400 border border-dashed border-slate-200">
      {message}
    </div>
  )
}
