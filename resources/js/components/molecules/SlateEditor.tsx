import { useCallback, useMemo } from 'react';
import { createEditor, Editor } from 'slate';
import type { Descendant } from 'slate';
import type { RenderElementProps, RenderLeafProps } from 'slate-react';
import { Slate, Editable, withReact } from 'slate-react';
import SlateToolbar from '@/components/molecules/SlateToolbar';

const renderLeaf = ({ attributes, children, leaf }: RenderLeafProps) => {
    let content = children;
    if (leaf.bold) content = <strong>{content}</strong>;
    if (leaf.italic) content = <em>{content}</em>;
    if (leaf.underline) content = <u>{content}</u>;
    return <span {...attributes}>{content}</span>;
};

const renderElement = ({ attributes, children, element }: RenderElementProps) => {
    switch (element.type) {
        case 'heading-one':
            return (
                <h1 {...attributes} className="mb-3 text-2xl leading-tight font-bold text-gray-900 dark:text-white">
                    {children}
                </h1>
            );
        case 'heading-two':
            return (
                <h2 {...attributes} className="mb-2 text-xl leading-snug font-semibold text-gray-800 dark:text-slate-100">
                    {children}
                </h2>
            );
        case 'block-quote':
            return (
                <blockquote
                    {...attributes}
                    className="my-3 rounded-r-md border-l-4 border-violet-400 bg-violet-50/40 py-2 pr-3 pl-4 text-gray-500 italic dark:bg-purple-950/20 dark:text-slate-400"
                >
                    {children}
                </blockquote>
            );
        case 'code':
            return (
                <pre {...attributes} className="my-3 overflow-x-auto rounded-lg bg-[#141416] p-4 font-mono text-sm leading-relaxed text-green-400">
                    <code>{children}</code>
                </pre>
            );
        case 'bulleted-list':
            return (
                <ul {...attributes} className="my-2 list-disc space-y-1 pl-6">
                    {children}
                </ul>
            );
        case 'numbered-list':
            return (
                <ol {...attributes} className="my-2 list-decimal space-y-1 pl-6">
                    {children}
                </ol>
            );
        case 'list-item':
            return (
                <li {...attributes} className="text-gray-700 dark:text-slate-200">
                    {children}
                </li>
            );
        default:
            return (
                <p {...attributes} className="mb-2 leading-relaxed text-gray-700 dark:text-slate-200">
                    {children}
                </p>
            );
    }
};

function getWordCount(value: unknown): number {
    if (!Array.isArray(value)) return 0;
    const text = value.flatMap((node) => (node.children ?? []).map((child: { text?: string }) => child.text ?? '')).join(' ');
    const trimmed = text.trim();
    return trimmed ? trimmed.split(/\s+/).length : 0;
}

/**
 * Slate crashes if any node has `children: undefined`.
 * This normalizes any value from the DB into a safe Slate document.
 */
function normalizeSlateValue(v: unknown): Descendant[] {
    const empty = [{ type: 'paragraph', children: [{ text: '' }] }] as Descendant[];
    if (!Array.isArray(v) || v.length === 0) return empty;

    const normalized = (v as { type?: string; children?: { text?: string }[] }[]).filter(Boolean).map((node) => ({
        ...node,
        type: typeof node.type === 'string' ? node.type : 'paragraph',
        children:
            Array.isArray(node.children) && node.children.length > 0
                ? node.children.map((child) => ({
                      ...child,
                      // text must come AFTER spread so undefined from DB never wins
                      text: typeof child.text === 'string' ? child.text : '',
                  }))
                : [{ text: '' }],
    }));

    return (normalized.length > 0 ? normalized : empty) as Descendant[];
}

interface Props {
    value: unknown;
    onChange: (value: unknown) => void;
    /** Pass content.content_text to ensure correct initialization */
    initialValue?: unknown;
}

export default function SlateEditor({ value, onChange, initialValue: initialValueProp }: Props) {
    const editor = useMemo(() => withReact(createEditor()), []);

    const initialValue = useMemo(() => {
        // Prefer the explicit initialValue prop (direct from DB content),
        // fall back to the reactive value state.
        return normalizeSlateValue(initialValueProp ?? value);
    }, [initialValueProp, value]); // re-init when the source content changes

    const onKeyDown = useCallback(
        (event: React.KeyboardEvent) => {
            if (!event.ctrlKey && !event.metaKey) return;

            const toggleMark = (mark: 'bold' | 'italic' | 'underline') => {
                const hasMark = Editor.marks(editor)?.[mark] === true;
                if (hasMark) {
                    Editor.removeMark(editor, mark);
                } else {
                    Editor.addMark(editor, mark, true);
                }
            };

            switch (event.key) {
                case 'b':
                    event.preventDefault();
                    toggleMark('bold');
                    break;
                case 'i':
                    event.preventDefault();
                    toggleMark('italic');
                    break;
                case 'u':
                    event.preventDefault();
                    toggleMark('underline');
                    break;
            }
        },
        [editor],
    );

    const wordCount = useMemo(() => {
        return Array.isArray(value) ? getWordCount(value) : 0;
    }, [value]);

    return (
        <div className="border border-gray-300 bg-white px-3 py-2 text-sm transition-all focus-within:border-purple-700 focus-within:ring-1 focus-within:ring-purple-700 dark:border-slate-600 dark:bg-[#1e1f24] dark:focus-within:border-purple-500 dark:focus-within:ring-purple-500">
            <div className="px-4 pt-3">
                <SlateToolbar editor={editor} />
            </div>

            <div className="px-4 pb-2">
                <Slate editor={editor} initialValue={initialValue} onChange={onChange}>
                    <Editable
                        renderElement={renderElement}
                        renderLeaf={renderLeaf}
                        onKeyDown={onKeyDown}
                        placeholder="Start writing your content here..."
                        className="min-h-55 text-sm leading-relaxed text-slate-900 outline-none dark:text-slate-100"
                    />
                </Slate>
            </div>

            <div className="flex items-center justify-between border-t border-gray-100 bg-gray-50/60 px-4 py-2 dark:border-slate-700 dark:bg-[#1e1f24]">
                <span className="text-xs text-gray-400 dark:text-slate-500">
                    {wordCount} {wordCount === 1 ? 'kata' : 'kata'}
                </span>
                <span className="hidden text-xs text-gray-400 sm:block dark:text-slate-500">
                    <kbd className="rounded bg-gray-200 px-1 py-0.5 font-mono text-xs text-gray-500 dark:bg-slate-700 dark:text-slate-400">
                        Ctrl+B
                    </kbd>{' '}
                    Bold ·{' '}
                    <kbd className="rounded bg-gray-200 px-1 py-0.5 font-mono text-xs text-gray-500 dark:bg-slate-700 dark:text-slate-400">
                        Ctrl+I
                    </kbd>{' '}
                    Italic ·{' '}
                    <kbd className="rounded bg-gray-200 px-1 py-0.5 font-mono text-xs text-gray-500 dark:bg-slate-700 dark:text-slate-400">
                        Ctrl+U
                    </kbd>{' '}
                    Underline
                </span>
            </div>
        </div>
    );
}
