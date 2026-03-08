import { Head, usePage } from "@inertiajs/react"
import AdminLayout from "@/components/templates/AdminLayout"
import Button from "@/components/atoms/Button"
import Modal from "@/components/atoms/Modal"
import { useState } from "react"

import CourseAdd from "@/components/organism/Course/CourseAdd"
import CourseGrid from "@/components/organism/Course/CourseGrid"
import BreadCrumb from "@/components/atoms/BreadCrumb"
import InputField from "@/components/molecules/InputField"

import { useCourse } from "@/hooks/useCourse"

export default function Course() {
  const [open, setOpen] = useState(false)

  const { courses = [] } = usePage().props as any

  const {
    search,
    setSearch,
    filteredCourses
  } = useCourse(undefined, courses)

  return (
    <>
      <Head title="Courses" />

      <section className="max-w-7xl mx-auto px-4 py-8 space-y-8">

        <BreadCrumb
          items={[
            {
              label: "Courses",
              href: "/admin/courses",
            }
          ]}
        />

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold">Courses</h1>
            <p className="text-sm text-muted-foreground">
              Manage all courses available on the platform
            </p>
          </div>

          <Button variant="secondary" onClick={() => setOpen(true)}>
            Tambah Course
          </Button>
        </div>

        {/* Search */}
        <div className="max-w-md">
          <InputField
            label="Search Courses"
            placeholder="Search title or instructor..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Course Grid */}
        <div className="pt-2">
          <CourseGrid courses={filteredCourses} />
        </div>

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