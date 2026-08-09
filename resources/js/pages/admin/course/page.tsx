import { Head, usePage } from "@inertiajs/react"
import AdminLayout from "@/components/templates/AdminLayout"
import Button from "@/components/atoms/Button"
import Modal from "@/components/atoms/Modal"
import { useState } from "react"
import { Plus, Sparkles } from "lucide-react"

import CourseAdd from "@/components/organism/Course/CourseAdd"
import CourseGrid from "@/components/organism/Course/CourseGrid"
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
      <Head title="Courses - Admin" />

      <div className="max-w-7xl mx-auto space-y-8">
        {/* Modern Header Banner (Sharp Edges) */}
        <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-purple-950 to-slate-900 text-white p-6 sm:p-8 shadow-xl shadow-slate-900/5">
          <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute right-20 -top-10 w-48 h-48 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-3">
              {/* Context Badge */}
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-purple-500/20 text-purple-200 border border-purple-500/30">
                  <Sparkles className="w-3.5 h-3.5 text-purple-300" />
                  <span className="font-medium">Admin / Courses</span>
                </div>
              </div>

              {/* Title & Description */}
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-3">
                  Courses Management
                </h1>
                <p className="text-sm text-slate-300 mt-1">
                  Manage all courses available on the platform
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 shrink-0">
              <Button
                variant="primary"
                onClick={() => setOpen(true)}
                leftIcon={<Plus className="w-4 h-4" />}
                className="!rounded-none"
              >
                Add Course
              </Button>
            </div>
          </div>
        </div>

        {/* Content Section Card */}
        <div className="bg-white border border-slate-200/80 shadow-sm p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">All Courses ({filteredCourses.length})</h2>
              <p className="text-xs text-slate-500 mt-0.5">Filter or search through all active courses.</p>
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

          {/* Course Grid */}
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