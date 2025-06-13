'use client';

import { useState, useCallback, useRef } from 'react';
import { Message, ApiKeys, ChatMode } from '@/lib/types';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import ApiKeySetup from './ApiKeySetup';
import { ModeToggle } from './mode-toggle';
import { Button } from '@/components/ui/button';
import { Zap, Waves, Settings, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<ChatMode>('streaming');
  const [apiKeys, setApiKeys] = useState<ApiKeys>({});
  const [showApiSetup, setShowApiSetup] = useState(true);
  const messageIdRef = useRef(0);

  const canChat = () => {
    return !!apiKeys.inception;
  };

  const generateUniqueId = () => {
    messageIdRef.current += 1;
    return `msg_${Date.now()}_${messageIdRef.current}`;
  };

  const addMessage = useCallback((message: Omit<Message, 'id' | 'timestamp'>) => {
    const newMessage: Message = {
      ...message,
      id: generateUniqueId(),
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, newMessage]);
    return newMessage.id;
  }, []);

  const updateMessage = useCallback((id: string, updates: Partial<Message>) => {
    setMessages(prev => prev.map(msg => 
      msg.id === id ? { ...msg, ...updates } : msg
    ));
  }, []);

  const sendMessage = async (content: string) => {
    if (!canChat()) return;

    setIsLoading(true);
    addMessage({ role: 'user', content });

    const assistantMessageId = addMessage({ 
      role: 'assistant', 
      content: '', 
      isStreaming: true 
    });

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: content,
          messages: messages.map(msg => ({
            role: msg.role,
            content: msg.content
          })),
          mode,
          apiKeys,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let accumulatedContent = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || !trimmed.startsWith('data: ')) continue;
            if (trimmed === 'data: [DONE]') continue;

            const jsonStr = trimmed.substring(6);
            if (!jsonStr.startsWith('{')) continue;

            try {
              const data = JSON.parse(jsonStr);
              
              if (data.choices?.[0]?.delta?.content !== undefined) {
                const newContent = data.choices[0].delta.content;
                
                if (mode === 'streaming') {
                  // Streaming: accumulate content
                  accumulatedContent += newContent;
                  updateMessage(assistantMessageId, {
                    content: accumulatedContent,
                    isStreaming: true
                  });
                } else {
                  // Diffusing: replace entire content
                  updateMessage(assistantMessageId, {
                    content: newContent || '',
                    isStreaming: true
                  });
                }
              }
            } catch (error) {
              console.error('JSON parsing error:', error);
            }
          }
        }
      }

      updateMessage(assistantMessageId, { isStreaming: false });

    } catch (error) {
      console.error('Chat error:', error);
      updateMessage(assistantMessageId, {
        content: 'Sorry, an error occurred while processing your request.',
        isStreaming: false
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-background text-foreground">
      <div className="bg-background/95 backdrop-blur-sm border-b border-border shadow-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-foreground">AI Chat Assistant</h1>
            
            <div className="flex items-center gap-3">
              <div className="flex bg-muted/50 rounded-lg p-1 border border-border/50">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setMode('streaming')}
                  className={cn(
                    "flex items-center gap-2 transition-all duration-200 relative",
                    mode === 'streaming' 
                      ? 'bg-primary text-primary-foreground shadow-md scale-105' 
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/80'
                  )}
                >
                  <Zap className={cn("h-4 w-4", mode === 'streaming' && "animate-pulse")} />
                  Streaming
                  {mode === 'streaming' && (
                    <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setMode('diffusing')}
                  className={cn(
                    "flex items-center gap-2 transition-all duration-200 relative",
                    mode === 'diffusing' 
                      ? 'bg-green-600 text-white shadow-md scale-105 dark:bg-green-500' 
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/80'
                  )}
                >
                  <Waves className={cn("h-4 w-4", mode === 'diffusing' && "animate-bounce")} />
                  Diffusing
                  {mode === 'diffusing' && (
                    <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full animate-bounce" />
                  )}
                </Button>
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowApiSetup(!showApiSetup)}
                className={cn(
                  "text-muted-foreground hover:text-foreground transition-all duration-200",
                  showApiSetup && "bg-muted text-foreground"
                )}
              >
                <Settings className={cn("h-4 w-4 mr-2", showApiSetup && "animate-spin")} />
                API Setup
                <ChevronDown className={cn("h-4 w-4 ml-2 transition-transform duration-200", showApiSetup && "rotate-180")} />
              </Button>

              <ModeToggle />
            </div>
          </div>
        </div>
      </div>

      <div className={cn(
        "max-w-4xl mx-auto w-full px-4 transition-all duration-300 ease-in-out overflow-hidden",
        showApiSetup ? "py-4 opacity-100" : "py-0 opacity-0 h-0"
      )}>
        <ApiKeySetup apiKeys={apiKeys} onApiKeysChange={setApiKeys} />
      </div>

      <div className="flex-1 max-w-4xl mx-auto w-full flex flex-col">
        {messages.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className={cn(
                "w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 transition-all duration-300",
                mode === 'streaming' 
                  ? 'bg-primary/10 text-primary animate-pulse' 
                  : 'bg-green-500/10 text-green-600 dark:text-green-500 animate-bounce'
              )}>
                {mode === 'streaming' ? <Zap className="h-8 w-8" /> : <Waves className="h-8 w-8" />}
              </div>
              <h3 className="text-lg font-medium text-foreground mb-2">
                {mode === 'streaming' ? 'Streaming Mode' : 'Diffusing Mode'}
              </h3>
              <p className="text-muted-foreground max-w-md">
                {mode === 'streaming' 
                  ? 'Experience progressive AI responses as they build up token by token via Inception Labs.'
                  : 'Watch AI responses evolve and rewrite themselves in real-time via Inception Labs.'
                }
              </p>
              {canChat() ? (
                <p className="text-sm text-muted-foreground mt-4">Start a conversation below!</p>
              ) : (
                <p className="text-sm text-orange-600 mt-4 font-medium">
                  Please set up your API key above to start chatting.
                </p>
              )}
            </div>
          </div>
        ) : (
          <MessageList messages={messages} mode={mode} />
        )}
      </div>

      <MessageInput
        onSendMessage={sendMessage}
        isLoading={isLoading}
        disabled={!canChat()}
      />
    </div>
  );
} 