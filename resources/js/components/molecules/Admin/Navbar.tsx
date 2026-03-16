import { router, usePage } from "@inertiajs/react"
import { LogOut, Menu } from "lucide-react"

interface NavbarProps {
  onToggleSidebar: () => void
}

export default function Navbar({ onToggleSidebar }: NavbarProps) {
  const { auth } = usePage().props as any
  const logout = () => router.post("/logout")

  return (
    <header className="sticky top-0 z-30 h-16 bg-white border-b border-neutral-100 flex items-center justify-between px-5">
      <button
        onClick={onToggleSidebar}
        className="lg:hidden p-2 text-neutral-400 hover:text-neutral-700 transition-colors"
      >
        <Menu size={19} />
      </button>
      <div className="flex items-center gap-3 ml-auto">
        <div className="flex items-center gap-2.5">
          <div className="hidden sm:block text-right leading-tight">
            <p className="text-xs font-medium text-neutral-700">{auth?.user?.name}</p>
            <p className="text-[10px] text-neutral-400 capitalize">{auth?.user?.role}</p>
          </div>

          <div className="w-8 h-8 bg-purple-100 shrink-0 flex items-center justify-center text-xs font-bold text-purple-600 overflow-hidden">
            {auth?.user?.avatar_url ? (
              <img src={auth.user.avatar_url} alt={auth.user.name} className="w-full h-full object-cover" />
            ) : (
              auth?.user?.name?.charAt(0)?.toUpperCase()
            )}
          </div>
        </div>

        <div className="w-px h-5 bg-neutral-200" />

        <button
          onClick={logout}
          className="p-1.5 text-neutral-400 hover:text-red-500 transition-colors"
          title="Logout"
        >
          <LogOut size={16} />
        </button>
      </div>
    </header>
  )
}