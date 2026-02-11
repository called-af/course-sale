import { useState } from "react"
import { router, usePage } from "@inertiajs/react"

import Badge from "@/components/atoms/Badge"
import Button from "@/components/atoms/Button"
import Modal from "@/components/atoms/Modal"
import Title from "@/components/atoms/Title"

interface CourseCardProps {
  course: {
    id: number
    slug: string
    title: string
    thumbnail_url: string
    level: string | null
    type: string
    status: string
    creator?: {
      name: string
    }
  }
}

export default function CourseCard({ course }: CourseCardProps) {
  const { auth } = usePage().props as any

  const [openDelete, setOpenDelete] = useState(false)
  const [processing, setProcessing] = useState(false)

  const visitCourse = () => {
    router.visit(`/${auth.user.role}/courses/${course.slug}`)
  }

  const handleConfirmDelete = () => {
    router.delete(`/${auth.user.role}/courses/${course.slug}`, {
      preserveScroll: true,
      onStart: () => setProcessing(true),
      onFinish: () => setProcessing(false),
      onSuccess: () => setOpenDelete(false),
    })
  }

  return (
    <>
      <div
        onClick={visitCourse}
        className="
          group
          rounded-2xl
          border
          bg-white
          p-3
          space-y-3
          cursor-pointer
          transition
          hover:shadow-lg
          hover:-translate-y-0.5
          active:scale-[0.99]
        "
      >
        <div className="w-full aspect-video rounded-xl overflow-hidden bg-neutral-100">
          <img
            src={course.thumbnail_url}
            className="
              w-full h-full object-cover
              transition
              group-hover:scale-[1.03]
            "
          />
        </div>

        <div>
          <Title as="h2">{course.title}</Title>

          <p className="text-xs text-neutral-500">
            By {course.creator?.name}
          </p>
        </div>

        <div className="flex gap-2 flex-wrap">
          {course.level && (
            <Badge variant="default">{course.level}</Badge>
          )}

          <Badge variant={course.type === "free" ? "info" : "warning"}>
            {course.type === "free" ? "FREE" : "PAID"}
          </Badge>

          <Badge variant={course.status === "published" ? "success" : "danger"}>
            {course.status.toUpperCase()}
          </Badge>
        </div>

        <div className="pt-2">
          <Button
            variant="danger"
            disabled={processing}
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              setOpenDelete(true)
            }}
          >
            Hapus
          </Button>
        </div>

        {processing && (
          <div className="absolute inset-0 bg-white/60 backdrop-blur-sm rounded-2xl flex items-center justify-center text-sm">
            Menghapus...
          </div>
        )}
      </div>

      <Modal
        open={openDelete}
        onClose={() => setOpenDelete(false)}
        title="Hapus Course"
        footer={
          <>
            <Button
              variant="secondary"
              disabled={processing}
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                setOpenDelete(false)
              }}
            >
              Batal
            </Button>

            <Button
              variant="danger"
              disabled={processing}
              onClick={handleConfirmDelete}
            >
              {processing ? "Menghapus..." : "Ya, Hapus"}
            </Button>
          </>
        }
      >
        <p>
          Yakin mau hapus course <b>{course.title}</b> ?
        </p>
      </Modal>
    </>
  )
}
