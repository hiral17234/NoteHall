import { Bot, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface FloatingAIButtonProps {
  onClick: () => void;
  isOpen: boolean;
}

export function FloatingAIButton({ onClick, isOpen }: FloatingAIButtonProps) {
  return (
    <Button
      onClick={onClick}
      className={cn(
        "fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full shadow-lg transition-all duration-300 hover:scale-110",
        "bg-primary hover:bg-primary/90 text-primary-foreground",
        isOpen && "rotate-180 bg-muted text-muted-foreground hover:bg-muted/90"
      )}
    >
      <div className="relative">
        <Bot className={cn("w-6 h-6 transition-transform", isOpen && "rotate-180")} />
        {!isOpen && (
          <Sparkles className="w-3 h-3 absolute -top-1 -right-1 text-primary-foreground animate-pulse" />
        )}
      </div>
    </Button>
  );
}
