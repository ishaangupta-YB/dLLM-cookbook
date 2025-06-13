import { NextRequest, NextResponse } from 'next/server';
import { ChatMode, ApiKeys } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const { message, messages = [], mode, apiKeys }: {
      message: string;
      messages?: Array<{ role: 'user' | 'assistant'; content: string }>;
      mode: ChatMode;
      apiKeys: ApiKeys;
    } = await request.json();

    const apiUrl = 'https://api.inceptionlabs.ai/v1/chat/completions';
    const apiKey = apiKeys.inception!;
    const model = 'mercury-coder';
    
    const conversationMessages = [
      ...messages.filter(msg => msg.content.trim() !== ''),  
      { role: 'user' as const, content: message }
    ];

    const requestBody: any = {
      model,
      messages: conversationMessages,
      max_tokens: 500,
      stream: true,
      temperature: 0.7,
    };

    if (mode === 'diffusing') {
      requestBody.diffusing = true;
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    };

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API error:', response.status, errorText);
      throw new Error(`API error: ${response.status} - ${errorText}`);
    }

    const stream = new ReadableStream({
      start(controller) {
        const reader = response.body?.getReader();
        
        function pump(): Promise<void> {
          return reader?.read().then(({ done, value }) => {
            if (done) {
              controller.close();
              return;
            }
            controller.enqueue(value);
            return pump();
          }) || Promise.resolve();
        }
        
        return pump();
      },
    });

    return new NextResponse(stream, {
      headers: {
        'Content-Type': 'text/stream-event',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: 'Failed to process chat request', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 