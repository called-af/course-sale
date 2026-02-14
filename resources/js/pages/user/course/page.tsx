import { Head } from "@inertiajs/react"
import DashboardLayout from "@/components/templates/DashboardLayout"
import Button from "@/components/atoms/Button"
import Modal from "@/components/atoms/Modal"
import { useState } from "react"
import CourseAdd from "@/components/organism/Course/CourseAdd"

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
        <CourseAdd onSuccess={() => setOpen(false)} />
      </Modal>
    </>
  )
}

Course.layout = (page: React.ReactNode) => (
  <DashboardLayout>{page}</DashboardLayout>
)