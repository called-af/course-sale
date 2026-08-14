import { Head } from "@inertiajs/react"
import { Course } from "@/types"
import AdminLayout from "@/components/templates/AdminLayout"
import CoursePreviewTemplate from "@/components/templates/CoursePreviewTemplate"

export default function CoursePreview({ course }: { course: Course }) {
  return (
    <>
      <Head title={`Preview: ${course.title} - Admin`} />
      <CoursePreviewTemplate course={course} />
    </>
  )
}

CoursePreview.layout = (page: React.ReactNode) => <AdminLayout>{page}</AdminLayout>
