import { Editor, Transforms, Element as SlateElement } from 'slate';
import EditorToolbarButton from '@/components/atoms/EditorToolbarButton';
import type { CustomElement } from '@/types/slate';

const LIST_TYPES = ['numbered-list', 'bulleted-list'];

const isMarkActive = (editor: Editor, format: string): boolean => {
    const marks = Editor.marks(editor);
    return marks ? (marks as Record<string, unknown>)[format] === true : false;
};

const toggleMark = (editor: Editor, format: string) => {
    if (isMarkActive(editor, format)) {
        Editor.removeMark(editor, format);
    } else {
        Editor.addMark(editor, format, true);
    }
};

const isBlockActive = (editor: Editor, format: string): boolean => {
    const [match] = Editor.nodes(editor, {
        match: (n) => !Editor.isEditor(n) && SlateElement.isElement(n) && n.type === format,
    });
    return !!match;
};

const toggleBlock = (editor: Editor, format: string) => {
    const isActive = isBlockActive(editor, format);
    const isList = LIST_TYPES.includes(format);

    Transforms.unwrapNodes(editor, {
        match: (n) => !Editor.isEditor(n) && SlateElement.isElement(n) && LIST_TYPES.includes(n.type),
        split: true,
    });

    const newType: CustomElement['type'] = isActive ? 'paragraph' : isList ? 'list-item' : (format as CustomElement['type']);
    Transforms.setNodes(editor, { type: newType });

    if (!isActive && isList) {
        Transforms.wrapNodes(editor, { type: format as CustomElement['type'], children: [] });
    }
};

const Divider = () => <div className="mx-0.5 h-5 w-px self-center bg-gray-200 dark:bg-slate-700" />;

interface Props {
    editor: Editor;
}

export default function SlateToolbar({ editor }: Props) {
    return (
        <div className="mb-3 flex flex-wrap items-center gap-0.5 border-b border-gray-100 pb-3 dark:border-slate-700">
            <EditorToolbarButton
                active={isMarkActive(editor, 'bold')}
                onMouseDown={(e) => {
                    e.preventDefault();
                    toggleMark(editor, 'bold');
                }}
                tooltip="Bold (Ctrl+B)"
            >
                <strong className="text-sm">B</strong>
            </EditorToolbarButton>

            <EditorToolbarButton
                active={isMarkActive(editor, 'italic')}
                onMouseDown={(e) => {
                    e.preventDefault();
                    toggleMark(editor, 'italic');
                }}
                tooltip="Italic (Ctrl+I)"
            >
                <em className="text-sm not-italic" style={{ fontStyle: 'italic' }}>
                    I
                </em>
            </EditorToolbarButton>

            <EditorToolbarButton
                active={isMarkActive(editor, 'underline')}
                onMouseDown={(e) => {
                    e.preventDefault();
                    toggleMark(editor, 'underline');
                }}
                tooltip="Underline (Ctrl+U)"
            >
                <u className="text-sm">U</u>
            </EditorToolbarButton>

            <Divider />

            <EditorToolbarButton
                active={isBlockActive(editor, 'heading-one')}
                onMouseDown={(e) => {
                    e.preventDefault();
                    toggleBlock(editor, 'heading-one');
                }}
                tooltip="Heading 1"
            >
                <span className="text-xs font-bold tracking-tight">H1</span>
            </EditorToolbarButton>

            <EditorToolbarButton
                active={isBlockActive(editor, 'heading-two')}
                onMouseDown={(e) => {
                    e.preventDefault();
                    toggleBlock(editor, 'heading-two');
                }}
                tooltip="Heading 2"
            >
                <span className="text-xs font-bold tracking-tight">H2</span>
            </EditorToolbarButton>

            <Divider />

            <EditorToolbarButton
                active={isBlockActive(editor, 'bulleted-list')}
                onMouseDown={(e) => {
                    e.preventDefault();
                    toggleBlock(editor, 'bulleted-list');
                }}
                tooltip="Bullet List"
            >
                <span className="text-sm leading-none">☰</span>
            </EditorToolbarButton>

            <EditorToolbarButton
                active={isBlockActive(editor, 'numbered-list')}
                onMouseDown={(e) => {
                    e.preventDefault();
                    toggleBlock(editor, 'numbered-list');
                }}
                tooltip="Numbered List"
            >
                <span className="font-mono text-xs leading-none">1≡</span>
            </EditorToolbarButton>

            <Divider />

            <EditorToolbarButton
                active={isBlockActive(editor, 'block-quote')}
                onMouseDown={(e) => {
                    e.preventDefault();
                    toggleBlock(editor, 'block-quote');
                }}
                tooltip="Block Quote"
            >
                <span className="font-serif text-base leading-none">"</span>
            </EditorToolbarButton>

            <EditorToolbarButton
                active={isBlockActive(editor, 'code')}
                onMouseDown={(e) => {
                    e.preventDefault();
                    toggleBlock(editor, 'code');
                }}
                tooltip="Code Block"
            >
                <span className="font-mono text-xs leading-none">{'</>'}</span>
            </EditorToolbarButton>
        </div>
    );
}
