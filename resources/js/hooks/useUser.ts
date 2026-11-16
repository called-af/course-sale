import { useForm, router } from '@inertiajs/react';
import { useState } from 'react';
import { route } from 'ziggy-js';

import type { User } from '@/types/user';

export function useUser() {
    const { data, setData, processing, reset } = useForm({
        name: '',
        email: '',
        role: 'student' as User['role'],
        bio: '',
        password: '',
    });

    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<User | null>(null);

    function startEdit(user: User) {
        setEditingUser(user);

        setData({
            name: user.name,
            email: user.email,
            role: user.role,
            bio: user.bio ?? '',
            password: '',
        });
    }

    function closeEdit() {
        setEditingUser(null);
        reset();
    }

    function submitCreate() {
        router.post(route('admin.users.store'), data, {
            onSuccess: () => reset(),
        });
    }

    function submitUpdate() {
        if (!editingUser) return;

        router.put(route('admin.users.update', editingUser.id), data, {
            onSuccess: () => closeEdit(),
        });
    }

    function openDeleteModal(user: User) {
        setDeleteTarget(user);
    }

    function closeDeleteModal() {
        setDeleteTarget(null);
    }

    function confirmDelete() {
        if (!deleteTarget) return;

        router.delete(route('admin.users.destroy', deleteTarget.id), {
            onSuccess: () => closeDeleteModal(),
        });
    }

    return {
        data,
        setData,
        processing,

        editingUser,
        deleteTarget,

        startEdit,
        closeEdit,

        submitCreate,
        submitUpdate,

        openDeleteModal,
        closeDeleteModal,
        confirmDelete,
    };
}
