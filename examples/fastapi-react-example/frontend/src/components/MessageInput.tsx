import { useState } from 'react';
import { Send, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

const MessageInput = ({ onSendMessage, isLoading, disabled }: { onSendMessage: (message: string) => void, isLoading: boolean, disabled: boolean }) => {
  const [input, setInput] = useState('');

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (input.trim() && !isLoading && !disabled) {
      onSendMessage(input.trim());
      setInput('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as unknown as React.FormEvent<HTMLFormElement>);
    }
  };

  return (
    <div className="absolute bottom-0 left-0 right-0 border-t bg-background/95 backdrop-blur-sm p-4">
      <form onSubmit={handleSubmit} className="flex gap-3 items-end max-w-4xl mx-auto">
        <div className="flex-1">
          <textarea
            value={input}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message... (Shift+Enter for new line)"
            disabled={disabled || isLoading}
            className="w-full px-4 py-3 border border-border rounded-2xl bg-background text-foreground focus:ring-2 focus:ring-ring focus:border-transparent resize-none max-h-32 disabled:opacity-50 disabled:cursor-not-allowed"
            rows={1}
            style={{
              height: 'auto',
              minHeight: '48px',
            }}
            onInput={(e: React.FormEvent<HTMLTextAreaElement>) => {
              const target = e.target as HTMLTextAreaElement;
              target.style.height = 'auto';
              target.style.height = `${Math.min(target.scrollHeight, 128)}px`;
            }}
          />
        </div>
        <Button
          type="submit"
          disabled={!input.trim() || isLoading || disabled}
          size="sm"
          className="h-12 w-12 rounded-2xl"
        >
          {isLoading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Send className="h-5 w-5" />
          )}
        </Button>
      </form>
    </div>
  );
};

export default MessageInput;