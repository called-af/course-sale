import InputField from "@/components/molecules/InputField"
import Button from "@/components/atoms/Button"
import SelectField from "@/components/molecules/SelectField"
import { useForm } from "@inertiajs/react"

interface CourseFormData {
  title: string
  description: string
  type: "free" | "paid"
  level: "beginner" | "intermediate" | "advanced"
  status: "draft" | "published"
}

export default function CourseForm({ onSuccess }: { onSuccess?: () => void }) {
  const { data, setData, post, processing, errors } =
    useForm<CourseFormData>({
      title: "",
      description: "",
      type: "free",
      level: "beginner",
      status: "draft",
    })

  const submit = (e: React.FormEvent) => {
    e.preventDefault()

    post("/api/courses", {
      onSuccess: () => {
        onSuccess?.()
      },
    })
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <InputField
        label="Title"
        name="title"
        value={data.title}
        onChange={(e) => setData("title", e.target.value)}
      />

      <InputField
        label="Description"
        name="description"
        value={data.description}
        onChange={(e) => setData("description", e.target.value)}
      />

      <SelectField
        label="Type"
        name="type"
        value={data.type}
        onChange={(e) => setData("type", e.target.value as any)}
        options={[
          { label: "Free", value: "free" },
          { label: "Paid", value: "paid" },
        ]}
      />

      <SelectField
        label="Level"
        name="level"
        value={data.level}
        onChange={(e) => setData("level", e.target.value as any)}
        options={[
          { label: "Beginner", value: "beginner" },
          { label: "Intermediate", value: "intermediate" },
          { label: "Advanced", value: "advanced" },
        ]}
      />

      <SelectField
        label="Status"
        name="status"
        value={data.status}
        onChange={(e) => setData("status", e.target.value as any)}
        options={[
          { label: "Draft", value: "draft" },
          { label: "Published", value: "published" },
        ]}
      />

      <Button type="submit" disabled={processing} variant="primary">
        Save Course
      </Button>
    </form>
  )
}
