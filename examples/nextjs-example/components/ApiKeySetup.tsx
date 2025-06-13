'use client';

import { useState } from 'react';
import { Eye, EyeOff, Key, CheckCircle, AlertCircle } from 'lucide-react';
import { ApiKeys } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface ApiKeySetupProps {
  apiKeys: ApiKeys;
  onApiKeysChange: (keys: ApiKeys) => void;
}

export default function ApiKeySetup({ apiKeys, onApiKeysChange }: ApiKeySetupProps) {
  const [showKeys, setShowKeys] = useState(false);

  const updateKey = (provider: keyof ApiKeys, value: string) => {
    onApiKeysChange({
      ...apiKeys,
      [provider]: value
    });
  };

  const isValidKey = (key: string | undefined) => {
    return key && key.length > 10;
  };

  return (
    <div className="bg-card rounded-xl border border-border shadow-sm p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-primary/10 rounded-lg">
          <Key className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1">
          <h2 className="text-lg font-semibold text-card-foreground">API Configuration</h2>
          <p className="text-sm text-muted-foreground">
            Configure your Inception Labs API key for both streaming and diffusing modes
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setShowKeys(!showKeys)}
          className="text-muted-foreground hover:text-foreground"
        >
          {showKeys ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </Button>
      </div>
      
      <div className="space-y-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-card-foreground">
              Inception Labs API Key
            </label>
            {apiKeys.inception && (
              <div className="flex items-center gap-1">
                {isValidKey(apiKeys.inception) ? (
                  <>
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-xs text-green-600 dark:text-green-400">Valid</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-4 w-4 text-orange-500" />
                    <span className="text-xs text-orange-600 dark:text-orange-400">Invalid</span>
                  </>
                )}
              </div>
            )}
          </div>
          <Input
            type={showKeys ? 'text' : 'password'}
            value={apiKeys.inception || ''}
            onChange={(e) => updateKey('inception', e.target.value)}
            placeholder="Enter your Inception Labs API key..."
            className="w-full transition-all duration-200 focus:ring-2 focus:ring-primary/20"
          />
          <div className="flex items-start gap-2 text-xs text-muted-foreground">
            <div className="flex-shrink-0 w-1 h-1 bg-muted-foreground rounded-full mt-2" />
            <p>
              This key will be used for both streaming and diffusing modes. 
              Get your API key from the{' '}
              <a 
                href="https://api.inceptionlabs.ai" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                Inception Labs dashboard
              </a>
            </p>
          </div>
        </div>

        <div className="pt-4 border-t border-border">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${
              isValidKey(apiKeys.inception) 
                ? 'bg-green-500 animate-pulse' 
                : 'bg-gray-300 dark:bg-gray-600'
            }`} />
            <span className="text-sm text-muted-foreground">
              {isValidKey(apiKeys.inception) 
                ? 'Ready to chat' 
                : 'Waiting for valid API key'
              }
            </span>
          </div>
        </div>
      </div>
    </div>
  );
} 