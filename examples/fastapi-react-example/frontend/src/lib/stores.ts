import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  isStreaming?: boolean;
  isError?: boolean;
  timestamp: Date;
}

export interface APIKeys {
  inception: string;
  tavily: string;
}

interface APIKeyStore {
  apiKeys: APIKeys;
  setAPIKey: (provider: keyof APIKeys, key: string) => void;
  hasRequiredKeys: () => boolean;
  isValidating: boolean;
  validationResult: { valid: boolean; error?: string } | null;
  setValidating: (validating: boolean) => void;
  setValidationResult: (result: { valid: boolean; error?: string } | null) => void;
}

export const useAPIKeyStore = create<APIKeyStore>()(
  persist(
    (set, get) => ({
      apiKeys: {
        inception: '',
        tavily: '',
      },
      setAPIKey: (provider, key) =>
        set((state) => ({
          apiKeys: { ...state.apiKeys, [provider]: key },
          validationResult: null,
        })),
      hasRequiredKeys: () => {
        const { apiKeys } = get();
        return Boolean(apiKeys.inception.trim());
      },
      isValidating: false,
      validationResult: null,
      setValidating: (validating) => set({ isValidating: validating }),
      setValidationResult: (result) => set({ validationResult: result }),
    }),
    {
      name: 'api-keys',
    }
  )
);

interface ChatModeStore {
  mode: 'streaming' | 'diffusing';
  setMode: (mode: 'streaming' | 'diffusing') => void;
}

export const useChatModeStore = create<ChatModeStore>()(
  persist(
    (set) => ({
      mode: 'streaming',
      setMode: (mode) => set({ mode }),
    }),
    {
      name: 'chat-mode',
    }
  )
);

interface ChatStore {
  messages: Message[];
  isLoading: boolean;
  toolsEnabled: boolean;
  addMessage: (message: Omit<Message, 'id' | 'timestamp'>) => string;
  updateMessage: (id: string, updates: Partial<Message>) => void;
  clearMessages: () => void;
  setLoading: (loading: boolean) => void;
  setToolsEnabled: (enabled: boolean) => void;
}

export const useChatStore = create<ChatStore>((set, get) => ({
  messages: [],
  isLoading: false,
  toolsEnabled: false,
  addMessage: (message) => {
    const id = Date.now().toString() + Math.random().toString(36);
    const newMessage: Message = {
      ...message,
      id,
      timestamp: new Date(),
    };
    set((state) => ({
      messages: [...state.messages, newMessage],
    }));
    return id;
  },
  updateMessage: (id, updates) =>
    set((state) => ({
      messages: state.messages.map((msg) =>
        msg.id === id ? { ...msg, ...updates } : msg
      ),
    })),
  clearMessages: () => set({ messages: [] }),
  setLoading: (loading) => set({ isLoading: loading }),
  setToolsEnabled: (enabled) => set({ toolsEnabled: enabled }),
})); 