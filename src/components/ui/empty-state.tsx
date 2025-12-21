import { FileText, Inbox, Search, Bookmark, HelpCircle, Bell } from "lucide-react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  type: "notes" | "requests" | "search" | "saved" | "helped" | "notifications";
  title?: string;
  description?: string;
  className?: string;
}

const emptyStateConfig = {
  notes: {
    icon: FileText,
    title: "No notes found",
    description: "Be the first to upload notes for this subject!",
  },
  requests: {
    icon: HelpCircle,
    title: "No requests yet",
    description: "Create a request if you need specific study materials.",
  },
  search: {
    icon: Search,
    title: "No results found",
    description: "Try adjusting your search or filters.",
  },
  saved: {
    icon: Bookmark,
    title: "No saved notes",
    description: "Save notes to access them quickly later.",
  },
  helped: {
    icon: Inbox,
    title: "No helped requests",
    description: "Help others by uploading requested materials.",
  },
  notifications: {
    icon: Bell,
    title: "No notifications",
    description: "When you get likes, comments, or contributions, they'll show up here.",
  },
};

export function EmptyState({ type, title, description, className }: EmptyStateProps) {
  const config = emptyStateConfig[type];
  const Icon = config.icon;

  return (
    <div className={cn("flex flex-col items-center justify-center py-16 px-4", className)}>
      <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
        <Icon className="w-10 h-10 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-1">
        {title || config.title}
      </h3>
      <p className="text-sm text-muted-foreground text-center max-w-sm">
        {description || config.description}
      </p>
    </div>
  );
}
