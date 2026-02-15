import { useForm } from "@inertiajs/react"
import { useEffect, useState } from "react"

import AdminLayout from "@/components/templates/AdminLayout"
import Button from "@/components/atoms/Button"

import InputField from "@/components/molecules/InputField"
import TextAreaField from "@/components/molecules/TextAreaField"
import SelectField from "@/components/molecules/SelectField"

import ModulesCrud from "@/components/organism/Course/ModulesCrud"

import { Course } from "@/types"

interface CourseSlugProps {
  course: Course
}

export default function CourseSlug({ course }: CourseSlugProps) {
  const [preview, setPreview] = useState<string>(
    course.thumbnail_url || "/assets/landscape.jpeg"
  )

  const form = useForm({
    title: course.title,
    description: course.description ?? "",
    level: course.level ?? "",
    type: course.type,
    status: course.status,
    price: (course as any).price ?? "",
    thumbnail: null as File | null,
  })

  const { data, setData, put, processing, errors } = form

  const handleThumbnailChange = (file: File) => {
    const objectUrl = URL.createObjectURL(file)

    setData("thumbnail", file)
    setPreview(objectUrl)
  }

  useEffect(() => {
    return () => {
      if (preview.startsWith("blob:")) {
        URL.revokeObjectURL(preview)
      }
    }
  }, [preview])

  const hasChanges =
    data.title !== course.title ||
    data.description !== (course.description ?? "") ||
    data.level !== (course.level ?? "") ||
    data.status !== course.status ||
    data.type !== course.type ||
    data.price !== ((course as any).price ?? "") ||
    data.thumbnail !== null

 
  const submit = () => {
    if (!hasChanges) return

    const payload: Record<string, any> = {}

    if (data.title !== course.title)
      payload.title = data.title

    if (data.description !== (course.description ?? ""))
      payload.description = data.description

    if (data.level !== (course.level ?? ""))
      payload.level = data.level

    if (data.status !== course.status)
      payload.status = data.status

    if (data.type !== course.type)
      payload.type = data.type

    if (data.price !== ((course as any).price ?? ""))
      payload.price = data.price

    if (data.thumbnail)
      payload.thumbnail = data.thumbnail

    form.transform(() => payload)

    put(`/admin/courses/${course.slug}`, {
      forceFormData: true,
      onSuccess: () => {
        form.reset("thumbnail")
      },
    })
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8">

      <div className="space-y-3">
        <div className="w-full aspect-video rounded-2xl overflow-hidden bg-gray-100">
          <img
            src={preview}
            className="w-full h-full object-cover"
          />
        </div>

        <input
          type="file"
          accept="image/*"
          onChange={(e) =>
            e.target.files && handleThumbnailChange(e.target.files[0])
          }
        />

        {errors.thumbnail && (
          <p className="text-xs text-red-500">{errors.thumbnail}</p>
        )}
      </div>

      <div className="space-y-1">
        <InputField
          label="Title"
          value={data.title}
          onChange={(e) => setData("title", e.target.value)}
        />

        {errors.title && (
          <p className="text-xs text-red-500">{errors.title}</p>
        )}
      </div>

      <p className="text-sm text-neutral-500">
        By {course.creator?.name}
      </p>

      <div className="grid grid-cols-2 gap-4">

        <SelectField
          label="Level"
          name="level"
          value={data.level}
          onChange={(e) => setData("level", e.target.value)}
          options={[
            { label: "Beginner", value: "beginner" },
            { label: "Intermediate", value: "intermediate" },
            { label: "Advanced", value: "advanced" },
          ]}
        />

        <SelectField
          label="Type"
          name="type"
          value={data.type}
          onChange={(e) => setData("type", e.target.value)}
          options={[
            { label: "Free", value: "free" },
            { label: "Paid", value: "paid" },
          ]}
        />

        <SelectField
          label="Status"
          name="status"
          value={data.status}
          onChange={(e) => setData("status", e.target.value)}
          options={[
            { label: "Draft", value: "draft" },
            { label: "Review", value: "review" },
            { label: "Published", value: "published" },
          ]}
        />

        {data.type === "paid" && (
          <div className="space-y-1">
            <InputField
              label="Price"
              type="number"
              value={data.price}
              onChange={(e) => setData("price", e.target.value)}
            />

            {errors.price && (
              <p className="text-xs text-red-500">{errors.price}</p>
            )}
          </div>
        )}
      </div>

      <div className="space-y-1">
        <TextAreaField
          label="Description"
          value={data.description}
          onChange={(e: { target: { value: string } }) =>
            setData("description", e.target.value)
          }
        />

        {errors.description && (
          <p className="text-xs text-red-500">{errors.description}</p>
        )}
      </div>

      <Button
        onClick={submit}
        disabled={!hasChanges || processing}
      >
        Save Changes
      </Button>

      <ModulesCrud
        courseId={course.id}
        modules={course.modules ?? []}
      />

    </div>
  )
}

CourseSlug.layout = (page: React.ReactNode) => (
  <AdminLayout>{page}</AdminLayout>
)