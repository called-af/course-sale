import { Link, useForm } from "@inertiajs/react"
import { LogOut, Menu } from "lucide-react"

interface NavbarProps {
  onToggleSidebar?: () => void
}

export default function Navbar({ onToggleSidebar }: NavbarProps) {
  const { post } = useForm()

  const logout = () => {
    post("/logout")
  }

  return (
    <header className="h-14 border-b flex items-center justify-between px-4 bg-white">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="md:hidden"
        >
          <Menu size={20} />
        </button>

        <Link href="/" className="font-semibold text-lg">
          CourseSale
        </Link>
      </div>

      <button
        onClick={logout}
        className="flex items-center gap-2 text-sm text-red-600 hover:text-red-700"
      >
        <LogOut size={18} />
        Logout
      </button>
    </header>
  )
}
