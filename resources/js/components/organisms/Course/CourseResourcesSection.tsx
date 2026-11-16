import { Download, ExternalLink, FileUp, FolderDown, Pencil, Plus, Sparkles, Trash2 } from 'lucide-react';
import Button from '@/components/atoms/Button';
import Modal from '@/components/atoms/Modal';
import ConfirmationDelete from '@/components/molecules/ConfirmationDelete';
import InputField from '@/components/molecules/InputField';
import SelectField from '@/components/molecules/SelectField';
import TextAreaField from '@/components/molecules/TextAreaField';
import { useCourseResources } from '@/hooks/useCourseResources';
import type { CourseResource } from '@/types';

interface CourseResourcesSectionProps {
    courseSlug: string;
    resources?: CourseResource[];
    routePrefix: 'admin' | 'instructor';
}

export default function CourseResourcesSection({ courseSlug, resources = [], routePrefix }: CourseResourcesSectionProps) {
    const crud = useCourseResources(courseSlug, resources, routePrefix);

    return (
        <>
            <div className="space-y-5 border border-slate-200/80 bg-white p-4 shadow-sm sm:p-8 dark:border-slate-700 dark:bg-[#1e1f24]">
                <div className="flex flex-col justify-between gap-4 border-b border-slate-100 pb-4 sm:flex-row sm:items-center dark:border-slate-700">
                    <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center bg-emerald-600 text-white">
                            <FolderDown size={20} />
                        </div>
                        <div className="min-w-0">
                            <h3 className="text-lg font-bold break-words text-slate-900 dark:text-white">Course Resources</h3>
                            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                                Files and links unlocked only after students complete every material ({resources.length} resources).
                            </p>
                            <p className="mt-1 text-[11px] text-slate-400 dark:text-slate-500">
                                File-type lesson materials (PDF, Word, PPT, Excel) are collected automatically.
                            </p>
                        </div>
                    </div>
                    <Button size="md" onClick={crud.openCreate} leftIcon={<Plus className="h-4 w-4" />} className="w-full !rounded-none sm:w-auto">
                        Add Resource
                    </Button>
                </div>

                {resources.length === 0 ? (
                    <div className="flex flex-col items-center border border-dashed border-slate-200 bg-slate-50/50 py-12 text-center dark:border-slate-700 dark:bg-[#1e1f24]">
                        <FolderDown className="mb-3 h-9 w-9 text-slate-300 dark:text-slate-600" />
                        <p className="text-sm font-bold text-slate-700 dark:text-slate-200">No resources yet</p>
                        <p className="mt-1 max-w-sm text-xs text-slate-400 dark:text-slate-500">
                            Add downloadable files or external links for students who finish the course. File-type lesson materials (PDF, Word, PPT,
                            Excel) appear here automatically.
                        </p>
                    </div>
                ) : (
                    <ul className="divide-y divide-slate-100 dark:divide-slate-700">
                        {resources.map((resource) => {
                            const isAutomatic = resource.source === 'material';

                            return (
                                <li
                                    key={`${resource.source ?? 'manual'}-${resource.id}`}
                                    className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between"
                                >
                                    <div className="min-w-0">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <p className="min-w-0 text-sm font-semibold break-words text-slate-900 dark:text-white">
                                                {resource.title}
                                            </p>
                                            {isAutomatic && (
                                                <span className="inline-flex items-center gap-1 bg-purple-100 px-2 py-0.5 text-[10px] font-bold tracking-wide text-purple-700 uppercase dark:bg-purple-950/40 dark:text-purple-300">
                                                    <Sparkles size={10} /> Auto
                                                </span>
                                            )}
                                            <span
                                                className={`px-2 py-0.5 text-[10px] font-bold tracking-wide uppercase ${
                                                    resource.status === 'published'
                                                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                                                        : 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'
                                                }`}
                                            >
                                                {resource.status}
                                            </span>
                                            <span className="flex items-center gap-1 text-[10px] font-medium text-slate-400 uppercase dark:text-slate-500">
                                                {resource.file_path ? <Download size={11} /> : <ExternalLink size={11} />}
                                                {resource.file_type ?? (resource.file_path ? 'File' : 'Link')}
                                            </span>
                                        </div>
                                        {resource.description && (
                                            <p className="mt-1 line-clamp-2 text-xs text-slate-500 dark:text-slate-400">{resource.description}</p>
                                        )}
                                    </div>

                                    <div className="flex shrink-0 items-center gap-1">
                                        {resource.url && (
                                            <a href={resource.url} target="_blank" rel="noreferrer" title="Open resource">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    leftIcon={<ExternalLink size={15} />}
                                                    aria-label="Open resource"
                                                    className="!h-8 !w-8 !rounded-none !p-0"
                                                />
                                            </a>
                                        )}
                                        {isAutomatic ? (
                                            <span className="px-2 text-[10px] font-medium tracking-wide text-purple-500 uppercase dark:text-purple-400">
                                                From lesson
                                            </span>
                                        ) : (
                                            <>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => crud.openEdit(resource)}
                                                    leftIcon={<Pencil size={15} />}
                                                    title="Edit resource"
                                                    aria-label="Edit resource"
                                                    className="!h-8 !w-8 !rounded-none !p-0"
                                                />
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => crud.setDeleteTarget(resource)}
                                                    leftIcon={<Trash2 size={15} />}
                                                    title="Delete resource"
                                                    aria-label="Delete resource"
                                                    className="!h-8 !w-8 !rounded-none !p-0 !text-rose-600 hover:!bg-rose-50 dark:!text-rose-400 dark:hover:!bg-rose-950/30"
                                                />
                                            </>
                                        )}
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </div>

            <Modal
                open={crud.open}
                onClose={() => crud.setOpen(false)}
                title={crud.editing ? 'Edit Resource' : 'Add Resource'}
                footer={
                    <>
                        <Button variant="outline" size="sm" onClick={() => crud.setOpen(false)}>
                            Cancel
                        </Button>
                        <Button size="sm" onClick={crud.editing ? crud.update : crud.create}>
                            {crud.editing ? 'Update' : 'Create'}
                        </Button>
                    </>
                }
            >
                <div className="space-y-4">
                    <InputField
                        label="Title"
                        value={crud.title}
                        onChange={(e) => crud.setTitle(e.target.value)}
                        error={crud.errors.title as string | undefined}
                    />

                    <TextAreaField
                        label="Description (optional)"
                        rows={3}
                        value={crud.description}
                        onChange={(e) => crud.setDescription(e.target.value)}
                        error={crud.errors.description as string | undefined}
                    />

                    <div className="space-y-1">
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Upload file (max 20MB)</label>
                        <label className="flex cursor-pointer items-center gap-2 border border-dashed border-slate-300 px-3 py-2 text-sm text-slate-600 transition-colors hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800">
                            <FileUp size={16} />
                            <span className="truncate">{crud.file?.name ?? (crud.editing?.file_path ? 'Replace current file' : 'Choose file')}</span>
                            <input
                                key={crud.editing?.id ?? 'new'}
                                type="file"
                                className="hidden"
                                accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.csv,.txt,.zip,.jpg,.jpeg,.png,.webp"
                                onChange={(e) => crud.setFile(e.target.files?.[0] ?? null)}
                            />
                        </label>
                        {crud.errors.file && <p className="text-xs text-red-500 dark:text-red-400">{crud.errors.file as string}</p>}
                    </div>

                    <InputField
                        label="Or external URL"
                        type="url"
                        placeholder="https://..."
                        value={crud.externalUrl}
                        onChange={(e) => crud.setExternalUrl(e.target.value)}
                        error={crud.errors.external_url as string | undefined}
                    />

                    <SelectField
                        label="Status"
                        value={crud.status}
                        onChange={(e) => crud.setStatus(e.target.value as 'draft' | 'published')}
                        options={[
                            { label: 'Draft', value: 'draft' },
                            { label: 'Published', value: 'published' },
                        ]}
                    />

                    <p className="text-xs text-slate-400 dark:text-slate-500">
                        Resources stay hidden from students until every material in this course is completed.
                    </p>
                </div>
            </Modal>

            <ConfirmationDelete
                open={crud.deleteTarget !== null}
                onClose={() => crud.setDeleteTarget(null)}
                onConfirm={crud.destroy}
                message={`Resource "${crud.deleteTarget?.title ?? ''}" will be deleted permanently.`}
            />
        </>
    );
}
