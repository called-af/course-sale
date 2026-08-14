import { usePage, router } from "@inertiajs/react"
import { Menu, Bell, LogOut, Settings } from "lucide-react"

interface UserNavbarProps {
  onToggleSidebar: () => void
  title?: string
}

export default function UserNavbar({ onToggleSidebar, title }: UserNavbarProps) {
  const { props, url } = usePage()
  const auth = (props as any).auth

  const logout = () => router.post("/logout")

  // Derive page title from URL if not passed explicitly
  const pageTitle = title ?? deriveTitle(url)

  return (
    <header className="h-16 bg-white border-b border-slate-100 flex items-center justify-between px-5 shrink-0 sticky top-0 z-30">

      {/* Left */}
      <div className="flex items-center gap-4">
        <button
          onClick={onToggleSidebar}
          className="lg:hidden p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition"
        >
          <Menu size={18} />
        </button>

        <span className="font-semibold text-slate-800 text-sm">
          {pageTitle}
        </span>
      </div>

      {/* Right */}
      <div className="flex items-center gap-2">

        {/* Notification bell */}
        <button className="relative p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition">
          <Bell size={17} />
          {/* Unread dot */}
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-indigo-500 rounded-full" />
        </button>

        {/* Divider */}
        <div className="w-px h-6 bg-slate-200 mx-1" />

        {/* User pill */}
        <div className="flex items-center gap-2.5 pl-1">
          <div className="w-8 h-8 rounded-full overflow-hidden bg-indigo-100 flex items-center justify-center shrink-0">
            {auth?.user?.avatar_url ? (
              <img
                src={auth.user.avatar_url}
                alt={auth.user.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-xs font-bold text-indigo-600">
                {auth?.user?.name?.charAt(0)?.toUpperCase()}
              </span>
            )}
          </div>

          <div className="hidden sm:block text-sm leading-tight">
            <p className="font-medium text-slate-700 leading-none">{auth?.user?.name}</p>
            <p className="text-[11px] text-slate-400 capitalize mt-0.5">{auth?.user?.role}</p>
          </div>
        </div>

        {/* Logout */}
        <button
          onClick={logout}
          className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition ml-1"
          title="Logout"
        >
          <LogOut size={16} />
        </button>
      </div>
    </header>
  )
}

function deriveTitle(url: string): string {
  if (url.includes("/dashboard")) return "Dashboard"
  if (url.includes("/courses"))   return "Courses"
  if (url.includes("/profile"))   return "Profile"
  if (url.includes("/explore") || url === "/course") return "Explore"
  return "Dashboard"
}
