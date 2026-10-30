import ChatAvatar from '@/components/ai/ChatAvatar';

export default function TypingIndicator() {
    return (
        <div className="flex items-start gap-3" aria-label="AI sedang berpikir">
            <ChatAvatar role="assistant" size="sm" />
            <div className="flex h-10 items-center gap-1.5 border border-slate-200 bg-white px-4 shadow-sm dark:border-slate-700 dark:bg-slate-800">
                <span className="h-1.5 w-1.5 animate-bounce bg-purple-500 [animation-delay:-0.2s]" />
                <span className="h-1.5 w-1.5 animate-bounce bg-purple-500 [animation-delay:-0.1s]" />
                <span className="h-1.5 w-1.5 animate-bounce bg-purple-500" />
            </div>
        </div>
    );
}
