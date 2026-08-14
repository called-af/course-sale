import { Head, usePage } from "@inertiajs/react"
import AdminLayout from "@/components/templates/AdminLayout"
import Button from "@/components/atoms/Button"
import Modal from "@/components/atoms/Modal"
import { useState } from "react"
import { Plus } from "lucide-react"

import CourseAdd from "@/components/organism/Course/CourseAdd"
import CourseGrid from "@/components/organism/Course/CourseGrid"
import InputField from "@/components/molecules/InputField"
import PageHeader from "@/components/molecules/PageHeader"

import { useCourse } from "@/hooks/useCourse"

export default function Course() {
  const [open, setOpen] = useState(false)

  const { courses = [] } = usePage().props as any

  const { search, setSearch, filteredCourses } = useCourse(undefined, courses)

  return (
    <>
      <Head title="Courses - Admin" />

      <div className="max-w-8xl mx-auto space-y-8">

        <PageHeader
          breadcrumbs={[{ label: "Admin" }, { label: "Courses" }]}
          title="Courses Management"
          description="Manage all courses available on the platform"
          actions={
            <Button
              variant="primary"
              onClick={() => setOpen(true)}
              leftIcon={<Plus className="w-4 h-4" />}
              className="!rounded-none"
            >
              Add Course
            </Button>
          }
        />

        {/* Content Card */}
        <div className="bg-white border border-slate-200/80 shadow-sm p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                All Courses ({filteredCourses.length})
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Filter or search through all active courses.
              </p>
            </div>
            <div className="w-full sm:w-80">
              <InputField
                label=""
                placeholder="Search title or instructor..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <CourseGrid courses={filteredCourses} />
        </div>
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Add Course">
        <CourseAdd onSuccess={() => setOpen(false)} />
      </Modal>
    </>
  )
}

Course.layout = (page: React.ReactNode) => (
  <AdminLayout>{page}</AdminLayout>
)
