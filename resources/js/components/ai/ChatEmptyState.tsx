import ChatAvatar from '@/components/ai/ChatAvatar';

export default function ChatEmptyState() {
    return (
        <div className="flex h-full min-h-64 flex-col items-center justify-center px-5 text-center">
            <div className="mb-4 flex items-center gap-3 border border-purple-100 bg-white px-4 py-3 shadow-sm dark:border-purple-950/50 dark:bg-slate-800">
                <ChatAvatar role="assistant" size="sm" />
                <div className="text-left">
                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-100">New Chat</p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">Start with a question about a course or learning path.</p>
                </div>
            </div>
            <p className="max-w-xs text-sm font-semibold text-slate-700 dark:text-slate-200">Start learning with AI Course Assistant</p>
            <p className="mt-1 max-w-xs text-xs leading-5 text-slate-500 dark:text-slate-400">
                Ask about courses, recommendations, or your learning goals.
            </p>
        </div>
    );
}
