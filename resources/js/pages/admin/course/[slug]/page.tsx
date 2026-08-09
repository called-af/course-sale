import AdminLayout from "@/components/templates/AdminLayout"
import Button from "@/components/atoms/Button"

import InputField from "@/components/molecules/InputField"
import TextAreaField from "@/components/molecules/TextAreaField"
import SelectField from "@/components/molecules/SelectField"
import MultiSelectField from "@/components/molecules/MultiSelectField"
import ChooseFile from "@/components/molecules/ChooseFile"

import CourseStructure from "@/components/organism/Course/CourseStructure"

import { Course } from "@/types"
import { useCourse } from "@/hooks/useCourse"
import { Head, Link, usePage } from "@inertiajs/react"
import DashboardLayout from "@/components/templates/DashboardLayout"
import { ArrowLeft, BookOpen, Layers, Save, Sparkles, User, Tag, ShieldCheck, Eye } from "lucide-react"

interface CourseSlugProps {
  course: Course
  categories: {
    id: number
    name: string
  }[]
}

export default function CourseSlug({ course, categories }: CourseSlugProps) {
  const { auth } = usePage().props as any
  const rolePrefix = auth?.user?.role ?? "admin"

  const {
    data,
    setData,
    errors,
    processing,
    preview,
    handleThumbnailChange,
    hasChanges,
    save,
  } = useCourse(course)

  return (
    <>
      <Head title={`${data.title} - Admin Course`} />

      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header Banner */}
        <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-purple-950 to-slate-900 text-white p-6 sm:p-8 shadow-xl shadow-slate-900/5">
          <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute right-20 -top-10 w-48 h-48 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-3">
              {/* Context Badges */}
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <Link
                  href={`/${rolePrefix}/courses`}
                  className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 hover:bg-white/20 text-slate-200 backdrop-blur-md transition-colors"
                >
                  <BookOpen className="w-3.5 h-3.5 text-purple-300" />
                  <span className="font-medium">All Courses</span>
                </Link>

                <span className="text-slate-500">/</span>

                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-purple-500/20 text-purple-200 border border-purple-500/30">
                  <Sparkles className="w-3.5 h-3.5 text-purple-300" />
                  <span className="font-medium truncate max-w-[200px]">{course.title}</span>
                </div>
              </div>

              {/* Course Title & Author */}
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex flex-wrap items-center gap-3">
                  {data.title || "Course Details"}
                  <span className={`text-xs px-3 py-1 font-bold uppercase tracking-wider ${
                    data.status === "published"
                      ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                      : data.status === "review"
                      ? "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                      : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                  }`}>
                    {data.status}
                  </span>
                </h1>

                {course.creator && (
                  <p className="text-xs text-slate-300 mt-1.5 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-purple-400" />
                    Created by <strong className="text-white">{course.creator.name}</strong>
                  </p>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 shrink-0">
              <Link
                href={`/${rolePrefix}/courses/${course.slug}/preview`}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-medium text-sm border border-purple-500 shadow-sm transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
              >
                <Eye className="w-4 h-4" />
                Preview Course
              </Link>

              <Link
                href={`/${rolePrefix}/courses`}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white font-medium text-sm border border-white/15 shadow-sm transition-all duration-200 backdrop-blur-md hover:scale-[1.02] active:scale-[0.98]"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to List
              </Link>
            </div>
          </div>
        </div>

        {/* 2-Column Settings Layout */}
        <div className="grid lg:grid-cols-12 gap-8 items-start">
          {/* Left Column (Thumbnail & Categories) */}
          <div className="lg:col-span-5 space-y-6">
            {/* Thumbnail Card */}
            <div className="bg-white border border-slate-200/80 shadow-sm p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-500" />
                  Course Thumbnail
                </h3>
                <span className="text-[11px] text-slate-400">16:9 Ratio</span>
              </div>

              <ChooseFile
                label=""
                aspect="video"
                value={preview}
                onChange={(file) => file && handleThumbnailChange(file)}
              />

              {errors.thumbnail && (
                <p className="text-xs text-red-500 font-medium">{errors.thumbnail}</p>
              )}

              <p className="text-xs text-slate-400 leading-relaxed">
                Use a high-resolution 16:9 ratio image for optimal catalog presentation.
              </p>
            </div>

            {/* Categories Card */}
            <div className="bg-white border border-slate-200/80 shadow-sm p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <Tag className="w-4 h-4 text-indigo-500" />
                  Course Categories
                </h3>
              </div>

              <MultiSelectField
                label=""
                value={data.category_ids ?? []}
                onChange={(values) => setData("category_ids", values)}
                options={(categories ?? []).map((category) => ({
                  label: category.name,
                  value: category.id,
                }))}
              />
            </div>
          </div>

          {/* Right Column (Course Details Form) */}
          <div className="lg:col-span-7 bg-white border border-slate-200/80 shadow-sm p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Course Information & Details</h2>
                <p className="text-xs text-slate-500 mt-0.5">Manage title, description, pricing, and accessibility level.</p>
              </div>

              {hasChanges && (
                <span className="text-xs font-semibold px-3 py-1 bg-amber-50 text-amber-700 border border-amber-200 animate-pulse">
                  Unsaved Changes
                </span>
              )}
            </div>

            <div className="space-y-4">
              <InputField
                label="Course Title"
                value={data.title}
                onChange={(e) => setData("title", e.target.value)}
                placeholder="Enter course title..."
              />

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <SelectField
                  label="Difficulty Level"
                  value={data.level}
                  onChange={(e) => setData("level", e.target.value)}
                  options={[
                    { label: "Beginner", value: "beginner" },
                    { label: "Intermediate", value: "intermediate" },
                    { label: "Advanced", value: "advanced" },
                  ]}
                />

                <SelectField
                  label="Access Type"
                  value={data.type}
                  onChange={(e) => setData("type", e.target.value)}
                  options={[
                    { label: "Free", value: "free" },
                    { label: "Paid", value: "paid" },
                  ]}
                />

                <SelectField
                  label="Publication Status"
                  value={data.status}
                  onChange={(e) => setData("status", e.target.value)}
                  options={[
                    { label: "Draft", value: "draft" },
                    { label: "Under Review", value: "review" },
                    { label: "Published", value: "published" },
                  ]}
                />
              </div>

              {data.type === "paid" && (
                <InputField
                  label="Course Price (IDR)"
                  type="number"
                  value={data.price}
                  onChange={(e) => setData("price", e.target.value)}
                  placeholder="e.g., 150000"
                />
              )}

              <TextAreaField
                label="Full Description"
                value={data.description}
                onChange={(e: { target: { value: string } }) =>
                  setData("description", e.target.value)
                }
                placeholder="Write course overview and syllabus description here..."
              />
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <Button onClick={save} disabled={!hasChanges || processing} leftIcon={<Save className="w-4 h-4" />} className="!rounded-none">
                {processing ? "Saving Changes..." : "Save Course Changes"}
              </Button>

              <span className="text-xs text-slate-400">
                {hasChanges ? "Click save to apply changes." : "All changes saved."}
              </span>
            </div>
          </div>
        </div>

        {/* Structure & Modules Section */}
        <CourseStructure
          course={course}
          modules={course.modules ?? []}
        />
      </div>
    </>
  )
}

CourseSlug.layout = (page: any) => (
  <AdminLayout>{page}</AdminLayout>
)