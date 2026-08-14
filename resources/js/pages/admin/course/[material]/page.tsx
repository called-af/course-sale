import { Head, Link, usePage } from "@inertiajs/react"
import AdminLayout from "@/components/templates/AdminLayout"
import EditMaterialContent from "@/components/organism/Course/EditMaterialContent"
import Button from "@/components/atoms/Button"
import Badge from "@/components/atoms/Badge"
import PageHeader from "@/components/molecules/PageHeader"
import { ArrowLeft, FileText } from "lucide-react"

interface MaterialPageProps {
  material: any
  editContentId?: number | null
}

export default function MaterialPage({
  material,
  editContentId = null,
}: MaterialPageProps) {
  const { auth } = usePage().props as any
  const rolePrefix = auth?.user?.role ?? "admin"

  const content = material.contents?.find((c: any) => c.id === editContentId)
  const course = material.module?.course
  const module = material.module

  if (!content) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center p-8 bg-white border border-slate-200 shadow-xs text-center space-y-3">
        <div className="w-12 h-12 bg-amber-50 text-amber-500 flex items-center justify-center">
          <FileText className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-bold text-slate-800">Content Not Found</h3>
        <p className="text-xs text-slate-500 max-w-md">
          The requested content is unavailable or may have been deleted.
        </p>
        <Link href={`/${rolePrefix}/courses/${course?.slug || ""}`}>
          <Button
            variant="outline"
            size="sm"
            leftIcon={<ArrowLeft className="w-4 h-4" />}
            className="!rounded-none"
          >
            Back to Course Structure
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <>
      <Head title={`Edit ${content.title} - ${course?.title || "Material"}`} />

      <div className="max-w-8xl mx-auto space-y-6">

        <PageHeader
          breadcrumbs={[
            { label: "All Courses", href: `/${rolePrefix}/courses` },
            { label: course.title, href: `/${rolePrefix}/courses/${course.slug}` },
            { label: module.title },
            { label: material.title },
          ]}
          title="Edit Material Content"
          description={content.title}
          titleBadge={
            <Badge variant="purple" className="!rounded-none">
              {content.type}
            </Badge>
          }
          actions={
            <Link href={`/${rolePrefix}/courses/${course.slug}`}>
              <Button
                variant="outline"
                size="md"
                leftIcon={<ArrowLeft className="w-4 h-4" />}
                className="!rounded-none"
              >
                Back to Course
              </Button>
            </Link>
          }
        />

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
