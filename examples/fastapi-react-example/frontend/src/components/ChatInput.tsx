import { useState, useCallback, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { ArrowUp, Zap, Waves, StopCircle } from 'lucide-react';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAPIKeyStore, useChatModeStore, useChatStore } from '@/lib/stores';

interface ChatInputProps {
  onSendMessage: (content: string) => Promise<void>;
  onStop?: () => void;
  disabled?: boolean;
}

export default function ChatInput({ onSendMessage, onStop, disabled = false }: ChatInputProps) {
  const [input, setInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { hasRequiredKeys, validationResult, apiKeys } = useAPIKeyStore();
  const { mode, setMode } = useChatModeStore();
  const { isLoading, toolsEnabled, setToolsEnabled } = useChatStore();

  const canSend = input.trim() && hasRequiredKeys() && validationResult?.valid === true && !isLoading && !disabled;

  const adjustHeight = useCallback(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, []);

  useEffect(() => {
    adjustHeight();
  }, [input, adjustHeight]);

  const handleSubmit = useCallback(async () => {
    if (!canSend) return;

    const content = input.trim();
    setInput('');
    
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    await onSendMessage(content);
  }, [input, canSend, onSendMessage]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
  };

  if (!hasRequiredKeys() || validationResult?.valid !== true) {
    return (
      <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
        <div className="flex items-center p-4 pr-5 border rounded-lg bg-background shadow-lg gap-4 max-w-md">
          <div className="bg-primary/10 p-2.5 rounded-full">
            <ArrowUp className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-sm font-medium">
              {!hasRequiredKeys() ? 'API key required' : 'API key validation required'}
            </p>
            <p className="text-xs text-muted-foreground">
              {!hasRequiredKeys() 
                ? 'Add your Inception Labs API key to enable chat'
                : 'Please validate your API key in settings'
              }
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-0 w-full max-w-4xl left-1/2 transform -translate-x-1/2 px-6">
      <div className="bg-secondary rounded-t-[20px] p-2 pb-0 w-full">
        <div className="relative">
          <div className="flex flex-col">
            <div className="bg-secondary overflow-y-auto max-h-[300px]">
              <Textarea
                ref={textareaRef}
                value={input}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder="What can I do for you?"
                className={cn(
                  'w-full px-4 py-3 border-none shadow-none dark:bg-transparent',
                  'placeholder:text-muted-foreground resize-none',
                  'focus-visible:ring-0 focus-visible:ring-offset-0',
                  'scrollbar-thin scrollbar-track-transparent scrollbar-thumb-muted-foreground/30',
                  'scrollbar-thumb-rounded-full',
                  'min-h-[72px]'
                )}
                disabled={disabled || isLoading}
                aria-label="Chat message input"
                aria-describedby="chat-input-description"
              />
              <span id="chat-input-description" className="sr-only">
                Press Enter to send, Shift+Enter for new line
              </span>
            </div>

            <div className="h-14 flex items-center px-2">
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-3">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        className="flex items-center gap-2 h-8 px-3 text-xs rounded-md text-foreground hover:bg-primary/10"
                      >
                        {mode === 'streaming' ? (
                          <>
                            <Zap className="w-3 h-3" />
                            Streaming
                          </>
                        ) : (
                          <>
                            <Waves className="w-3 h-3" />
                            Diffusing
                          </>
                        )}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onClick={() => setMode('streaming')}>
                        <Zap className="w-4 h-4 mr-2" />
                        Streaming
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setMode('diffusing')}>
                        <Waves className="w-4 h-4 mr-2" />
                        Diffusing
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  <label className="flex items-center gap-2 text-xs">
                    <input
                      type="checkbox"
                      checked={toolsEnabled}
                      onChange={(e) => setToolsEnabled(e.target.checked)}
                      disabled={!apiKeys.tavily}
                      className="rounded"
                    />
                    <span className={apiKeys.tavily ? 'text-foreground' : 'text-muted-foreground'}>
                      🔍 Web Search
                    </span>
                  </label>
                </div>

                {isLoading ? (
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={onStop}
                    aria-label="Stop generating response"
                  >
                    <StopCircle className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button
                    onClick={handleSubmit}
                    disabled={!canSend}
                    size="icon"
                    aria-label="Send message"
                  >
                    <ArrowUp className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 