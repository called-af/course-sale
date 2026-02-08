import { Head } from "@inertiajs/react"
import AdminLayout from "@/components/templates/AdminLayout"
import Button from "@/components/atoms/Button"
import Modal from "@/components/atoms/Modal"
import { useState } from "react"
import CourseForm from "@/components/organism/CourseForm"

export default function Course() {
  const [open, setOpen] = useState(false)
  return (
    <>
      <Head />
      <div>
        <Button variant="secondary" onClick={() => setOpen(true)}>
          Tambah Course
        </Button>
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Add Course">
        <CourseForm onSuccess={() => setOpen(false)} />
      </Modal>
    </>
  )
}

Course.layout = (page: React.ReactNode) => (
  <AdminLayout>{page}</AdminLayout>
)