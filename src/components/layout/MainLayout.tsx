import { ReactNode, useState } from "react";
import { Sidebar } from "./Sidebar";
import { AIAssistantPanel } from "@/components/ai/AIAssistantPanel";
import { FloatingAIButton } from "@/components/ai/FloatingAIButton";
import { Bot, Search, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Toaster } from "@/components/ui/toaster";

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const [aiPanelOpen, setAiPanelOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      
      {/* Main Content */}
      <div className="ml-64 transition-all duration-300">
        {/* Top Bar */}
        <header className="sticky top-0 z-30 h-16 bg-card/80 backdrop-blur-sm border-b border-border flex items-center justify-between px-6">
          <div className="flex items-center gap-4 flex-1 max-w-xl">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search notes, subjects, topics..."
                className="pl-10 bg-background border-border"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="w-5 h-5" />
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-primary text-primary-foreground text-[10px] rounded-full flex items-center justify-center">
                3
              </span>
            </Button>
            <Button
              onClick={() => setAiPanelOpen(!aiPanelOpen)}
              className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2"
            >
              <Bot className="w-4 h-4" />
              <span className="hidden sm:inline">AI Assistant</span>
            </Button>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-6">
          {children}
        </main>
      </div>

      {/* AI Assistant Panel */}
      <AIAssistantPanel open={aiPanelOpen} onClose={() => setAiPanelOpen(false)} />
      
      {/* Floating AI Button */}
      <FloatingAIButton onClick={() => setAiPanelOpen(!aiPanelOpen)} isOpen={aiPanelOpen} />
      
      {/* Toast notifications */}
      <Toaster />
    </div>
  );
}
