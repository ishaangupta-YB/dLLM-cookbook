import { useState } from 'react';
import { Eye, EyeOff, Key } from 'lucide-react';
import { Button } from '@/components/ui/button';

const ApiKeySetup = ({ apiKeys, onApiKeysChange, onValidate, validationStatus }: { apiKeys: { inception: string; tavily: string }, onApiKeysChange: (apiKeys: { inception: string; tavily: string }) => void, onValidate: (apiKey: string) => void, validationStatus: { validating: boolean; result: { valid: boolean; error?: string } | null } }) => {
  const [showKeys, setShowKeys] = useState(false);

  const updateKey = (provider: string, value: string) => {
    onApiKeysChange({
      ...apiKeys,
      [provider]: value
    });
  };

  return (
    <div className="bg-card border rounded-lg p-6 max-w-md mx-auto">
      <div className="flex items-center gap-3 mb-4">
        <Key className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-semibold text-card-foreground">API Configuration</h2>
        <Button
          onClick={() => setShowKeys(!showKeys)}
          variant="ghost"
          size="sm"
          className="ml-auto"
        >
          {showKeys ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </Button>
      </div>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-card-foreground mb-2">
            Inception Labs API Key (Required)
          </label>
          <input
            type={showKeys ? 'text' : 'password'}
            value={apiKeys.inception || ''}
            onChange={(e) => updateKey('inception', e.target.value)}
            placeholder="Enter your Inception Labs API key..."
            className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-ring focus:border-transparent"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-card-foreground mb-2">
            Tavily API Key (for Web Search)
          </label>
          <input
            type={showKeys ? 'text' : 'password'}
            value={apiKeys.tavily || ''}
            onChange={(e) => updateKey('tavily', e.target.value)}
            placeholder="Enter your Tavily API key..."
            className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-ring focus:border-transparent"
          />
          <p className="text-xs text-muted-foreground mt-1">Optional: Required for web search functionality</p>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={() => onValidate(apiKeys.inception)}
            disabled={!apiKeys.inception || validationStatus.validating}
            className="flex-1"
          >
            {validationStatus.validating ? 'Validating...' : 'Validate API Key'}
          </Button>
        </div>

        {validationStatus.result !== null && (
          <div className={`p-3 rounded-lg border ${validationStatus.result.valid 
            ? 'bg-green-50 border-green-200 text-green-800' 
            : 'bg-red-50 border-red-200 text-red-800'
          }`}>
            {validationStatus.result.valid ? '✅ API key is valid' : `❌ ${validationStatus.result.error}`}
          </div>
        )}
      </div>
    </div>
  );
};

export default ApiKeySetup;