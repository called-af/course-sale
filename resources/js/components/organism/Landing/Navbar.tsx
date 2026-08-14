import { useState } from "react"
import { Link } from "@inertiajs/react"
import Button from "@/components/atoms/Button"
import { Menu, X } from "lucide-react"

const menus = [
  { name: "Home", href: "/" },
  { name: "About", href: "/#about" },
  { name: "Courses", href: "/course" },
]

export default function Navbar() {
  const [open, setOpen] = useState(false)

  return (
    <nav className="w-full absolute z-50">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4">

        <Link href="/" className="flex items-center">
          <img src="/images/logo.png" alt="Logo" className="h-10 w-auto" />
        </Link>

        <div className="hidden lg:flex items-center gap-8">
          {menus.map((menu) => (
            <Link key={menu.name} href={menu.href} className="text-gray-700 hover:text-purple-700 font-medium">
              {menu.name}
            </Link>
          ))}
        </div>

        <div className="hidden lg:flex items-center gap-3">
          <Link href="/login">
            <Button variant="outline">Sign In</Button>
          </Link>
          <Link href="/register">
            <Button>Sign Up</Button>
          </Link>
        </div>

        <button
          className="lg:hidden p-2 text-gray-700"
          onClick={() => setOpen(!open)}
        >
          {open ? <X size={24} /> : <Menu size={24} />}
        </button>

      </div>

      {open && (
        <div className="lg:hidden bg-white border-t border-gray-100 px-6 py-6 flex flex-col gap-6">
          <div className="flex flex-col gap-4">
            {menus.map((menu) => (
              <Link
                key={menu.name}
                href={menu.href}
                className="text-gray-700 hover:text-purple-700 font-medium text-lg"
                onClick={() => setOpen(false)}
              >
                {menu.name}
              </Link>
            ))}
          </div>

          <div className="flex flex-col gap-3 pt-4 border-t border-gray-100">
            <Link href="/login" onClick={() => setOpen(false)}>
              <Button variant="outline" widthFull>Sign In</Button>
            </Link>
            <Link href="/register" onClick={() => setOpen(false)}>
              <Button widthFull>Sign Up</Button>
            </Link>
          </div>
        </div>
      )}
    </nav>
  )
}