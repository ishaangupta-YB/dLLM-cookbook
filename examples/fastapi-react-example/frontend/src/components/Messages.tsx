import { useEffect, useRef } from 'react';
import { Bot, User, Zap, Waves } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Message } from '@/lib/stores';
import { useChatModeStore } from '@/lib/stores';

interface MessagesProps {
  messages: Message[];
  isLoading: boolean;
}

const Messages = ({ messages, isLoading }: MessagesProps) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { mode } = useChatModeStore();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
            mode === 'streaming' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300' : 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-300'
          }`}>
            {mode === 'streaming' ? <Zap className="h-8 w-8" /> : <Waves className="h-8 w-8" />}
          </div>
          <h3 className="text-lg font-medium text-foreground mb-2">
            {mode === 'streaming' ? 'Streaming Mode' : 'Diffusing Mode'}
          </h3>
          <p className="text-muted-foreground max-w-md">
            {mode === 'streaming' 
              ? 'Experience progressive AI responses as they build up token by token.'
              : 'Watch AI responses evolve and rewrite themselves in real-time.'
            }
          </p>
          <p className="text-sm text-muted-foreground mt-4">Start a conversation below!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto space-y-6">
      {messages.map((message) => (
        <div
          key={message.id}
          className={`flex items-start gap-4 ${
            message.role === 'user' ? 'justify-end' : 'justify-start'
          }`}
        >
          {message.role === 'assistant' && (
            <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
              mode === 'streaming' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300' : 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-300'
            }`}>
              <Bot className="h-4 w-4" />
            </div>
          )}
          
          <div
            className={`max-w-[75%] rounded-lg px-4 py-3 ${
              message.role === 'user'
                ? 'bg-primary text-primary-foreground'
                : message.isError
                ? 'bg-destructive/10 text-destructive border border-destructive/20'
                : mode === 'streaming'
                ? 'bg-muted text-muted-foreground'
                : 'bg-accent text-accent-foreground border-l-4 border-green-400'
            }`}
          >
            {message.role === 'user' ? (
              <p className="whitespace-pre-wrap text-sm">{message.content}</p>
            ) : (
              <div className="prose prose-sm max-w-none dark:prose-invert">
                <ReactMarkdown 
                  remarkPlugins={[remarkGfm]} 
                  components={{
                    p: ({ children }) => <p className="mb-2 last:mb-0 text-sm">{children}</p>,
                    code: ({ children, className }) => {
                      const isInline = !className;
                      return isInline ? (
                        <code className="bg-secondary text-secondary-foreground px-1 py-0.5 rounded text-xs font-mono">
                          {children}
                        </code>
                      ) : (
                        <pre className="bg-secondary text-secondary-foreground p-3 rounded-lg overflow-x-auto text-xs">
                          <code>{children}</code>
                        </pre>
                      );
                    },
                    ul: ({ children }) => <ul className="list-disc list-inside mb-2 text-sm">{children}</ul>,
                    ol: ({ children }) => <ol className="list-decimal list-inside mb-2 text-sm">{children}</ol>,
                    blockquote: ({ children }) => (
                      <blockquote className="border-l-4 border-border pl-4 italic mb-2 text-sm">
                        {children}
                      </blockquote>
                    ),
                    h1: ({ children }) => <h1 className="text-lg font-bold mb-2">{children}</h1>,
                    h2: ({ children }) => <h2 className="text-base font-bold mb-2">{children}</h2>,
                    h3: ({ children }) => <h3 className="text-sm font-bold mb-2">{children}</h3>,
                  }}
                >
                  {message.content}
                </ReactMarkdown>
              </div>
            )}
            
            {message.isStreaming && (
              <div className="flex items-center gap-2 mt-2 text-xs opacity-70">
                {mode === 'streaming' ? (
                  <>
                    <Zap className="h-3 w-3" />
                    <span>Streaming...</span>
                    <div className="streaming-indicator" />
                  </>
                ) : (
                  <>
                    <Waves className="h-3 w-3" />
                    <span>Diffusing...</span>
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
      ))}
      
      {isLoading && messages.length > 0 && !messages[messages.length - 1]?.isStreaming && (
        <div className="flex items-start gap-4">
          <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
            mode === 'streaming' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300' : 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-300'
          }`}>
            <Bot className="h-4 w-4" />
          </div>
          <div className={`max-w-[75%] rounded-lg px-4 py-3 ${
            mode === 'streaming' ? 'bg-muted text-muted-foreground' : 'bg-accent text-accent-foreground border-l-4 border-green-400'
          }`}>
            <div className="flex items-center gap-2 text-sm">
              {mode === 'streaming' ? (
                <>
                  <Zap className="h-4 w-4" />
                  <span>AI is thinking...</span>
                  <div className="streaming-indicator" />
                </>
              ) : (
                <>
                  <Waves className="h-4 w-4" />
                  <span>AI is diffusing...</span>
                  <div className="diffusing-indicator" />
                </>
              )}
            </div>
          </div>
        </div>
      )}
      <div ref={messagesEndRef} />
    </div>
  );
};

export default Messages; 