import { useState, useCallback, useEffect } from "react";
import { geminiService, GeminiContext } from "@/services/geminiService";

export interface ChatMessage {
  id: string;
  content: string;
  role: "user" | "assistant";
  timestamp: Date;
  isLoading?: boolean;
}

export function useGemini() {
const [messages, setMessages] = useState<ChatMessage[]>(() => {
  const saved = sessionStorage.getItem("gemini-chat");
  return saved
    ? JSON.parse(saved).map((m: any) => ({
        ...m,
        timestamp: new Date(m.timestamp),
      }))
    : [
        {
          id: "welcome",
          content: "Hi! I'm **Gemini**, your AI study assistant. How can I help you today?",
          role: "assistant",
          timestamp: new Date(),
        },
      ];
});


  // ✅ ADD THIS EXACTLY HERE
useEffect(() => {
  sessionStorage.setItem("gemini-chat", JSON.stringify(messages));
}, [messages]);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isConfigured = geminiService.isConfigured();

  const setContext = useCallback((context: GeminiContext) => {
    geminiService.setContext(context);
  }, []);

  const sendMessage = useCallback(
  async (
    content: string,
    images?: { base64: string; mimeType: string }[]
  ) => {

if (!content.trim() && (!images || images.length === 0)) return;

    
    setError(null);
    
    // Add user message
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      content,
      role: "user",
      timestamp: new Date(),
    };
    
    // Add loading message
    const loadingMessage: ChatMessage = {
      id: `loading-${Date.now()}`,
      content: "",
      role: "assistant",
      timestamp: new Date(),
      isLoading: true,
    };

    setMessages(prev => [...prev, userMessage, loadingMessage]);
    setIsLoading(true);

    try {
      const response = await geminiService.sendMessage(content, images);

      
      // Replace loading message with actual response
      setMessages(prev => {
        const filtered = prev.filter(m => !m.isLoading);
        return [
          ...filtered,
          {
            id: `assistant-${Date.now()}`,
            content: response,
            role: "assistant",
            timestamp: new Date(),
          },
        ];
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Something went wrong. Please try again.";
      setError(errorMessage);
      
      // Remove loading message and show error
      setMessages(prev => {
        const filtered = prev.filter(m => !m.isLoading);
        return [
          ...filtered,
          {
            id: `error-${Date.now()}`,
            content: `⚠️ ${errorMessage}`,
            role: "assistant",
            timestamp: new Date(),
          },
        ];
      });
    } finally {
      setIsLoading(false);
    }
  }, []);


  const clearChat = useCallback(() => {
  geminiService.clearHistory();
  sessionStorage.removeItem("gemini-chat");

  setMessages([
    {
      id: "welcome",
      content: "Hi! I'm **Gemini**, your AI study assistant. How can I help you today?",
      role: "assistant",
      timestamp: new Date(),
    },
  ]);

  setError(null);
}, []);

  const summarize = useCallback(async (content: string, format: "short" | "bullets" | "exam") => {
    setIsLoading(true);
    try {
      const response = await geminiService.summarize(content, format);
      setMessages(prev => [
        ...prev,
        {
          id: `assistant-${Date.now()}`,
          content: response,
          role: "assistant",
          timestamp: new Date(),
        },
      ]);
      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to summarize";
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const explainConcept = useCallback(async (concept: string, level: "beginner" | "intermediate" | "advanced") => {
    return sendMessage(`Explain "${concept}" at ${level} level`);
  }, [sendMessage]);

  const generateQuestions = useCallback(async (topic: string, count?: number) => {
    return sendMessage(`Generate ${count || 5} practice questions about "${topic}"`);
  }, [sendMessage]);

  return {
    messages,
    isLoading,
    error,
    isConfigured,
    sendMessage,
    clearChat,
    setContext,
    summarize,
    explainConcept,
    generateQuestions,
  };
}

export default useGemini;
