import { ReactNode, useState } from "react";
import { Sidebar } from "./Sidebar";
import { AIAssistantPanel } from "@/components/ai/AIAssistantPanel";
import { FloatingAIButton } from "@/components/ai/FloatingAIButton";
import { NotificationDropdown } from "@/components/notifications/NotificationDropdown";
import { Search, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Toaster } from "@/components/ui/toaster";
import logo from "@/assets/logo.png";

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
            {/* Logo + NoteHall in top bar */}
            <div className="flex items-center gap-2 mr-4">
              <img src={logo} alt="NoteHall" className="h-7 w-auto" />
              <span className="font-semibold text-foreground hidden sm:inline">NoteHall</span>
            </div>
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search notes, subjects, topics..."
                className="pl-10 bg-background border-border"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <NotificationDropdown />
            <Button
              onClick={() => setAiPanelOpen(!aiPanelOpen)}
              className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2"
            >
              <Sparkles className="w-4 h-4" />
              <span className="hidden sm:inline">Gemini</span>
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
      
      {/* Floating Request Notes button */}
      <FloatingAIButton />
      
      {/* Toast notifications */}
      <Toaster />
    </div>
  );
}
