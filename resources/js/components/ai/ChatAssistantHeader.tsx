import ChatAvatar from '@/components/ai/ChatAvatar';

interface ChatAssistantHeaderProps {
  title?: string;
}

export default function ChatAssistantHeader({ title = 'AI Assistant' }: ChatAssistantHeaderProps) {
  return (
    <div className="flex min-w-0 items-center gap-2.5">
      <ChatAvatar role="assistant" size="sm" />
      <div className="min-w-0">
        <h3 className="truncate text-sm font-semibold text-white">{title}</h3>
        <p className="flex items-center gap-1.5 text-[10px] font-medium text-white/60">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_0_3px_rgba(52,211,153,0.12)]" />
          Online
        </p>
      </div>
    </div>
  );
}
