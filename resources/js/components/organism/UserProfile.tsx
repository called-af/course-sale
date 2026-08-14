import { useForm } from "@inertiajs/react"
import { route } from "ziggy-js"
import { useState } from "react"

import Button from "@/components/atoms/Button"
import InputField from "@/components/molecules/InputField"
import SelectField from "@/components/molecules/SelectField"
import ChooseFile from "@/components/molecules/ChooseFile"
import CourseGrid from "@/components/organism/Course/CourseGrid"

import type { User } from "@/types/user"

interface Props {
  user: User
}

export default function UserProfile({ user }: Props) {
  const [preview, setPreview] = useState<string | null>(null)
  const [search, setSearch] = useState("")

  const { data, setData, put, processing, errors } = useForm({
    name: user.name,
    email: user.email,
    role: user.role,
    password: "",
    avatar: null as File | null,
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    put(route("admin.users.update", user.id), {
      forceFormData: true,
    })
  }

  function handleAvatarChange(file: File | null) {
    if (!file) return
    setData("avatar", file)
    setPreview(URL.createObjectURL(file))
  }

  const isInstructorOrAdmin = user.role === "instructor" || user.role === "admin"
  const allCourses = (user.created_courses ?? []) as any[]
  const filteredCourses = allCourses.filter((c) =>
    c.title.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-8">

      {/* ===== Account Edit Form ===== */}
      <form onSubmit={handleSubmit} className="grid md:grid-cols-3 gap-8">

        {/* Avatar */}
        <div className="bg-white border border-gray-300 p-6 flex flex-col gap-4">
          <div className="text-sm font-medium text-neutral-600">Avatar</div>
          <div className="flex-1 flex flex-col gap-3">
            <ChooseFile
              aspect="square"
              value={preview ?? user.avatar_url ?? null}
              onChange={(file) => handleAvatarChange(file)}
            />
            {errors.avatar && (
              <p className="text-sm text-red-500">{errors.avatar}</p>
            )}
          </div>
        </div>

        {/* Info & Security */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white border border-gray-300 p-6 space-y-4">
            <div className="text-sm font-medium text-neutral-600">
              Account Information
            </div>
            <InputField
              label="Name"
              value={data.name}
              onChange={(e) => setData("name", e.target.value)}
            />
            <InputField
              label="Email"
              value={data.email}
              onChange={(e) => setData("email", e.target.value)}
            />
            <SelectField
              label="Role"
              value={data.role}
              onChange={(e) => setData("role", e.target.value as User["role"])}
              options={[
                { label: "Student", value: "student" },
                { label: "Instructor", value: "instructor" },
                { label: "Admin", value: "admin" },
              ]}
            />
            {errors.role && (
              <p className="text-sm text-red-500">{errors.role}</p>
            )}
          </div>

          <div className="bg-white border border-gray-300 p-6 space-y-4">
            <div className="text-sm font-medium text-neutral-600">
              Security
            </div>
            <InputField
              label="New Password"
              type="password"
              placeholder="Leave blank to keep current password"
              value={data.password}
              onChange={(e) => setData("password", e.target.value)}
            />
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={processing}>
              {processing ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
      </form>

      {/* ===== Course List — instructor / admin only ===== */}
      {isInstructorOrAdmin && (
        <div className="bg-white border border-slate-200/80 shadow-sm p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                All Courses ({filteredCourses.length})
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Filter or search through courses by this instructor.
              </p>
            </div>
            <div className="w-full sm:w-80">
              <InputField
                label=""
                placeholder="Search course title..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <CourseGrid courses={filteredCourses} />
        </div>
      )}
    </div>
  )
}
