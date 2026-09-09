import AdminLayout from "@/components/templates/AdminLayout"
import Button from "@/components/atoms/Button"
import Modal from "@/components/atoms/Modal"
import InputField from "@/components/molecules/InputField"
import TextAreaField from "@/components/molecules/TextAreaField"
import SelectField from "@/components/molecules/SelectField"
import MultiSelectField from "@/components/molecules/MultiSelectField"
import ChooseFile from "@/components/molecules/ChooseFile"
import PageHeader from "@/components/molecules/PageHeader"
import CourseStructure from "@/components/organism/Course/CourseStructure"
import CertificateTemplateEditor from "@/components/organism/Course/CertificateTemplateEditor"

import { Course } from "@/types"
import { useCourse } from "@/hooks/useCourse"
import { Head, Link, router, usePage } from "@inertiajs/react"
import { ArrowLeft, Award, CheckCircle, Eye, Image, Save, Tag } from "lucide-react"
import { useState } from "react"

interface CourseSlugProps {
  course: Course
  categories: { id: number; name: string }[]
  tags?: { id: number; name: string }[]
}

export default function CourseSlug({ course, categories, tags }: CourseSlugProps) {
  const { auth } = usePage().props as any
  const rolePrefix = auth?.user?.role ?? "admin"
  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false)
  const [isApproving, setIsApproving] = useState(false)

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

  const approve = () => {
    router.put(`/admin/courses/${course.slug}/approve`, {}, {
      onStart: () => setIsApproving(true),
      onSuccess: () => setIsApprovalModalOpen(false),
      onFinish: () => setIsApproving(false),
    })
  }

  return (
    <>
      <Head title={`${data.title} - Admin Course`} />

      <div className="max-w-8xl mx-auto space-y-8">

        <PageHeader
          breadcrumbs={[
            { label: "All Courses", href: `/${rolePrefix}/courses` },
            { label: course.title },
          ]}
          title={data.title || "Course Details"}
          titleBadge={
            <span className={`text-xs px-3 py-1 font-bold uppercase tracking-wider ${
              data.status === "published"
                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                : data.status === "review"
                ? "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
            }`}>
              {data.status}
            </span>
          }
          description={course.creator ? `Created by ${course.creator.name}` : undefined}
          actions={
            <div className="flex items-center gap-3">
              {course.status === "review" && (
                <Button
                  onClick={() => setIsApprovalModalOpen(true)}
                  leftIcon={<CheckCircle className="w-4 h-4" />}
                  className="!rounded-none"
                >
                  Approve & Publish
                </Button>
              )}
              <Link
                href={`/${rolePrefix}/courses/${course.slug}/preview`}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-medium text-sm border border-purple-500 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
              >
                <Eye className="w-4 h-4" />
                Preview
              </Link>
              <Link
                href={`/${rolePrefix}/courses`}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white font-medium text-sm border border-white/15 transition-all duration-200 backdrop-blur-md hover:scale-[1.02] active:scale-[0.98]"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </Link>
            </div>
          }
        />

        {/* 2-Column Settings Layout */}
        <div className="grid lg:grid-cols-12 gap-8 items-start">
          {/* Left Column */}
          <div className="lg:col-span-5 space-y-6">
            {/* Thumbnail */}
            <div className="bg-white border border-slate-200/80 shadow-sm p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <Image className="w-4 h-4 text-purple-500" />
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

            {/* Tags */}
            <div className="bg-white border border-slate-200/80 shadow-sm p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <Tag className="w-4 h-4 text-purple-500" />
                  Course Tags
                </h3>
                <span className="text-[11px] text-slate-400">For Recommendations</span>
              </div>
              <MultiSelectField
                label=""
                value={data.tag_ids ?? []}
                onChange={(values) => setData("tag_ids", values)}
                options={(tags ?? []).map((t) => ({ label: t.name, value: t.id }))}
              />
              <p className="text-xs text-slate-400 leading-relaxed">
                Tags help student discovery and power personalized recommendations.
              </p>
            </div>
          </div>

          {/* Right Column */}
          <div className="lg:col-span-7 bg-white border border-slate-200/80 shadow-sm p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Course Information & Details</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Manage title, description, pricing, and accessibility level.
                </p>
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

            {/* Categories */}
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
                options={(categories ?? []).map((c) => ({ label: c.name, value: c.id }))}
              />

            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <Button
                onClick={save}
                disabled={!hasChanges || processing}
                leftIcon={<Save className="w-4 h-4" />}
                className="!rounded-none"
              >
                {processing ? "Saving Changes..." : "Save Course Changes"}
              </Button>
              <span className="text-xs text-slate-400">
                {hasChanges ? "Click save to apply changes." : "All changes saved."}
              </span>
            </div>
            
          </div>
          
        </div>

        <CourseStructure course={course} modules={course.modules ?? []} />

        {/* Certificate Template Editor */}
        <div className="bg-white border border-slate-200/80 shadow-sm p-6 sm:p-8 space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
            <div className="flex h-8 w-8 items-center justify-center bg-purple-50">
              <Award className="w-4 h-4 text-purple-600" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Certificate Template</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Customize the certificate design issued to students who complete this course.
              </p>
            </div>
          </div>
          <CertificateTemplateEditor
            courseSlug={course.slug}
            rolePrefix="admin"
            initialTemplate={{
              primary_color:  course.certificate_template?.primary_color  ?? '#7c3aed',
              accent_color:   course.certificate_template?.accent_color   ?? '#a78bfa',
              bg_style:       (course.certificate_template?.bg_style       ?? 'dark') as 'dark' | 'light' | 'gradient',
              show_signature: course.certificate_template?.show_signature  ?? false,
              signature_name: course.certificate_template?.signature_name  ?? '',
              custom_title:   course.certificate_template?.custom_title    ?? '',
              footer_note:    course.certificate_template?.footer_note     ?? '',
            }}
          />
        </div>
      </div>

      <Modal
        open={isApprovalModalOpen}
        onClose={() => !isApproving && setIsApprovalModalOpen(false)}
        title="Approve Course"
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => setIsApprovalModalOpen(false)}
              disabled={isApproving}
            >
              Cancel
            </Button>
            <Button
              onClick={approve}
              isLoading={isApproving}
              leftIcon={<CheckCircle className="w-4 h-4" />}
            >
              Approve & Publish
            </Button>
          </>
        }
      >
        <p>Are you sure you want to approve this course?</p>
        <p className="mt-2 text-gray-500">
          Once approved, “{course.title}” will be published and become visible in the public course catalog.
        </p>
      </Modal>
    </>
  )
}

CourseSlug.layout = (page: any) => (
  <AdminLayout>{page}</AdminLayout>
)
