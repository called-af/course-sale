import { usePage } from "@inertiajs/react"
import { useState, useEffect } from "react"
import Navbar from "@/components/organisms/admin/AdminNavbar"
import Sidebar from "@/components/organisms/admin/AdminSidebar"
import { ToastContainer } from "react-toastify"
import { useInertiaToast } from "@/hooks/useInertiaToast"

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useInertiaToast()

  useEffect(() => {
    document.body.style.overflow = sidebarOpen ? "hidden" : ""
    return () => { document.body.style.overflow = "" }
  }, [sidebarOpen])

  return (
    <div className="h-screen flex overflow-hidden bg-neutral-50 dark:bg-[#141416]">

      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>

      <ToastContainer
        position="top-right"
        autoClose={4000}
        newestOnTop
        pauseOnHover
        closeOnClick
      />
    </div>
  )
}
