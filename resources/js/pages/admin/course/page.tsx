import { Head, usePage } from "@inertiajs/react"
import AdminLayout from "@/components/templates/AdminLayout"
import Button from "@/components/atoms/Button"
import Modal from "@/components/atoms/Modal"
import { useState } from "react"
import CourseAdd from "@/components/organism/Course/CourseAdd"
import CourseGrid from "@/components/organism/Course/CourseGrid"

export default function Course() {
  const [open, setOpen] = useState(false)

  const { courses = [] } = usePage().props as any

  return (
    <>
      <Head title="Courses" />

      <section className="space-y-4">
        <Button variant="secondary" onClick={() => setOpen(true)}>
          Tambah Course
        </Button>

        <CourseGrid courses={courses} />
      </section>

      <Modal open={open} onClose={() => setOpen(false)} title="Add Course">
        <CourseAdd onSuccess={() => setOpen(false)} />
      </Modal>
    </>
  )
}

Course.layout = (page: React.ReactNode) => (
  <AdminLayout>{page}</AdminLayout>
)
