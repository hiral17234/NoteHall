import { useState, useRef } from "react";
import { X, Send, FileText, Brain, ListChecks, HelpCircle, Loader2, Lightbulb, GraduationCap, ClipboardList, Mic, Sparkles, Camera, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useUser } from "@/contexts/UserContext";
import { geminiService } from "@/services/geminiService";
import { toast } from "@/hooks/use-toast";

interface AIAssistantPanelProps {
  open: boolean;
  onClose: () => void;
  initialPrompt?: string;
  noteContext?: string;
}

interface Message {
  id: string;
  content: string;
  role: "user" | "assistant";
  timestamp: Date;
  imageUrl?: string;
}

const basicActions = [
  { id: "summarize", label: "Summarize", icon: FileText, color: "bg-chart-1/20 text-chart-1" },
  { id: "explain", label: "Explain Topic", icon: Brain, color: "bg-chart-2/20 text-chart-2" },
  { id: "revision", label: "Revision Points", icon: ListChecks, color: "bg-chart-3/20 text-chart-3" },
  { id: "mcq", label: "Generate MCQs", icon: HelpCircle, color: "bg-chart-4/20 text-chart-4" },
];

const advancedActions = [
  { id: "viva", label: "Viva Questions", icon: Mic, color: "bg-primary/20 text-primary" },
  { id: "cheatsheet", label: "Cheat Sheet", icon: ClipboardList, color: "bg-chart-5/20 text-chart-5" },
  { id: "examples", label: "With Examples", icon: Lightbulb, color: "bg-chart-1/20 text-chart-1" },
  { id: "beginner", label: "Explain Simple", icon: GraduationCap, color: "bg-chart-2/20 text-chart-2" },
];

