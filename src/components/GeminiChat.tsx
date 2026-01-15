import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useGemini } from "@/hooks/useGemini";
import { useAuth } from "@/contexts/AuthContext";
import ReactMarkdown from "react-markdown";
import { Send, Loader2, Sparkles, User, Image as ImageIcon, X, AlertCircle, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface GeminiChatProps {
  className?: string;
  noteContext?: { title?: string; subject?: string; fileUrl?: string; fileType?: string };
}

export function GeminiChat({ className, noteContext }: GeminiChatProps) {
  const { userProfile } = useAuth();
  const { messages, isLoading, error, sendMessage, clearChat, setContext, isConfigured } = useGemini();
  const [input, setInput] = useState("");
  const [images, setImages] = useState<{ base64: string; mimeType: string; preview: string }[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [hasAutoSent, setHasAutoSent] = useState(false);

  useEffect(() => {
    if (noteContext) setContext({ noteTitle: noteContext.title, selectedSubject: noteContext.subject });
  }, [noteContext, setContext]);

  useEffect(() => {
    if (userProfile) setContext({ userBranch: userProfile.branch, userYear: userProfile.year });
  }, [userProfile, setContext]);

  // Auto-send initial message when noteContext has a file
  useEffect(() => {
    if (noteContext?.fileUrl && noteContext?.title && !hasAutoSent && messages.length === 0) {
      const initialPrompt = `I'm studying a note titled "${noteContext.title}"${noteContext.subject ? ` about ${noteContext.subject}` : ""}. The file is available at: ${noteContext.fileUrl}\n\nPlease help me understand this note. What would you like to know about it? You can:\n- Summarize the content\n- Explain key concepts\n- Generate practice questions\n- Answer specific questions about it`;
      sendMessage(initialPrompt);
      setHasAutoSent(true);
    }
  }, [noteContext, hasAutoSent, messages.length, sendMessage]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!input.trim() && images.length === 0) || isLoading) return;
    const imageData = images.map(img => ({ base64: img.base64, mimeType: img.mimeType }));
    await sendMessage(input, imageData.length > 0 ? imageData : undefined);
    setInput("");
    setImages([]);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach((file) => {
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = () => {
          const base64 = (reader.result as string).split(",")[1];
          setImages((prev) => [...prev, { base64, mimeType: file.type, preview: URL.createObjectURL(file) }]);
        };
        reader.readAsDataURL(file);
      }
    });
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeImage = (index: number) => {
    setImages((prev) => { URL.revokeObjectURL(prev[index].preview); return prev.filter((_, i) => i !== index); });
  };

  if (!isConfigured) {
    return (
      <Card className={cn("bg-card border-border", className)}>
        <CardContent className="flex flex-col items-center justify-center h-full py-12">
          <AlertCircle className="w-12 h-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">AI assistant unavailable</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("bg-card border-border flex flex-col", className)}>
      <CardHeader className="pb-3 shrink-0">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2"><Sparkles className="w-5 h-5 text-primary" />Gemini Chat</CardTitle>
          {messages.length > 0 && <Button variant="ghost" size="sm" onClick={clearChat}><Trash2 className="w-4 h-4 mr-1" />Clear</Button>}
        </div>
          {noteContext?.title && (
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <Badge variant="secondary">Context: {noteContext.title}</Badge>
              {noteContext.fileType && <Badge variant="outline" className="capitalize">{noteContext.fileType}</Badge>}
            </div>
          )}
      </CardHeader>
      <CardContent className="flex-1 flex flex-col overflow-hidden p-0">
        <ScrollArea className="flex-1 px-4" ref={scrollRef}>
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-12 text-center">
              <Sparkles className="w-12 h-12 text-primary/50 mb-4" />
              <p className="text-muted-foreground">Ask me anything about your studies</p>
            </div>
          ) : (
            <div className="space-y-4 py-4">
              {messages.map((msg, i) => (
                <div key={i} className={cn("flex gap-3", msg.role === "user" ? "justify-end" : "justify-start")}>
                  {msg.role === "assistant" && <Avatar className="w-8 h-8"><AvatarFallback className="bg-primary/20"><Sparkles className="w-4 h-4 text-primary" /></AvatarFallback></Avatar>}
                  <div className={cn("max-w-[80%] rounded-2xl px-4 py-3", msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted")}>
                    {msg.role === "assistant" ? <div className="prose prose-sm dark:prose-invert max-w-none"><ReactMarkdown>{msg.content}</ReactMarkdown></div> : <p className="text-sm whitespace-pre-wrap">{msg.content}</p>}
                  </div>
                  {msg.role === "user" && <Avatar className="w-8 h-8"><AvatarFallback className="bg-secondary"><User className="w-4 h-4" /></AvatarFallback></Avatar>}
                </div>
              ))}
              {isLoading && <div className="flex gap-3"><Avatar className="w-8 h-8"><AvatarFallback className="bg-primary/20"><Sparkles className="w-4 h-4 text-primary" /></AvatarFallback></Avatar><div className="bg-muted rounded-2xl px-4 py-3"><Loader2 className="w-4 h-4 animate-spin" /></div></div>}
            </div>
          )}
        </ScrollArea>
        {error && <div className="mx-4 mb-2 p-3 bg-destructive/10 text-destructive text-sm rounded-lg flex items-center gap-2"><AlertCircle className="w-4 h-4" />{error}</div>}
        {images.length > 0 && <div className="px-4 pb-2 flex gap-2">{images.map((img, i) => <div key={i} className="relative"><img src={img.preview} className="w-16 h-16 object-cover rounded-lg" /><button onClick={() => removeImage(i)} className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center"><X className="w-3 h-3" /></button></div>)}</div>}
        <form onSubmit={handleSubmit} className="p-4 pt-2 shrink-0">
          <div className="flex gap-2">
            <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleImageUpload} />
            <Button type="button" variant="outline" size="icon" onClick={() => fileInputRef.current?.click()} disabled={isLoading}><ImageIcon className="w-4 h-4" /></Button>
            <Textarea value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask me anything..." className="flex-1 min-h-[44px] max-h-[120px] resize-none bg-background" disabled={isLoading} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSubmit(e); } }} />
            <Button type="submit" disabled={isLoading || (!input.trim() && images.length === 0)}>{isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

export default GeminiChat;
