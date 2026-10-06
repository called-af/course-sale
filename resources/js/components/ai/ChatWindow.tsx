import { useEffect, useRef } from 'react';
import ChatMessage from '@/components/ai/ChatMessage';
import ChatEmptyState from '@/components/ai/ChatEmptyState';
import TypingIndicator from '@/components/ai/TypingIndicator';
import type { ChatMessageData } from '@/components/ai/types';

interface ChatWindowProps {
  messages: ChatMessageData[];
  isLoading?: boolean;
}

export default function ChatWindow({ messages, isLoading = false }: ChatWindowProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, isLoading]);

  return (
    <div className="h-full min-h-0 flex-1 overflow-y-auto bg-slate-50 px-4 py-5 dark:bg-slate-950 sm:px-5">
      {messages.length === 0 ? (
        <ChatEmptyState />
      ) : (
        <div className="space-y-5">
          {messages.map((message) => (
            <ChatMessage key={message.id ?? `${message.role}-${message.content}`} message={message} />
          ))}
          {isLoading && <TypingIndicator />}
        </div>
      )}
      <div ref={messagesEndRef} />
    </div>
  );
}
