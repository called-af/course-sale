import { Head } from '@inertiajs/react';
import { Plus, Pencil, Trash2, Tag as TagIcon, Search, BookOpen } from 'lucide-react';
import { useState } from 'react';

import Button from '@/components/atoms/Button';
import ConfirmationDelete from '@/components/molecules/ConfirmationDelete';
import PageHeader from '@/components/molecules/PageHeader';
import TagForm from '@/components/organisms/TagForm';
import AdminLayout from '@/components/templates/AdminLayout';
import { useTag } from '@/hooks/useTag';
import type { Tag } from '@/types';

export default function TagPage({ tags }: { tags: Tag[] }) {
    const [search, setSearch] = useState('');

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
    } = useTag();

    const filteredTags = (tags ?? []).filter(
        (tag) => tag.name.toLowerCase().includes(search.toLowerCase()) || tag.slug.toLowerCase().includes(search.toLowerCase()),
    );

    return (
        <>
            <Head title="Tags Management - Admin" />

            <div className="max-w-8xl mx-auto space-y-8">
                <PageHeader
                    breadcrumbs={[{ label: 'Admin' }, { label: 'Tags' }]}
                    title="Tag Management"
                    description="Manage course tags used for categorization and content recommendations"
                    actions={
                        <Button onClick={openCreate} leftIcon={<Plus size={15} />} className="!rounded-none">
                            Add Tag
                        </Button>
                    }
                />

                {/* Content Card */}
                <div className="space-y-6 border border-slate-200/80 bg-white p-6 shadow-sm sm:p-8 dark:border-slate-700 dark:bg-[#1e1f24]">
                    <div className="flex flex-col justify-between gap-4 border-b border-slate-100 pb-4 sm:flex-row sm:items-center dark:border-slate-700">
                        <div>
                            <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900 dark:text-white">
                                <TagIcon className="h-5 w-5 text-purple-600" />
                                All Tags ({tags?.length ?? 0})
                            </h2>
                            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                                Manage tags to power recommendations and enhance course discovery.
                            </p>
                        </div>

                        {/* Search */}
                        <div className="relative w-full sm:w-72">
                            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search tags..."
                                className="w-full rounded-none border border-slate-200 bg-slate-50 py-2 pr-4 pl-9 text-sm text-slate-800 transition-all placeholder:text-slate-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 focus:outline-none dark:border-slate-700 dark:bg-[#1e1f24] dark:text-slate-200 dark:placeholder:text-slate-500 dark:focus:border-purple-500"
                            />
                        </div>
                    </div>

                    <div className="divide-y divide-neutral-100 border border-neutral-200 dark:divide-slate-700 dark:border-slate-700">
                        {filteredTags.length === 0 && (
                            <div className="space-y-2 py-12 text-center">
                                <TagIcon className="mx-auto h-8 w-8 text-neutral-300 dark:text-slate-600" />
                                <p className="text-sm font-medium text-neutral-500 dark:text-slate-400">
                                    {search ? `No tags found matching "${search}"` : 'No tags yet.'}
                                </p>
                                {search && (
                                    <button onClick={() => setSearch('')} className="text-xs text-purple-600 hover:underline dark:text-purple-400">
                                        Clear search filter
                                    </button>
                                )}
                            </div>
                        )}

                        {filteredTags.map((tag) => (
                            <div
                                key={tag.id}
                                className="flex items-center justify-between bg-white p-4 transition-colors hover:bg-neutral-50 dark:bg-[#1e1f24] dark:hover:bg-slate-700"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="flex h-10 w-10 items-center justify-center border border-purple-100/80 bg-purple-50 text-purple-600 dark:border-purple-900/50 dark:bg-purple-950/40 dark:text-purple-400">
                                        <TagIcon className="h-4 w-4" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <p className="text-sm font-semibold text-neutral-900 dark:text-slate-100">{tag.name}</p>
                                            {typeof tag.courses_count === 'number' && (
                                                <span className="inline-flex items-center gap-1 rounded-none border border-slate-200 bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-300">
                                                    <BookOpen className="h-3 w-3 text-slate-400 dark:text-slate-500" />
                                                    {tag.courses_count} {tag.courses_count === 1 ? 'course' : 'courses'}
                                                </span>
                                            )}
                                        </div>
                                        <p className="mt-0.5 font-mono text-xs text-neutral-400 dark:text-slate-500">#{tag.slug}</p>
                                    </div>
                                </div>

                                <div className="flex gap-1">
                                    <button
                                        onClick={() => startEdit(tag)}
                                        className="flex h-8 w-8 items-center justify-center text-neutral-400 transition-colors hover:bg-purple-50 hover:text-purple-600 dark:text-slate-500 dark:hover:bg-purple-950/40 dark:hover:text-purple-400"
                                        title="Edit tag"
                                    >
                                        <Pencil size={14} />
                                    </button>
                                    <button
                                        onClick={() => openDeleteModal(tag)}
                                        className="flex h-8 w-8 items-center justify-center text-neutral-400 transition-colors hover:bg-red-50 hover:text-red-600 dark:text-slate-500 dark:hover:bg-red-950/30 dark:hover:text-red-400"
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
    );
}

TagPage.layout = (page: React.ReactNode) => <AdminLayout>{page}</AdminLayout>;
