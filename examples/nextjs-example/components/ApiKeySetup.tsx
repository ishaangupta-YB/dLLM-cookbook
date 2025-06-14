'use client';

import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Key, CheckCircle, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { useAPIKeyStore } from '@/lib/stores';
import { toast } from 'sonner';
import { LoadingSpinner } from './ui/loading';

export default function APIKeySetup() {
  const { apiKeys, setApiKey, hasRequiredKeys } = useAPIKeyStore();
  const [inceptionKey, setInceptionKey] = useState(apiKeys.inception || '');
  const [showKey, setShowKey] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  
  const validateApiKey = useCallback(async (key: string): Promise<boolean> => {
    if (!key || key.length < 10) {
      toast.error('API key must be at least 10 characters long');
      return false;
    }

    if (!key.startsWith('sk-') && !key.includes('_')) {
      toast.error('Invalid API key format');
      return false;
    }

    return true;
  }, []);

  const handleSaveKeys = useCallback(async () => {
    if (!inceptionKey.trim()) {
      toast.error('Please enter your Inception Labs API key');
      return;
    }

    const isValid = await validateApiKey(inceptionKey.trim());
    if (!isValid) return;

    setApiKey('inception', inceptionKey.trim());
    toast.success('API key saved successfully!');
  }, [inceptionKey, setApiKey, validateApiKey]);

  const handleClearKey = useCallback(() => {
    setInceptionKey('');
    setApiKey('inception', '');
    toast.info('API key cleared');
  }, [setApiKey]);

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
          <Key className="w-6 h-6 text-primary" />
        </div>
        <CardTitle className="text-2xl">API Key Setup</CardTitle>
        <CardDescription>
          Enter your Inception Labs API key to start chatting
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <label htmlFor="inception-key" className="text-sm font-medium">
            Inception Labs API Key
          </label>
          <div className="relative">
            <Input
              id="inception-key"
              type={showKey ? 'text' : 'password'}
              placeholder="sk-..."
              value={inceptionKey}
              onChange={(e) => setInceptionKey(e.target.value)}
              className="pr-10"
              disabled={isValidating}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
              onClick={() => setShowKey(!showKey)}
              tabIndex={-1}
            >
              {showKey ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {hasRequiredKeys() && (
          <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
            <CheckCircle className="w-4 h-4" />
            <span>API key configured successfully</span>
          </div>
        )}

        <div className="flex gap-2">
          <Button 
            onClick={handleSaveKeys} 
            className="flex-1"
            disabled={!inceptionKey.trim() || isValidating}
          >
            {isValidating ? (
              <>
                <LoadingSpinner size="sm" />
                <span className="ml-2">Validating...</span>
              </>
            ) : (
              'Save Configuration'
            )}
          </Button>
          
          {hasRequiredKeys() && (
            <Button 
              onClick={handleClearKey}
              variant="outline"
              className="px-3"
            >
              Clear
            </Button>
          )}
        </div>

        <div className="text-xs text-muted-foreground space-y-2">
          <p>
            <strong>Note:</strong> Your API key is stored locally in your browser and never sent to our servers.
          </p>
          <p>
            Get your API key from{' '}
            <a 
              href="https://platform.inceptionlabs.ai/dashboard/api-keys" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              Inception Labs Dashboard
            </a>
          </p>
        </div>
      </CardContent>
    </Card>
  );
} 