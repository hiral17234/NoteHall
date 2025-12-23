import { useState, useRef, useEffect } from "react";
import * as pdfjsLib from "pdfjs-dist";
import pdfWorker from "pdfjs-dist/build/pdf.worker?url";
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

// ✅ ADD: helper to convert image to base64
const fileToBase64 = (file: File): Promise<string> =>
new Promise((resolve, reject) => {
    img.onerror = () => reject("Image load failed");
reader.onerror = () => reject("File read failed");
    const img = new Image();
    const reader = new FileReader();

    reader.onload = () => {
      img.src = reader.result as string;
    };

    img.onload = () => {
      const canvas = document.createElement("canvas");
      const MAX = 1024;
      const scale = Math.min(MAX / img.width, MAX / img.height, 1);

      canvas.width = img.width * scale;
      canvas.height = img.height * scale;

      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      resolve(canvas.toDataURL("image/jpeg", 0.8));
    };

    reader.readAsDataURL(file);
  });

const pdfToImages = async (file: File): Promise<string[]> => {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

  const images: string[] = [];

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const viewport = page.getViewport({ scale: 2 });

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d")!;
    canvas.width = viewport.width;
    canvas.height = viewport.height;

    await page.render({
      canvasContext: ctx,
      viewport,
    }).promise;

    images.push(canvas.toDataURL("image/jpeg", 0.8));
  }

  return images;
};



pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

export function GeminiChat({ noteContext, className }: GeminiChatProps) {
  const [input, setInput] = useState("");
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const {
  messages,
  isLoading,
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
}, [noteContext, setContext, messages.length]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const files = Array.from(e.target.files || []);

  for (const file of files) {
    // 🖼 IMAGE
    if (file.type.startsWith("image/")) {
      setSelectedImages(prev => [...prev, file]);

      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviews(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    }

    // 📄 PDF
    else if (file.type === "application/pdf") {
      try {
        const pdfImages = await pdfToImages(file);

        pdfImages.forEach((src) => {
          setImagePreviews(prev => [...prev, src]);

          // convert base64 → File so pipeline stays SAME
          fetch(src)
            .then(res => res.blob())
            .then(blob => {
              const imgFile = new File([blob], "pdf-page.jpg", {
                type: "image/jpeg",
              });
              setSelectedImages(prev => [...prev, imgFile]);
            });
        });
      } catch (err) {
        toast({
          title: "PDF error",
          description: "Failed to read PDF file",
          variant: "destructive",
        });
      }
    }

    // ❌ Unsupported
    else {
      toast({
        title: "Unsupported file",
        description: "Only images and PDFs are supported",
        variant: "destructive",
      });
    }
  }
};


  images.forEach(file => {
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreviews(prev => [...prev, reader.result as string]);
    };
    reader.readAsDataURL(file);
  });
};
  
  const clearImages = () => {
  setSelectedImages([]);
  setImagePreviews([]);
  if (fileInputRef.current) fileInputRef.current.value = "";
};

/* =======================
   DRAG & DROP HANDLERS
======================= */
const handleDragOver = (e: React.DragEvent) => {
  e.preventDefault();
  setIsDragging(true);
};

const handleDragLeave = () => {
  setIsDragging(false);
};

const handleDrop = (e: React.DragEvent) => {
  e.preventDefault();
  setIsDragging(false);

  const files = Array.from(e.dataTransfer.files || []);
for (const file of files) {
  if (file.type.startsWith("image/")) {
    handleFileSelect({ target: { files: [file] } } as any);
  } else if (file.type === "application/pdf") {
    handleFileSelect({ target: { files: [file] } } as any);
  }
}

  if (!images.length) {
    toast({
      title: "Invalid file",
      description: "Only image files are supported.",
      variant: "destructive",
    });
    return;
  }

  setSelectedImages(prev => [...prev, ...images]);

  images.forEach(file => {
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreviews(prev => [...prev, reader.result as string]);
    };
    reader.readAsDataURL(file);
  });
};


  /* =======================
     ✅ EDITED (CORE FIX)
     ======================= */
  const handleSend = async () => {
    if ((!input.trim() && selectedImages.length === 0) || isLoading) return;

    const message = input || "Please analyze this image.";

    setInput("");

    const imagePayloads = await Promise.all(
  selectedImages.map(async file => {
    const base64 = await fileToBase64(file);
    return {
      base64: base64.split(",")[1],
      mimeType: file.type,
    };
  })
);

clearImages();
await sendMessage(message, imagePayloads);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleQuickAction = async (prompt: string) => {
  if (isLoading) return;
  await sendMessage(prompt);
};

  return (
   <Card
  onDragOver={handleDragOver}
  onDragLeave={handleDragLeave}
  onDrop={handleDrop}
  className={cn(
    "bg-card border-border flex flex-col h-full",
    isDragging && "ring-2 ring-primary ring-dashed",
    className
  )}
> 
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
<ScrollArea className="flex-1 p-4">
  <div ref={scrollRef} className="space-y-4">
        <div className="space-y-4">
          {messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))}
        </div>
    </div>
      </ScrollArea>

      {/* Image Preview */}
     {imagePreviews.length > 0 && (
  <div className="px-4 py-2 border-t border-border">
    <div className="flex gap-2 flex-wrap">
      {imagePreviews.map((src, index) => (
  <div key={index} className="relative">
    <img
      src={src}
      className="h-20 rounded-lg border border-border"
    />

    {/* REMOVE SINGLE IMAGE */}
    <button
      type="button"
      onClick={() => {
        setImagePreviews(prev => prev.filter((_, i) => i !== index));
        setSelectedImages(prev => prev.filter((_, i) => i !== index));
      }}
      className="absolute -top-2 -right-2 bg-destructive text-white rounded-full p-1"
    >
      <X className="w-3 h-3" />
    </button>
  </div>
))}
          </div>
  </div>
)}




      {/* Input */}
      <div className="p-4 border-t border-border">
        <div className="flex gap-2">
          <input
  type="file"
  multiple
  ref={fileInputRef}
  onChange={handleFileSelect}
  accept="image/*,application/pdf"
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
            disabled={(!input.trim() && selectedImages.length === 0) || isLoading}
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
  <>
    <div className="prose prose-sm dark:prose-invert max-w-none">
      <ReactMarkdown>{message.content}</ReactMarkdown>
    </div>

    {!isUser && message.content.includes("⚠️") && (
      <Button
        variant="outline"
        size="sm"
        className="mt-2"
        onClick={clearChat}
      >
        Retry
      </Button>
    )}

    <p className="text-[10px] opacity-60 mt-1">
      {message.timestamp.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })}
    </p>
  </>
)}
      </div>
    </div>
  );
}

export default GeminiChat;
