import { useForm } from '@inertiajs/react';
import { useState } from 'react';
import { route } from 'ziggy-js';

interface Category {
    id: number;
    name: string;
    slug: string;
    desc?: string;
    img_url?: string;
}

export function useCategory() {
    const [editingId, setEditingId] = useState<number | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);

    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);

    const [preview, setPreview] = useState<string | null>(null);

    const form = useForm({
        name: '',
        desc: '',
        img: null as File | null,
    });

    const { data, setData, post, delete: destroy, processing, reset } = form;

    const handleImgChange = (file: File) => {
        setData('img', file);
        setPreview(URL.createObjectURL(file));
    };

    const openCreate = () => {
        reset();
        setPreview(null);
        setIsCreateOpen(true);
    };

    const closeCreate = () => {
        setIsCreateOpen(false);
    };

    const submitCreate = () => {
        if (!data.name.trim()) return;

        form.transform((d) => {
            const newData: Record<string, string | File | null> = { ...d };

            if (!d.img) delete newData.img;

            return newData;
        });

        post(route('admin.categories.store'), {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                reset();
                setPreview(null);
                setIsCreateOpen(false);
            },
        });
    };

    const startEdit = (category: Category) => {
        setEditingId(category.id);
        setIsEditOpen(true);

        setData({
            name: category.name,
            desc: category.desc ?? '',
            img: null,
        });

        setPreview(category.img_url ?? null);
    };

    const closeEdit = () => {
        setIsEditOpen(false);
        setEditingId(null);
        setPreview(null);
        reset();
    };

    const submitUpdate = (id: number) => {
        if (!data.name.trim()) return;

        form.transform((d) => {
            const newData: Record<string, string | File | null> = {
                ...d,
                _method: 'PUT',
            };

            if (!d.img) delete newData.img;

            return newData;
        });

        post(route('admin.categories.update', id), {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                setEditingId(null);
                setPreview(null);
                reset();
                setIsEditOpen(false);
            },
        });
    };

    const openDeleteModal = (category: Category) => {
        setDeleteTarget(category);
    };

    const closeDeleteModal = () => {
        setDeleteTarget(null);
    };

    const confirmDelete = () => {
        if (!deleteTarget) return;

        destroy(route('admin.categories.destroy', deleteTarget.id), {
            preserveScroll: true,
            onSuccess: () => {
                closeDeleteModal();
            },
        });
    };

    return {
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
    };
}
