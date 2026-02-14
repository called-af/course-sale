import { Link, usePage } from "@inertiajs/react"
import {
  LayoutDashboard,
  BookOpen,
  Users,
  Layers,
  CreditCard,
  X,
} from "lucide-react"
import clsx from "clsx"

interface SidebarProps {
  role: "admin"
  open: boolean
  onClose: () => void
}

const menuByRole = {
  admin: [
    { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
    { label: "Users", href: "/admin/users", icon: Users },
    { label: "Courses", href: "/admin/courses", icon: BookOpen },
    { label: "Categories", href: "/admin/categories", icon: Layers },
    { label: "Payments", href: "/admin/payments", icon: CreditCard },
  ],
}

export default function Sidebar({ role, open, onClose }: SidebarProps) {
  const { url } = usePage()

  return (
    <aside
      className={clsx(
        "fixed lg:static inset-y-0 left-0 w-72 h-screen bg-slate-950 text-slate-200 border-r border-white/5 z-50 transform transition-transform duration-300 overflow-hidden",
        open ? "translate-x-0" : "-translate-x-full",
        "lg:translate-x-0"
      )}
    >
      <div className="h-16 flex items-center justify-between px-6 text-lg font-semibold">
        <div>
          <span className="text-indigo-400">●</span>
          <span className="ml-2">CourseSale</span>
        </div>

        <button
          onClick={onClose}
          className="lg:hidden p-2 rounded-lg hover:bg-white/10"
        >
          <X size={20} />
        </button>
      </div>

      <nav className="px-4 py-6 space-y-1">
        {menuByRole[role].map((item) => {
          const Icon = item.icon
          const active = url.startsWith(item.href)

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={clsx(
                "group flex items-center gap-3 rounded-xl px-4 py-3 text-sm transition-all",
                active
                  ? "bg-white/10 text-white"
                  : "text-slate-400 hover:text-white hover:bg-white/5"
              )}
            >
              <Icon
                size={18}
                className={clsx(
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

      <div className="mt-auto px-6 py-4 text-xs text-slate-500 border-t border-white/5">
        Logged as <span className="capitalize">{role}</span>
      </div>
    </aside>
  )
}