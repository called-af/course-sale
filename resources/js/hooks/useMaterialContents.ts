import { useState, useMemo, useEffect } from 'react';
import { router } from '@inertiajs/react';
import { MaterialContent } from '@/types';

export function useMaterialContents(
    courseSlug: string,
    moduleId: number,
    materialId: number,
    contents: MaterialContent[],
    routePrefix: 'admin' | 'instructor',
    editId?: number | null,
) {
    const baseUrl = `/${routePrefix}/courses/${courseSlug}/modules/${moduleId}/materials/${materialId}/contents`;

    const [open, setOpen] = useState(false);

    const [title, setTitle] = useState('');
    const [type, setType] = useState<MaterialContent['type']>('text');
    const [status, setStatus] = useState<'draft' | 'published'>('draft');
    const [contentUrl, setContentUrl] = useState('');
    const [contentText, setContentText] = useState<any>([]);
    const [duration, setDuration] = useState<number | ''>('');

    const sortedContents = useMemo(() => {
        return [...contents].sort((a, b) => a.sort_order - b.sort_order);
    }, [contents]);

    const editing = useMemo(() => {
        if (!editId) return null;
        return contents.find((c) => c.id === editId) ?? null;
    }, [editId, contents]);

    useEffect(() => {
        if (!editing) return;

        setTitle(editing.title);
        setType(editing.type);
        setContentUrl(editing.content_url ?? '');
        setContentText(editing.content_text ?? []);
        setStatus(editing.status);
        setDuration(editing.duration ?? '');
    }, [editing]);

    function reset() {
        setTitle('');
        setType('text');
        setContentUrl('');
        setContentText([]);
        setDuration('');
        setStatus('draft');
    }

    function openCreate() {
        reset();
        setOpen(true);
    }

    function create() {
        if (!title.trim()) return;

        router.post(
            baseUrl,
            {
                title,
                type,
                content_url: contentUrl || null,
                content_text: contentText || null,
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

        router.put(`${baseUrl}/${editing.id}`, {
            title,
            type,
            content_url: contentUrl || null,
            content_text: contentText || null,
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
