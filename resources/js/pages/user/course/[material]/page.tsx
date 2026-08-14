import { Head, Link, usePage } from "@inertiajs/react"
import UserLayout from "@/components/templates/UserLayout"
import EditMaterialContent from "@/components/organism/Course/EditMaterialContent"
import Button from "@/components/atoms/Button"
import Badge from "@/components/atoms/Badge"
import { ArrowLeft, BookOpen, Layers, Sparkles, FileText } from "lucide-react"

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

  const course = material.module?.course
  const module = material.module

  if (!content) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center p-8 bg-white border border-slate-200 shadow-xs text-center space-y-3 rounded-none">
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
        {/* Header Banner matching all other course pages */}
        <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-purple-950 to-slate-900 text-white p-6 sm:p-8 shadow-xl rounded-none">
          <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-purple-500/10 blur-3xl pointer-events-none" />
          <div className="absolute right-20 -top-10 w-48 h-48 bg-indigo-500/10 blur-2xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-3">
              {/* Breadcrumb Navigation */}
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <Link
                  href={`/${rolePrefix}/courses`}
                  className="inline-flex items-center gap-1.5 text-slate-300 hover:text-white transition-colors"
                >
                  <span className="font-medium">All Courses</span>
                </Link>

                <span className="text-slate-500">/</span>

                <Link
                  href={`/${rolePrefix}/courses/${course.slug}`}
                  className="inline-flex items-center gap-1.5 text-slate-300 hover:text-white transition-colors"
                >
                  <span className="font-medium truncate max-w-[150px]">{course.title}</span>
                </Link>

                <span className="text-slate-500">/</span>

                <span className="text-slate-300 font-medium truncate max-w-[150px]">{module.title}</span>

                <span className="text-slate-500">/</span>

                <div className="inline-flex items-center gap-1.5 text-purple-200 font-semibold">
                  <span className="truncate max-w-[150px]">{material.title}</span>
                </div>
              </div>

              {/* Title & Type Badge */}
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex flex-wrap items-center gap-3">
                  <span>Edit Material Content</span>
                  <Badge variant="purple" className="!rounded-none">
                    {content.type}
                  </Badge>
                </h1>
                <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl font-medium">
                  {content.title}
                </p>
              </div>
            </div>

            {/* Header Action Button */}
            <div className="flex-shrink-0">
              <Link href={`/${rolePrefix}/courses/${course.slug}`}>
                <Button
                  variant="outline"
                  size="md"
                  leftIcon={<ArrowLeft className="w-4 h-4" />}
                  className="!rounded-none"
                >
                  Back to Course Structure
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Content Editor Organism */}
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
  return <UserLayout>{children}</UserLayout>
}

MaterialPage.layout = (page: any) => (
  <MaterialPageLayout>{page}</MaterialPageLayout>
)