import { usePage } from '@inertiajs/react';
import {
    FileText,
    Video,
    File,
    Presentation,
    HelpCircle,
    ExternalLink,
    Clock,
    Save,
    CheckCircle2,
    Layout,
    Eye,
    Edit3,
    UploadCloud,
    Link2,
    X,
    Download,
} from 'lucide-react';
import { useState } from 'react';
import Button from '@/components/atoms/Button';
import InputField from '@/components/molecules/InputField';
import SelectField from '@/components/molecules/SelectField';
import SlateEditor from '@/components/molecules/SlateEditor';
import SlatePreview from '@/components/molecules/SlatePreview';
import QuizBuilder from '@/components/organisms/Course/QuizBuilder';
import { useMaterialContents } from '@/hooks/useMaterialContents';
import type { MaterialContent } from '@/types';
import type { SharedPageProps } from '@/types/shared';

type ContentType = MaterialContent['type'];

const TYPES: {
    value: ContentType;
    label: string;
    desc: string;
    icon: typeof FileText;
    colorCls: string;
    activeCls: string;
}[] = [
    {
        value: 'text',
        label: 'Text / Article',
        desc: 'Rich text & documents',
        icon: FileText,
        colorCls: 'text-blue-500',
        activeCls: 'border-blue-500 bg-blue-50/80 ring-2 ring-blue-500/20 dark:border-blue-400 dark:bg-blue-950/60',
    },
    {
        value: 'video',
        label: 'Video',
        desc: 'YouTube, Vimeo, URL',
        icon: Video,
        colorCls: 'text-violet-500',
        activeCls: 'border-violet-500 bg-violet-50/80 ring-2 ring-violet-500/20 dark:border-violet-400 dark:bg-violet-950/60',
    },
    {
        value: 'file',
        label: 'Attachment',
        desc: 'PDF, ZIP, Documents',
        icon: File,
        colorCls: 'text-emerald-500',
        activeCls: 'border-emerald-500 bg-emerald-50/80 ring-2 ring-emerald-500/20 dark:border-emerald-400 dark:bg-emerald-950/60',
    },
    {
        value: 'ppt',
        label: 'Presentation',
        desc: 'Google Slides, PPT, PDF',
        icon: Presentation,
        colorCls: 'text-orange-500',
        activeCls: 'border-orange-500 bg-orange-50/80 ring-2 ring-orange-500/20 dark:border-orange-400 dark:bg-orange-950/60',
    },
    {
        value: 'quiz',
        label: 'Interactive Quiz',
        desc: 'MCQ & Essays',
        icon: HelpCircle,
        colorCls: 'text-rose-500',
        activeCls: 'border-rose-500 bg-rose-50/80 ring-2 ring-rose-500/20 dark:border-rose-400 dark:bg-rose-950/60',
    },
];

interface EditMaterialContentProps {
    courseSlug: string;
    moduleId: number;
    materialId: number;
    content: MaterialContent;
    routePrefix: 'admin' | 'instructor';
}

function formatDate(date?: string | null) {
    if (!date) return '-';
    return new Date(date).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
    });
}

function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function fileNameFromUrl(url?: string | null): string {
    if (!url) return '';
    try {
        const path = new URL(url, window.location.origin).pathname;
        return decodeURIComponent(path.split('/').pop() || '');
    } catch {
        return url.split('/').pop() || '';
    }
}

const UPLOAD_ACCEPT: Record<string, string> = {
    file: '.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.zip,.txt,.csv,.jpg,.jpeg,.png,.webp',
    ppt: '.pdf,.ppt,.pptx',
};

const URL_PLACEHOLDER: Record<string, string> = {
    video: 'https://www.youtube.com/watch?v=... or https://vimeo.com/...',
    file: 'https://example.com/document.pdf',
    ppt: 'https://docs.google.com/presentation/d/... or direct PDF/PPT link',
};

const URL_LABEL: Record<string, string> = {
    video: 'Video URL',
    file: 'File URL',
    ppt: 'Presentation URL',
};

const UPLOAD_HINT: Record<string, string> = {
    file: 'PDF, DOC/DOCX, PPT/PPTX, XLS/XLSX, ZIP, TXT/CSV, images — max 50 MB',
    ppt: 'PDF, PPT, PPTX — max 50 MB',
};

