import { Bot, UserRound } from 'lucide-react';

interface ChatAvatarProps {
    role: 'user' | 'assistant';
    size?: 'sm' | 'md';
}

export default function ChatAvatar({ role, size = 'sm' }: ChatAvatarProps) {
    const isAssistant = role === 'assistant';
    const dimensions = size === 'sm' ? 'h-7 w-7' : 'h-9 w-9';

    return (
        <div
            className={`flex shrink-0 items-center justify-center ${dimensions} ${
                isAssistant
                    ? 'bg-gradient-to-br from-purple-500 to-purple-700 text-white shadow-md shadow-purple-500/20'
                    : 'bg-slate-100 text-slate-600 dark:bg-[#1e1f24] dark:text-slate-300'
            }`}
            aria-label={isAssistant ? 'AI Assistant' : 'User'}
        >
            {isAssistant ? (
                <Bot className={size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4'} />
            ) : (
                <UserRound className={size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4'} />
            )}
        </div>
    );
}
