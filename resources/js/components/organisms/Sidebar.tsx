import { Link, router, usePage } from "@inertiajs/react"
import {
  LayoutDashboard,
  BookOpen,
  GraduationCap,
  LogOut,
  ExternalLink,
  Settings,
  User,
} from "lucide-react"
import clsx from "clsx"

interface SidebarProps {
  role: "instructor" | "student"
}

function buildMenus(role: string) {
  const prefix = role === "instructor" ? "/instructor" : "/student"

  if (role === "instructor") {
    return [
      { label: "Dashboard", href: `${prefix}/dashboard`, icon: LayoutDashboard },
      { label: "My Courses", href: `${prefix}/courses`, icon: BookOpen },
      { label: "Settings", href: `${prefix}/settings`, icon: Settings },
      { label: "Profile", href: `${prefix}/profile`, icon: User },
    ]
  }

  return [
    { label: "Dashboard",     href: `${prefix}/dashboard`, icon: LayoutDashboard },
    { label: "My Learning",   href: `${prefix}/courses`,   icon: GraduationCap },
    { label: "Explore",       href: "/course",             icon: BookOpen },
  ]
}

export default function Sidebar({ role }: SidebarProps) {
  const { url, props } = usePage()
  const auth = (props as any).auth
  const menus = buildMenus(role)

  const logout = () => router.post("/logout")

  return (
    <aside className="hidden md:flex w-64 min-h-screen flex-col shrink-0" style={{ background: "#0f0f0f" }}>

      {/* Logo */}
      <div
        className="h-16 flex items-center justify-between px-5 shrink-0"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}
      >
        <Link href="/" className="flex items-center">
          <img src="/images/logo.png" alt="Logo" className="h-7 w-auto" />
        </Link>
        <Link href="/" target="_blank" className="p-1.5 text-white/20 hover:text-white/60 transition-colors" title="View site">
          <ExternalLink size={14} />
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-5 space-y-0.5">
        <p className="text-[10px] font-semibold text-white/20 uppercase tracking-[0.15em] px-3 mb-2">Menu</p>
        {menus.map((item) => {
          const Icon = item.icon
          const active = url === item.href || url.startsWith(item.href + "/")

          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                "flex items-center gap-3 px-3 py-2.5 text-sm transition-all duration-150 group relative",
                active ? "text-white" : "text-white/40 hover:text-white/80"
              )}
            >
              {active && (
                <span className="absolute inset-0" style={{ background: "rgba(255,255,255,0.06)" }} />
              )}
              {active && (
                <span className="absolute left-0 top-1 bottom-1 w-0.5 bg-purple-500" />
              )}
              <Icon
                size={15}
                className={clsx(
                  "shrink-0 transition-colors relative",
                  active ? "text-purple-400" : "text-white/25 group-hover:text-white/50"
                )}
              />
              <span className="relative">{item.label}</span>
            </Link>
          )
        })}
      </nav>

      {/* User footer */}
      <div
        className="px-3 py-3 shrink-0"
        style={{ borderTop: "1px solid rgba(255,255,255,0.05)", background: "#0a0a0a" }}
      >
        <div className="flex items-center gap-3 px-2 py-2.5">
          <div
            className="w-8 h-8 shrink-0 flex items-center justify-center text-xs font-bold text-purple-300"
            style={{ background: "rgba(139,92,246,0.15)" }}
          >
            {auth?.user?.name?.[0]?.toUpperCase() ?? "U"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-white/80 truncate">{auth?.user?.name}</p>
            <p className="text-[10px] text-white/25 capitalize truncate">{auth?.user?.role}</p>
          </div>
          <button
            onClick={logout}
            className="p-1.5 text-white/20 hover:text-red-400 transition-colors shrink-0"
            title="Logout"
          >
            <LogOut size={14} />
          </button>
        </div>
      </div>

    </aside>
  )
}
