import { useState } from "react"
import { Head } from "@inertiajs/react"
import { Plus, Pencil, Trash2, Tag as TagIcon, Search, BookOpen } from "lucide-react"

import { Tag } from "@/types"
import { useTag } from "@/hooks/useTag"
import AdminLayout from "@/components/templates/AdminLayout"
import Button from "@/components/atoms/Button"
import PageHeader from "@/components/molecules/PageHeader"
import ConfirmationDelete from "@/components/molecules/ConfirmationDelete"
import TagForm from "@/components/organism/TagForm"

export default function TagPage({ tags }: { tags: Tag[] }) {
  const [search, setSearch] = useState("")

  const {
    data,
    setData,
    errors,
    processing,
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
  } = useTag()

  const filteredTags = (tags ?? []).filter((tag) =>
    tag.name.toLowerCase().includes(search.toLowerCase()) ||
    tag.slug.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <>
      <Head title="Tags Management - Admin" />

      <div className="max-w-8xl mx-auto space-y-8">
        <PageHeader
          breadcrumbs={[{ label: "Admin" }, { label: "Tags" }]}
          title="Tag Management"
          description="Manage course tags used for categorization and content recommendations"
          actions={
            <Button
              onClick={openCreate}
              leftIcon={<Plus size={15} />}
              className="!rounded-none"
            >
              Add Tag
            </Button>
          }
        />

        {/* Content Card */}
        <div className="bg-white border border-slate-200/80 shadow-sm p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <TagIcon className="w-5 h-5 text-purple-600" />
                All Tags ({tags?.length ?? 0})
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Manage tags to power recommendations and enhance course discovery.
              </p>
            </div>

            {/* Search */}
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search tags..."
                className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-none focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all text-slate-800 placeholder:text-slate-400"
              />
            </div>
          </div>

          <div className="divide-y divide-neutral-100 border border-neutral-200">
            {filteredTags.length === 0 && (
              <div className="text-center py-12 space-y-2">
                <TagIcon className="w-8 h-8 text-neutral-300 mx-auto" />
                <p className="text-sm text-neutral-500 font-medium">
                  {search ? `No tags found matching "${search}"` : "No tags yet."}
                </p>
                {search && (
                  <button
                    onClick={() => setSearch("")}
                    className="text-xs text-purple-600 hover:underline"
                  >
                    Clear search filter
                  </button>
                )}
              </div>
            )}

            {filteredTags.map((tag) => (
              <div
                key={tag.id}
                className="flex items-center justify-between p-4 bg-white hover:bg-neutral-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-50 border border-purple-100/80 flex items-center justify-center text-purple-600">
                    <TagIcon className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-neutral-900">
                        {tag.name}
                      </p>
                      {typeof tag.courses_count === "number" && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 bg-slate-100 text-slate-600 rounded-none border border-slate-200">
                          <BookOpen className="w-3 h-3 text-slate-400" />
                          {tag.courses_count} {tag.courses_count === 1 ? "course" : "courses"}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-neutral-400 font-mono mt-0.5">
                      #{tag.slug}
                    </p>
                  </div>
                </div>

                <div className="flex gap-1">
                  <button
                    onClick={() => startEdit(tag)}
                    className="w-8 h-8 flex items-center justify-center text-neutral-400 hover:text-purple-600 hover:bg-purple-50 transition-colors"
                    title="Edit tag"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={() => openDeleteModal(tag)}
                    className="w-8 h-8 flex items-center justify-center text-neutral-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                    title="Delete tag"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <TagForm
        open={isCreateOpen}
        onClose={closeCreate}
        onSubmit={submitCreate}
        processing={processing}
        errors={errors}
        title="Add New Tag"
        data={data}
        setData={setData}
      />

      <TagForm
        open={isEditOpen}
        onClose={closeEdit}
        onSubmit={() => submitUpdate(editingId!)}
        processing={processing}
        errors={errors}
        title="Edit Tag"
        data={data}
        setData={setData}
      />

      <ConfirmationDelete
        open={!!deleteTarget}
        onClose={closeDeleteModal}
        onConfirm={confirmDelete}
        isLoading={processing}
        title="Delete Tag"
        message={
          deleteTarget
            ? `Tag "${deleteTarget.name}" will be permanently removed from all associated courses and the recommendation catalog.`
            : undefined
        }
      />
    </>
  )
}

TagPage.layout = (page: React.ReactNode) => (
  <AdminLayout>{page}</AdminLayout>
)