export default function EditMaterialContent({ courseSlug, moduleId, materialId, content, routePrefix }: EditMaterialContentProps) {
    const { flash } = usePage<SharedPageProps>().props;
    const form = useMaterialContents(courseSlug, moduleId, materialId, [content], routePrefix, content.id);

    const [splitView, setSplitView] = useState(false);

    const renderMeta = (label: string, value: React.ReactNode) => (
        <div className="flex flex-col gap-1 border-b border-slate-100 py-3 last:border-0 sm:flex-row sm:items-start sm:justify-between dark:border-slate-700">
            <span className="text-xs font-semibold tracking-wider text-slate-400 uppercase dark:text-slate-500">{label}</span>
            <div className="max-w-sm text-left text-sm font-medium text-slate-700 sm:text-right dark:text-slate-200">{value}</div>
        </div>
    );

    return (
        <div className="mx-auto w-full max-w-5xl space-y-6">
            {flash?.success && (
                <div className="flex items-center gap-3 border border-emerald-200 bg-emerald-50 p-4 text-emerald-700 shadow-sm dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-400">
                    <CheckCircle2 className="h-5 w-5 shrink-0" />
                    <p className="text-sm font-medium">{flash.success}</p>
                </div>
            )}

            {flash?.error && (
                <div className="flex items-center gap-3 border border-rose-200 bg-rose-50 p-4 text-rose-700 shadow-sm dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-400">
                    <X className="h-5 w-5 shrink-0" />
                    <p className="text-sm font-medium">{flash.error}</p>
                </div>
            )}

            {/* Card 1: Basic Settings */}
            <div className="space-y-6 border border-slate-200/80 bg-white p-4 shadow-sm sm:p-8 dark:border-slate-700 dark:bg-[#1e1f24]">
                <div className="flex flex-col justify-between gap-4 border-b border-slate-100 pb-4 sm:flex-row sm:items-center dark:border-slate-700">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
                            <Layout className="h-5 w-5" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Content Settings</h2>
                            <p className="text-xs text-slate-500 dark:text-slate-400">Basic details, type, and publication status.</p>
                        </div>
                    </div>

                    <div
                        className={`flex shrink-0 items-center gap-1.5 px-3 py-1.5 text-xs font-bold tracking-wider uppercase ${
                            form.status === 'published'
                                ? 'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:ring-emerald-800'
                                : 'bg-amber-100 text-amber-700 ring-1 ring-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:ring-amber-800'
                        }`}
                    >
                        <span className={`h-2 w-2 rounded-full ${form.status === 'published' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                        {form.status === 'published' ? 'Published' : 'Draft Mode'}
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <div className="md:col-span-2">
                        <InputField
                            label="Content Title"
                            name="title"
                            value={form.title}
                            onChange={(e) => form.setTitle(e.target.value)}
                            placeholder="e.g. Introduction to React Hooks"
                        />
                    </div>

                    <SelectField
                        label="Publication Status"
                        name="status"
                        value={form.status}
                        onChange={(e) => form.setStatus(e.target.value as 'draft' | 'published')}
                        options={[
                            { label: 'Draft (Hidden from students)', value: 'draft' },
                            { label: 'Published (Visible to students)', value: 'published' },
                        ]}
                    />

                    <div className="flex flex-col gap-1 text-xs text-slate-400 md:justify-end md:pb-2 dark:text-slate-500">
                        {renderMeta('Created At', formatDate(content.created_at))}
                    </div>
                </div>

                {/* Content Type Selector */}
                <div className="space-y-3 pt-2">
                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">Content Type</label>
                    <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
                        {TYPES.map((item) => {
                            const Icon = item.icon;
                            const isActive = form.type === item.value;

                            return (
                                <button
                                    key={item.value}
                                    type="button"
                                    onClick={() => form.setType(item.value)}
                                    className={`group relative flex flex-col items-center justify-center gap-2 border p-4 text-center transition-all duration-200 ${
                                        isActive
                                            ? item.activeCls
                                            : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-[#1e1f24] dark:hover:border-slate-600 dark:hover:bg-slate-700/60'
                                    }`}
                                >
                                    <div
                                        className={`transition-transform duration-200 ${isActive ? 'scale-110 ' + item.colorCls : 'text-slate-400 group-hover:text-slate-600 dark:text-slate-500 dark:group-hover:text-slate-300'}`}
                                    >
                                        <Icon className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <span
                                            className={`block text-sm font-bold ${isActive ? 'text-slate-900 dark:text-white' : 'text-slate-700 dark:text-slate-200'}`}
                                        >
                                            {item.label}
                                        </span>
                                        <span className="mt-0.5 block text-[10px] text-slate-500 dark:text-slate-400">{item.desc}</span>
                                    </div>
                                    {isActive && (
                                        <div className="absolute top-2 right-2 text-indigo-600 dark:text-indigo-400">
                                            <CheckCircle2 className="h-4 w-4" />
                                        </div>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Card 2: Content Specific Editor */}
            <div className="space-y-6 border border-slate-200/80 bg-white p-4 shadow-sm sm:p-8 dark:border-slate-700 dark:bg-[#1e1f24]">
                {/* Media & Upload Source */}
                {(form.type === 'video' || form.type === 'file' || form.type === 'ppt') && (
                    <div className="space-y-4">
                        <div className="flex flex-col justify-between gap-3 border-b border-slate-100 pb-3 sm:flex-row sm:items-center dark:border-slate-700">
                            <div>
                                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                                    {form.type === 'video' ? 'Video Source' : 'File & Media Source'}
                                </h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                    {form.type === 'video'
                                        ? 'Paste a YouTube, Vimeo, or direct video URL.'
                                        : 'Upload a file from your device or paste a link to an existing file.'}
                                </p>
                            </div>

                            {(form.type === 'file' || form.type === 'ppt') && (
                                <div className="inline-flex shrink-0 border border-slate-200 bg-slate-50 p-0.5 dark:border-slate-700 dark:bg-[#1e1f24]">
                                    <button
                                        type="button"
                                        onClick={() => form.setSourceMode('upload')}
                                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold transition-colors ${
                                            form.sourceMode === 'upload'
                                                ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white'
                                                : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                                        }`}
                                    >
                                        <UploadCloud className="h-3.5 w-3.5" /> Upload File
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => form.setSourceMode('url')}
                                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold transition-colors ${
                                            form.sourceMode === 'url'
                                                ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white'
                                                : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                                        }`}
                                    >
                                        <Link2 className="h-3.5 w-3.5" /> Paste URL
                                    </button>
                                </div>
                            )}
                        </div>

                        {form.type !== 'video' && form.sourceMode === 'upload' ? (
                            <div className="space-y-3">
                                <label
                                    className={`flex cursor-pointer flex-col items-center justify-center gap-2 border border-dashed px-4 py-8 text-center transition-colors ${
                                        form.file
                                            ? 'border-emerald-400 bg-emerald-50/60 dark:border-emerald-700 dark:bg-emerald-950/20'
                                            : 'border-slate-300 bg-slate-50/60 hover:border-indigo-400 hover:bg-indigo-50/40 dark:border-slate-600 dark:bg-[#1e1f24] dark:hover:border-indigo-500 dark:hover:bg-indigo-950/20'
                                    }`}
                                >
                                    <input
                                        type="file"
                                        className="sr-only"
                                        accept={UPLOAD_ACCEPT[form.type]}
                                        onChange={(e) => form.setFile(e.target.files?.[0] ?? null)}
                                    />
                                    <UploadCloud className="h-7 w-7 text-indigo-500 dark:text-indigo-400" />
                                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                                        {form.file ? form.file.name : 'Click to choose a file'}
                                    </span>
                                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                                        {form.file ? formatFileSize(form.file.size) : UPLOAD_HINT[form.type]}
                                    </span>
                                </label>

                                {form.file && (
                                    <div className="flex items-center justify-between border border-slate-200 bg-slate-50 px-3 py-2 text-xs dark:border-slate-700 dark:bg-[#1e1f24]">
                                        <span className="min-w-0 truncate text-slate-600 dark:text-slate-300">Ready to upload: {form.file.name}</span>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => form.setFile(null)}
                                            leftIcon={<X className="h-3.5 w-3.5" />}
                                            className="!rounded-none !text-rose-600 hover:!bg-rose-50 dark:!text-rose-400 dark:hover:!bg-rose-950/30"
                                        >
                                            Remove
                                        </Button>
                                    </div>
                                )}

                                {!form.file && form.contentUrl && (
                                    <div className="flex flex-wrap items-center justify-between gap-2 border border-slate-200 bg-slate-50 px-3 py-2 text-xs dark:border-slate-700 dark:bg-[#1e1f24]">
                                        <span className="min-w-0 truncate text-slate-600 dark:text-slate-300">
                                            Current file: {fileNameFromUrl(form.contentUrl)}
                                        </span>
                                        <span className="flex shrink-0 items-center gap-1">
                                            <a href={form.contentUrl} target="_blank" rel="noreferrer">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    leftIcon={<ExternalLink className="h-3.5 w-3.5" />}
                                                    className="!rounded-none !text-indigo-600 hover:!bg-indigo-50 dark:!text-indigo-400 dark:hover:!bg-indigo-950/30"
                                                >
                                                    Open
                                                </Button>
                                            </a>
                                            <a href={form.contentUrl} target="_blank" rel="noreferrer" download>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    leftIcon={<Download className="h-3.5 w-3.5" />}
                                                    className="!rounded-none !text-emerald-600 hover:!bg-emerald-50 dark:!text-emerald-400 dark:hover:!bg-emerald-950/30"
                                                >
                                                    Download
                                                </Button>
                                            </a>
                                        </span>
                                    </div>
                                )}

                                <p className="text-[11px] text-slate-400 dark:text-slate-500">
                                    Uploading a new file replaces the current file. Students can view and download it from the lesson.
                                </p>

                                {form.errors?.file && <p className="text-xs font-medium text-rose-600 dark:text-rose-400">{form.errors.file}</p>}
                            </div>
                        ) : (
                            <div className="space-y-2">
                                <InputField
                                    label={URL_LABEL[form.type] ?? 'Media URL'}
                                    name="content_url"
                                    type="url"
                                    value={form.contentUrl}
                                    onChange={(e) => form.setContentUrl(e.target.value)}
                                    placeholder={URL_PLACEHOLDER[form.type]}
                                />

                                {form.contentUrl && (
                                    <div className="flex flex-wrap items-center justify-between gap-2 border border-slate-200/80 bg-slate-50 p-3 text-xs dark:border-slate-700 dark:bg-[#1e1f24]">
                                        <span className="max-w-md min-w-0 break-all text-slate-600 dark:text-slate-300">{form.contentUrl}</span>
                                        <a href={form.contentUrl} target="_blank" rel="noreferrer">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                rightIcon={<ExternalLink className="h-3.5 w-3.5" />}
                                                className="!rounded-none !border-indigo-100 !bg-indigo-50 !text-indigo-600 hover:!bg-indigo-100 dark:!border-indigo-900 dark:!bg-indigo-950/60 dark:!text-indigo-300 dark:hover:!bg-indigo-900/60"
                                            >
                                                Open Link
                                            </Button>
                                        </a>
                                    </div>
                                )}

                                {form.errors?.content_url && (
                                    <p className="text-xs font-medium text-rose-600 dark:text-rose-400">{form.errors.content_url}</p>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* Quiz Builder Container */}
                {form.type === 'quiz' && (
                    <div className="space-y-6">
                        <div className="flex flex-col justify-between gap-4 border-b border-slate-100 pb-4 sm:flex-row sm:items-center dark:border-slate-700">
                            <div>
                                <h3 className="flex items-center gap-2 text-base font-bold text-slate-900 dark:text-white">
                                    <Clock className="h-5 w-5 text-rose-500" />
                                    Quiz Settings & Duration
                                </h3>
                                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                                    Set the time limit for students to complete the quiz.
                                </p>
                            </div>

                            <div className="flex items-center gap-2">
                                <div className="w-32">
                                    <InputField
                                        label=""
                                        name="duration"
                                        type="number"
                                        min={1}
                                        value={form.duration}
                                        onChange={(e) => form.setDuration(e.target.value ? Number(e.target.value) : '')}
                                        placeholder="30"
                                    />
                                </div>
                                <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">Minutes</span>
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                            <span className="text-xs font-semibold tracking-wider text-slate-400 uppercase dark:text-slate-500">Quick Presets:</span>
                            {[15, 30, 45, 60, 90].map((mins) => (
                                <Button
                                    key={mins}
                                    type="button"
                                    variant={form.duration === mins ? 'primary' : 'outline'}
                                    size="sm"
                                    onClick={() => form.setDuration(mins)}
                                    className="!rounded-none"
                                >
                                    {mins} min
                                </Button>
                            ))}
                        </div>

                        <div className="pt-2">
                            <QuizBuilder
                                courseSlug={courseSlug}
                                moduleId={moduleId}
                                materialId={materialId}
                                contentId={content.id}
                                routePrefix={routePrefix}
                            />
                        </div>
                    </div>
                )}

                {/* Rich Text Editor */}
                {form.type === 'text' && (
                    <div className="space-y-4">
                        <div className="flex flex-col justify-between gap-3 border-b border-slate-100 pb-3 sm:flex-row sm:items-center dark:border-slate-700">
                            <div>
                                <h3 className="text-base font-bold text-slate-900 dark:text-white">Lesson Text Editor</h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400">Write and compose rich text learning material.</p>
                            </div>

                            <div className="flex items-center gap-1 bg-slate-100 p-1 dark:bg-[#1e1f24]">
                                <Button
                                    type="button"
                                    variant={!splitView ? 'primary' : 'ghost'}
                                    size="sm"
                                    onClick={() => setSplitView(false)}
                                    leftIcon={<Edit3 className="h-3.5 w-3.5" />}
                                    className="!rounded-none"
                                >
                                    Editor
                                </Button>
                                <Button
                                    type="button"
                                    variant={splitView ? 'primary' : 'ghost'}
                                    size="sm"
                                    onClick={() => setSplitView(true)}
                                    leftIcon={<Layout className="h-3.5 w-3.5" />}
                                    className="!rounded-none"
                                >
                                    Split View
                                </Button>
                            </div>
                        </div>

                        {splitView ? (
                            <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-2">
                                <div className="space-y-2">
                                    <span className="text-[11px] font-semibold tracking-wider text-slate-400 uppercase dark:text-slate-500">
                                        Text Editor
                                    </span>
                                    <div className="overflow-hidden border border-slate-200/90 shadow-xs transition-all focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-500/20 dark:border-slate-700">
                                        <SlateEditor
                                            key={content.id}
                                            initialValue={content.content_text}
                                            value={form.contentText}
                                            onChange={form.setContentText}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <span className="flex items-center gap-1 text-[11px] font-semibold tracking-wider text-slate-400 uppercase dark:text-slate-500">
                                        <Eye className="h-3.5 w-3.5 text-indigo-500" /> Student Preview
                                    </span>
                                    <div className="min-h-[300px] border border-slate-200/80 bg-slate-50/50 p-4 dark:border-slate-700 dark:bg-[#1e1f24]">
                                        <SlatePreview value={form.contentText} />
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="overflow-hidden border border-slate-200/90 shadow-xs transition-all focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-500/20 dark:border-slate-700">
                                <SlateEditor
                                    key={content.id}
                                    initialValue={content.content_text}
                                    value={form.contentText}
                                    onChange={form.setContentText}
                                />
                            </div>
                        )}
                    </div>
                )}

                {/* Footer Action Bar */}
                <div className="flex flex-col justify-between gap-4 border-t border-slate-100 pt-6 sm:flex-row sm:items-center dark:border-slate-700">
                    <div className="flex items-center gap-2">
                        <Button onClick={form.update} size="md" leftIcon={<Save className="h-4 w-4" />} className="w-full !rounded-none sm:w-auto">
                            Save Content Changes
                        </Button>
                    </div>

                    {content.updated_at && (
                        <span className="flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500">
                            <Clock className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
                            Last updated: {formatDate(content.updated_at)}
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
}
