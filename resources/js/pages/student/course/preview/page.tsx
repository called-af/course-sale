import { Head } from "@inertiajs/react"
import { Course } from "@/types"
import UserLayout from "@/components/templates/UserLayout"
import CoursePreviewTemplate from "@/components/templates/CoursePreviewTemplate"

export default function CoursePreview({ course }: { course: Course }) {
  return (
    <>
      <Head title={`Preview: ${course.title}`} />
      <CoursePreviewTemplate course={course} />
    </>
  )
}

CoursePreview.layout = (page: React.ReactNode) => <UserLayout>{page}</UserLayout>
