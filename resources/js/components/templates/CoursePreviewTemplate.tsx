import { Course } from "@/types"
import CoursePreviewSection from "@/components/organisms/Course/CoursePreviewSection"

interface CoursePreviewTemplateProps {
  course: Course
}

export default function CoursePreviewTemplate({ course }: CoursePreviewTemplateProps) {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white">
      <CoursePreviewSection course={course} />
    </div>
  )
}
