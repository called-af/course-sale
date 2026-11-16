import { Head } from '@inertiajs/react';
import { Plus, Pencil, Trash2 } from 'lucide-react';

import Button from '@/components/atoms/Button';
import ConfirmationDelete from '@/components/molecules/ConfirmationDelete';
import PageHeader from '@/components/molecules/PageHeader';
import CategoryForm from '@/components/organisms/CategoryForm';
import AdminLayout from '@/components/templates/AdminLayout';
import { useCategory } from '@/hooks/useCategory';

interface Category {
    id: number;
    name: string;
    slug: string;
    desc?: string;
    img_url?: string;
}

export default function CategoryPage({ categories }: { categories: Category[] }) {
    const {
        data,
        setData,
        processing,
        preview,
        handleImgChange,
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
    } = useCategory();

    return (
        <>
            <Head title="Category" />

            <div className="max-w-8xl mx-auto space-y-8">
                <PageHeader
                    breadcrumbs={[{ label: 'Admin' }, { label: 'Categories' }]}
                    title="Category Management"
                    description="Manage course categories shown on the platform"
                    actions={
                        <Button onClick={openCreate} leftIcon={<Plus size={15} />} className="w-full justify-center !rounded-none sm:w-auto">
                            Add Category
                        </Button>
                    }
                />

                {/* Content Card */}
                <div className="space-y-4 border border-slate-200/80 bg-white p-4 shadow-sm sm:p-8 dark:border-slate-700 dark:bg-[#1e1f24]">
                    <div className="border-b border-slate-100 pb-4 dark:border-slate-700">
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white">All Categories ({categories.length})</h2>
                        <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">Click edit or delete to manage each category.</p>
                    </div>

                    <div className="divide-y divide-neutral-100 border border-neutral-200 dark:divide-slate-700 dark:border-slate-700">
                        {categories.length === 0 && (
                            <p className="py-10 text-center text-sm text-neutral-400 dark:text-slate-500">No categories yet.</p>
                        )}

                        {categories.map((category) => (
                            <div
                                key={category.id}
                                className="flex items-center justify-between gap-3 bg-white p-4 transition-colors hover:bg-neutral-50 dark:bg-[#1e1f24] dark:hover:bg-slate-700"
                            >
                                <div className="flex min-w-0 items-center gap-3">
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden bg-neutral-100 dark:bg-slate-700">
                                        {category.img_url ? (
                                            <img src={category.img_url} className="h-full w-full object-cover" />
                                        ) : (
                                            <span className="text-xs text-neutral-400 dark:text-slate-500">IMG</span>
                                        )}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="truncate text-sm font-medium text-neutral-800 dark:text-slate-100">{category.name}</p>
                                        <p className="truncate font-mono text-xs text-neutral-400 dark:text-slate-500">/{category.slug}</p>
                                        {category.desc && (
                                            <p className="line-clamp-1 text-xs text-neutral-500 dark:text-slate-400">{category.desc}</p>
                                        )}
                                    </div>
                                </div>

                                <div className="flex shrink-0 gap-2">
                                    <button
                                        onClick={() => startEdit(category)}
                                        className="flex h-8 w-8 items-center justify-center text-neutral-400 hover:text-purple-600 dark:hover:text-purple-400"
                                    >
                                        <Pencil size={14} />
                                    </button>
                                    <button
                                        onClick={() => openDeleteModal(category)}
                                        className="flex h-8 w-8 items-center justify-center text-neutral-400 hover:text-red-500"
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
                message={deleteTarget ? `Category "${deleteTarget.name}" will be permanently deleted.` : undefined}
            />
        </>
    );
}

CategoryPage.layout = (page: React.ReactNode) => <AdminLayout>{page}</AdminLayout>;
