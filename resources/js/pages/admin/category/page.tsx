import { useForm } from "@inertiajs/react"
import { useState } from "react"

import AdminLayout from "@/components/templates/AdminLayout"
import InputField from "@/components/molecules/InputField"
import Button from "@/components/atoms/Button"

interface Category {
  id: number
  name: string
  slug: string
}

interface CategoryPageProps {
  categories: Category[]
}

export default function CategoryPage({ categories }: CategoryPageProps) {
  const [editingId, setEditingId] = useState<number | null>(null)

  const form = useForm({
    name: "",
  })

  const { data, setData, post, put, delete: destroy, processing, reset } = form

  const startEdit = (category: Category) => {
    setEditingId(category.id)
    setData("name", category.name)
  }

  const cancelEdit = () => {
    setEditingId(null)
    reset()
  }

  const submitCreate = () => {
    if (!data.name.trim()) return

    post("/admin/categories", {
      onSuccess: () => reset(),
    })
  }

  const submitUpdate = (id: number) => {
    if (!data.name.trim()) return

    put(`/admin/categories/${id}`, {
      onSuccess: () => {
        setEditingId(null)
        reset()
      },
    })
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">

      <div className="space-y-3">
        <h1 className="text-xl font-semibold">Categories</h1>

        <div className="flex gap-3">
          <InputField
            label="New Category"
            value={data.name}
            onChange={(e) => setData("name", e.target.value)}
          />

          <Button onClick={submitCreate} disabled={processing}>
            Add
          </Button>
        </div>
      </div>

      <div className="space-y-3">
        {categories.map((category) => {
          const isEditing = editingId === category.id
          const hasChanges = data.name !== category.name

          return (
            <div
              key={category.id}
              className="p-4 border rounded-xl flex items-center gap-4"
            >
              <div className="flex-1">

                <InputField
                  label="Name"
                  value={isEditing ? data.name : category.name}
                  disabled={!isEditing}
                  onChange={(e) => setData("name", e.target.value)}
                />

                <p className="text-xs text-neutral-500 mt-1">
                  /{category.slug}
                </p>

              </div>

              {!isEditing ? (
                <>
                  <Button onClick={() => startEdit(category)}>
                    Edit
                  </Button>

                  <Button
                    variant="danger"
                    onClick={() =>
                      destroy(`/admin/categories/${category.id}`)
                    }
                  >
                    Delete
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    onClick={() => submitUpdate(category.id)}
                    disabled={!hasChanges || processing}
                  >
                    Save
                  </Button>

                  <Button variant="secondary" onClick={cancelEdit}>
                    Cancel
                  </Button>
                </>
              )}
            </div>
          )
        })}
      </div>

    </div>
  )
}

CategoryPage.layout = (page: React.ReactNode) => (
  <AdminLayout>{page}</AdminLayout>
)