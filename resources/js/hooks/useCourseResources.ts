import { router, usePage } from '@inertiajs/react';
import { useState } from 'react';
import type { CourseResource } from '@/types';
import type { SharedPageProps } from '@/types/shared';

export function useCourseResources(courseSlug: string, resources: CourseResource[], routePrefix: 'admin' | 'instructor') {
    const baseUrl = `/${routePrefix}/courses/${courseSlug}/resources`;

    const { errors } = usePage<SharedPageProps>().props;

    const [open, setOpen] = useState(false);
    const [editing, setEditing] = useState<CourseResource | null>(null);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [externalUrl, setExternalUrl] = useState('');
    const [status, setStatus] = useState<'draft' | 'published'>('published');
    const [file, setFile] = useState<File | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<CourseResource | null>(null);

    function reset() {
        setTitle('');
        setDescription('');
        setExternalUrl('');
        setStatus('published');
        setFile(null);
    }

    function openCreate() {
        setEditing(null);
        reset();
        setOpen(true);
    }

    function openEdit(resource: CourseResource) {
        if (resource.source === 'material') return;

        setEditing(resource);
        setTitle(resource.title);
        setDescription(resource.description ?? '');
        setExternalUrl(resource.external_url ?? '');
        setStatus(resource.status);
        setFile(null);
        setOpen(true);
    }

    function payload(method?: 'PUT'): FormData {
        const data = new FormData();

        if (method) {
            data.append('_method', method);
        }

        data.append('title', title);

        if (description.trim()) {
            data.append('description', description.trim());
        }

        if (externalUrl.trim()) {
            data.append('external_url', externalUrl.trim());
        }

        if (file) {
            data.append('file', file);
        }

        data.append('status', status);

        return data;
    }

    function create() {
        if (!title.trim()) return;

        router.post(baseUrl, payload(), {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                setOpen(false);
                reset();
            },
        });
    }

    function update() {
        if (!editing || !title.trim()) return;

        router.post(`${baseUrl}/${editing.id}`, payload('PUT'), {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                setOpen(false);
                setEditing(null);
                reset();
            },
        });
    }

    function destroy() {
        if (!deleteTarget || deleteTarget.source === 'material') return;

        router.delete(`${baseUrl}/${deleteTarget.id}`, {
            preserveScroll: true,
            onSuccess: () => setDeleteTarget(null),
        });
    }

    return {
        errors,
        open,
        setOpen,
        editing,
        title,
        setTitle,
        description,
        setDescription,
        externalUrl,
        setExternalUrl,
        status,
        setStatus,
        file,
        setFile,
        resources,
        deleteTarget,
        setDeleteTarget,
        openCreate,
        openEdit,
        create,
        update,
        destroy,
    };
}
