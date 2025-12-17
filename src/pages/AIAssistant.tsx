import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bot, Send, Sparkles, BookOpen, FileQuestion, Lightbulb, ListChecks } from "lucide-react";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  content: string;
  role: "user" | "assistant";
  timestamp: Date;
}

const quickActions = [
  { icon: BookOpen, label: "Summarize a topic", prompt: "Can you summarize the concept of" },
  { icon: FileQuestion, label: "Explain a concept", prompt: "Explain in simple terms:" },
  { icon: Lightbulb, label: "Study tips", prompt: "Give me study tips for" },
  { icon: ListChecks, label: "Practice questions", prompt: "Generate practice questions about" },
];

const mockResponses = [
  "I'd be happy to help you with that! Let me break down the concept into simpler terms...\n\n**Key Points:**\n1. The fundamental principle is...\n2. This relates to...\n3. In practical applications...\n\nWould you like me to elaborate on any specific part?",
  "Great question! Here's a comprehensive summary:\n\n**Overview:**\nThe topic you're asking about is fundamental to understanding...\n\n**Main Concepts:**\n- Concept A: Deals with...\n- Concept B: Focuses on...\n\nLet me know if you need more details!",
  "Here are some practice questions to test your understanding:\n\n1. What is the primary function of...?\n2. How does X relate to Y?\n3. Explain the difference between A and B.\n4. In what scenarios would you use...?\n\nWant me to provide the answers?",
];

export default function AIAssistant() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      content: "Hello! I'm your AI study assistant. I can help you understand complex topics, summarize notes, generate practice questions, and provide study tips. What would you like to learn today?",
      role: "assistant",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");

  const handleSend = (text?: string) => {
    const messageText = text || input;
    if (!messageText.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: messageText,
      role: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");

    // Mock AI response
    setTimeout(() => {
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: mockResponses[Math.floor(Math.random() * mockResponses.length)],
        role: "assistant",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMessage]);
    }, 1500);
  };

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto h-[calc(100vh-8rem)] flex flex-col">
        {/* Header */}
        <div className="mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center">
              <Bot className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">AI Study Assistant</h1>
              <p className="text-muted-foreground">Your personal learning companion</p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        {messages.length <= 1 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            {quickActions.map((action, index) => (
              <Card
                key={index}
                className="bg-card border-border hover:border-primary/50 cursor-pointer transition-all group"
                onClick={() => handleSend(action.prompt)}
              >
                <CardContent className="p-4 flex flex-col items-center text-center gap-2">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <action.icon className="w-5 h-5 text-primary" />
                  </div>
                  <span className="text-sm font-medium text-foreground">{action.label}</span>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Chat Area */}
        <Card className="flex-1 bg-card border-border flex flex-col overflow-hidden">
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
                        ? "bg-primary"
                        : "bg-secondary"
                    )}
                  >
                    {message.role === "assistant" ? (
                      <Bot className="w-4 h-4 text-primary-foreground" />
                    ) : (
                      <span className="text-xs font-medium text-secondary-foreground">JD</span>
                    )}
                  </div>
                  <div
                    className={cn(
                      "max-w-[80%] rounded-xl px-4 py-3",
                      message.role === "assistant"
                        ? "bg-muted text-foreground"
                        : "bg-primary text-primary-foreground"
                    )}
                  >
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>

          {/* Input Area */}
          <div className="p-4 border-t border-border">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-xs text-muted-foreground">Powered by NoteHall AI</span>
            </div>
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask me anything about your studies..."
                className="flex-1 bg-background"
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
              />
              <Button
                onClick={() => handleSend()}
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </MainLayout>
  );
}
