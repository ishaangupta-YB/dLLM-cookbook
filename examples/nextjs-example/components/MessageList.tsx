'use client';

import { useEffect, useRef, useMemo, memo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Message, ChatMode } from '@/lib/types';
import { User, Bot, Zap, Waves } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MessageListProps {
  messages: Message[];
  mode: ChatMode;
}

const MessageComponent = memo(({ message, mode }: { message: Message; mode: ChatMode }) => {
  const markdownComponents = useMemo(() => ({
    p: ({ children }: any) => <p className="mb-2 last:mb-0 text-inherit">{children}</p>,
    code: ({ children, className }: any) => {
      const isInline = !className;
      return isInline ? (
        <code className="bg-muted/50 text-foreground px-1 py-0.5 rounded text-sm font-mono">
          {children}
        </code>
      ) : (
        <pre className="bg-muted border border-border p-3 rounded-lg overflow-x-auto my-2">
          <code className="text-foreground">{children}</code>
        </pre>
      );
    },
    ul: ({ children }: any) => <ul className="list-disc list-inside mb-2 text-inherit">{children}</ul>,
    ol: ({ children }: any) => <ol className="list-decimal list-inside mb-2 text-inherit">{children}</ol>,
    blockquote: ({ children }: any) => (
      <blockquote className="border-l-4 border-border pl-4 italic mb-2 text-muted-foreground">
        {children}
      </blockquote>
    ),
    h1: ({ children }: any) => <h1 className="text-xl font-bold mb-2 text-inherit">{children}</h1>,
    h2: ({ children }: any) => <h2 className="text-lg font-semibold mb-2 text-inherit">{children}</h2>,
    h3: ({ children }: any) => <h3 className="text-base font-medium mb-2 text-inherit">{children}</h3>,
    strong: ({ children }: any) => <strong className="font-semibold text-inherit">{children}</strong>,
    em: ({ children }: any) => <em className="italic text-inherit">{children}</em>,
    a: ({ children, href }: any) => (
      <a href={href} className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">
        {children}
      </a>
    ),
  }), []);

  return (
    <div
      className={`flex items-start gap-3 ${
        message.role === 'user' ? 'justify-end' : 'justify-start'
      }`}
    >
      {message.role === 'assistant' && (
        <div className={cn(
          "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center",
          mode === 'streaming' 
            ? 'bg-primary/10 text-primary' 
            : 'bg-green-500/10 text-green-600 dark:text-green-500'
        )}>
          <Bot className="h-4 w-4" />
        </div>
      )}
      
      <div
        className={cn(
          "max-w-3xl rounded-2xl px-4 py-3 transition-all duration-200",
          message.role === 'user'
            ? 'bg-primary text-primary-foreground'
            : mode === 'streaming'
            ? 'bg-muted text-muted-foreground border border-border/50'
            : 'bg-green-50 text-green-900 border border-green-200 dark:bg-green-950/50 dark:text-green-100 dark:border-green-400',
          message.isStreaming && 'animate-diffuse shadow-md'
        )}
      >
        {message.role === 'user' ? (
          <p className="whitespace-pre-wrap break-words">{message.content}</p>
        ) : (
          <div className="prose prose-sm max-w-none dark:prose-invert">
            <ReactMarkdown 
              remarkPlugins={[remarkGfm]}
              components={markdownComponents}
            >
              {message.content || '...'}
            </ReactMarkdown>
          </div>
        )}
        
        {message.isStreaming && (
          <div className="flex items-center gap-2 mt-2 text-xs opacity-70">
            {mode === 'streaming' ? (
              <>
                <Zap className="h-3 w-3 animate-pulse" />
                <span>Streaming via Inception Labs...</span>
                <div className="streaming-indicator" />
              </>
            ) : (
              <>
                <Waves className="h-3 w-3 animate-bounce" />
                <span>Diffusing via Inception Labs...</span>
                <div className="diffusing-indicator" />
              </>
            )}
          </div>
        )}
      </div>

      {message.role === 'user' && (
        <div className="flex-shrink-0 w-8 h-8 bg-primary rounded-full flex items-center justify-center">
          <User className="h-4 w-4 text-primary-foreground" />
        </div>
      )}
    </div>
  );
});

MessageComponent.displayName = 'MessageComponent';

function MessageList({ messages, mode }: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages.length]);

  const memoizedMessages = useMemo(() => {
    return messages.map((message) => (
      <MessageComponent key={message.id} message={message} mode={mode} />
    ));
  }, [messages, mode]);

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {memoizedMessages}
      <div ref={messagesEndRef} />
    </div>
  );
}

export default memo(MessageList); 