import ChatMessageBubble from '@/components/ai/ChatMessageBubble';
import type { ChatMessageData } from '@/components/ai/types';

interface ChatMessageProps {
  message: ChatMessageData;
}

export default function ChatMessage({ message }: ChatMessageProps) {
  return <ChatMessageBubble message={message} />;
}
