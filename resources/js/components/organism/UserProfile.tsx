import { useForm } from "@inertiajs/react"
import { route } from "ziggy-js"
import { useState } from "react"

import Button from "@/components/atoms/Button"
import InputField from "@/components/molecules/InputField"
import type { User } from "@/types/user"

interface Props {
  user: User
}

export default function UserProfile({ user }: Props) {
  const [preview, setPreview] = useState<string | null>(null)

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

  return (
    <form
      onSubmit={handleSubmit}
      className="grid md:grid-cols-3 gap-8"
    >
      {/* LEFT - AVATAR */}
      <div className="bg-white border rounded-2xl p-6 space-y-4">
        <div className="text-sm font-medium text-neutral-600">
          Avatar
        </div>

        <div className="flex flex-col items-center gap-4">
          <div className="w-32 h-32 rounded-xl overflow-hidden bg-neutral-100">
            {preview ? (
              <img
                src={preview}
                className="w-full h-full object-cover"
              />
            ) : user.avatar_url ? (
              <img
                src={user.avatar_url}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-neutral-400">
                No Image
              </div>
            )}
          </div>

          <input
            type="file"
            accept="image/*"
            onChange={(e) =>
              handleAvatarChange(
                e.target.files?.[0] || null
              )
            }
          />

          {errors.avatar && (
            <p className="text-sm text-red-500">
              {errors.avatar}
            </p>
          )}
        </div>
      </div>

      {/* RIGHT - FORM */}
      <div className="md:col-span-2 space-y-6">

        {/* ACCOUNT INFO */}
        <div className="bg-white border rounded-2xl p-6 space-y-4">
          <div className="text-sm font-medium text-neutral-600">
            Account Information
          </div>

          <InputField
            label="Name"
            value={data.name}
            onChange={(e) =>
              setData("name", e.target.value)
            }
          />

          <InputField
            label="Email"
            value={data.email}
            onChange={(e) =>
              setData("email", e.target.value)
            }
          />

          <div className="space-y-1">
            <label className="text-sm font-medium">
              Role
            </label>

            <select
              value={data.role}
              onChange={(e) =>
                setData(
                  "role",
                  e.target.value as User["role"]
                )
              }
              className="w-full border rounded-lg px-3 py-2"
            >
              <option value="student">Student</option>
              <option value="instructor">Instructor</option>
              <option value="admin">Admin</option>
            </select>

            {errors.role && (
              <p className="text-sm text-red-500">
                {errors.role}
              </p>
            )}
          </div>
        </div>

        {/* SECURITY */}
        <div className="bg-white border rounded-2xl p-6 space-y-4">
          <div className="text-sm font-medium text-neutral-600">
            Security
          </div>

          <InputField
            label="New Password"
            type="password"
            placeholder="Leave blank if not changing"
            value={data.password}
            onChange={(e) =>
              setData("password", e.target.value)
            }
          />
        </div>

        {/* ACTION */}
        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={processing}
          >
            {processing ? "Saving..." : "Save Changes"}
          </Button>
        </div>

      </div>
    </form>
  )
}