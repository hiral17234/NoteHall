import { useState } from "react";
import { X, Send, Bot, Sparkles, FileText, Brain, ListChecks, HelpCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";

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
}

const aiActions = [
  { id: "summarize", label: "Summarize", icon: FileText, color: "bg-chart-1/20 text-chart-1" },
  { id: "explain", label: "Explain Topic", icon: Brain, color: "bg-chart-2/20 text-chart-2" },
  { id: "revision", label: "Revision Points", icon: ListChecks, color: "bg-chart-3/20 text-chart-3" },
  { id: "mcq", label: "Generate MCQs", icon: HelpCircle, color: "bg-chart-4/20 text-chart-4" },
];

const mockResponses: Record<string, string> = {
  summarize: `📝 **Summary**

This note covers the fundamental concepts with the following key points:

• **Introduction**: Basic definitions and terminology
• **Core Concepts**: Main theories and principles explained
• **Applications**: Real-world use cases and examples
• **Important Formulas**: Key equations to remember

The content is well-structured and covers approximately 80% of the syllabus for this topic.`,
  explain: `🧠 **Explanation**

Let me break this down in simple terms:

**What is it?**
This concept refers to the fundamental principle that governs how systems interact and process information.

**How does it work?**
Think of it like a pipeline where data flows through different stages, each performing a specific transformation.

**Why is it important?**
Understanding this helps you grasp more advanced topics and solve real-world problems efficiently.

**Example:**
Imagine you're organizing a library - this concept is like the system that determines which shelf each book goes to.`,
  revision: `📋 **Revision Points**

Here are the key points to remember:

1. **Definition**: Memorize the exact technical definition
2. **Types**: There are 4 main types - A, B, C, and D
3. **Properties**: 
   - Property 1: Always true for type A
   - Property 2: Conditionally applies
   - Property 3: Exception cases
4. **Formulas**:
   - Main formula: X = Y + Z
   - Derived formula: A = B × C
5. **Applications**: Used in networking, databases, and AI
6. **Common Mistakes**: Don't confuse Type A with Type B
7. **Exam Tips**: Focus on numerical problems and diagrams`,
  mcq: `❓ **Practice MCQs**

**Q1.** What is the primary purpose of this concept?
a) Data storage
b) Data processing ✓
c) Data deletion
d) Data encryption

**Q2.** Which type is most commonly used in real applications?
a) Type A
b) Type B ✓
c) Type C
d) Type D

**Q3.** The time complexity of the main algorithm is:
a) O(1)
b) O(n) ✓
c) O(n²)
d) O(log n)

**Q4.** Which of the following is NOT a characteristic?
a) Scalability
b) Reliability
c) Immutability ✓
d) Efficiency

**Q5.** In the worst case scenario, the space complexity is:
a) O(1)
b) O(n)
c) O(n²) ✓
d) O(2ⁿ)`,
  default: `I'd be happy to help you understand this topic better! Based on what you've shared, here are some key insights:

1. **Main Concept**: The fundamental idea revolves around efficient data organization
2. **Key Takeaway**: Focus on understanding the relationships between components
3. **Study Tip**: Practice with examples to solidify your understanding

Would you like me to elaborate on any specific aspect?`,
};

export function AIAssistantPanel({ open, onClose, initialPrompt, noteContext }: AIAssistantPanelProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      content: noteContext 
        ? `I'm ready to help you with "${noteContext}". Choose an action below or ask me anything!`
        : "Hello! I'm your AI study assistant. I can help you summarize notes, explain topics, generate revision points, and create practice MCQs. How can I help you today?",
      role: "assistant",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState(initialPrompt || "");
  const [isTyping, setIsTyping] = useState(false);

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
    setIsTyping(true);

    // Determine response type
    const lowerText = messageText.toLowerCase();
    let responseKey = "default";
    if (lowerText.includes("summarize") || lowerText.includes("summary")) {
      responseKey = "summarize";
    } else if (lowerText.includes("explain") || lowerText.includes("what is")) {
      responseKey = "explain";
    } else if (lowerText.includes("revision") || lowerText.includes("points") || lowerText.includes("remember")) {
      responseKey = "revision";
    } else if (lowerText.includes("mcq") || lowerText.includes("question") || lowerText.includes("quiz")) {
      responseKey = "mcq";
    }

    // Mock AI response with typing delay
    setTimeout(() => {
      setIsTyping(false);
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: mockResponses[responseKey],
        role: "assistant",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMessage]);
    }, 1500);
  };

  const handleActionClick = (actionId: string) => {
    const actionMessages: Record<string, string> = {
      summarize: "Summarize this note for me",
      explain: "Explain this topic in simple terms",
      revision: "Generate revision points from this note",
      mcq: "Create practice MCQs from this content",
    };
    handleSend(actionMessages[actionId]);
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
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <Bot className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">AI Assistant</h3>
            <p className="text-xs text-muted-foreground">Powered by NoteHall AI</p>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="w-5 h-5" />
        </Button>
      </div>

      {/* AI Actions */}
      <div className="p-4 border-b border-border">
        <div className="grid grid-cols-2 gap-2">
          {aiActions.map((action) => (
            <button
              key={action.id}
              onClick={() => handleActionClick(action.id)}
              className={cn(
                "flex items-center gap-2 p-3 rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98]",
                action.color
              )}
            >
              <action.icon className="w-4 h-4" />
              <span className="text-sm font-medium">{action.label}</span>
            </button>
          ))}
        </div>
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
                  "max-w-[80%] rounded-xl px-4 py-2.5",
                  message.role === "assistant"
                    ? "bg-muted text-foreground"
                    : "bg-primary text-primary-foreground"
                )}
              >
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              </div>
            </div>
          ))}
          
          {isTyping && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-primary">
                <Bot className="w-4 h-4 text-primary-foreground" />
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

      {/* Input */}
      <div className="p-4 border-t border-border">
        <div className="flex gap-2">
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
            disabled={isTyping || !input.trim()}
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
