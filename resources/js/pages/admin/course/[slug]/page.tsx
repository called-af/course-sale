import AdminLayout from "@/components/templates/AdminLayout"
import Button from "@/components/atoms/Button"

import InputField from "@/components/molecules/InputField"
import TextAreaField from "@/components/molecules/TextAreaField"
import SelectField from "@/components/molecules/SelectField"
import MultiSelectField from "@/components/molecules/MultiSelectField"
import ChooseFile from "@/components/molecules/ChooseFile"

import BreadCrumb from "@/components/atoms/BreadCrumb"
import ModulesTree from "@/components/organism/Course/ModulesTree"

import { Course } from "@/types"
import { useCourse } from "@/hooks/useCourse"
import { Head } from "@inertiajs/react"

interface CourseSlugProps {
  course: Course
  categories: {
    id: number
    name: string
  }[]
}

export default function CourseSlug({ course, categories }: CourseSlugProps) {
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
      <Head title={data.title} />

      <div className="max-w-7xl mx-auto space-y-8">

        <BreadCrumb
          items={[
            { label: "Courses", href: "/admin/courses" },
            { label: course.title },
          ]}
        />

        <div className="grid md:grid-cols-2 gap-8 items-start">

          <div className="space-y-3">

            <ChooseFile
              label="Thumbnail"
              aspect="video"
              value={preview}
              onChange={(file) => file && handleThumbnailChange(file)}
            />

            {errors.thumbnail && (
              <p className="text-xs text-red-500">{errors.thumbnail}</p>
            )}

            <MultiSelectField
              label="Categories"
              value={data.category_ids ?? []}
              onChange={(values) => setData("category_ids", values)}
              options={(categories ?? []).map((category) => ({
                label: category.name,
                value: category.id,
              }))}
            />

          </div>

          <div className="space-y-6">

            <div className="space-y-2">
              <InputField
                label="Title"
                value={data.title}
                onChange={(e) => setData("title", e.target.value)}
              />

              <p className="text-sm text-neutral-500">
                By {course.creator?.name}
              </p>
            </div>

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
              onChange={(e: { target: { value: string } }) =>
                setData("description", e.target.value)
              }
            />

            <Button onClick={save} disabled={!hasChanges || processing}>
              Save Changes
            </Button>

          </div>
        </div>

        <ModulesTree
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