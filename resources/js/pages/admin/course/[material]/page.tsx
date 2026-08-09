import { Head, Link } from "@inertiajs/react"
import AdminLayout from "@/components/templates/AdminLayout"
import EditMaterialContent from "@/components/organism/Course/EditMaterialContent"
import { ArrowLeft, BookOpen, Layers, FileText, Sparkles } from "lucide-react"

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
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center p-8 bg-white border border-slate-200/80 shadow-sm text-center">
        <div className="w-12 h-12 bg-amber-50 text-amber-500 flex items-center justify-center mb-3">
          <FileText className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-semibold text-slate-800">Content Not Found</h3>
        <p className="text-sm text-slate-500 max-w-md mt-1 mb-4">
          The requested content is unavailable or may have been deleted.
        </p>
        <Link
          href={`/admin/courses/${material.module?.course?.slug}`}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Course
        </Link>
      </div>
    )
  }

  const course = material.module?.course
  const module = material.module

  return (
    <>
      <Head title={`Edit ${content.title} - ${course?.title || "Material"}`} />

      <div className="max-w-7xl mx-auto space-y-6">
        {/* Modern Header Banner */}
        <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 sm:p-8 shadow-xl shadow-slate-900/5">
          <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute right-20 -top-10 w-48 h-48 bg-purple-500/10 rounded-full blur-2xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-3">
              {/* Context Badges */}
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <Link
                  href={`/admin/courses/${course.slug}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 hover:bg-white/20 text-slate-200 backdrop-blur-md transition-colors"
                >
                  <BookOpen className="w-3.5 h-3.5 text-indigo-300" />
                  <span className="font-medium truncate max-w-[150px]">{course.title}</span>
                </Link>

                <span className="text-slate-500">/</span>

                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 text-slate-200 backdrop-blur-md">
                  <Layers className="w-3.5 h-3.5 text-purple-300" />
                  <span className="font-medium truncate max-w-[150px]">{module.title}</span>
                </div>

                <span className="text-slate-500">/</span>

                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-500/20 text-indigo-200 border border-indigo-500/30">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                  <span className="font-medium truncate max-w-[150px]">{material.title}</span>
                </div>
              </div>

              {/* Title */}
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-3">
                  Edit Material Content
                  <span className="text-xs px-2.5 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold tracking-wide uppercase">
                    {content.type}
                  </span>
                </h1>
                <p className="text-sm text-slate-300 mt-1 max-w-2xl">
                  {content.title}
                </p>
              </div>
            </div>

            {/* Back Action */}
            <div className="flex-shrink-0">
              <Link
                href={`/admin/courses/${course.slug}`}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white font-medium text-sm border border-white/15 shadow-sm transition-all duration-200 backdrop-blur-md hover:scale-[1.02] active:scale-[0.98]"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Course Structure
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

MaterialPage.layout = (page: any) => (
  <AdminLayout>{page}</AdminLayout>
)