export function AIAssistantPanel({ open, onClose, initialPrompt, noteContext }: AIAssistantPanelProps) {
  const { user } = useUser();
  const userName = user?.name?.split(" ")[0] || "there";
  const userBranch = user?.branch || "";
  const userYear = user?.year || "";
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      content: noteContext 
        ? `Hi ${userName}! I'm ready to help you with "${noteContext}". Choose an action below or ask me anything!`
        : `Hello ${userName}! 👋 I'm Gemini, your AI study assistant${userBranch ? ` for ${userBranch}` : ""}${userYear ? ` (${userYear})` : ""}. I can help you summarize notes, explain topics, generate MCQs, prepare for vivas, and much more! How can I help you today?`,
      role: "assistant",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState(initialPrompt || "");
  const [isTyping, setIsTyping] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);

  // Set context for Gemini service
  geminiService.setContext({
    userBranch: user?.branch,
    userYear: user?.year,
    noteTitle: noteContext,
  });

  const handleSend = async (text?: string) => {
    const messageText = text || input;
    if (!messageText.trim() && !selectedImage) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: messageText || (selectedImage ? "Analyze this image" : ""),
      role: "user",
      timestamp: new Date(),
      imageUrl: selectedImage ? URL.createObjectURL(selectedImage) : undefined,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setSelectedImage(null);
    setIsTyping(true);

    try {
      // Build the prompt with image context if present
      let fullPrompt = messageText;
      if (selectedImage) {
        fullPrompt = `[User has shared an image] ${messageText || "Please analyze this image and help me understand it."}`;
      }

      const response = await geminiService.sendMessage(fullPrompt);
      
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: response,
        role: "assistant",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMessage]);
    } catch (error: any) {
      console.error("AI error:", error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: error?.message?.includes("API") 
          ? "I'm having trouble connecting to the AI service. Please make sure the Gemini API key is configured correctly."
          : "Sorry, I encountered an error. Please try again.",
        role: "assistant",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
      toast({
        title: "AI Error",
        description: error?.message || "Failed to get AI response",
        variant: "destructive",
      });
    } finally {
      setIsTyping(false);
    }
  };

  const handleActionClick = (actionId: string) => {
    const actionMessages: Record<string, string> = {
      summarize: "Summarize this note for me",
      explain: "Explain this topic in detail",
      revision: "Generate revision points from this note",
      mcq: "Create practice MCQs from this content",
      viva: "Generate viva questions for this topic",
      cheatsheet: "Create a quick cheat sheet",
      examples: "Explain this with real-world examples",
      beginner: "Explain like I'm in 1st year - make it super simple",
    };
    handleSend(actionMessages[actionId]);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Image too large",
          description: "Please select an image under 5MB",
          variant: "destructive",
        });
        return;
      }
      setSelectedImage(file);
    }
  };

  return (
    <div
      className={cn(
        "fixed right-0 top-0 h-screen w-96 bg-card border-l border-border shadow-xl transition-transform duration-300 z-50 flex flex-col",
        open ? "translate-x-0" : "translate-x-full"
      )}
    >
      {/* Header */}
      <div className="h-16 px-4 flex items-center justify-between border-b border-border">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Gemini</h3>
            <p className="text-xs text-muted-foreground">AI Study Assistant</p>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="w-5 h-5" />
        </Button>
      </div>

      {/* AI Actions with Tabs */}
      <div className="border-b border-border">
        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="w-full bg-muted/50 rounded-none h-9">
            <TabsTrigger value="basic" className="flex-1 text-xs">Basic</TabsTrigger>
            <TabsTrigger value="study" className="flex-1 text-xs">Study Mode</TabsTrigger>
          </TabsList>
          <TabsContent value="basic" className="p-3 mt-0">
            <div className="grid grid-cols-2 gap-2">
              {basicActions.map((action) => (
                <button
                  key={action.id}
                  onClick={() => handleActionClick(action.id)}
                  disabled={isTyping}
                  className={cn(
                    "flex items-center gap-2 p-2.5 rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50",
                    action.color
                  )}
                >
                  <action.icon className="w-4 h-4" />
                  <span className="text-xs font-medium">{action.label}</span>
                </button>
              ))}
            </div>
          </TabsContent>
          <TabsContent value="study" className="p-3 mt-0">
            <div className="grid grid-cols-2 gap-2">
              {advancedActions.map((action) => (
                <button
                  key={action.id}
                  onClick={() => handleActionClick(action.id)}
                  disabled={isTyping}
                  className={cn(
                    "flex items-center gap-2 p-2.5 rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50",
                    action.color
                  )}
                >
                  <action.icon className="w-4 h-4" />
                  <span className="text-xs font-medium">{action.label}</span>
                </button>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "flex gap-3",
                message.role === "user" && "flex-row-reverse"
              )}
            >
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
                  message.role === "assistant"
                    ? "bg-gradient-to-br from-blue-500 to-purple-600"
                    : "bg-secondary"
                )}
              >
                {message.role === "assistant" ? (
                  <Sparkles className="w-4 h-4 text-white" />
                ) : (
                  <span className="text-xs font-medium text-secondary-foreground">
                    {user?.name?.split(" ").map(n => n[0]).join("") || "U"}
                  </span>
                )}
              </div>
              <div
                className={cn(
                  "max-w-[80%] rounded-xl px-4 py-2.5",
                  message.role === "assistant"
                    ? "bg-muted text-foreground"
                    : "bg-primary text-primary-foreground"
                )}
              >
                {message.imageUrl && (
                  <img 
                    src={message.imageUrl} 
                    alt="Shared image" 
                    className="max-w-full rounded-lg mb-2"
                  />
                )}
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              </div>
            </div>
          ))}
          
          {isTyping && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-gradient-to-br from-blue-500 to-purple-600">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div className="bg-muted rounded-xl px-4 py-3">
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Thinking...</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Selected Image Preview */}
      {selectedImage && (
        <div className="px-4 py-2 border-t border-border bg-muted/50">
          <div className="flex items-center gap-2">
            <img 
              src={URL.createObjectURL(selectedImage)} 
              alt="Selected" 
              className="w-12 h-12 rounded-lg object-cover"
            />
            <span className="text-xs text-muted-foreground flex-1 truncate">{selectedImage.name}</span>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-6 w-6"
              onClick={() => setSelectedImage(null)}
            >
              <X className="w-4 h-4" />
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
            accept="image/*"
            onChange={handleImageSelect}
            className="hidden"
          />
          <Button
            variant="outline"
            size="icon"
            onClick={() => fileInputRef.current?.click()}
            disabled={isTyping}
            className="flex-shrink-0"
          >
            <Camera className="w-4 h-4" />
          </Button>
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask me anything..."
            className="flex-1"
            onKeyDown={(e) => e.key === "Enter" && !isTyping && handleSend()}
            disabled={isTyping}
          />
          <Button 
            onClick={() => handleSend()} 
            className="bg-primary hover:bg-primary/90"
            disabled={isTyping || (!input.trim() && !selectedImage)}
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
