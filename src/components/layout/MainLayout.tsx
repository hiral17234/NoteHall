import { ReactNode, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { AIAssistantPanel } from "@/components/ai/AIAssistantPanel";
import { FloatingAIButton } from "@/components/ai/FloatingAIButton";
import { NotificationDropdown } from "@/components/notifications/NotificationDropdown";
import { SearchBar } from "@/components/search/SearchBar";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/toaster";
import logo from "@/assets/logo.png";

interface MainLayoutProps {
  children: ReactNode;
}

// All notes for search - this would come from a central store in production
const allNotes = [
  { id: "1", title: "Data Structures and Algorithms - Complete Notes Unit 1-5", subject: "DSA", branch: "CSE", year: "2nd Year", author: "Priya Sharma", topic: "Unit 1-5" },
  { id: "2", title: "Operating Systems - Process Scheduling Diagrams", subject: "OS", branch: "CSE", year: "3rd Year", author: "Rahul Verma", topic: "Process Scheduling" },
  { id: "3", title: "DBMS - Normalization Explained Video Tutorial", subject: "DBMS", branch: "CSE", year: "2nd Year", author: "Ankit Kumar", topic: "Normalization" },
  { id: "4", title: "Computer Networks - OSI Model Reference", subject: "CN", branch: "CSE", year: "3rd Year", author: "Sneha Patel", topic: "OSI Model" },
  { id: "5", title: "Machine Learning - Linear Regression Notes", subject: "ML", branch: "CSE", year: "4th Year", author: "Vikash Singh", topic: "Linear Regression" },
  { id: "6", title: "Digital Electronics - Logic Gates Diagrams", subject: "DE", branch: "ECE", year: "2nd Year", author: "Meera Gupta", topic: "Logic Gates" },
  { id: "r1", title: "DSA - Quick Revision Notes for Exams", subject: "DSA", branch: "CSE", year: "2nd Year", author: "Top Contributor", topic: "Quick Revision" },
  { id: "r2", title: "OS - Interview Questions Collection", subject: "OS", branch: "CSE", year: "3rd Year", author: "Placement Cell", topic: "Interviews" },
];

export function MainLayout({ children }: MainLayoutProps) {
  const [aiPanelOpen, setAiPanelOpen] = useState(false);
  const navigate = useNavigate();

  const handleNoteSelect = (note: { id: string }) => {
    // Navigate to note or open preview
    console.log("Selected note:", note.id);
    // Could navigate to /note/:id when implemented
  };

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
            <SearchBar 
              notes={allNotes}
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
  );
}
