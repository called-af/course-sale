import { Head, usePage } from "@inertiajs/react"
import InstructorLayout from "@/components/templates/DashboardLayout"
import DashboardLayout from "@/components/templates/DashboardLayout"
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
  const { auth } = usePage().props as any
  const rolePrefix = auth?.user?.role ?? "instructor"

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
              href: `/${rolePrefix}/courses`,
            },
            {
              label: course.title,
              href: `/${rolePrefix}/courses/${course.slug}`,
            },
            {
              label: module.title,
              href: `/${rolePrefix}/courses/${course.slug}`,
            },
            {
              label: material.title,
              href: `/${rolePrefix}/courses/${course.slug}`,
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

function MaterialPageLayout({ children }: { children: React.ReactNode }) {
  const { auth } = usePage().props as any
  if (auth?.user?.role === "instructor") {
    return <DashboardLayout>{children}</DashboardLayout>
  }
  return <InstructorLayout>{children}</InstructorLayout>
}

MaterialPage.layout = (page: any) => (
  <MaterialPageLayout>{page}</MaterialPageLayout>
)