import { Head } from "@inertiajs/react"
import AdminLayout from "@/components/templates/AdminLayout"
import EditMaterialContent from "@/components/organism/Course/EditMaterialContent"
import BreadCrumb from "@/components/atoms/BreadCrumb"

interface MaterialPageProps {
  material: any
  editContentId?: number | null
}

export default function MaterialPage({
  material,
  editContentId = null,
}: MaterialPageProps) {

  const content = material.contents?.find(
    (c: any) => c.id === editContentId
  )

  if (!content) {
    return <div className="p-6">Content not found</div>
  }

  const course = material.module?.course
  const module = material.module

  return (
    <>
      <Head title={`Edit ${content.title}`} />

      <div className="max-w-7xl mx-auto space-y-6">

        <BreadCrumb
          items={[
            {
              label: "Courses",
              href: "/admin/courses",
            },
            {
              label: course.title,
              href: `/admin/courses/${course.slug}`,
            },
            {
              label: module.title,
              href: `/admin/courses/${course.slug}`,
            },
            {
              label: material.title,
              href: `/admin/courses/${course.slug}`,
            },
            {
              label: "Edit Content",
            },
          ]}
        />

        <div>
          <h1 className="text-2xl font-semibold">
            Edit Content
          </h1>

          <p className="text-sm text-neutral-500">
            {material.title}
          </p>
        </div>

        <EditMaterialContent
          courseSlug={course.slug}
          moduleId={material.module_id}
          materialId={material.id}
          content={content}
        />
      </div>
    </>
  )
}

MaterialPage.layout = (page: any) => (
  <AdminLayout>{page}</AdminLayout>
)