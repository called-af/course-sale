import { useCategory } from "@/hooks/useCategory"

import AdminLayout from "@/components/templates/AdminLayout"
import InputField from "@/components/molecules/InputField"
import Button from "@/components/atoms/Button"
import ConfirmationDelete from "@/components/molecules/ConfirmationDelete"

interface Category {
  id: number
  name: string
  slug: string
}

interface CategoryPageProps {
  categories: Category[]
}

export default function CategoryPage({ categories }: CategoryPageProps) {
  const {
    data,
    setData,
    processing,

    editingId,
    deleteTarget,

    startEdit,
    cancelEdit,

    submitCreate,
    submitUpdate,

    openDeleteModal,
    closeDeleteModal,
    confirmDelete,
  } = useCategory()

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
                    onClick={() => openDeleteModal(category)}
                  >
                    Delete
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    onClick={() =>
                      submitUpdate(category.id, category.name)
                    }
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

      <ConfirmationDelete
        open={!!deleteTarget}
        onClose={closeDeleteModal}
        onConfirm={confirmDelete}
        isLoading={processing}
        title="Delete Category"
        message={
          deleteTarget
            ? `Category "${deleteTarget.name}" will be permanently deleted.`
            : undefined
        }
      />

    </div>
  )
}

CategoryPage.layout = (page: React.ReactNode) => (
  <AdminLayout>{page}</AdminLayout>
)
