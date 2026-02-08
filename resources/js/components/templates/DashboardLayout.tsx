import { usePage } from "@inertiajs/react"
import { useState } from "react"
import Navbar from "@/components/molecules/Navbar"
import Sidebar from "@/components/molecules/Sidebar"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { auth } = usePage().props as any
  const [open, setOpen] = useState(false)

  return (
    <div className="min-h-screen flex">
      <Sidebar role={auth.user.role} />
      <div className="flex-1">
        <Navbar onToggleSidebar={() => setOpen(!open)} />
        <main className="p-6 bg-gray-50 min-h-[calc(100vh-56px)]">
          {children}
        </main>
      </div>
    </div>
  )
}