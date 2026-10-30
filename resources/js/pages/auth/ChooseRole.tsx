import { useForm, Head } from "@inertiajs/react"
import Button from "@/components/atoms/Button"
import Title from "@/components/atoms/Title"
import LoginLayout from "@/components/templates/LoginLayout"
import { BookOpen, GraduationCap, Check } from "lucide-react"
import clsx from "clsx"

const roles = [
  {
    value: "student",
    label: "Student",
    description: "Browse, enroll, and learn from expert-led courses at your own pace.",
    icon: BookOpen,
    features: ["Access all courses", "Track your progress", "Earn certificates"],
  },
  {
    value: "instructor",
    label: "Instructor",
    description: "Create, publish, and sell your own courses to students worldwide.",
    icon: GraduationCap,
    features: ["Build courses", "Manage students", "Earn revenue"],
  },
] as const

export default function ChooseRole() {
  const { data, setData, post, processing } = useForm({
    role: "student",
  })

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    post("/choose-role")
  }

  return (
    <LoginLayout>
      <Head title="Choose Your Role" />

      <div className="min-h-screen grid grid-cols-1 md:grid-cols-2 bg-white dark:bg-[#141416]">
        {/* Left — decorative panel */}
        <div
          className="hidden md:block bg-cover bg-center"
          style={{ backgroundImage: "url('/assets/landscape.jpeg')" }}
        />

        {/* Right — role selection */}
        <div className="flex items-center justify-center px-6 py-12">
          <div className="w-full max-w-md space-y-8">
            {/* Header */}
            <div className="space-y-2 text-center">
              <Title as="h2">Choose your role</Title>
              <p className="text-sm text-neutral-500 dark:text-slate-400">
                Select how you want to use the platform. You can always change this later.
              </p>
            </div>

            {/* Role cards */}
            <form onSubmit={submit} className="space-y-6">
              <div className="space-y-4">
                {roles.map((role) => {
                  const isSelected = data.role === role.value
                  const Icon = role.icon

                  return (
                    <button
                      key={role.value}
                      type="button"
                      onClick={() => setData("role", role.value)}
                      className={clsx(
                        "w-full border-2 p-5 text-left transition-all duration-200",
                        "focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2",
                        "cursor-pointer",
                        isSelected
                          ? "border-purple-500 bg-purple-50/60 dark:bg-purple-950/40 shadow-md shadow-purple-500/10"
                          : "border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1e1f24] hover:border-slate-300 dark:hover:border-slate-600 hover:shadow-sm"
                      )}
                    >
                      <div className="flex items-start gap-4">
                        {/* Icon */}
                        <div
                          className={clsx(
                            "flex h-11 w-11 shrink-0 items-center justify-center transition-colors duration-200",
                            isSelected
                              ? "bg-gradient-to-b from-purple-500 to-purple-700 text-white shadow-md shadow-purple-500/25"
                              : "bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400"
                          )}
                        >
                          <Icon className="h-5 w-5" />
                        </div>

                        {/* Content */}
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-base font-semibold text-gray-900 dark:text-white">
                              {role.label}
                            </span>

                            {/* Radio indicator */}
                            <div
                              className={clsx(
                                "flex h-5 w-5 shrink-0 items-center justify-center border-2 transition-all duration-200",
                                isSelected
                                  ? "border-purple-600 bg-purple-600"
                                  : "border-slate-300 dark:border-slate-600"
                              )}
                            >
                              {isSelected && (
                                <Check className="h-3 w-3 text-white" strokeWidth={3} />
                              )}
                            </div>
                          </div>

                          <p className="text-sm leading-relaxed text-neutral-500 dark:text-slate-400">
                            {role.description}
                          </p>

                          {/* Feature list */}
                          <ul className="flex flex-wrap gap-x-4 gap-y-1 pt-1">
                            {role.features.map((feature) => (
                              <li
                                key={feature}
                                className={clsx(
                                  "flex items-center gap-1.5 text-xs font-medium",
                                  isSelected ? "text-purple-600 dark:text-purple-400" : "text-neutral-400 dark:text-slate-500"
                                )}
                              >
                                <Check className="h-3 w-3" strokeWidth={3} />
                                {feature}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>

              <Button type="submit" disabled={processing} widthFull size="lg">
                Continue as {data.role === "student" ? "Student" : "Instructor"}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </LoginLayout>
  )
}
