import {
    ArrowUp,
    ArrowDown,
    ChevronRight,
    Layers,
    Plus,
    Pencil,
    Trash2,
    X,
    Save,
    FileText,
    Video,
    HelpCircle,
    File,
    Presentation,
} from 'lucide-react';
import { useState } from 'react';
import type { SetStateAction } from 'react';

import Button from '@/components/atoms/Button';
import Modal from '@/components/atoms/Modal';
import ConfirmationDelete from '@/components/molecules/ConfirmationDelete';
import InputField from '@/components/molecules/InputField';
import SelectField from '@/components/molecules/SelectField';
import TextAreaField from '@/components/molecules/TextAreaField';
import { useMaterials } from '@/hooks/useMaterial';
import { useMaterialContents } from '@/hooks/useMaterialContents';
import { useModules } from '@/hooks/useModules';
import type { Material, MaterialContent } from '@/types';
import type { Module } from '@/types/modules';

/* Content type config */
const TYPE_META: Record<string, { label: string; icon: typeof Video; cls: string }> = {
    video: { label: 'Video', icon: Video, cls: 'text-violet-500' },
    text: { label: 'Text', icon: FileText, cls: 'text-blue-500' },
    quiz: { label: 'Quiz', icon: HelpCircle, cls: 'text-amber-500' },
    file: { label: 'File', icon: File, cls: 'text-neutral-400' },
    ppt: { label: 'PPT', icon: Presentation, cls: 'text-rose-500' },
};

/*
   TreeNode — Renders the connecting lines for each item.
   Creates a continuous vertical pipe │ that connects siblings,
   with a horizontal branch at each item. */
function TreeNode({ isLast, children }: { isLast: boolean; children: React.ReactNode }) {
    return (
        <div className="relative pl-6">
            {/* Vertical line: full height for non-last, half for last */}
            <div className={`absolute top-0 left-[7px] border-l-2 border-neutral-200 dark:border-slate-700 ${isLast ? 'h-[22px]' : 'bottom-0'}`} />
            {/* Horizontal branch */}
            <div className="absolute top-[21px] left-[7px] w-[17px] border-t-2 border-neutral-200 dark:border-slate-700" />
            {children}
        </div>
    );
}

/*
   LEVEL 3 — CONTENTS */
interface ContentsSectionProps {
    courseSlug: string;
    moduleId: number;
    materialId: number;
    contents: MaterialContent[];
    editId?: number | null;
    routePrefix: 'admin' | 'instructor';
}

