import { HelpCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";

interface FloatingAIButtonProps {
  onClick?: () => void;
  isOpen?: boolean;
}

export function FloatingAIButton({ onClick, isOpen }: FloatingAIButtonProps) {
  // Changed to "Request Notes / Ask Doubt" button that navigates to HelpDesk
  return (
    <Link to="/helpdesk">
      <Button
        className={cn(
          "fixed bottom-6 right-6 z-40 h-14 px-5 rounded-full shadow-lg transition-all duration-300 hover:scale-105",
          "bg-primary hover:bg-primary/90 text-primary-foreground gap-2"
        )}
      >
        <HelpCircle className="w-5 h-5" />
        <span className="font-medium">Request Notes</span>
      </Button>
    </Link>
  );
}
