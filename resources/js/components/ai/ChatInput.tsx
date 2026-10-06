import { FormEvent, KeyboardEvent, useState } from 'react';
import Button from '@/components/atoms/Button';
import InputField from '@/components/molecules/InputField';

interface ChatInputProps {
  onSend: (content: string) => void;
  disabled?: boolean;
}

export default function ChatInput({ onSend, disabled = false }: ChatInputProps) {
  const [input, setInput] = useState('');
  const isEmpty = !input.trim();

  const submit = () => {
    if (isEmpty || disabled) return;
    onSend(input.trim());
    setInput('');
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    submit();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      submit();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-end gap-2">
      <div className="relative min-w-0 flex-1">
        <InputField
          label=""
          name="message"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask about courses, skills, or a learning path..."
          disabled={disabled}
          maxLength={1000}
          aria-label="Message AI"
          className="h-10 min-h-10 rounded-xl border-slate-200 bg-slate-50 py-2 pl-3 pr-14 text-xs text-slate-900 placeholder:text-slate-400 focus:border-purple-500 focus:ring-purple-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500"
        />
        <span className="pointer-events-none absolute bottom-2.5 right-3 text-[9px] font-medium text-slate-400">{input.length}/1000</span>
      </div>
      <Button
        type="submit"
        size="sm"
        disabled={disabled || isEmpty}
        className="h-10 min-w-10 shrink-0 rounded-xl px-3"
        aria-label="Send message"
      >
        Send
      </Button>
    </form>
  );
}
