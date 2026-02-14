import AdminLayout from "@/components/templates/AdminLayout"
import Badge from "@/components/atoms/Badge"
import Title from "@/components/atoms/Title"
import ModulesCrud from "@/components/organism/Course/ModulesCrud"

import { Course } from "@/types"

interface CourseSlugProps {
  course: Course
}

export default function CourseSlug({ course }: CourseSlugProps) {
  return (
    <div className="max-w-7xl mx-auto space-y-6">

      <div className="w-full aspect-video rounded-2xl overflow-hidden bg-neutral-100">
        <img
          src={course.thumbnail_url}
          className="w-full h-full object-cover"
        />
      </div>

      <div className="space-y-2">
        <Title as="h1">{course.title}</Title>

        <p className="text-sm text-neutral-500">
          By {course.creator?.name}
        </p>
      </div>

      <div className="flex gap-2 flex-wrap">
        {course.level && (
          <Badge variant="default">{course.level}</Badge>
        )}

        <Badge variant={course.type === "free" ? "info" : "warning"}>
          {course.type === "free" ? "FREE" : "PAID"}
        </Badge>

        <Badge variant={course.status === "published" ? "success" : "danger"}>
          {course.status.toUpperCase()}
        </Badge>
      </div>

      {course.description && (
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <h2 className="font-medium mb-2">Description</h2>
          <p className="text-sm text-neutral-600 leading-relaxed">
            {course.description}
          </p>
        </div>
      )}

      <ModulesCrud
        courseId={course.id}
        modules={course.modules}
      />

    </div>
  )
}

CourseSlug.layout = (page: React.ReactNode) => (
  <AdminLayout>{page}</AdminLayout>
)