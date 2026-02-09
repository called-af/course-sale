import InputField from "@/components/molecules/InputField"
import Button from "@/components/atoms/Button"
import { useForm, usePage } from "@inertiajs/react"
import { useRoute } from "ziggy-js"

interface CourseAddData {
  title: string
}

export default function CourseAdd({ onSuccess }: { onSuccess?: () => void }) {
  const route = useRoute()
  const { auth } = usePage().props as any

  const { data, setData, post, processing } = useForm<CourseAddData>({
    title: "",
  })

  const submit = (e: React.FormEvent) => {
    e.preventDefault()

    const routeName =
      auth.user.role === "admin"
        ? "admin.courses.store"
        : "instructor.courses.store"

    post(route(routeName), {
      onSuccess: () => onSuccess?.(),
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

      <Button type="submit" disabled={processing} variant="primary">
        Save Course
      </Button>
    </form>
  )
}
