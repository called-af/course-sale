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
        desc: 'Rich text & documentation',
        icon: FileText,
        colorCls: 'text-blue-600 bg-blue-50 border-blue-100 dark:text-blue-300 dark:bg-blue-950/50 dark:border-blue-900',
        activeCls: 'border-blue-500 bg-blue-50/80 ring-2 ring-blue-500/20 text-blue-950 dark:border-blue-400 dark:bg-blue-950/60 dark:text-blue-100',
    },
    {
        value: 'video',
        label: 'Video Lesson',
        desc: 'YouTube / Vimeo / URL',
        icon: Video,
        colorCls: 'text-violet-600 bg-violet-50 border-violet-100 dark:text-violet-300 dark:bg-violet-950/50 dark:border-violet-900',
        activeCls:
            'border-violet-500 bg-violet-50/80 ring-2 ring-violet-500/20 text-violet-950 dark:border-violet-400 dark:bg-violet-950/60 dark:text-violet-100',
    },
    {
        value: 'file',
        label: 'File Attachment',
        desc: 'Upload PDF / Word / ZIP',
        icon: File,
        colorCls: 'text-emerald-600 bg-emerald-50 border-emerald-100 dark:text-emerald-300 dark:bg-emerald-950/50 dark:border-emerald-900',
        activeCls:
            'border-emerald-500 bg-emerald-50/80 ring-2 ring-emerald-500/20 text-emerald-950 dark:border-emerald-400 dark:bg-emerald-950/60 dark:text-emerald-100',
    },
    {
        value: 'ppt',
        label: 'Presentation',
        desc: 'Upload PPT / PDF or paste a link',
        icon: Presentation,
        colorCls: 'text-amber-600 bg-amber-50 border-amber-100 dark:text-amber-300 dark:bg-amber-950/50 dark:border-amber-900',
        activeCls:
            'border-amber-500 bg-amber-50/80 ring-2 ring-amber-500/20 text-amber-950 dark:border-amber-400 dark:bg-amber-950/60 dark:text-amber-100',
    },
    {
        value: 'quiz',
        label: 'Quiz & Evaluation',
        desc: 'Multiple choice & essay',
        icon: HelpCircle,
        colorCls: 'text-rose-600 bg-rose-50 border-rose-100 dark:text-rose-300 dark:bg-rose-950/50 dark:border-rose-900',
        activeCls: 'border-rose-500 bg-rose-50/80 ring-2 ring-rose-500/20 text-rose-950 dark:border-rose-400 dark:bg-rose-950/60 dark:text-rose-100',
    },
];

const URL_PLACEHOLDER: Partial<Record<ContentType, string>> = {
    video: 'https://www.youtube.com/watch?v=...',
    file: 'https://drive.google.com/file/d/...',
    ppt: 'https://docs.google.com/presentation/d/...',
};

const URL_LABEL: Partial<Record<ContentType, string>> = {
    video: 'Video Lesson URL',
    file: 'File / Documentation URL',
    ppt: 'Presentation Slide URL',
};

const UPLOAD_ACCEPT: Partial<Record<ContentType, string>> = {
    file: '.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.zip,.txt,.csv,.jpg,.jpeg,.png,.webp',
    ppt: '.pdf,.ppt,.pptx',
};

const UPLOAD_HINT: Partial<Record<ContentType, string>> = {
    file: 'PDF, Word, PowerPoint, Excel, ZIP, text or image — max 50 MB.',
    ppt: 'PDF, PPT or PPTX — max 50 MB. PDF/PPTX can be viewed directly in the lesson.',
};

function fileNameFromUrl(url?: string | null): string | null {
    if (!url) return null;

    const clean = url.split('?')[0].split('#')[0];
    const name = clean.split('/').filter(Boolean).pop();

    return name ? decodeURIComponent(name) : url;
}

function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;

    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(iso?: string) {
    if (!iso) return null;
    return new Intl.DateTimeFormat('en-US', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    }).format(new Date(iso));
}

interface Props {
    courseSlug: string;
    moduleId: number;
    materialId: number;
    content: MaterialContent;
}

