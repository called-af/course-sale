import { Head, usePage } from "@inertiajs/react"
import UserLayout from "@/components/templates/UserLayout"
import { BookOpen, Plus } from "lucide-react"
import Button from "@/components/atoms/Button"
import { useState } from "react"
import Modal from "@/components/atoms/Modal"
import CourseAdd from "@/components/organisms/Course/CourseAdd"
import CourseGrid from "@/components/organisms/Course/CourseGrid"
import InputField from "@/components/molecules/InputField"
import { useCourse } from "@/hooks/useCourse"

export default function CoursePage() {
  const { auth, courses = [] } = usePage().props as any
  const role = auth.user.role
  const [open, setOpen] = useState(false)

  const { search, setSearch, filteredCourses } = useCourse(undefined, courses)

  return (
    <>
      <Head title={role === "instructor" ? "My Courses" : "My Learning"} />

      <div className="space-y-8">

        {/* Header Banner */}
        <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-purple-950 to-slate-900 text-white p-6 sm:p-8 shadow-xl">
          <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute right-20 -top-10 w-48 h-48 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <p className="text-xs text-purple-300 font-medium">
                {role === "instructor" ? "Instructor / Courses" : "Student / Learning"}
              </p>
              <h1 className="text-2xl sm:text-3xl font-bold text-white">
                {role === "instructor" ? "My Courses" : "My Learning"}
              </h1>
              <p className="text-sm text-slate-400">
                {role === "instructor"
                  ? "Manage and publish courses for your students."
                  : "Track your enrolled courses and progress."}
              </p>
            </div>

            {role === "instructor" && (
              <Button
                onClick={() => setOpen(true)}
                leftIcon={<Plus size={16} />}
                className="!rounded-none shrink-0"
              >
                Add Course
              </Button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="bg-white dark:bg-[#1e1f24] border border-slate-200/80 dark:border-slate-700 shadow-sm p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-700">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                {role === "instructor"
                  ? `All My Courses (${filteredCourses.length})`
                  : `Enrolled Courses (${filteredCourses.length})`}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {role === "instructor"
                  ? "Courses you've created and published."
                  : "Courses you're currently enrolled in."}
              </p>
            </div>
            {role === "instructor" && courses.length > 0 && (
              <div className="w-full sm:w-80">
                <InputField
                  label=""
                  placeholder="Search course title..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            )}
          </div>

          {filteredCourses.length > 0 ? (
            <CourseGrid courses={filteredCourses} />
          ) : (
            /* Empty State */
            <div className="py-20 flex flex-col items-center gap-4 text-center">
              <div className="w-14 h-14 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 flex items-center justify-center text-slate-300 dark:text-slate-500">
                <BookOpen size={28} strokeWidth={1.5} />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
                  {role === "instructor" ? "No courses yet" : "No enrolled courses yet"}
                </p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                  {role === "instructor"
                    ? "Create your first course to get started."
                    : "Browse the catalog and enroll in a course."}
                </p>
              </div>
              {role === "instructor" ? (
                <Button onClick={() => setOpen(true)} leftIcon={<Plus size={15} />} className="!rounded-none">
                  Create Course
                </Button>
              ) : (
                <Button variant="outline" className="!rounded-none">
                  Browse Courses
                </Button>
              )}
            </div>
          )}
        </div>

      </div>

      {role === "instructor" && (
        <Modal open={open} onClose={() => setOpen(false)} title="Add Course">
          <CourseAdd onSuccess={() => setOpen(false)} />
        </Modal>
      )}
    </>
  )
}

CoursePage.layout = (page: React.ReactNode) => (
  <UserLayout>{page}</UserLayout>
)

CoursePage.layout = (page: React.ReactNode) => (
  <UserLayout>{page}</UserLayout>
)