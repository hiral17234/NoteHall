import { ReactNode, useState, createContext, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { AIAssistantPanel } from "@/components/ai/AIAssistantPanel";
import { FloatingAIButton } from "@/components/ai/FloatingAIButton";
import { NotificationDropdown } from "@/components/notifications/NotificationDropdown";
import { SearchBar } from "@/components/search/SearchBar";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/toaster";
import { cn } from "@/lib/utils";
import logo from "@/assets/logo.png";

interface MainLayoutProps {
  children: ReactNode;
}

// Sidebar context for collapsed state
interface SidebarContextType {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export function useSidebar() {
  const context = useContext(SidebarContext);
  if (!context) {
    return { collapsed: false, setCollapsed: () => {} };
  }
  return context;
}

export function MainLayout({ children }: MainLayoutProps) {
  const [aiPanelOpen, setAiPanelOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const navigate = useNavigate();

  const handleNoteSelect = (note: { id: string }) => {
    navigate(`/?noteId=${note.id}`);
  };

  return (
    <SidebarContext.Provider value={{ collapsed: sidebarCollapsed, setCollapsed: setSidebarCollapsed }}>
      <div className="min-h-screen bg-background">
        <Sidebar />
        
        {/* Main Content - dynamic margin based on sidebar state */}
        <div className={cn(
          "transition-all duration-300",
          sidebarCollapsed ? "ml-16" : "ml-64"
        )}>
          {/* Top Bar */}
          <header className="sticky top-0 z-30 h-16 bg-card/80 backdrop-blur-sm border-b border-border flex items-center justify-between px-6">
            <div className="flex items-center gap-4 flex-1 max-w-xl">
              <div className="flex items-center gap-2 mr-4">
                <img src={logo} alt="NoteHall" className="h-7 w-auto" />
                <span className="font-semibold text-foreground hidden sm:inline">NoteHall</span>
              </div>
              <SearchBar 
                onSelectNote={handleNoteSelect}
                placeholder="Search notes, subjects, topics..."
              />
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
    </SidebarContext.Provider>
  );
}
