import { Head } from "@inertiajs/react"
import { Plus, Pencil, Trash2 } from "lucide-react"

import { useCategory } from "@/hooks/useCategory"
import AdminLayout from "@/components/templates/AdminLayout"
import Button from "@/components/atoms/Button"
import PageHeader from "@/components/molecules/PageHeader"
import ConfirmationDelete from "@/components/molecules/ConfirmationDelete"
import CategoryForm from "@/components/organisms/CategoryForm"

interface Category {
  id: number
  name: string
  slug: string
  desc?: string
  img_url?: string
}

export default function CategoryPage({ categories }: { categories: Category[] }) {
  const {
    data, setData, processing,
    preview, handleImgChange,
    editingId, deleteTarget,
    isCreateOpen, isEditOpen,
    openCreate, closeCreate, closeEdit,
    startEdit, submitCreate, submitUpdate,
    openDeleteModal, closeDeleteModal, confirmDelete,
  } = useCategory()

  return (
    <>
      <Head title="Category" />

      <div className="max-w-8xl mx-auto space-y-8">

        <PageHeader
          breadcrumbs={[{ label: "Admin" }, { label: "Categories" }]}
          title="Category Management"
          description="Manage course categories shown on the platform"
          actions={
            <Button
              onClick={openCreate}
              leftIcon={<Plus size={15} />}
              className="!rounded-none"
            >
              Add Category
            </Button>
          }
        />

        {/* Content Card */}
        <div className="bg-white dark:bg-[#1e1f24] border border-slate-200/80 dark:border-slate-700 shadow-sm p-6 sm:p-8 space-y-4">
          <div className="pb-4 border-b border-slate-100 dark:border-slate-700">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              All Categories ({categories.length})
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Click edit or delete to manage each category.
            </p>
          </div>

          <div className="divide-y divide-neutral-100 dark:divide-slate-700 border border-neutral-200 dark:border-slate-700">
            {categories.length === 0 && (
              <p className="text-sm text-neutral-400 dark:text-slate-500 text-center py-10">
                No categories yet.
              </p>
            )}

            {categories.map((category) => (
              <div
                key={category.id}
                className="flex items-center justify-between p-4 bg-white dark:bg-[#1e1f24] hover:bg-neutral-50 dark:hover:bg-slate-700 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-neutral-100 dark:bg-slate-700 overflow-hidden flex items-center justify-center">
                    {category.img_url ? (
                      <img
                        src={category.img_url}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-xs text-neutral-400 dark:text-slate-500">IMG</span>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-neutral-800 dark:text-slate-100">
                      {category.name}
                    </p>
                    <p className="text-xs text-neutral-400 dark:text-slate-500 font-mono">
                      /{category.slug}
                    </p>
                    {category.desc && (
                      <p className="text-xs text-neutral-500 dark:text-slate-400 line-clamp-1">
                        {category.desc}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => startEdit(category)}
                    className="w-8 h-8 flex items-center justify-center text-neutral-400 hover:text-purple-600 dark:hover:text-purple-400"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={() => openDeleteModal(category)}
                    className="w-8 h-8 flex items-center justify-center text-neutral-400 hover:text-red-500"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <CategoryForm
        open={isCreateOpen}
        onClose={closeCreate}
        onSubmit={submitCreate}
        processing={processing}
        title="Add Category"
        data={data}
        setData={setData}
        preview={preview}
        onImgChange={handleImgChange}
      />

      <CategoryForm
        open={isEditOpen}
        onClose={closeEdit}
        onSubmit={() => submitUpdate(editingId!)}
        processing={processing}
        title="Edit Category"
        data={data}
        setData={setData}
        preview={preview}
        onImgChange={handleImgChange}
      />

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
    </>
  )
}

CategoryPage.layout = (page: React.ReactNode) => (
  <AdminLayout>{page}</AdminLayout>
)
