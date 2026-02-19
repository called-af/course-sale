import Badge from "@/components/atoms/Badge"
import Button from "@/components/atoms/Button"
import Title from "@/components/atoms/Title"
import Label from "@/components/atoms/Label"
import ConfirmationDelete from "@/components/molecules/ConfirmationDelete"

import { useState } from "react"
import { Course } from "@/types"
import { useCourse } from "@/hooks/useCourse"

interface CourseCardProps {
  course: Course
}

export default function CourseCard({ course }: CourseCardProps) {
  const { visit, destroy } = useCourse()

  const [openDelete, setOpenDelete] = useState(false)

  return (
    <>
      <div
        onClick={() => visit(course.slug)}
        className="group bg-white rounded-2xl p-3 space-y-3 cursor-pointer shadow-sm hover:shadow-xl"
      >
        <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-neutral-100">

          <img
            src={course.thumbnail_url}
            className="w-full h-full object-cover group-hover:scale-105 transition"
          />

          <div className="absolute top-2 left-2 flex gap-2">
            {course.level && <Badge>{course.level}</Badge>}
            <Badge variant={course.type === "free" ? "info" : "warning"}>
              {course.type.toUpperCase()}
            </Badge>
          </div>
        </div>

        <Title as="h2">{course.title}</Title>

        <Label>
          By {course.creator?.name}
        </Label>

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