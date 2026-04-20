import { useState } from 'react';
import { router } from '@inertiajs/react';
import { Module } from '@/types/modules';

export function useModules(courseSlug: string, modules: Module[]) {
    const [open, setOpen] = useState(false);
    const [editingModule, setEditingModule] = useState<Module | null>(null);
    const [title, setTitle] = useState('');
    const [status, setStatus] = useState<'draft' | 'published'>('draft');

    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [selectedModule, setSelectedModule] = useState<Module | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const [expandedModule, setExpandedModule] = useState<number | null>(null);

    const sortedModules = [...modules].sort((a, b) => a.sort_order - b.sort_order);

    function openCreateModal() {
        setEditingModule(null);
        setTitle('');
        setStatus('draft');
        setOpen(true);
    }

    function openEditModal(module: Module) {
        setEditingModule(module);
        setTitle(module.title);
        setStatus(module.status);
        setOpen(true);
    }

    function handleSubmit() {
        if (!title.trim()) return;

        const payload = {
            title,
            status,
        };

        if (editingModule) {
            router.put(`/admin/courses/${courseSlug}/modules/${editingModule.id}`, payload, { preserveScroll: true });
        } else {
            router.post(`/admin/courses/${courseSlug}/modules`, payload, { preserveScroll: true });
        }

        setOpen(false);
    }

    function openDeleteModal(module: Module) {
        setSelectedModule(module);
        setDeleteModalOpen(true);
    }

    function handleConfirmDelete() {
        if (!selectedModule) return;

        setIsDeleting(true);

        router.delete(`/admin/courses/${courseSlug}/modules/${selectedModule.id}`, {
            preserveScroll: true,
            onFinish: () => {
                setIsDeleting(false);
                setDeleteModalOpen(false);
                setSelectedModule(null);
            },
        });
    }

    function moveModule(module: Module, direction: 'up' | 'down') {
        router.put(`/admin/courses/${courseSlug}/modules/${module.id}/move`, { direction }, { preserveScroll: true });
    }

    function toggleExpand(moduleId: number | string) {
        const id = Number(moduleId);

        setExpandedModule((prev) => (prev === id ? null : id));
    }

    return {
        open,
        setOpen,
        editingModule,
        title,
        setTitle,

        status,
        setStatus,

        deleteModalOpen,
        setDeleteModalOpen,
        selectedModule,
        isDeleting,

        sortedModules,
        expandedModule,

        openCreateModal,
        openEditModal,
        handleSubmit,
        openDeleteModal,
        handleConfirmDelete,
        moveModule,
        toggleExpand,
    };
}
