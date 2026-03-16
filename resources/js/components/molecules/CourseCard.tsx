import Badge from "@/components/atoms/Badge"
import Button from "@/components/atoms/Button"
import Title from "@/components/atoms/Title"
import Label from "@/components/atoms/Label"
import ConfirmationDelete from "@/components/molecules/ConfirmationDelete"

import { useState } from "react"
import { Course } from "@/types"
import { useCourse } from "@/hooks/useCourse"
import { usePage } from "@inertiajs/react"

interface CourseCardProps {
  course: Course
}

export default function CourseCard({ course }: CourseCardProps) {
  const { visit, destroy } = useCourse()
  const [openDelete, setOpenDelete] = useState(false)

  const { auth } = usePage().props as any
  const user = auth?.user

  const isCourseOwner =
    user &&
    (user.role === "admin" ||
      (user.role === "instructor" && course.creator === user.id))

  return (
    <>
      <div
        onClick={() => visit(course.slug)}
        className="group bg-white p-2 space-y-4 cursor-pointer shadow-sm hover:shadow-lg transition"
      >
        <div className="relative w-full aspect-video overflow-hidden bg-neutral-100">
          <img
            src={course.thumbnail_url}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />

          {course.level && (
            <div className="absolute top-2 left-2">
              <Badge>{course.level}</Badge>
            </div>
          )}
        </div>

        <div className="space-y-1">
          <Title as="h2" className="text-base leading-snug line-clamp-2">
            {course.title}
          </Title>

          <Label className="text-sm text-neutral-600 line-clamp-3">
            {course.description}
          </Label>

          <Label className="text-xs text-neutral-500">
            By {course.creator?.name}
          </Label>
        </div>

        {/* PRICE BADGE */}
        <Badge variant={course.type === "free" ? "info" : "warning"}>
          {course.type === "free"
            ? "FREE"
            : `Rp ${course.price?.toLocaleString("id-ID")}`}
        </Badge>

        {isCourseOwner && (
          <div className="pt-2">
            <Button
              variant="danger"
              onClick={(e) => {
                e.stopPropagation()
                setOpenDelete(true)
              }}
            >
              Hapus
            </Button>
          </div>
        )}
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