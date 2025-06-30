import { memo, useState } from 'react';
import type { Message as MessageType } from '@/lib/stores';
import { cn } from '@/lib/utils';
import { Copy, Check, AlertCircle } from 'lucide-react';
import { Button } from './ui/button';
import MemoizedMarkdown from './MemoizedMarkdown';

interface MessageProps {
  message: MessageType;
  isStreaming?: boolean;
}

function MessageComponent({ message, isStreaming = false }: MessageProps) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy message:', error);
    }
  };

  if (message.role === 'user') {
    return (
      <div className="flex justify-end group">
        <div className="relative max-w-[80%]">
          <div className="bg-primary text-primary-foreground rounded-2xl px-4 py-3 shadow-md">
            <p className="text-sm leading-relaxed">{message.content}</p>
          </div>
          
          {/* Copy button positioned outside the message */}
          <Button
            onClick={copyToClipboard}
            variant="ghost"
            size="sm"
            className="absolute -left-10 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 p-0"
          >
            {copied ? (
              <Check className="h-3 w-3 text-green-500" />
            ) : (
              <Copy className="h-3 w-3" />
            )}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start space-x-3 group">
      <div className="flex-shrink-0">
        <div className={cn(
          "w-8 h-8 rounded-full flex items-center justify-center",
          message.isError ? "bg-red-500/10" : "bg-muted"
        )}>
          {message.isError ? (
            <AlertCircle className="w-4 h-4 text-red-500" />
          ) : (
            <span className="text-xs font-medium">AI</span>
          )}
        </div>
      </div>
      
      <div className="flex-1 min-w-0 relative">
        <div className={cn(
          "prose prose-sm max-w-none",
          isStreaming && "opacity-80",
          message.isError && "prose-red"
        )}>
          {message.content ? (
            <div className={cn(
              message.isError && "text-red-600 dark:text-red-400"
            )}>
              <MemoizedMarkdown 
                content={message.content} 
                id={message.id}
              />
            </div>
          ) : (
            <div className="flex items-center space-x-2 py-2">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-pulse"></div>
                <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
              </div>
              <span className="text-xs text-muted-foreground">Thinking...</span>
            </div>
          )}
        </div>
        
        {/* Copy button positioned outside the message */}
        {message.content && (
          <Button
            onClick={copyToClipboard}
            variant="ghost"
            size="sm"
            className="absolute -right-10 top-2 opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 p-0"
          >
            {copied ? (
              <Check className="h-3 w-3 text-green-500" />
            ) : (
              <Copy className="h-3 w-3" />
            )}
          </Button>
        )}
      </div>
    </div>
  );
}

const Message = memo(MessageComponent, (prevProps, nextProps) => {
  return (
    prevProps.message.id === nextProps.message.id &&
    prevProps.message.content === nextProps.message.content &&
    prevProps.isStreaming === nextProps.isStreaming &&
    prevProps.message.isError === nextProps.message.isError
  );
});

Message.displayName = 'Message';

export default Message; 