import { Head } from "@inertiajs/react"
import AdminLayout from "@/components/templates/AdminLayout"
import UserProfile from "@/components/organisms/UserProfile"
import Badge from "@/components/atoms/Badge"
import PageHeader from "@/components/molecules/PageHeader"
import type { User } from "@/types/user"
import { BookOpen, LayoutGrid, Users } from "lucide-react"

function roleVariant(role: string) {
  switch (role) {
    case "admin": return "danger"
    case "instructor": return "warning"
    default: return "info"
  }
}

export default function UserDetailPage({ user }: { user: User }) {
  const isInstructorOrAdmin = user.role === "instructor" || user.role === "admin"
  const courses = user.created_courses ?? []
  const totalStudents = courses.reduce((sum, c) => sum + (c.enrollments_count ?? 0), 0)
  const publishedCount = courses.filter((c) => c.status === "published").length

  return (
    <>
      <Head title={`${user.name} — User Detail`} />

      <div className="max-w-8xl mx-auto space-y-8">

        <PageHeader
          breadcrumbs={[
            { label: "All Users", href: "/admin/users" },
            { label: user.name },
          ]}
          leading={
            <div className="w-14 h-14 rounded-xl bg-white/10 overflow-hidden border border-white/20">
              {user.avatar_url ? (
                <img
                  src={user.avatar_url}
                  alt={user.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xl font-bold text-white/60">
                  {user.name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
          }
          title={user.name}
          titleBadge={<Badge variant={roleVariant(user.role)}>{user.role}</Badge>}
          description={user.email}
          stats={
            isInstructorOrAdmin
              ? [
                  {
                    icon: <LayoutGrid size={18} />,
                    value: courses.length,
                    label: "Total Courses",
                  },
                  {
                    icon: <Users size={18} />,
                    value: totalStudents,
                    label: "Total Students",
                  },
                  {
                    icon: <BookOpen size={18} />,
                    value: publishedCount,
                    label: "Published",
                  },
                ]
              : undefined
          }
        />

        <UserProfile user={user} />
      </div>
    </>
  )
}

UserDetailPage.layout = (page: React.ReactNode) => (
  <AdminLayout>{page}</AdminLayout>
)
