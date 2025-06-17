import { useState, useCallback, useEffect } from 'react';
import { Settings, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ModeToggle } from './mode-toggle';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import Messages from './Messages';
import ChatInput from './ChatInput';
import ApiKeySetup from './ApiKeySetup';
import LoadingSkeleton from './LoadingSkeleton';
import { useAPIKeyStore, useChatModeStore, useChatStore } from '@/lib/stores';

const API_BASE_URL = 'http://localhost:8000';

const ChatInterface = () => {
  const [mounted, setMounted] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [showApiKeyDialog, setShowApiKeyDialog] = useState(false);
  const [abortController, setAbortController] = useState<AbortController | null>(null);
  
  const { hasRequiredKeys, apiKeys, validationResult } = useAPIKeyStore();
  const { mode } = useChatModeStore();
  const { 
    messages, 
    isLoading, 
    toolsEnabled,
    addMessage, 
    updateMessage, 
    clearMessages, 
    setLoading,
  } = useChatStore();

  useEffect(() => {
    setMounted(true);
    const timer = setTimeout(() => {
      setInitializing(false);
    }, 500);
    
    return () => clearTimeout(timer);
  }, []);

  const handleStop = useCallback(() => {
    if (abortController) {
      abortController.abort();
      setAbortController(null);
      setLoading(false);
      toast.info('Response generation stopped');
    }
  }, [abortController, setLoading]);

  const sendMessage = useCallback(async (content: string) => {
    if (!hasRequiredKeys() || validationResult?.valid !== true || isLoading) return;
    setLoading(true);
    addMessage({ role: 'user', content });

    const assistantMessageId = addMessage({ 
      role: 'assistant', 
      content: '', 
      isStreaming: true 
    });

    const controller = new AbortController();
    setAbortController(controller);

    try {
      const response = await fetch(`${API_BASE_URL}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [...messages, { role: 'user', content }].map(msg => ({
            role: msg.role,
            content: msg.content
          })),
          mode,
          inception_api_key: apiKeys.inception,
          tavily_api_key: apiKeys.tavily || null,
          tools_enabled: toolsEnabled && !!apiKeys.tavily,
          max_tokens: 800,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = 'An error occurred while processing your request.';
        
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.error || errorMessage;
        } catch {
        }

        if (response.status === 401) {
          errorMessage = 'Invalid API key. Please check your credentials.';
          toast.error('Authentication failed - Please check your API key');
        } else if (response.status === 429) {
          errorMessage = 'Rate limit exceeded. Please try again later.';
          toast.error('Rate limit exceeded - Please wait before sending another message');
        } else if (response.status >= 500) {
          errorMessage = 'Server error occurred. Please try again.';
          toast.error('Server error - Please try again');
        } else {
          toast.error(`Request failed: ${errorMessage}`);
        }

        updateMessage(assistantMessageId, {
          content: `**Error:** ${errorMessage}`,
          isStreaming: false,
          isError: true
        });
        return;
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
              
              if (data.error) {
                throw new Error(data.error);
              }
              
              if (data.content !== undefined) {
                if (mode === 'streaming') {
                  // Streaming: accumulate content
                  accumulatedContent += data.content;
                  updateMessage(assistantMessageId, {
                    content: accumulatedContent,
                    isStreaming: true
                  });
                } else {
                  // Diffusing: replace entire content
                  updateMessage(assistantMessageId, {
                    content: data.content || '',
                    isStreaming: true
                  });
                }
              }
            } catch (parseError: any) {
              console.error('JSON parsing error:', parseError);
              toast.error('Failed to parse response data');
            }
          }
        }
      }

      updateMessage(assistantMessageId, { isStreaming: false });
      toast.success('Response completed');

    } catch (error: any) {
      let errorMessage = 'An unexpected error occurred.';
      
      if (error.name === 'AbortError') {
        updateMessage(assistantMessageId, {
          content: '**Response cancelled by user.**',
          isStreaming: false
        });
        return;
      } else if (error.message) {
        errorMessage = error.message;
      }

      console.error('Chat error:', error);
      toast.error(`Chat error: ${errorMessage}`);
      
      updateMessage(assistantMessageId, {
        content: `**Error:** ${errorMessage}`,
        isStreaming: false,
        isError: true
      });
    } finally {
      setLoading(false);
      setAbortController(null);
    }
  }, [hasRequiredKeys, validationResult, isLoading, messages, mode, apiKeys, toolsEnabled, addMessage, updateMessage, setLoading]);

  if (!mounted || initializing) {
    return (
      <div className="flex flex-col h-screen bg-background">
        <header className="border-b border-border bg-background/95 backdrop-blur-sm sticky top-0 z-10">
          <div className="max-w-5xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold">
                dLLM <span className="text-primary">Chat</span>
              </h1>
              <div className="h-9 w-9 bg-muted rounded-md animate-pulse" />
            </div>
          </div>
        </header>
        <main className="flex-1 flex items-center justify-center p-4">
          <div className="max-w-4xl w-full">
            <LoadingSkeleton />
          </div>
        </main>
      </div>
    );
  }

  if (!hasRequiredKeys() || validationResult?.valid !== true) {
    return (
      <div className="flex flex-col h-screen bg-background">
        <header className="border-b border-border bg-background/95 backdrop-blur-sm sticky top-0 z-10">
          <div className="max-w-5xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold">
                dLLM <span className="text-primary">Chat</span>
              </h1>
              <ModeToggle />
            </div>
          </div>
        </header>

        <main className="flex-1 flex items-center justify-center p-4">
          <ApiKeySetup />
        </main>
        
        <ChatInput onSendMessage={sendMessage} onStop={handleStop} disabled={isLoading} />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      <header className="border-b border-border bg-background/95 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">
              dLLM <span className="text-primary">Chat</span>
            </h1>
            
            <div className="flex items-center gap-4">
              {messages.length > 0 && (
                <Button
                  onClick={() => {
                    clearMessages();
                    toast.success('Chat cleared');
                  }}
                  variant="ghost"
                  size="sm"
                  className="flex items-center gap-2 h-9 px-3 text-sm text-muted-foreground hover:text-foreground"
                >
                  <Trash2 className="w-4 h-4" />
                  Clear Chat
                </Button>
              )}

              <Dialog open={showApiKeyDialog} onOpenChange={setShowApiKeyDialog}>
                <DialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex items-center gap-2 h-9 px-3 text-sm text-muted-foreground hover:text-foreground"
                  >
                    <Settings className="w-4 h-4" />
                    Settings
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>API Key Settings</DialogTitle>
                  </DialogHeader>
                  <ApiKeySetup />
                </DialogContent>
              </Dialog>

              <ModeToggle />
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 relative">
        <div className="flex flex-col w-full max-w-4xl pt-12 pb-44 mx-auto px-6">
          <Messages messages={messages} isLoading={isLoading} />
        </div>
        
        <ChatInput onSendMessage={sendMessage} onStop={handleStop} disabled={isLoading} />
      </main>
    </div>
  );
};

export default ChatInterface;