import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSanitize from 'rehype-sanitize';

interface MarkdownResponseProps {
  content: string;
  className?: string;
}

export default function MarkdownResponse({ content, className = '' }: MarkdownResponseProps) {
  return (
    <div className={className}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeSanitize]}
        components={{
        h1: ({ children }) => <h1 className="mb-3 text-lg font-bold leading-snug text-slate-900 dark:text-white">{children}</h1>,
        h2: ({ children }) => <h2 className="mb-2 mt-4 text-base font-bold leading-snug text-slate-900 dark:text-white">{children}</h2>,
        h3: ({ children }) => <h3 className="mb-2 mt-4 text-sm font-bold text-slate-900 dark:text-white">{children}</h3>,
        p: ({ children }) => <p className="mb-3 text-sm leading-7 text-slate-600 dark:text-slate-300">{children}</p>,
        ul: ({ children }) => <ul className="mb-3 list-disc space-y-1 pl-5 text-sm leading-6 text-slate-600 dark:text-slate-300">{children}</ul>,
        ol: ({ children }) => <ol className="mb-3 list-decimal space-y-1 pl-5 text-sm leading-6 text-slate-600 dark:text-slate-300">{children}</ol>,
        li: ({ children }) => <li className="pl-1">{children}</li>,
        strong: ({ children }) => <strong className="font-semibold text-slate-900 dark:text-white">{children}</strong>,
        a: ({ children, href }) => (
          <a
            href={href}
            target="_blank"
            rel="noreferrer"
            className="font-medium text-purple-600 underline decoration-purple-300 underline-offset-2 hover:text-purple-800 dark:text-purple-400 dark:decoration-purple-700"
          >
            {children}
          </a>
        ),
        code: ({ children, className }) => (
          <code className={className ?? 'rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs text-slate-700 dark:bg-slate-800 dark:text-slate-200'}>
            {children}
          </code>
        ),
        pre: ({ children }) => (
          <pre className="mb-3 overflow-x-auto rounded-xl border border-slate-200 bg-slate-950 p-4 text-xs leading-6 text-slate-100 dark:border-slate-700">
            {children}
          </pre>
        ),
        table: ({ children }) => (
          <div className="mb-3 overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
            <table className="w-full border-collapse text-left text-xs">{children}</table>
          </div>
        ),
        th: ({ children }) => <th className="border-b border-slate-200 bg-slate-50 px-3 py-2 font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">{children}</th>,
          td: ({ children }) => <td className="border-b border-slate-100 px-3 py-2 text-slate-600 dark:border-slate-800 dark:text-slate-300">{children}</td>,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
