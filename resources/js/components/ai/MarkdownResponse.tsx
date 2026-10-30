import React from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeSanitize from 'rehype-sanitize';
import remarkGfm from 'remark-gfm';

interface MarkdownResponseProps {
    content: string;
    className?: string;
    variant?: 'default' | 'inverted';
}

export default function MarkdownResponse({ content, className = '', variant = 'default' }: MarkdownResponseProps) {
    const inverted = variant === 'inverted';

    const heading = inverted ? 'text-white' : 'text-slate-900 dark:text-white';
    const body = inverted ? 'text-white' : 'text-slate-600 dark:text-slate-300';
    const strong = inverted ? 'text-white' : 'text-slate-900 dark:text-white';
    const link = inverted
        ? 'font-medium text-white underline decoration-white/40 underline-offset-2 hover:text-white/80'
        : 'font-medium text-purple-600 underline decoration-purple-300 underline-offset-2 hover:text-purple-800 dark:text-purple-400 dark:decoration-purple-700';
    const code = inverted
        ? 'bg-white/15 px-1.5 py-0.5 font-mono text-xs text-white'
        : 'bg-slate-100 px-1.5 py-0.5 font-mono text-xs text-slate-700 dark:bg-[#1e1f24] dark:text-slate-200';
    const pre = inverted
        ? 'mb-3 overflow-x-auto border border-white/20 bg-black/30 p-4 text-xs leading-6 text-white'
        : 'mb-3 overflow-x-auto border border-slate-200 bg-[#141416] p-4 text-xs leading-6 text-slate-100 dark:border-slate-700';
    const tableWrapper = inverted
        ? 'mb-3 overflow-x-auto border border-white/20'
        : 'mb-3 overflow-x-auto border border-slate-200 dark:border-slate-700';
    const th = inverted
        ? 'border-b border-white/20 bg-white/10 px-3 py-2 font-semibold text-white'
        : 'border-b border-slate-200 bg-slate-50 px-3 py-2 font-semibold text-slate-700 dark:border-slate-700 dark:bg-[#1e1f24] dark:text-slate-200';
    const td = inverted
        ? 'border-b border-white/10 px-3 py-2 text-white'
        : 'border-b border-slate-100 px-3 py-2 text-slate-600 dark:border-slate-800 dark:text-slate-300';

    return (
        <div className={className}>
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeSanitize]}
                components={{
                    h1: ({ children }) => <h1 className={`mb-3 text-lg leading-snug font-bold ${heading}`}>{children}</h1>,
                    h2: ({ children }) => <h2 className={`mt-4 mb-2 text-base leading-snug font-bold ${heading}`}>{children}</h2>,
                    h3: ({ children }) => <h3 className={`mt-4 mb-2 text-sm font-bold ${heading}`}>{children}</h3>,
                    p: ({ children }) => <p className={`mb-3 text-sm leading-7 ${body}`}>{children}</p>,
                    ul: ({ children }) => <ul className={`mb-3 list-disc space-y-1 pl-5 text-sm leading-6 ${body}`}>{children}</ul>,
                    ol: ({ children }) => <ol className={`mb-3 list-decimal space-y-1 pl-5 text-sm leading-6 ${body}`}>{children}</ol>,
                    li: ({ children }) => <li className={inverted ? 'pl-1 text-white' : 'pl-1'}>{children}</li>,
                    strong: ({ children }) => <strong className={`font-semibold ${strong}`}>{children}</strong>,
                    a: ({ children, href }) => (
                        <a href={href} target="_blank" rel="noreferrer" className={link}>
                            {children}
                        </a>
                    ),
                    code: ({ children, className: codeClassName }) => (
                        <code className={codeClassName ? `${codeClassName} ${code}` : code}>{children}</code>
                    ),
                    pre: ({ children }) => <pre className={pre}>{children}</pre>,
                    table: ({ children }) => (
                        <div className={tableWrapper}>
                            <table className="w-full border-collapse text-left text-xs">{children}</table>
                        </div>
                    ),
                    th: ({ children }) => <th className={th}>{children}</th>,
                    td: ({ children }) => <td className={td}>{children}</td>,
                }}
            >
                {content}
            </ReactMarkdown>
        </div>
    );
}
