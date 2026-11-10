import { router } from '@inertiajs/react';
import { useState } from 'react';
import type { Material } from '@/types';

export function useMaterials(courseSlug: string, moduleId: number, materials: Material[], routePrefix: 'admin' | 'instructor') {
    const [open, setOpen] = useState(false);
    const [editing, setEditing] = useState<Material | null>(null);

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');

    const [status, setStatus] = useState<'draft' | 'published'>('draft');

    const [deleteOpen, setDeleteOpen] = useState(false);
    const [selected, setSelected] = useState<Material | null>(null);
    const [loadingDelete, setLoadingDelete] = useState(false);

    const baseUrl = `/${routePrefix}/courses/${courseSlug}/modules/${moduleId}/materials`;

    const sortedMaterials = [...materials].sort((a, b) => a.sort_order - b.sort_order);

    function reset() {
        setTitle('');
        setDescription('');
        setStatus('draft');
    }

    function openCreate() {
        setEditing(null);
        reset();
        setOpen(true);
    }

    function openEdit(material: Material) {
        setEditing(material);
        setTitle(material.title);
        setDescription(material.description ?? '');
        setStatus(material.status);
        setOpen(true);
    }

    function submit() {
        if (!title.trim()) return;

        const data = {
            title,
            description,
            status,
        };

        if (editing) {
            router.put(`${baseUrl}/${editing.id}`, data, {
                preserveScroll: true,
                onSuccess: () => setOpen(false),
            });
        } else {
            router.post(baseUrl, data, {
                preserveScroll: true,
                onSuccess: () => setOpen(false),
            });
        }
    }

    function openDelete(material: Material) {
        setSelected(material);
        setDeleteOpen(true);
    }

    function confirmDelete() {
        if (!selected) return;

        setLoadingDelete(true);

        router.delete(`${baseUrl}/${selected.id}`, {
            preserveScroll: true,
            onFinish: () => {
                setLoadingDelete(false);
                setDeleteOpen(false);
                setSelected(null);
            },
        });
    }

    function moveMaterial(material: Material, direction: 'up' | 'down') {
        router.put(`${baseUrl}/${material.id}/move`, { direction }, { preserveScroll: true });
    }

    return {
        open,
        setOpen,
        editing,

        title,
        setTitle,

        description,
        setDescription,

        status,
        setStatus,

        deleteOpen,
        setDeleteOpen,
        selected,
        loadingDelete,

        sortedMaterials,

        openCreate,
        openEdit,
        submit,
        openDelete,
        confirmDelete,

        moveMaterial,
    };
}
