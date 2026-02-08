import { useForm, usePage } from "@inertiajs/react"
import { LogOut, Menu } from "lucide-react"

interface NavbarProps {
  onToggleSidebar?: () => void
}

export default function Navbar({ onToggleSidebar }: NavbarProps) {
  const { post } = useForm()
  const { auth } = usePage().props as any

  const logout = () => post("/logout")

  return (
    <header className="sticky top-0 z-30">
      <div className="mx-4 mt-4 h-16 rounded-2xl border border-white/10 bg-white/80 backdrop-blur-md shadow-sm flex items-center justify-between px-5">
        {/* Left */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSidebar}
            className="md:hidden text-slate-600"
          >
            <Menu size={20} />
          </button>

          <h1 className="font-semibold text-slate-800">
            Dashboard
          </h1>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            {/* Avatar */}
            <div className="h-9 w-9 rounded-full bg-linear-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-sm font-semibold">
              {auth.user.name.charAt(0)}
            </div>

            <div className="hidden sm:block text-sm leading-tight">
              <div className="font-medium text-slate-700">
                {auth.user.name}
              </div>
              <div className="text-xs text-slate-400 capitalize">
                {auth.user.role}
              </div>
            </div>
          </div>

          <button
            onClick={logout}
            className="text-sm text-red-600 hover:text-red-700"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </header>
  )
}
