import { Course } from "@/types"
import CoursePreviewSection from "@/components/organism/Course/CoursePreviewSection"

interface CoursePreviewTemplateProps {
  course: Course
}

export default function CoursePreviewTemplate({ course }: CoursePreviewTemplateProps) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <CoursePreviewSection course={course} />
    </div>
  )
}
