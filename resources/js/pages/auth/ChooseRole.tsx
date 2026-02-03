import { useForm } from "@inertiajs/react"
import Button from "@/components/atoms/Button"

export default function ChooseRole() {
  const { data, setData, post, processing } = useForm({
    role: "student",
  })

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    post("/choose-role")
  }

  return (
    <form onSubmit={submit} className="space-y-6 max-w-md mx-auto">
      <h1 className="text-xl font-semibold text-center">
        Choose your role
      </h1>

      <div className="space-y-3">
        <label className="flex items-center gap-3">
          <input
            type="radio"
            checked={data.role === "student"}
            onChange={() => setData("role", "student")}
          />
          Student – Learn from courses
        </label>

        <label className="flex items-center gap-3">
          <input
            type="radio"
            checked={data.role === "instructor"}
            onChange={() => setData("role", "instructor")}
          />
          Instructor – Create and sell courses
        </label>
      </div>

      <Button type="submit" disabled={processing} widthFull>
        Continue
      </Button>
    </form>
  )
}
