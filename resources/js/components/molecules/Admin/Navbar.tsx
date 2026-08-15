import { router, usePage } from "@inertiajs/react"
import { Bell, CheckCircle, LogOut, Menu } from "lucide-react"
import { useEffect, useRef, useState } from "react"

interface NavbarProps {
  onToggleSidebar: () => void
}

export default function Navbar({ onToggleSidebar }: NavbarProps) {
  const { auth, adminReviewNotifications } = usePage().props as any
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false)
  const notificationRef = useRef<HTMLDivElement>(null)
  const pendingReviews = adminReviewNotifications?.courses ?? []
  const pendingReviewCount = adminReviewNotifications?.count ?? 0
  const logout = () => router.post("/logout")

  useEffect(() => {
    const closeOnOutsideClick = (event: MouseEvent) => {
      if (!notificationRef.current?.contains(event.target as Node)) {
        setIsNotificationsOpen(false)
      }
    }

    document.addEventListener("mousedown", closeOnOutsideClick)
    return () => document.removeEventListener("mousedown", closeOnOutsideClick)
  }, [])

  return (
    <header className="sticky top-0 z-30 h-16 bg-white border-b border-neutral-100 flex items-center justify-between px-5">
      <button
        onClick={onToggleSidebar}
        className="lg:hidden p-2 text-neutral-400 hover:text-neutral-700 transition-colors"
      >
        <Menu size={19} />
      </button>
      <div className="flex items-center gap-3 ml-auto">
        {auth?.user?.role === "admin" && (
          <div ref={notificationRef} className="relative">
            <button
              type="button"
              onClick={() => setIsNotificationsOpen((open) => !open)}
              className="relative p-2 text-neutral-500 hover:text-purple-600 hover:bg-purple-50 transition-colors"
              title="Courses pending approval"
              aria-label="Courses pending approval"
              aria-expanded={isNotificationsOpen}
            >
              <Bell size={18} />
              {pendingReviewCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold leading-4">
                  {pendingReviewCount > 99 ? "99+" : pendingReviewCount}
                </span>
              )}
            </button>

            {isNotificationsOpen && (
              <div className="absolute right-0 top-11 z-50 w-80 overflow-hidden bg-white border border-neutral-200 shadow-xl">
                <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-100">
                  <div>
                    <p className="text-sm font-semibold text-neutral-800">Pending approvals</p>
                    <p className="text-xs text-neutral-400">Courses submitted by instructors for review</p>
                  </div>
                  {pendingReviewCount > 0 && (
                    <span className="text-xs font-semibold text-purple-600">{pendingReviewCount}</span>
                  )}
                </div>

                <div className="max-h-80 overflow-y-auto">
                  {pendingReviews.length === 0 ? (
                    <p className="px-4 py-8 text-center text-sm text-neutral-400">No courses are pending review.</p>
                  ) : (
                    pendingReviews.map((course: any) => (
                      <button
                        key={course.id}
                        type="button"
                        onClick={() => {
                          setIsNotificationsOpen(false)
                          router.visit(`/admin/courses/${course.slug}`)
                        }}
                        className="w-full px-4 py-3 text-left border-b border-neutral-100 last:border-0 hover:bg-purple-50 transition-colors"
                      >
                        <div className="flex items-start gap-3">
                          <CheckCircle size={16} className="mt-0.5 shrink-0 text-purple-500" />
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-neutral-800">{course.title}</p>
                            <p className="mt-0.5 text-xs text-neutral-400">by {course.creator?.name ?? "Instructor"}</p>
                          </div>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        )}

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
