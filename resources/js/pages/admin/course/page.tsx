import { Head, router, usePage } from "@inertiajs/react"
import AdminLayout from "@/components/templates/AdminLayout"
import Button from "@/components/atoms/Button"
import Modal from "@/components/atoms/Modal"
import { useState } from "react"
import { ChevronLeft, ChevronRight, Plus } from "lucide-react"

import CourseAdd from "@/components/organisms/Course/CourseAdd"
import CourseGrid from "@/components/organisms/Course/CourseGrid"
import InputField from "@/components/molecules/InputField"
import PageHeader from "@/components/molecules/PageHeader"

import { useCourse } from "@/hooks/useCourse"

export default function Course() {
  const [open, setOpen] = useState(false)

  const { courses } = usePage().props as any
  const coursePaginator = courses ?? { data: [], current_page: 1, last_page: 1, total: 0 }
  const courseItems = coursePaginator.data ?? []

  const { search, setSearch, filteredCourses } = useCourse(undefined, courseItems)

  const changePage = (page: number) => {
    router.get('/admin/courses', { page }, {
      only: ['courses'],
      preserveState: true,
      preserveScroll: true,
    })
  }

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
        <div className="bg-white dark:bg-[#1e1f24] border border-slate-200/80 dark:border-slate-700 shadow-sm p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-700 pb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                All Courses ({coursePaginator.total})
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
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

          {coursePaginator.last_page > 1 && (
            <div className="flex flex-col gap-3 border-t border-slate-100 dark:border-slate-700 pt-5 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Showing {courseItems.length === 0 ? 0 : (coursePaginator.current_page - 1) * 10 + 1}
                –{Math.min(coursePaginator.current_page * 10, coursePaginator.total)} of {coursePaginator.total} courses
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={coursePaginator.current_page === 1}
                  onClick={() => changePage(coursePaginator.current_page - 1)}
                  leftIcon={<ChevronLeft className="h-4 w-4" />}
                >
                  Previous
                </Button>
                <span className="px-2 text-xs font-medium text-slate-500 dark:text-slate-400">
                  Page {coursePaginator.current_page} of {coursePaginator.last_page}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={coursePaginator.current_page === coursePaginator.last_page}
                  onClick={() => changePage(coursePaginator.current_page + 1)}
                  rightIcon={<ChevronRight className="h-4 w-4" />}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
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
