import { Link } from "@inertiajs/react"
import {
  LayoutDashboard,
  BookOpen,
  GraduationCap,
  Users,
} from "lucide-react"

interface SidebarProps {
  role: "admin" | "instructor" | "student"
}

export default function Sidebar({ role }: SidebarProps) {
  return (
    <aside className="w-64 min-h-screen border-r bg-white hidden md:block">
      <nav className="p-4 space-y-2">

        <SidebarLink
          href="/"
          icon={<LayoutDashboard size={18} />}
          label="Dashboard"
        />

        {role === "instructor" && (
          <SidebarLink
            href="/instructor/courses"
            icon={<BookOpen size={18} />}
            label="My Courses"
          />
        )}

        {role === "student" && (
          <SidebarLink
            href="/student/courses"
            icon={<GraduationCap size={18} />}
            label="My Learning"
          />
        )}

        {role === "admin" && (
          <SidebarLink
            href="/admin/users"
            icon={<Users size={18} />}
            label="Manage Users"
          />
        )}

      </nav>
    </aside>
  )
}

function SidebarLink({
  href,
  icon,
  label,
}: {
  href: string
  icon: React.ReactNode
  label: string
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 px-3 py-2 rounded hover:bg-gray-100 text-sm"
    >
      {icon}
      {label}
    </Link>
  )
}
