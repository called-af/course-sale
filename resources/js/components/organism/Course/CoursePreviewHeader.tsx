import React from "react"
import { Link, usePage } from "@inertiajs/react"
import { ArrowLeft, Edit3, User } from "lucide-react"
import Button from "@/components/atoms/Button"
import Badge from "@/components/atoms/Badge"
import { Course } from "@/types"

interface CoursePreviewHeaderProps {
  course: Course
}

export default function CoursePreviewHeader({ course }: CoursePreviewHeaderProps) {
  const { auth } = usePage().props as any
  const rolePrefix = auth?.user?.role ?? "admin"

  return (
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
              <span className="font-medium truncate max-w-[200px]">{course.title}</span>
            </Link>

            <span className="text-slate-500">/</span>

            <div className="inline-flex items-center gap-1.5 text-purple-200">
              <span className="font-semibold">Preview Mode</span>
            </div>
          </div>

          {/* Course Title & Metadata */}
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex flex-wrap items-center gap-3">
              <span>{course.title}</span>
              <Badge
                variant={
                  course.status === "published"
                    ? "success"
                    : course.status === "review"
                    ? "info"
                    : "warning"
                }
                className="!rounded-none"
              >
                {course.status}
              </Badge>
            </h1>

            {course.creator && (
              <p className="text-xs text-slate-300 mt-1.5 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-purple-400" />
                Created by <strong className="text-white">{course.creator.name}</strong>
              </p>
            )}
          </div>
        </div>

        {/* Top Header Actions */}
        <div className="flex items-center gap-3 shrink-0">
          <Link href={`/${rolePrefix}/courses/${course.slug}`}>
            <Button
              variant="primary"
              size="md"
              leftIcon={<Edit3 className="w-4 h-4" />}
              className="!rounded-none"
            >
              Edit Course
            </Button>
          </Link>

          <Link href={`/${rolePrefix}/courses`}>
            <Button
              variant="outline"
              size="md"
              leftIcon={<ArrowLeft className="w-4 h-4" />}
              className="!rounded-none"
            >
              Back to List
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
