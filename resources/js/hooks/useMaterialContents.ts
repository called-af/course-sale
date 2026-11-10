import type { FormDataConvertible } from '@inertiajs/core';
import { router, usePage } from '@inertiajs/react';
import { useState, useMemo, useEffect } from 'react';
import type { MaterialContent } from '@/types';
import type { SharedPageProps } from '@/types/shared';

export type ContentSourceMode = 'upload' | 'url';

function supportsUpload(type: MaterialContent['type']): boolean {
    return type === 'file' || type === 'ppt';
}

function isManagedUpload(url?: string | null): boolean {
    return typeof url === 'string' && url.includes('/storage/');
}

export function useMaterialContents(
    courseSlug: string,
    moduleId: number,
    materialId: number,
    contents: MaterialContent[],
    routePrefix: 'admin' | 'instructor',
    editId?: number | null,
) {
    const baseUrl = `/${routePrefix}/courses/${courseSlug}/modules/${moduleId}/materials/${materialId}/contents`;

    const { errors } = usePage<SharedPageProps>().props;

    const [open, setOpen] = useState(false);

    const [title, setTitle] = useState('');
    const [type, setType] = useState<MaterialContent['type']>('text');
    const [status, setStatus] = useState<'draft' | 'published'>('draft');
    const [contentUrl, setContentUrl] = useState('');
    const [contentText, setContentText] = useState<unknown>([]);
    const [duration, setDuration] = useState<number | ''>('');
    const [sourceMode, setSourceMode] = useState<ContentSourceMode>('url');
    const [file, setFile] = useState<File | null>(null);

    const sortedContents = useMemo(() => {
        return [...contents].sort((a, b) => a.sort_order - b.sort_order);
    }, [contents]);

    const editing = useMemo(() => {
        if (!editId) return null;
        return contents.find((c) => c.id === editId) ?? null;
    }, [editId, contents]);

    useEffect(() => {
        if (!editing) return;

        const url = editing.content_url ?? '';

        setTitle(editing.title);
        setType(editing.type);
        setContentUrl(url);
        setContentText(editing.content_text ?? []);
        setStatus(editing.status);
        setDuration(editing.duration ?? '');
        setFile(null);
        setSourceMode(supportsUpload(editing.type) && (!url || isManagedUpload(url)) ? 'upload' : 'url');
    }, [editing]);

    function reset() {
        setTitle('');
        setType('text');
        setContentUrl('');
        setContentText([]);
        setDuration('');
        setStatus('draft');
        setSourceMode('url');
        setFile(null);
    }

    function openCreate() {
        reset();
        setOpen(true);
    }

    function uploadPayload(method?: 'PUT'): FormData {
        const data = new FormData();

        if (method) {
            data.append('_method', method);
        }

        data.append('title', title);
        data.append('type', type);
        data.append('status', status);

        if (file) {
            data.append('file', file);
        }

        if (duration) {
            data.append('duration', String(duration));
        }

        if (contentText !== null && contentText !== undefined) {
            data.append('content_text', JSON.stringify(contentText));
        }

        return data;
    }

    function create() {
        if (!title.trim()) return;

        if (supportsUpload(type) && sourceMode === 'upload') {
            router.post(baseUrl, uploadPayload(), {
                forceFormData: true,
                onSuccess: () => {
                    setOpen(false);
                    setFile(null);
                },
            });

            return;
        }

        router.post(
            baseUrl,
            {
                title,
                type,
                content_url: contentUrl.trim() || null,
                content_text: (contentText as FormDataConvertible) || null,
                duration: duration || null,
                status,
            },
            {
                onSuccess: () => setOpen(false),
            },
        );
    }

    function update() {
        if (!editing) return;

        if (supportsUpload(type) && sourceMode === 'upload') {
            router.post(`${baseUrl}/${editing.id}`, uploadPayload('PUT'), {
                forceFormData: true,
                onSuccess: () => setFile(null),
            });

            return;
        }

        router.put(`${baseUrl}/${editing.id}`, {
            title,
            type,
            content_url: contentUrl.trim() || null,
            content_text: (contentText as FormDataConvertible) || null,
            duration: duration || null,
            status,
        });
    }

    function destroy(id: number) {
        router.delete(`${baseUrl}/${id}`, {
            preserveScroll: true,
        });
    }

    function editPage(id: number) {
        router.get(`${baseUrl}/${id}/edit`);
    }

    function moveContent(content: MaterialContent, direction: 'up' | 'down') {
        router.put(`${baseUrl}/${content.id}/move`, { direction }, { preserveScroll: true });
    }

    return {
        open,
        setOpen,

        title,
        setTitle,

        type,
        setType,

        contentUrl,
        setContentUrl,

        contentText,
        setContentText,

        status,
        setStatus,

        duration,
        setDuration,

        sourceMode,
        setSourceMode,

        file,
        setFile,

        errors,

        sortedContents,
        editing,

        openCreate,
        create,
        update,
        destroy,
        editPage,

        moveContent,
    };
}
