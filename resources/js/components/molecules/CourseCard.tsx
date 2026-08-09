import Badge from "@/components/atoms/Badge"
import Button from "@/components/atoms/Button"
import Title from "@/components/atoms/Title"
import Label from "@/components/atoms/Label"
import ConfirmationDelete from "@/components/molecules/ConfirmationDelete"

import { useState } from "react"
import { Course } from "@/types"
import { useCourse } from "@/hooks/useCourse"
import { usePage, Link } from "@inertiajs/react"
import { Eye } from "lucide-react"

interface CourseCardProps {
  course: Course
}

export default function CourseCard({ course }: CourseCardProps) {
  const { visit, destroy } = useCourse()
  const [openDelete, setOpenDelete] = useState(false)

  const { auth } = usePage().props as any
  const user = auth?.user

  const creatorId = typeof course.creator === "object" ? (course.creator as any)?.id : ((course as any).creator_id ?? course.creator)
  const isCourseOwner =
    user &&
    (user.role === "admin" ||
      (user.role === "instructor" && (creatorId === user.id || (course as any).creator_id === user.id)))

  const rolePrefix = user?.role ?? "admin"

  return (
    <>
      <div
        onClick={() => visit(course.slug)}
        className="group bg-white cursor-pointer hover:shadow-md transition-shadow duration-200 border border-neutral-100"
      >
        {/* Thumbnail — bersih tanpa overlay */}
        <div className="w-full aspect-video overflow-hidden bg-neutral-100">
          <img
            src={course.thumbnail_url}
            alt={course.title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        </div>

        {/* Content */}
        <div className="p-4 space-y-3">

          {/* Title */}
          <Title as="h2" className="text-sm font-semibold leading-snug line-clamp-2 text-neutral-800">
            {course.title}
          </Title>

          {/* Creator */}
          <Label className="text-xs text-neutral-400">
            By {course.creator?.name ?? "—"}
          </Label>

          {/* Description */}
          <Label className="text-xs text-neutral-500 line-clamp-2 leading-relaxed">
            {course.description}
          </Label>

          {/* Meta row */}
          <div className="flex items-center gap-2 flex-wrap pt-1">
            {course.level && (
              <Badge>{course.level}</Badge>
            )}
            <Badge variant={course.type === "free" ? "info" : "warning"}>
              {course.type === "free"
                ? "FREE"
                : `Rp ${course.price?.toLocaleString("id-ID")}`}
            </Badge>
            <Badge variant={course.status === "published" ? "success" : "default"}>
              {course.status}
            </Badge>
          </div>

          {isCourseOwner && (
            <div
              className="pt-3 mt-1 border-t border-neutral-100 space-y-2"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-neutral-400">
                <span>Categories</span>
                <span className="text-neutral-700 font-medium text-right truncate">
                  {course.categories?.map((category) => category.name).join(", ") || "—"}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <Link
                  href={`/${rolePrefix}/courses/${course.slug}/preview`}
                  className="inline-flex items-center justify-center gap-1 text-xs py-1.5 px-3 bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 font-medium transition-colors"
                >
                  <Eye className="w-3.5 h-3.5" /> Preview
                </Link>

                <Button
                  variant="danger"
                  className="w-full text-xs py-1.5 !rounded-none"
                  onClick={(e) => {
                    e.stopPropagation()
                    setOpenDelete(true)
                  }}
                >
                  Hapus
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      <ConfirmationDelete
        open={openDelete}
        onClose={() => setOpenDelete(false)}
        onConfirm={() => destroy(course.slug)}
        title="Hapus Course"
        message={`Course "${course.title}" akan dihapus permanen.`}
      />
    </>
  )
}