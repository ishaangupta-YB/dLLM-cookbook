import { useState } from 'react';
import { Eye, EyeOff, Key } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAPIKeyStore } from '@/lib/stores';

const API_BASE_URL = 'http://localhost:8000';

const ApiKeySetup = () => {
  const [showKeys, setShowKeys] = useState(false);
  const { 
    apiKeys, 
    setAPIKey, 
    hasRequiredKeys,
    isValidating,
    validationResult,
    setValidating,
    setValidationResult
  } = useAPIKeyStore();

  const validateApiKey = async (apiKey: string) => {
    if (!apiKey) return;
    
    setValidating(true);
    setValidationResult(null);
    
    try {
      const response = await fetch(`${API_BASE_URL}/validate-api-key`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ api_key: apiKey }),
      });
      
      const result = await response.json();
      setValidationResult(result);
      
      if (result.valid) {
        console.log('API key validated successfully!');
      } else {
        console.error(`API key validation failed: ${result.error}`);
      }
    } catch (error) {
      setValidationResult({
        valid: false,
        error: 'Network error'
      });
      console.error('Network error during validation');
    } finally {
      setValidating(false);
    }
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
            onChange={(e) => setAPIKey('inception', e.target.value)}
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
            onChange={(e) => setAPIKey('tavily', e.target.value)}
            placeholder="Enter your Tavily API key..."
            className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-ring focus:border-transparent"
          />
          <p className="text-xs text-muted-foreground mt-1">Optional: Required for web search functionality</p>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={() => validateApiKey(apiKeys.inception)}
            disabled={!apiKeys.inception || isValidating}
            className="flex-1"
          >
            {isValidating ? 'Validating...' : 'Validate API Key'}
          </Button>
        </div>

        {validationResult !== null && (
          <div className={`p-3 rounded-lg border ${validationResult.valid 
            ? 'bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-300' 
            : 'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300'
          }`}>
            {validationResult.valid ? '✅ API key is valid' : `❌ ${validationResult.error}`}
          </div>
        )}
      </div>
    </div>
  );
};

export default ApiKeySetup;