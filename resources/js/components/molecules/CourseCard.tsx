import { useState } from "react"
import { router, usePage } from "@inertiajs/react"

import Badge from "@/components/atoms/Badge"
import Button from "@/components/atoms/Button"
import Title from "@/components/atoms/Title"
import ConfirmationDelete from "@/components/molecules/ConfirmationDelete"
import Label from "@/components/atoms/Label"

import { Course } from "@/types"

interface CourseCardProps {
  course: Course
}

export default function CourseCard({ course }: CourseCardProps) {
  const { auth } = usePage().props as any

  const [openDelete, setOpenDelete] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const visitCourse = () => {
    router.visit(`/${auth.user.role}/courses/${course.slug}`)
  }

  const handleConfirmDelete = () => {
    setIsDeleting(true)

    router.delete(`/${auth.user.role}/courses/${course.slug}`, {
      preserveScroll: true,
      onFinish: () => {
        setIsDeleting(false)
        setOpenDelete(false)
      },
    })
  }

  return (
    <>
      <div
        onClick={visitCourse}
        className="
          group
          bg-white
          rounded-2xl
          p-3
          space-y-3
          cursor-pointer
          transition-all
          duration-200
          shadow-sm
          hover:shadow-xl
          hover:-translate-y-1
          active:scale-[0.99]
        "
      >
        <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-neutral-100">

          <img
            src={course.thumbnail_url}
            className="
              w-full h-full object-cover
              transition
              duration-300
              group-hover:scale-105
            "
          />

          <div className="absolute top-2 left-2 flex gap-2 flex-wrap">
            {course.level && (
              <Badge variant="default">{course.level}</Badge>
            )}

            <Badge variant={course.type === "free" ? "info" : "warning"}>
              {course.type === "free" ? "FREE" : "PAID"}
            </Badge>
          </div>

          <div className="absolute top-2 right-2">
            <Badge
              variant={course.status === "published" ? "success" : "danger"}
            >
              {course.status.toUpperCase()}
            </Badge>
          </div>
        </div>

        <div className="space-y-1">
          <Title as="h2">{course.title}</Title>

          <Label>
            By {course.creator?.name}
          </Label>
        </div>

        <div className="flex justify-end">
          <Button
            variant="danger"
            className="text-red-500 hover:bg-red-50"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              setOpenDelete(true)
            }}
          >
            Hapus
          </Button>
        </div>
      </div>

      <ConfirmationDelete
        open={openDelete}
        onClose={() => setOpenDelete(false)}
        onConfirm={handleConfirmDelete}
        isLoading={isDeleting}
        title="Hapus Course"
        message={`Course "${course.title}" akan dihapus permanen.`}
      />
    </>
  )
}