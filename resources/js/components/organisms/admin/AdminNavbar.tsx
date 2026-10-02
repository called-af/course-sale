import { router, usePage } from "@inertiajs/react"
import { Bell, CheckCircle, LogOut, Menu, Moon, Sun } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { useTheme } from "@/hooks/useTheme"

interface NavbarProps {
  onToggleSidebar: () => void
}

export default function Navbar({ onToggleSidebar }: NavbarProps) {
  const { auth, adminReviewNotifications } = usePage().props as any
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false)
  const notificationRef = useRef<HTMLDivElement>(null)
  const pendingReviews = adminReviewNotifications?.courses ?? []
  const pendingReviewCount = adminReviewNotifications?.count ?? 0
  const { toggle, isDark } = useTheme()
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
    <header className="sticky top-0 z-30 h-16 bg-white dark:bg-slate-900 border-b border-neutral-100 dark:border-slate-700 flex items-center justify-between px-5">
      <button
        onClick={onToggleSidebar}
        className="lg:hidden p-2 text-neutral-400 dark:text-slate-500 hover:text-neutral-700 dark:hover:text-white transition-colors"
      >
        <Menu size={19} />
      </button>
      <div className="flex items-center gap-3 ml-auto">
        {auth?.user?.role === "admin" && (
          <div ref={notificationRef} className="relative">
            <button
              type="button"
              onClick={() => setIsNotificationsOpen((open) => !open)}
              className="relative p-2 text-neutral-500 dark:text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/40 transition-colors"
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
              <div className="absolute right-0 top-11 z-50 w-80 overflow-hidden bg-white dark:bg-slate-900 border border-neutral-200 dark:border-slate-700 shadow-xl">
                <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-100 dark:border-slate-800">
                  <div>
                    <p className="text-sm font-semibold text-neutral-800 dark:text-slate-100">Pending approvals</p>
                    <p className="text-xs text-neutral-400 dark:text-slate-500">Courses submitted by instructors for review</p>
                  </div>
                  {pendingReviewCount > 0 && (
                    <span className="text-xs font-semibold text-purple-600 dark:text-purple-400">{pendingReviewCount}</span>
                  )}
                </div>

                <div className="max-h-80 overflow-y-auto">
                  {pendingReviews.length === 0 ? (
                    <p className="px-4 py-8 text-center text-sm text-neutral-400 dark:text-slate-500">No courses are pending review.</p>
                  ) : (
                    pendingReviews.map((course: any) => (
                      <button
                        key={course.id}
                        type="button"
                        onClick={() => {
                          setIsNotificationsOpen(false)
                          router.visit(`/admin/courses/${course.slug}`)
                        }}
                        className="w-full px-4 py-3 text-left border-b border-neutral-100 dark:border-slate-800 last:border-0 hover:bg-purple-50 dark:hover:bg-slate-800 transition-colors"
                      >
                        <div className="flex items-start gap-3">
                          <CheckCircle size={16} className="mt-0.5 shrink-0 text-purple-500 dark:text-purple-400" />
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-neutral-800 dark:text-slate-100">{course.title}</p>
                            <p className="mt-0.5 text-xs text-neutral-400 dark:text-slate-500">by {course.creator?.name ?? "Instructor"}</p>
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
            <p className="text-xs font-medium text-neutral-700 dark:text-slate-200">{auth?.user?.name}</p>
            <p className="text-[10px] text-neutral-400 dark:text-slate-500 capitalize">{auth?.user?.role}</p>
          </div>

          <div className="w-8 h-8 bg-purple-100 dark:bg-purple-950/40 shrink-0 flex items-center justify-center text-xs font-bold text-purple-600 dark:text-purple-400 overflow-hidden">
            {auth?.user?.avatar_url ? (
              <img src={auth.user.avatar_url} alt={auth.user.name} className="w-full h-full object-cover" />
            ) : (
              auth?.user?.name?.charAt(0)?.toUpperCase()
            )}
          </div>
        </div>

        <div className="w-px h-5 bg-neutral-200 dark:bg-slate-700" />

        <button
          onClick={toggle}
          className="p-1.5 text-neutral-400 dark:text-slate-500 hover:text-neutral-700 dark:hover:text-white transition-colors"
          title="Toggle dark mode"
        >
          {isDark ? <Sun size={16} /> : <Moon size={16} />}
        </button>

        <button
          onClick={logout}
          className="p-1.5 text-neutral-400 dark:text-slate-500 hover:text-red-500 transition-colors"
          title="Logout"
        >
          <LogOut size={16} />
        </button>
      </div>
    </header>
  )
}
