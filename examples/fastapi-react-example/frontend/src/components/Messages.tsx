import type { Message } from '@/lib/stores';
import { memo, useEffect, useRef } from 'react';
import MessageComponent from './Message';

interface MessagesProps {
  messages: Message[];
  isLoading: boolean;
}

function MessagesComponent({ messages, isLoading }: MessagesProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  if (messages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center space-y-4">
        <div className="text-2xl">🚀</div>
        <div>
          <h3 className="text-lg font-semibold mb-2">Fastest Inference You Have Ever Seen!</h3>
          <p className="text-muted-foreground font-semibold text-sm max-w-md">
            {/* Ask me anything! I can help with coding, writing, analysis, and much more. */}
             By Ishaan Gupta 👨‍💻
          </p>
        </div>
      </div>
    );
  }

  return (
    <section className="flex flex-col space-y-12">
      {messages.map((message, index) => (
        <MessageComponent
          key={`${message.id}-${index}`}
          message={message}
          isStreaming={message.isStreaming || (isLoading && index === messages.length - 1)}
        />
      ))}
      
      {isLoading && messages.length > 0 && messages[messages.length - 1]?.role === 'user' && (
        <div className="flex items-start">
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center mr-3">
            <span className="text-primary-foreground text-sm font-medium">AI</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-2">
              <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
              <div className="w-2 h-2 bg-primary rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
              <div className="w-2 h-2 bg-primary rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
            </div>
          </div>
        </div>
      )}
      <div ref={messagesEndRef} />
    </section>
  );
}

const Messages = memo(MessagesComponent, (prevProps, nextProps) => {
  if (prevProps.messages.length !== nextProps.messages.length) return false;
  if (prevProps.isLoading !== nextProps.isLoading) return false;
  
  // Deep compare messages content
  for (let i = 0; i < prevProps.messages.length; i++) {
    const prevMessage = prevProps.messages[i];
    const nextMessage = nextProps.messages[i];
    
    if (prevMessage.content !== nextMessage.content) return false;
    if (prevMessage.isStreaming !== nextMessage.isStreaming) return false;
  }
  
  return true;
});

Messages.displayName = 'Messages';

export default Messages; 