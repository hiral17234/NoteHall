import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
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
  ImageIcon,
  X
} from "lucide-react";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import { toast } from "@/hooks/use-toast";

interface GeminiChatProps {
  noteContext?: {
    title?: string;
    content?: string;
    subject?: string;
    fileUrl?: string;
  };
  className?: string;
}

const quickActions = [
  { id: "summarize", label: "Summarize", icon: FileText, prompt: "Summarize the key concepts from my current study material" },
  { id: "explain", label: "Explain Simply", icon: Lightbulb, prompt: "Explain this concept in simple terms" },
  { id: "questions", label: "Practice Questions", icon: HelpCircle, prompt: "Generate 5 practice questions for this topic" },
  { id: "tips", label: "Study Tips", icon: BookOpen, prompt: "Give me effective study tips for this subject" },
];

/* =======================
   ✅ ADDED (REQUIRED)
   ======================= */
const fileToBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

export function GeminiChat({ noteContext, className }: GeminiChatProps) {
  const [input, setInput] = useState("");
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
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
      if (noteContext.title && messages.length <= 1) {
        const contextMessage = `I'm asking about the note: "${noteContext.title}" (${noteContext.subject || 'Unknown subject'})`;
        setInput(contextMessage);
      }
    }
  }, [noteContext, setContext]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        toast({
          title: "Invalid file",
          description: "Please select an image file.",
          variant: "destructive",
        });
        return;
      }
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const clearImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  /* =======================
     ✅ EDITED (CORE FIX)
     ======================= */
  const handleSend = async () => {
    if ((!input.trim() && !selectedImage) || isLoading) return;

    const message = input || "Please analyze this image.";

    setInput("");

    let imagePayload:
      | { base64: string; mimeType: string }
      | undefined = undefined;

    if (selectedImage) {
      const base64 = await fileToBase64(selectedImage);
      imagePayload = {
        base64: base64.split(",")[1], // IMPORTANT
        mimeType: selectedImage.type,
      };
    }

    clearImage();
    await sendMessage(message, imagePayload); // ✅ IMAGE NOW SENT
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

      {/* Note Context Banner */}
      {noteContext?.title && (
        <div className="px-4 py-2 bg-primary/5 border-b border-border">
          <p className="text-xs text-muted-foreground">
            Asking about:{" "}
            <span className="font-medium text-foreground">
              {noteContext.title}
            </span>
            {noteContext.subject && (
              <span className="text-primary ml-1">
                ({noteContext.subject})
              </span>
            )}
          </p>
        </div>
      )}

      {/* Quick Actions */}
      {messages.length <= 1 && !noteContext?.title && (
        <div className="p-4 border-b border-border">
          <p className="text-xs text-muted-foreground mb-2">
            Quick actions:
          </p>
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

      {/* Image Preview */}
      {imagePreview && (
        <div className="px-4 py-2 border-t border-border">
          <div className="relative inline-block">
            <img
              src={imagePreview}
              alt="Selected"
              className="h-20 rounded-lg border border-border"
            />
            <Button
              variant="destructive"
              size="icon"
              className="absolute -top-2 -right-2 h-6 w-6"
              onClick={clearImage}
            >
              <X className="w-3 h-3" />
            </Button>
          </div>
        </div>
      )}

      {/* Input */}
      <div className="p-4 border-t border-border">
        <div className="flex gap-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageSelect}
            accept="image/*"
            className="hidden"
          />
          <Button
            variant="outline"
            size="icon"
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading}
            title="Attach image"
          >
            <ImageIcon className="w-4 h-4" />
          </Button>
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
            disabled={(!input.trim() && !selectedImage) || isLoading}
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
        <AvatarFallback
          className={cn(
            isUser
              ? "bg-secondary text-secondary-foreground"
              : "bg-primary/10 text-primary"
          )}
        >
          {isUser ? "U" : <Sparkles className="w-4 h-4" />}
        </AvatarFallback>
      </Avatar>
      <div
        className={cn(
          "flex-1 rounded-lg p-3 max-w-[85%]",
          isUser
            ? "bg-primary text-primary-foreground ml-auto"
            : "bg-muted"
        )}
      >
        {isUser ? (
          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
        ) : (
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <ReactMarkdown>{message.content}</ReactMarkdown>
          </div>
        )}
        <p className="text-[10px] opacity-60 mt-1">
          {message.timestamp.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      </div>
    </div>
  );
}

export default GeminiChat;