function ContentsSection({ courseSlug, moduleId, materialId, contents, editId, routePrefix }: ContentsSectionProps) {
    const crud = useMaterialContents(courseSlug, moduleId, materialId, contents, routePrefix, editId);
    const [deleteId, setDeleteId] = useState<number | null>(null);
    const [openDelete, setOpenDelete] = useState(false);

    function handleConfirmDelete() {
        if (deleteId) {
            crud.destroy(deleteId);
            setOpenDelete(false);
            setDeleteId(null);
        }
    }

    return (
        <div>
            {/* Inline Edit */}
            {crud.editing && (
                <div className="m-3 space-y-3 border border-violet-200/60 bg-violet-50/20 p-4">
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] font-semibold tracking-wider text-violet-500 uppercase">Edit Content</span>
                        <button
                            onClick={() => history.back()}
                            className="p-1 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-600"
                        >
                            <X className="h-3.5 w-3.5" />
                        </button>
                    </div>
                    <InputField label="Title" value={crud.title} onChange={(e) => crud.setTitle(e.target.value)} />
                    <div className="space-y-1">
                        <label className="text-xs font-medium text-neutral-500">Type</label>
                        <select
                            value={crud.type}
                            onChange={(e) => {
                                crud.setType(e.target.value as MaterialContent['type']);
                                crud.setSourceMode('url');
                            }}
                            className="w-full border border-neutral-200 bg-white px-3 py-2 text-sm text-slate-800 transition focus:border-violet-300 focus:ring-2 focus:ring-violet-500/20 focus:outline-none dark:border-slate-600 dark:bg-[#1e1f24] dark:text-slate-200 dark:focus:border-violet-500"
                        >
                            {Object.entries(TYPE_META).map(([val, { label }]) => (
                                <option key={val} value={val}>
                                    {label}
                                </option>
                            ))}
                        </select>
                    </div>
                    {(crud.type === 'video' || crud.type === 'file' || crud.type === 'ppt') && (
                        <InputField
                            label="Content URL"
                            value={crud.contentUrl}
                            onChange={(e) => {
                                crud.setSourceMode('url');
                                crud.setContentUrl(e.target.value);
                            }}
                        />
                    )}
                    {crud.type === 'text' && (
                        <TextAreaField
                            label="Content Text"
                            value={typeof crud.contentText === 'string' ? crud.contentText : ''}
                            onChange={(e: { target: { value: SetStateAction<string> } }) => crud.setContentText(e.target.value)}
                        />
                    )}
                    {crud.type === 'video' && (
                        <InputField
                            label="Duration (seconds)"
                            type="number"
                            value={crud.duration}
                            onChange={(e) => crud.setDuration(Number(e.target.value))}
                        />
                    )}
                    <div className="flex gap-2">
                        <Button size="sm" onClick={crud.update} leftIcon={<Save className="h-3 w-3" />}>
                            Save
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => history.back()}>
                            Cancel
                        </Button>
                    </div>
                </div>
            )}

            {/* Contents header */}
            <div className="flex items-center justify-between pt-2 pr-2 pb-1">
                <div className="flex items-center gap-2">
                    <span className="text-[10px] font-semibold tracking-wider text-neutral-400 uppercase dark:text-slate-500">Contents</span>
                    <span className="bg-neutral-100 px-1.5 py-px text-[10px] font-medium text-neutral-300 dark:bg-slate-700 dark:text-slate-500">
                        {crud.sortedContents.length}
                    </span>
                </div>
                <button
                    onClick={crud.openCreate}
                    className="flex items-center gap-1 text-sm font-medium text-purple-500 transition-colors hover:text-purple-700"
                >
                    <Plus className="h-4 w-4" /> Add
                </button>
            </div>

            {/* Content rows */}
            {crud.sortedContents.length === 0 ? (
                <TreeNode isLast>
                    <div className="py-2">
                        <span className="text-xs text-neutral-300 italic">No content yet</span>
                    </div>
                </TreeNode>
            ) : (
                crud.sortedContents.map((item, i) => {
                    const isFirst = i === 0;
                    const isLast = i === crud.sortedContents.length - 1;
                    const meta = TYPE_META[item.type] ?? TYPE_META.file;
                    const Icon = meta.icon;

                    return (
                        <TreeNode key={item.id} isLast={isLast}>
                            <div className="group flex items-center gap-2 py-1.5 pr-2 transition-colors hover:bg-slate-100/80 dark:hover:bg-slate-700/60">
                                <Icon className={`h-4 w-4 shrink-0 ${meta.cls}`} />
                                <span className="flex-1 truncate text-[13px] text-neutral-700 dark:text-slate-200">{item.title}</span>
                                <span className="hidden shrink-0 text-[9px] font-medium tracking-wide text-neutral-400 uppercase sm:inline">
                                    {meta.label}
                                </span>
                                <StatusDot status={item.status} />
                                <div className="flex items-center gap-px opacity-0 transition-opacity group-hover:opacity-100 max-sm:opacity-100">
                                    <IconBtn onClick={() => crud.moveContent(item, 'up')} disabled={isFirst} title="Move up">
                                        <ArrowUp className="h-3 w-3" />
                                    </IconBtn>
                                    <IconBtn onClick={() => crud.moveContent(item, 'down')} disabled={isLast} title="Move down">
                                        <ArrowDown className="h-3 w-3" />
                                    </IconBtn>
                                    <IconBtn onClick={() => crud.editPage(item.id)} title="Edit">
                                        <Pencil className="h-3 w-3" />
                                    </IconBtn>
                                    <IconBtn
                                        onClick={() => {
                                            setDeleteId(item.id);
                                            setOpenDelete(true);
                                        }}
                                        title="Delete"
                                        danger
                                    >
                                        <Trash2 className="h-3 w-3" />
                                    </IconBtn>
                                </div>
                            </div>
                        </TreeNode>
                    );
                })
            )}

            <Modal open={crud.open} onClose={() => crud.setOpen(false)} title="Add Content">
                <div className="space-y-4">
                    <InputField label="Title" value={crud.title} onChange={(e) => crud.setTitle(e.target.value)} />
                    <SelectField
                        label="Status"
                        value={crud.status}
                        onChange={(e) => crud.setStatus(e.target.value as 'draft' | 'published')}
                        options={[
                            { label: 'Draft', value: 'draft' },
                            { label: 'Published', value: 'published' },
                        ]}
                    />
                    <Button onClick={crud.create} widthFull>
                        Create
                    </Button>
                </div>
            </Modal>

            <ConfirmationDelete
                open={openDelete}
                onClose={() => {
                    setOpenDelete(false);
                    setDeleteId(null);
                }}
                onConfirm={handleConfirmDelete}
            />
        </div>
    );
}

