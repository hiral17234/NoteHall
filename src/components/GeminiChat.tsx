import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useGemini, ChatMessage } from "@/hooks/useGemini";
import { 
  Send, 
  Trash2, 
  Sparkles, 
  BookOpen, 
  HelpCircle, 
  FileText,
  Lightbulb,
  Loader2,
  AlertCircle,
  Bot
} from "lucide-react";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";

interface GeminiChatProps {
  noteContext?: {
    title?: string;
    content?: string;
    subject?: string;
  };
  className?: string;
}

const quickActions = [
  { id: "summarize", label: "Summarize", icon: FileText, prompt: "Summarize the key concepts from my current study material" },
  { id: "explain", label: "Explain Simply", icon: Lightbulb, prompt: "Explain this concept in simple terms" },
  { id: "questions", label: "Practice Questions", icon: HelpCircle, prompt: "Generate 5 practice questions for this topic" },
  { id: "tips", label: "Study Tips", icon: BookOpen, prompt: "Give me effective study tips for this subject" },
];

export function GeminiChat({ noteContext, className }: GeminiChatProps) {
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { 
    messages, 
    isLoading, 
    error, 
    isConfigured, 
    sendMessage, 
    clearChat,
    setContext 
  } = useGemini();

  // Set context when note context changes
  useEffect(() => {
    if (noteContext) {
      setContext({
        noteTitle: noteContext.title,
        noteContent: noteContext.content,
        selectedSubject: noteContext.subject,
      });
    }
  }, [noteContext, setContext]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    const message = input;
    setInput("");
    await sendMessage(message);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleQuickAction = (prompt: string) => {
    sendMessage(prompt);
  };

  if (!isConfigured) {
    return (
      <Card className={cn("bg-card border-border", className)}>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <AlertCircle className="w-12 h-12 text-destructive mb-4" />
          <h3 className="font-semibold text-lg text-foreground mb-2">Gemini Not Configured</h3>
          <p className="text-muted-foreground text-sm max-w-sm">
            Please add your Gemini API key as <code className="bg-muted px-1.5 py-0.5 rounded">VITE_GEMINI_API_KEY</code> in your environment variables.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("bg-card border-border flex flex-col h-full", className)}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Gemini</h3>
            <p className="text-xs text-muted-foreground">AI Study Assistant</p>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={clearChat} title="Clear chat">
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>

      {/* Quick Actions */}
      {messages.length <= 1 && (
        <div className="p-4 border-b border-border">
          <p className="text-xs text-muted-foreground mb-2">Quick actions:</p>
          <div className="flex flex-wrap gap-2">
            {quickActions.map((action) => (
              <Button
                key={action.id}
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={() => handleQuickAction(action.prompt)}
                disabled={isLoading}
              >
                <action.icon className="w-3.5 h-3.5" />
                {action.label}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-4">
          {messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="p-4 border-t border-border">
        <div className="flex gap-2">
          <Input
            ref={inputRef}
            placeholder="Ask Gemini anything..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            className="flex-1"
          />
          <Button 
            onClick={handleSend} 
            disabled={!input.trim() || isLoading}
            className="bg-primary hover:bg-primary/90"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-2 text-center">
          Powered by Google Gemini
        </p>
      </div>
    </Card>
  );
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";

  if (message.isLoading) {
    return (
      <div className="flex items-start gap-3">
        <Avatar className="w-8 h-8 flex-shrink-0">
          <AvatarFallback className="bg-primary/10 text-primary">
            <Sparkles className="w-4 h-4" />
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 bg-muted rounded-lg p-3">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm">Gemini is thinking...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex items-start gap-3", isUser && "flex-row-reverse")}>
      <Avatar className="w-8 h-8 flex-shrink-0">
        <AvatarFallback className={cn(
          isUser ? "bg-secondary text-secondary-foreground" : "bg-primary/10 text-primary"
        )}>
          {isUser ? "U" : <Sparkles className="w-4 h-4" />}
        </AvatarFallback>
      </Avatar>
      <div className={cn(
        "flex-1 rounded-lg p-3 max-w-[85%]",
        isUser ? "bg-primary text-primary-foreground ml-auto" : "bg-muted"
      )}>
        {isUser ? (
          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
        ) : (
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <ReactMarkdown
              components={{
                p: ({ children }) => <p className="text-sm mb-2 last:mb-0">{children}</p>,
                ul: ({ children }) => <ul className="text-sm list-disc pl-4 mb-2">{children}</ul>,
                ol: ({ children }) => <ol className="text-sm list-decimal pl-4 mb-2">{children}</ol>,
                li: ({ children }) => <li className="mb-1">{children}</li>,
                h1: ({ children }) => <h1 className="text-base font-bold mb-2">{children}</h1>,
                h2: ({ children }) => <h2 className="text-sm font-bold mb-2">{children}</h2>,
                h3: ({ children }) => <h3 className="text-sm font-semibold mb-1">{children}</h3>,
                strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                code: ({ children }) => (
                  <code className="bg-background/50 px-1 py-0.5 rounded text-xs font-mono">
                    {children}
                  </code>
                ),
                pre: ({ children }) => (
                  <pre className="bg-background/50 p-2 rounded overflow-x-auto text-xs my-2">
                    {children}
                  </pre>
                ),
              }}
            >
              {message.content}
            </ReactMarkdown>
          </div>
        )}
        <p className="text-[10px] opacity-60 mt-1">
          {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </p>
      </div>
    </div>
  );
}

export default GeminiChat;
