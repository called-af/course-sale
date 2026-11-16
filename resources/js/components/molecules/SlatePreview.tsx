import type { ReactNode } from 'react';

type LeafProps = {
    children: ReactNode;
    leaf: { text?: string; bold?: boolean; italic?: boolean; underline?: boolean };
};

type ElementProps = {
    children: ReactNode;
    element: { type?: string };
};

const renderLeaf = ({ children, leaf }: LeafProps) => {
    let content = children;
    if (leaf.bold) content = <strong className="font-semibold">{content}</strong>;
    if (leaf.italic) content = <em>{content}</em>;
    if (leaf.underline) content = <u>{content}</u>;
    return <span>{content}</span>;
};

const renderElement = ({ children, element }: ElementProps) => {
    switch (element.type) {
        case 'heading-one':
            return <h1 className="mb-3 text-2xl leading-tight font-bold text-gray-900 dark:text-white">{children}</h1>;
        case 'heading-two':
            return <h2 className="mb-2 text-xl leading-snug font-semibold text-gray-800 dark:text-slate-100">{children}</h2>;
        case 'block-quote':
            return (
                <blockquote className="my-3 rounded-r-md border-l-4 border-violet-400 bg-violet-50/40 py-2 pr-3 pl-4 text-gray-500 italic dark:bg-purple-950/20 dark:text-slate-400">
                    {children}
                </blockquote>   
            );
        case 'code':
            return (
                <pre className="my-3 overflow-x-auto rounded-lg bg-[#141416] p-4 font-mono text-sm leading-relaxed text-green-400">
                    <code>{children}</code>
                </pre>
            );
        case 'bulleted-list':
            return <ul className="my-2 list-disc space-y-1 pl-6">{children}</ul>;
        case 'numbered-list':
            return <ol className="my-2 list-decimal space-y-1 pl-6">{children}</ol>;
        case 'list-item':
            return <li className="text-gray-700 dark:text-slate-200">{children}</li>;
        default:
            return <p className="mb-2 leading-relaxed text-gray-700 dark:text-slate-200">{children}</p>;
    }
};

interface Props {
    value: unknown;
}

export default function SlatePreview({ value }: Props) {
    const isEmpty =
        !Array.isArray(value) || value.length === 0 || (value.length === 1 && value[0].children?.length === 1 && value[0].children[0].text === '');

    if (isEmpty) {
        return (
            <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50/60 p-8 text-center dark:border-slate-700 dark:bg-[#1e1f24]">
                <p className="text-sm text-gray-400 dark:text-slate-500">Your preview will appear here when you start writing.</p>
            </div>
        );
    }

    return (
        <div className="max-h-125 overflow-auto rounded-xl border border-gray-200 bg-gray-50/60 p-5 text-sm dark:border-slate-700 dark:bg-[#1e1f24]">
            {value.map((node, i: number) => (
                <div key={i}>
                    {renderElement({
                        element: node,
                        children: node.children?.map((child: { text?: string; bold?: boolean; italic?: boolean; underline?: boolean }, j: number) => (
                            <span key={j}>{renderLeaf({ leaf: child, children: child.text })}</span>
                        )),
                    })}
                </div>
            ))}
        </div>
    );
}