/*
   LEVEL 2 — MATERIALS */
interface MaterialsSectionProps {
    courseSlug: string;
    moduleId: number;
    materials: Material[];
    routePrefix: 'admin' | 'instructor';
}

function MaterialsSection({ courseSlug, moduleId, materials, routePrefix }: MaterialsSectionProps) {
    const crud = useMaterials(courseSlug, moduleId, materials, routePrefix);
    const [expanded, setExpanded] = useState<number | null>(null);

    function toggle(id: number) {
        setExpanded((prev) => (prev === id ? null : id));
    }

    return (
        <>
            {/* Materials header */}
            <div className="flex items-center justify-between pt-2 pr-2 pb-1">
                <div className="flex items-center gap-2">
                    <span className="text-[10px] font-semibold tracking-wider text-neutral-400 uppercase dark:text-slate-500">Materials</span>
                    <span className="bg-neutral-100 px-1.5 py-px text-[10px] font-medium text-neutral-300 dark:bg-slate-700 dark:text-slate-500">
                        {crud.sortedMaterials.length}
                    </span>
                </div>
                <button
                    onClick={crud.openCreate}
                    className="flex items-center gap-1 text-sm font-medium text-purple-500 transition-colors hover:text-purple-700"
                >
                    <Plus className="h-4 w-4" /> Add
                </button>
            </div>

            {/* Material rows */}
            {crud.sortedMaterials.length === 0 ? (
                <TreeNode isLast>
                    <div className="py-2">
                        <span className="text-xs text-neutral-300 italic">No materials yet</span>
                    </div>
                </TreeNode>
            ) : (
                crud.sortedMaterials.map((material, i) => {
                    const isFirst = i === 0;
                    const isLast = i === crud.sortedMaterials.length - 1;
                    const isOpen = expanded === material.id;

                    return (
                        <TreeNode key={material.id} isLast={isLast}>
                            {/* Material row */}
                            <div
                                onClick={() => toggle(material.id)}
                                className={`group flex cursor-pointer items-center gap-2 py-2 pr-2 transition-colors ${
                                    isOpen ? 'bg-blue-50/40 dark:bg-blue-950/20' : 'hover:bg-neutral-50 dark:hover:bg-slate-700/50'
                                }`}
                            >
                                <div className={`shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-90' : ''}`}>
                                    <ChevronRight className={`h-3.5 w-3.5 ${isOpen ? 'text-blue-500' : 'text-neutral-300'}`} />
                                </div>
                                <span className="flex-1 truncate text-sm font-medium text-neutral-700 dark:text-slate-200">{material.title}</span>
                                <StatusDot status={material.status} />
                                <div
                                    className="flex items-center gap-px opacity-0 transition-opacity group-hover:opacity-100 max-sm:opacity-100"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <IconBtn onClick={() => crud.moveMaterial(material, 'up')} disabled={isFirst} title="Up">
                                        <ArrowUp className="h-3 w-3" />
                                    </IconBtn>
                                    <IconBtn onClick={() => crud.moveMaterial(material, 'down')} disabled={isLast} title="Down">
                                        <ArrowDown className="h-3 w-3" />
                                    </IconBtn>
                                    <IconBtn onClick={() => crud.openEdit(material)} title="Edit">
                                        <Pencil className="h-3 w-3" />
                                    </IconBtn>
                                    <IconBtn onClick={() => crud.openDelete(material)} title="Delete" danger>
                                        <Trash2 className="h-3 w-3" />
                                    </IconBtn>
                                </div>
                            </div>

                            {/* Contents nested */}
                            {isOpen && (
                                <div className="pb-1">
                                    <ContentsSection
                                        courseSlug={courseSlug}
                                        moduleId={moduleId}
                                        materialId={material.id}
                                        contents={material.contents ?? []}
                                        routePrefix={routePrefix}
                                    />
                                </div>
                            )}
                        </TreeNode>
                    );
                })
            )}

            <Modal open={crud.open} onClose={() => crud.setOpen(false)} title={crud.editing ? 'Edit Material' : 'Add Material'}>
                <div className="space-y-4">
                    <InputField label="Title" value={crud.title} onChange={(e) => crud.setTitle(e.target.value)} />
                    {crud.editing && (
                        <TextAreaField
                            label="Description"
                            value={crud.description}
                            onChange={(e: { target: { value: SetStateAction<string> } }) => crud.setDescription(e.target.value)}
                        />
                    )}
                    <SelectField
                        label="Status"
                        value={crud.status}
                        onChange={(e) => crud.setStatus(e.target.value as 'draft' | 'published')}
                        options={[
                            { label: 'Draft', value: 'draft' },
                            { label: 'Published', value: 'published' },
                        ]}
                    />
                    <Button onClick={crud.submit} widthFull>
                        {crud.editing ? 'Update' : 'Create'}
                    </Button>
                </div>
            </Modal>

            <ConfirmationDelete
                open={crud.deleteOpen}
                onClose={() => crud.setDeleteOpen(false)}
                onConfirm={crud.confirmDelete}
                isLoading={crud.loadingDelete}
                title="Delete Material"
                message={`Material "${crud.selected?.title}" will be deleted.`}
            />
        </>
    );
}

