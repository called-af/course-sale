import { useCategory } from "@/hooks/useCategory"
import AdminLayout from "@/components/templates/AdminLayout"
import Button from "@/components/atoms/Button"
import ConfirmationDelete from "@/components/molecules/ConfirmationDelete"
import CategoryForm from "@/components/organism/CategoryForm"
import { Head } from "@inertiajs/react"
import { Pencil, Trash2, Plus } from "lucide-react"

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

    editingId,
    deleteTarget,

    isCreateOpen,
    isEditOpen,
    openCreate,
    closeCreate,
    closeEdit,

    startEdit,
    submitCreate,
    submitUpdate,

    openDeleteModal,
    closeDeleteModal,
    confirmDelete,
  } = useCategory()

  return (
    <>
      <Head title="Category" />

      <div className="max-w-7xl mx-auto space-y-6">

        <div className="flex justify-between items-center">
          <h1 className="text-xl font-semibold text-neutral-900">
            Categories
          </h1>

          <Button onClick={openCreate} leftIcon={<Plus size={15} />}>
            Tambah
          </Button>
        </div>

        <div className="divide-y divide-neutral-100 border border-neutral-200">

          {categories.length === 0 && (
            <p className="text-sm text-neutral-400 text-center py-10">
              Belum ada kategori.
            </p>
          )}

          {categories.map((category) => (
            <div
              key={category.id}
              className="flex items-center justify-between p-4 bg-white hover:bg-neutral-50 transition-colors"
            >

              <div className="flex items-center gap-3">

                <div className="w-10 h-10 bg-neutral-100 overflow-hidden flex items-center justify-center">
                  {category.img_url ? (
                    <img
                      src={category.img_url}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-xs text-neutral-400">IMG</span>
                  )}
                </div>

                <div>
                  <p className="text-sm font-medium text-neutral-800">
                    {category.name}
                  </p>

                  <p className="text-xs text-neutral-400 font-mono">
                    /{category.slug}
                  </p>

                  {category.desc && (
                    <p className="text-xs text-neutral-500 line-clamp-1">
                      {category.desc}
                    </p>
                  )}
                </div>

              </div>

              <div className="flex gap-2">

                <button
                  onClick={() => startEdit(category)}
                  className="w-8 h-8 flex items-center justify-center text-neutral-400 hover:text-purple-600"
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


      <CategoryForm
        open={isCreateOpen}
        onClose={closeCreate}
        onSubmit={submitCreate}
        processing={processing}
        title="Tambah Kategori"
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
        title="Edit Kategori"
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
        title="Hapus Kategori"
        message={
          deleteTarget
            ? `Kategori "${deleteTarget.name}" akan dihapus permanen.`
            : undefined
        }
      />

    </>
  )
}

CategoryPage.layout = (page: React.ReactNode) => (
  <AdminLayout>{page}</AdminLayout>
)