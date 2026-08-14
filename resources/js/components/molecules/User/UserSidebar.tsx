import { Link, router, usePage } from "@inertiajs/react"
import {
  LayoutDashboard,
  BookOpen,
  GraduationCap,
  LogOut,
  Compass,
  User,
  X,
} from "lucide-react"
import clsx from "clsx"

interface UserSidebarProps {
  open: boolean
  onClose: () => void
}

function buildMenus(role: string) {
  if (role === "instructor") {
    return {
      main: [
        { label: "Dashboard",   href: "/instructor/dashboard", icon: LayoutDashboard },
        { label: "My Courses",  href: "/instructor/courses",   icon: BookOpen },
      ],
      account: [
        { label: "Profile",     href: "/instructor/profile",   icon: User },
      ],
    }
  }

  return {
    main: [
      { label: "Dashboard",   href: "/student/dashboard", icon: LayoutDashboard },
      { label: "My Learning", href: "/student/courses",   icon: GraduationCap },
      { label: "Explore",     href: "/course",            icon: Compass },
    ],
    account: [
      { label: "Profile",     href: "/student/profile",   icon: User },
    ],
  }
}

function NavItem({
  href,
  icon: Icon,
  label,
  url,
  onClose,
}: {
  href: string
  icon: any
  label: string
  url: string
  onClose: () => void
}) {
  const active = url === href || (href !== "/" && url.startsWith(href))

  return (
    <Link
      href={href}
      onClick={onClose}
      className={clsx(
        "flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-xl transition-all",
        active
          ? "bg-indigo-50 text-indigo-700"
          : "text-slate-500 hover:text-slate-800 hover:bg-slate-100"
      )}
    >
      <Icon
        size={16}
        className={clsx(
          "shrink-0",
          active ? "text-indigo-600" : "text-slate-400"
        )}
      />
      {label}
      {active && (
        <span className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-500" />
      )}
    </Link>
  )
}

export default function UserSidebar({ open, onClose }: UserSidebarProps) {
  const { url, props } = usePage()
  const auth = (props as any).auth
  const role = auth?.user?.role ?? "student"
  const menus = buildMenus(role)

  const logout = () => router.post("/logout")

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/30 z-40 lg:hidden backdrop-blur-sm"
          onClick={onClose}
        />
      )}

      <aside
        className={clsx(
          "fixed lg:static inset-y-0 left-0 z-50 flex flex-col w-64 h-screen bg-white border-r border-slate-100 transform transition-transform duration-300",
          open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-slate-100 shrink-0">
          <Link href="/" className="flex items-center">
            <img src="/images/logo.png" alt="Logo" className="h-7 w-auto" />
          </Link>
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 text-slate-400 hover:text-slate-700 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-5 space-y-6 overflow-y-auto">
          {/* Main menu */}
          <div className="space-y-1">
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest px-4 mb-2">
              Main
            </p>
            {menus.main.map((item) => (
              <NavItem key={item.href} {...item} icon={item.icon} url={url} onClose={onClose} />
            ))}
          </div>

          {/* Account */}
          <div className="space-y-1">
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest px-4 mb-2">
              Account
            </p>
            {menus.account.map((item) => (
              <NavItem key={item.href} {...item} icon={item.icon} url={url} onClose={onClose} />
            ))}
          </div>
        </nav>

        {/* User footer */}
        <div className="px-4 py-4 border-t border-slate-100 shrink-0 bg-slate-50/50">
          <div className="flex items-center gap-3">
            {/* Avatar */}
            <div className="w-9 h-9 rounded-full overflow-hidden bg-indigo-100 shrink-0 flex items-center justify-center">
              {auth?.user?.avatar_url ? (
                <img
                  src={auth.user.avatar_url}
                  alt={auth.user.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-sm font-bold text-indigo-600">
                  {auth?.user?.name?.[0]?.toUpperCase()}
                </span>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-700 truncate">{auth?.user?.name}</p>
              <p className="text-xs text-slate-400 capitalize truncate">{auth?.user?.role}</p>
            </div>

            <button
              onClick={logout}
              className="p-1.5 text-slate-300 hover:text-red-500 transition-colors shrink-0"
              title="Logout"
            >
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}
