import { useCategory } from "@/hooks/useCategory"
import AdminLayout from "@/components/templates/AdminLayout"
import InputField from "@/components/molecules/InputField"
import Button from "@/components/atoms/Button"
import ConfirmationDelete from "@/components/molecules/ConfirmationDelete"
import ChooseFile from "@/components/molecules/ChooseFile"
import { Head } from "@inertiajs/react"
import { Pencil, Trash2, X, Check, Plus } from "lucide-react"

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
    editingId, deleteTarget, preview,
    handleImgChange, startEdit, cancelEdit,
    submitCreate, submitUpdate,
    openDeleteModal, closeDeleteModal, confirmDelete,
  } = useCategory()

  return (
    <>
      <Head title="Category" />

      <div className="max-w-7xl mx-auto space-y-6">

        <h1 className="text-xl font-semibold text-neutral-900">
          Categories
        </h1>

        {/* CREATE CATEGORY */}
        <div className="p-4 bg-neutral-50 border border-neutral-200 space-y-3">

          <div className="flex gap-3 items-start">

            <div className="w-20 shrink-0">
              <ChooseFile
                label="Logo"
                aspect="square"
                value={preview}
                onChange={(file) => file && handleImgChange(file)}
              />
            </div>

            <div className="flex-1 flex flex-col gap-2">
              <InputField
                label="Nama"
                value={data.name}
                placeholder="Nama kategori"
                onChange={(e) => setData("name", e.target.value)}
              />

              <InputField
                label="Deskripsi"
                value={data.desc}
                placeholder="Deskripsi singkat"
                onChange={(e) => setData("desc", e.target.value)}
              />
            </div>

          </div>

          <div className="flex justify-end">
            <Button
              onClick={submitCreate}
              disabled={processing || !data.name.trim()}
              leftIcon={<Plus size={15} />}
            >
              Tambah
            </Button>
          </div>

        </div>

        {/* CATEGORY LIST */}
        <div className="divide-y divide-neutral-100 border border-neutral-200">

          {categories.length === 0 && (
            <p className="text-sm text-neutral-400 text-center py-10">
              Belum ada kategori.
            </p>
          )}

          {categories.map((category) => {

            const isEditing = editingId === category.id

            const hasChanges =
              data.name !== category.name ||
              data.desc !== (category.desc ?? "") ||
              data.img !== null

            return (

              <div
                key={category.id}
                className="flex items-start gap-3 p-4 bg-white hover:bg-neutral-50 transition-colors"
              >

                {/* IMAGE */}
                {isEditing ? (

                  <div className="w-16 shrink-0">
                    <ChooseFile
                      label="Edit"
                      aspect="square"
                      value={preview ?? category.img_url}
                      onChange={(file) => file && handleImgChange(file)}
                    />
                  </div>

                ) : (

                  <div className="w-10 h-10 shrink-0 bg-neutral-100 overflow-hidden flex items-center justify-center">
                    {category.img_url
                      ? (
                        <img
                          src={category.img_url}
                          className="w-full h-full object-cover"
                        />
                      )
                      : (
                        <span className="text-xs text-neutral-400">
                          IMG
                        </span>
                      )
                    }
                  </div>

                )}

                {/* TEXT */}
                <div className="flex-1 min-w-0">

                  {isEditing ? (

                    <div className="flex flex-col gap-2">

                      <InputField
                        label=""
                        value={data.name}
                        autoFocus
                        onChange={(e) => setData("name", e.target.value)}
                      />

                      <InputField
                        label=""
                        value={data.desc}
                        placeholder="Deskripsi..."
                        onChange={(e) => setData("desc", e.target.value)}
                      />

                    </div>

                  ) : (

                    <div>

                      <p className="text-sm font-medium text-neutral-800">
                        {category.name}
                      </p>

                      <p className="text-xs text-neutral-400 font-mono">
                        /{category.slug}
                      </p>

                      {category.desc && (
                        <p className="text-xs text-neutral-500 mt-0.5 line-clamp-1">
                          {category.desc}
                        </p>
                      )}

                    </div>

                  )}

                </div>

                {/* ACTION */}
                <div className="flex items-center gap-1 shrink-0">

                  {!isEditing ? (
                    <>
                      <button
                        onClick={() => startEdit(category)}
                        className="w-8 h-8 flex items-center justify-center text-neutral-400 hover:text-purple-600 transition-colors"
                      >
                        <Pencil size={14} />
                      </button>

                      <button
                        onClick={() => openDeleteModal(category)}
                        className="w-8 h-8 flex items-center justify-center text-neutral-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() =>
                          submitUpdate(category.id, category.name)
                        }
                        disabled={!hasChanges || processing}
                        className="w-8 h-8 flex items-center justify-center text-green-600 hover:bg-green-50 transition-colors disabled:opacity-30"
                      >
                        <Check size={14} />
                      </button>

                      <button
                        onClick={cancelEdit}
                        className="w-8 h-8 flex items-center justify-center text-neutral-400 hover:text-neutral-700 transition-colors"
                      >
                        <X size={14} />
                      </button>
                    </>
                  )}

                </div>

              </div>

            )

          })}

        </div>

      </div>

      {/* DELETE MODAL */}
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