/*
   LEVEL 1 — MODULES  ← default export */
interface CourseStructureProps {
    course: { slug: string };
    modules: Module[];
    routePrefix: 'admin' | 'instructor';
}

export default function CourseStructure({ course, modules, routePrefix }: CourseStructureProps) {
    const crud = useModules(course.slug, modules, routePrefix);

    return (
        <>
            <div className="space-y-6 overflow-hidden border border-slate-200/80 bg-white p-6 shadow-sm sm:p-8 dark:border-slate-700 dark:bg-[#1e1f24]">
                {/* Header */}
                <div className="flex flex-col justify-between gap-4 border-b border-slate-100 pb-4 sm:flex-row sm:items-center dark:border-slate-700">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center bg-purple-700 shadow-xs">
                            <Layers className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Structure &amp; Syllabus Course</h3>
                            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                                Manage modules, materials, and learning content ({crud.sortedModules.length} Modules)
                            </p>
                        </div>
                    </div>
                    <Button size="md" onClick={crud.openCreateModal} leftIcon={<Plus className="h-4 w-4" />} className="!rounded-none">
                        Add New Module
                    </Button>
                </div>

                {/* Modules */}
                {crud.sortedModules.length === 0 ? (
                    <div className="flex flex-col items-center border border-dashed border-slate-200 bg-slate-50/50 py-16 text-center dark:border-slate-700 dark:bg-[#1e1f24]">
                        <div className="mb-3 flex h-12 w-12 items-center justify-center border border-slate-200 bg-white shadow-xs dark:border-slate-600 dark:bg-slate-700">
                            <Layers className="h-6 w-6 text-purple-500" />
                        </div>
                        <p className="text-sm font-bold text-slate-700 dark:text-slate-200">No Modules Yet</p>
                        <p className="mt-1 max-w-sm text-xs text-slate-400 dark:text-slate-500">
                            Add your first module to start building your course curriculum.
                        </p>
                    </div>
                ) : (
                    <div className="p-4">
                        {crud.sortedModules.map((module, index) => {
                            const isFirst = index === 0;
                            const isLast = index === crud.sortedModules.length - 1;
                            const isOpen = crud.expandedModule === module.id;

                            return (
                                <TreeNode key={module.id} isLast={isLast}>
                                    {/* Module row */}
                                    <div
                                        onClick={() => crud.toggleExpand(module.id)}
                                        className={`group flex cursor-pointer items-center gap-2.5 py-2.5 pr-2 transition-colors ${
                                            isOpen ? 'bg-purple-50/40 dark:bg-purple-950/30' : 'hover:bg-neutral-50/60 dark:hover:bg-slate-700/50'
                                        }`}
                                    >
                                        <div className={`shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-90' : ''}`}>
                                            <ChevronRight className={`h-4 w-4 ${isOpen ? 'text-purple-500' : 'text-neutral-300'}`} />
                                        </div>
                                        <span className="hidden w-4 shrink-0 text-right font-mono text-[10px] text-neutral-300 sm:block dark:text-slate-600">
                                            {String(index + 1).padStart(2, '0')}
                                        </span>
                                        <span className="flex-1 truncate text-sm font-semibold text-neutral-800 dark:text-slate-100">
                                            {module.title}
                                        </span>
                                        <StatusDot status={module.status} />
                                        <div
                                            className="flex items-center gap-px opacity-0 transition-opacity group-hover:opacity-100 max-sm:opacity-100"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <div className="hidden gap-px sm:flex">
                                                <IconBtn onClick={() => crud.moveModule(module, 'up')} disabled={isFirst} title="Up">
                                                    <ArrowUp className="h-3 w-3" />
                                                </IconBtn>
                                                <IconBtn onClick={() => crud.moveModule(module, 'down')} disabled={isLast} title="Down">
                                                    <ArrowDown className="h-3 w-3" />
                                                </IconBtn>
                                            </div>
                                            <IconBtn onClick={() => crud.openEditModal(module)} title="Edit">
                                                <Pencil className="h-3 w-3" />
                                            </IconBtn>
                                            <IconBtn onClick={() => crud.openDeleteModal(module)} title="Delete" danger>
                                                <Trash2 className="h-3 w-3" />
                                            </IconBtn>
                                        </div>
                                    </div>

                                    {/* Materials nested */}
                                    {isOpen && (
                                        <div className="pb-1">
                                            <MaterialsSection
                                                courseSlug={course.slug}
                                                moduleId={module.id}
                                                materials={module.materials ?? []}
                                                routePrefix={routePrefix}
                                            />
                                        </div>
                                    )}
                                </TreeNode>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Module Modal */}
            <Modal
                open={crud.open}
                onClose={() => crud.setOpen(false)}
                title={crud.editingModule ? 'Edit Module' : 'Add Module'}
                footer={
                    <>
                        <Button variant="outline" size="sm" onClick={() => crud.setOpen(false)}>
                            Cancel
                        </Button>
                        <Button size="sm" onClick={crud.handleSubmit}>
                            {crud.editingModule ? 'Update' : 'Create'}
                        </Button>
                    </>
                }
            >
                <InputField label="Module Title" value={crud.title} onChange={(e) => crud.setTitle(e.target.value)} />
                <SelectField
                    label="Status"
                    value={crud.status}
                    onChange={(e) => crud.setStatus(e.target.value as 'draft' | 'published')}
                    options={[
                        { label: 'Draft', value: 'draft' },
                        { label: 'Published', value: 'published' },
                    ]}
                />
            </Modal>

            <ConfirmationDelete
                open={crud.deleteModalOpen}
                onClose={() => crud.setDeleteModalOpen(false)}
                onConfirm={crud.handleConfirmDelete}
                isLoading={crud.isDeleting}
                title="Delete Module"
                message={`Module "${crud.selectedModule?.title}" will be deleted permanently.`}
            />
        </>
    );
}

/*
   Shared primitives */

function StatusDot({ status }: { status: string }) {
    const colors: Record<string, string> = {
        published: 'bg-emerald-400',
        draft: 'bg-amber-400',
    };
    return (
        <span className="flex shrink-0 items-center gap-1.5" title={status}>
            <span className={`h-2 w-2 ${colors[status] ?? 'bg-neutral-300'}`} />
            <span className="hidden text-[10px] font-medium text-neutral-400 capitalize sm:inline dark:text-slate-500">{status}</span>
        </span>
    );
}

function IconBtn({
    children,
    onClick,
    disabled,
    title,
    danger,
}: {
    children: React.ReactNode;
    onClick?: () => void;
    disabled?: boolean;
    title?: string;
    danger?: boolean;
}) {
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            title={title}
            className={`flex h-7 w-7 shrink-0 items-center justify-center transition-colors ${
                danger
                    ? 'text-neutral-400 hover:bg-red-50 hover:text-red-500 dark:text-slate-500 dark:hover:bg-red-950/30 dark:hover:text-red-400'
                    : 'text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 dark:text-slate-500 dark:hover:bg-slate-700 dark:hover:text-slate-200'
            } disabled:cursor-not-allowed disabled:opacity-20`}
        >
            {children}
        </button>
    );
}
