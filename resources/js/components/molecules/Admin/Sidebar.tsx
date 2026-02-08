import { Link, usePage } from "@inertiajs/react"
import {
  LayoutDashboard,
  BookOpen,
  GraduationCap,
  Users,
  Layers,
  CreditCard,
} from "lucide-react"
import clsx from "clsx"

interface SidebarProps {
  role: "admin"
}

const menuByRole = {
  admin: [
    { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
    { label: "Users", href: "/admin/users", icon: Users },
    { label: "Courses", href: "/admin/courses", icon: BookOpen },
    { label: "Categories", href: "/admin/categories", icon: Layers },
    { label: "Payments", href: "/admin/payments", icon: CreditCard },
  ]
}

export default function Sidebar({ role }: SidebarProps) {
  const { url } = usePage()

  return (
    <aside className="hidden md:flex w-72 min-h-screen flex-col bg-slate-950 text-slate-200 border-r border-white/5">
      {/* Logo */}
      <div className="h-16 flex items-center px-6 text-lg font-semibold tracking-wide">
        <span className="text-indigo-400">●</span>
        <span className="ml-2">CourseSale</span>
      </div>

      {/* Menu */}
      <nav className="flex-1 px-4 py-6 space-y-1">
        {menuByRole[role].map((item) => {
          const Icon = item.icon
          const active = url.startsWith(item.href)

          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                "group flex items-center gap-3 rounded-xl px-4 py-3 text-sm transition-all",
                active
                  ? "bg-white/10 text-white shadow-inner"
                  : "text-slate-400 hover:text-white hover:bg-white/5"
              )}
            >
              <Icon
                size={18}
                className={clsx(
                  "transition",
                  active
                    ? "text-indigo-400"
                    : "group-hover:text-indigo-300"
                )}
              />
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="px-6 py-4 text-xs text-slate-500 border-t border-white/5">
        Logged as <span className="capitalize">{role}</span>
      </div>
    </aside>
  )
}
