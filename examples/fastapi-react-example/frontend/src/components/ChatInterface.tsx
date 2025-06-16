import { useState, useCallback, useEffect } from 'react';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import ApiKeySetup from './ApiKeySetup';
import { Zap, Waves, Settings, Trash2 } from 'lucide-react';
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

const API_BASE_URL = 'http://localhost:8000';

const ChatInterface = () => {
  const [messages, setMessages] = useState<{ role: string; content: string; isStreaming: boolean }[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState('streaming');
  const [apiKeys, setApiKeys] = useState({ inception: '', tavily: '' });
  const [showApiSetup, setShowApiSetup] = useState(false);
  const [toolsEnabled, setToolsEnabled] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [validationStatus, setValidationStatus] = useState({
    validating: false,
    result: null as { valid: boolean; error?: string } | null
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  const canChat = () => {
    return validationStatus.result?.valid === true;
  };

  const validateApiKey = async (apiKey: string) => {
    if (!apiKey) return;
    
    setValidationStatus({ validating: true, result: null });
    
    try {
      const response = await fetch(`${API_BASE_URL}/validate-api-key`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ api_key: apiKey }),
      });
      
      const result = await response.json();
      setValidationStatus({ validating: false, result });
      
      if (result.valid) {
        toast.success('API key validated successfully!');
      } else {
        toast.error(`API key validation failed: ${result.error}`);
      }
    } catch (error) {
      setValidationStatus({
        validating: false,
        result: { valid: false, error: 'Network error' } as { valid: boolean; error?: string }  
      });
      toast.error('Network error during validation');
    }
  };

  const clearMessages = () => {
    setMessages([]);
    toast.success('Chat cleared');
  };

  const addMessage = useCallback((message: { role: string; content: string; isStreaming: boolean }) => {
    const newMessage = {
      ...message,
      id: Date.now().toString(),
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, newMessage]);
    return newMessage.id;
  }, []);

  const updateLastMessage = useCallback((updates: { content: string; isStreaming: boolean }) => {
    setMessages(prev => {
      const newMessages = [...prev];
      const lastIndex = newMessages.length - 1;
      if (lastIndex >= 0) {
        newMessages[lastIndex] = { ...newMessages[lastIndex], ...updates };
      }
      return newMessages;
    });
  }, []);

  const sendMessage = async (content: string) => {
    if (!canChat()) return;

    setIsLoading(true);
    addMessage({ role: 'user', content, isStreaming: false });

    // Add initial assistant message
    const assistantMessageId = addMessage({ 
      role: 'assistant', 
      content: '', 
      isStreaming: true 
    });

    try {
      const response = await fetch(`${API_BASE_URL}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [...messages, { role: 'user', content }],
          mode,
          inception_api_key: apiKeys.inception,
          tavily_api_key: apiKeys.tavily,
          tools_enabled: toolsEnabled,
          max_tokens: 800,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader?.read() || { done: true, value: new Uint8Array() };
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
              updateLastMessage({
                content: `Error: ${data.error}`,
                isStreaming: false
              });
              break;
            }
            
            if (data.content !== undefined) {
              updateLastMessage({
                content: data.content,
                isStreaming: true
              });
            }
          } catch (error) {
            console.error('JSON parsing error:', error);
          }
        }
      }

      updateLastMessage({ content: '', isStreaming: false });

    } catch (error) {
      console.error('Chat error:', error);
      updateLastMessage({
        content: 'Sorry, an error occurred while processing your request.',
        isStreaming: false
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!mounted) {
    return null;
  }

  if (!canChat()) {
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
          <ApiKeySetup 
            apiKeys={apiKeys} 
            onApiKeysChange={setApiKeys}
            onValidate={validateApiKey}
            validationStatus={validationStatus}
          />
        </main>
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
              <div className="flex bg-muted rounded-lg p-1">
                <Button
                  onClick={() => setMode('streaming')}
                  variant={mode === 'streaming' ? 'default' : 'ghost'}
                  size="sm"
                  className="flex items-center gap-2 h-8 px-3 text-xs"
                >
                  <Zap className="h-3 w-3" />
                  Streaming
                </Button>
                <Button
                  onClick={() => setMode('diffusing')}
                  variant={mode === 'diffusing' ? 'default' : 'ghost'}
                  size="sm"
                  className="flex items-center gap-2 h-8 px-3 text-xs"
                >
                  <Waves className="h-3 w-3" />
                  Diffusing
                </Button>
              </div>

              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={toolsEnabled}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setToolsEnabled(e.target.checked)}
                  disabled={!apiKeys.tavily}
                  className="rounded"
                />
                <span className={apiKeys.tavily ? 'text-foreground' : 'text-muted-foreground'}>
                  🔍 Web Search
                </span>
              </label>

              {messages.length > 0 && (
                <Button
                  onClick={clearMessages}
                  variant="ghost"
                  size="sm"
                  className="flex items-center gap-2 h-9 px-3 text-sm text-muted-foreground hover:text-foreground"
                >
                  <Trash2 className="w-4 h-4" />
                  Clear Chat
                </Button>
              )}

              <Dialog open={showApiSetup} onOpenChange={setShowApiSetup}>
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
                  <ApiKeySetup 
                    apiKeys={apiKeys} 
                    onApiKeysChange={setApiKeys}
                    onValidate={validateApiKey}
                    validationStatus={validationStatus}
                  />
                </DialogContent>
              </Dialog>

              <ModeToggle />
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 relative">
        <div className="flex flex-col w-full max-w-4xl pt-12 pb-44 mx-auto px-6">
          {messages.length === 0 ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
                  mode === 'streaming' ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'
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
                {toolsEnabled && <p className="text-sm text-green-600 mt-2">🔍 Web search enabled</p>}
                <p className="text-sm text-muted-foreground mt-4">Start a conversation below!</p>
              </div>
            </div>
          ) : (
            <MessageList messages={messages} mode={mode} isStreaming={isLoading} />
          )}
        </div>
        
        <MessageInput
          onSendMessage={sendMessage}
          isLoading={isLoading}
          disabled={!canChat()}
        />
      </main>
    </div>
  );
};

export default ChatInterface;