import AdminLayout from "@/components/templates/AdminLayout"
import Button from "@/components/atoms/Button"

import InputField from "@/components/molecules/InputField"
import TextAreaField from "@/components/molecules/TextAreaField"
import SelectField from "@/components/molecules/SelectField"

import ModulesCrud from "@/components/organism/Course/ModulesCrud"

import { Course } from "@/types"
import { useCourse } from "@/hooks/useCourse"
import { ReactElement, JSXElementConstructor, ReactNode, ReactPortal } from "react"

interface CourseSlugProps {
  course: Course
}

export default function CourseSlug({ course }: CourseSlugProps) {
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
    <div className="max-w-7xl mx-auto space-y-8">

      <div className="space-y-3">
        <div className="w-full aspect-video rounded-2xl overflow-hidden bg-gray-100">
          <img src={preview} className="w-full h-full object-cover" />
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

      <InputField
        label="Title"
        value={data.title}
        onChange={(e) => setData("title", e.target.value)}
      />

      <p className="text-sm text-neutral-500">
        By {course.creator?.name}
      </p>

      <div className="grid grid-cols-2 gap-4">

        <SelectField
          label="Level"
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
          value={data.type}
          onChange={(e) => setData("type", e.target.value)}
          options={[
            { label: "Free", value: "free" },
            { label: "Paid", value: "paid" },
          ]}
        />

        <SelectField
          label="Status"
          value={data.status}
          onChange={(e) => setData("status", e.target.value)}
          options={[
            { label: "Draft", value: "draft" },
            { label: "Review", value: "review" },
            { label: "Published", value: "published" },
          ]}
        />

        {data.type === "paid" && (
          <InputField
            label="Price"
            type="number"
            value={data.price}
            onChange={(e) => setData("price", e.target.value)}
          />
        )}
      </div>

      <TextAreaField
        label="Description"
        value={data.description}
        onChange={(e: { target: { value: string } }) => setData("description", e.target.value)}
      />

      <Button onClick={save} disabled={!hasChanges || processing}>
        Save Changes
      </Button>

      <ModulesCrud
        courseId={course.id}
        modules={course.modules ?? []}
      />
    </div>
  )
}

CourseSlug.layout = (page: string | number | bigint | boolean | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | ReactPortal | Promise<string | number | bigint | boolean | ReactPortal | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | null | undefined> | null | undefined) => <AdminLayout>{page}</AdminLayout>