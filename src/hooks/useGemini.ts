import { useState, useCallback } from 'react';
import { geminiService, GeminiMessage, GeminiContext } from '@/services/geminiService';

interface UseGeminiReturn {
  messages: GeminiMessage[];
  isLoading: boolean;
  error: string | null;
  sendMessage: (message: string, images?: { base64: string; mimeType: string }[]) => Promise<void>;
  clearChat: () => void;
  setContext: (context: GeminiContext) => void;
  isConfigured: boolean;
}

export function useGemini(): UseGeminiReturn {
  const [messages, setMessages] = useState<GeminiMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = useCallback(async (
    message: string, 
    images?: { base64: string; mimeType: string }[]
  ) => {
    if ((!message.trim() && (!images || images.length === 0)) || isLoading) return;

    setError(null);
    setIsLoading(true);

    const userMessage: GeminiMessage = {
      role: 'user',
      content: message.trim() || 'Sent image(s) for analysis',
    };
    setMessages(prev => [...prev, userMessage]);

    try {
      const response = await geminiService.sendMessage(message, images);
      const assistantMessage: GeminiMessage = { role: 'assistant', content: response };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get response');
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setIsLoading(false);
    }
  }, [isLoading]);

  const clearChat = useCallback(() => {
    setMessages([]);
    setError(null);
    geminiService.clearHistory();
  }, []);

  const setContext = useCallback((context: GeminiContext) => {
    geminiService.setContext(context);
  }, []);

  return { messages, isLoading, error, sendMessage, clearChat, setContext, isConfigured: geminiService.isConfigured() };
}

export default useGemini;
