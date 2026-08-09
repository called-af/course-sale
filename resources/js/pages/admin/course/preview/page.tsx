import { Course } from "@/types"
import AdminLayout from "@/components/templates/AdminLayout"
import CoursePreviewTemplate from "@/components/templates/CoursePreviewTemplate"

export default function CoursePreview({ course }: { course: Course }) {
  return <CoursePreviewTemplate course={course} />
}

CoursePreview.layout = (page: React.ReactNode) => <AdminLayout>{page}</AdminLayout>