export default function EditMaterialContent({ courseSlug, moduleId, materialId, content }: Props) {
    const [splitView, setSplitView] = useState(true);
    const { auth } = usePage<SharedPageProps>().props;
    const routePrefix = auth?.user?.role === 'instructor' ? 'instructor' : 'admin';

    const form = useMaterialContents(courseSlug, moduleId, materialId, [content], routePrefix, content.id);

    if (!form.editing) return null;

    return (
        <div className="space-y-6">
            {/* Card 1: Main Content Settings */}
            <div className="space-y-6 border border-slate-200/80 bg-white p-4 shadow-sm sm:p-8 dark:border-slate-700 dark:bg-[#1e1f24]">
                <div className="flex flex-col items-start justify-between gap-3 border-b border-slate-100 pb-4 sm:flex-row sm:items-center dark:border-slate-700">
                    <div className="min-w-0">
                        <h2 className="text-lg font-bold break-words text-slate-900 dark:text-white">Main Content Settings</h2>
                        <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                            Set the title, publication status, and content type for this lesson.
                        </p>
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
                        <span
                            className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold tracking-wider uppercase ${
                                form.status === 'published'
                                    ? 'border border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-300'
                                    : 'border border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/50 dark:text-amber-300'
                            }`}
                        >
                            <span className={`h-1.5 w-1.5 ${form.status === 'published' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                            {form.status}
                        </span>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                    <div className="md:col-span-2">
                        <InputField
                            label="Material Content Title"
                            name="title"
                            value={form.title}
                            onChange={(e) => form.setTitle(e.target.value)}
                            placeholder="e.g., Introduction to HTML & Document Structure"
                        />
                    </div>

                    <div>
                        <SelectField
                            label="Publication Status"
                            value={form.status}
                            onChange={(e) => form.setStatus(e.target.value as 'draft' | 'published')}
                            options={[
                                { label: 'Draft (Unpublished)', value: 'draft' },
                                { label: 'Published (Student Accessible)', value: 'published' },
                            ]}
                        />
                    </div>
                </div>

                {/* Content Type Selector */}
                <div>
                    <label className="mb-3 block text-xs font-semibold tracking-wider text-slate-500 uppercase dark:text-slate-400">
                        Select Content Type
                    </label>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                        {TYPES.map((t) => {
                            const Icon = t.icon;
                            const isSelected = form.type === t.value;

                            return (
                                <button
                                    key={t.value}
                                    type="button"
                                    onClick={() => {
                                        form.setType(t.value);
                                        if (t.value !== 'quiz') form.setDuration('');
                                        if ((t.value === 'file' || t.value === 'ppt') && !form.contentUrl) {
                                            form.setSourceMode('upload');
                                        } else if (t.value === 'video') {
                                            form.setSourceMode('url');
                                        }
                                    }}
                                    className={`group relative flex flex-col items-start border p-4 text-left transition-all hover:scale-[1.01] ${
                                        isSelected
                                            ? t.activeCls
                                            : 'border-slate-200/90 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50/50 dark:border-slate-700 dark:bg-[#1e1f24] dark:text-slate-300 dark:hover:border-slate-600 dark:hover:bg-slate-700'
                                    }`}
                                >
                                    <div className={`mb-3 border p-2.5 transition-colors ${t.colorCls}`}>
                                        <Icon className="h-5 w-5" />
                                    </div>

                                    <span className="block text-sm leading-tight font-bold">{t.label}</span>
                                    <span className="mt-1 text-[11px] leading-snug text-slate-400 dark:text-slate-400">{t.desc}</span>

                                    {isSelected && (
                                        <div className="absolute top-3 right-3 text-emerald-600">
                                            <CheckCircle2 className="h-4 w-4 fill-emerald-100" />
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
                                    Uploading a new file replaces the current file. The student can view the file and download it from the lesson.
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
                                        onChange={(e) => form.setDuration(Number(e.target.value))}
                                        placeholder="30"
                                    />
                                </div>
                                <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">Minutes</span>
                            </div>
                        </div>

                        {/* Quick Duration Presets */}
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
                            {content.id ? (
                                <QuizBuilder
                                    courseSlug={courseSlug}
                                    moduleId={moduleId}
                                    materialId={materialId}
                                    contentId={content.id}
                                    routePrefix={routePrefix}
                                />
                            ) : (
                                <div className="border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
                                    Save content first before adding quiz questions.
                                </div>
                            )}
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
