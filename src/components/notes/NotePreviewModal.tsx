import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { 
  FileText, 
  Image, 
  Video, 
  Link, 
  ThumbsUp, 
  ThumbsDown, 
  Eye, 
  Bookmark,
  Bot,
  Download,
  Share2,
  User,
  ExternalLink,
  Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { NoteCommentsSection } from "./NoteCommentsSection";
import { notesService } from "@/services/firestoreService";
import { useSavedNotes } from "@/contexts/SavedNotesContext";
import { auth } from "@/lib/firebase";
import { toast } from "@/hooks/use-toast";

interface Note {
  id: string;
  title: string;
  subject: string;
  branch: string;
  year: string;
  fileType: "pdf" | "image" | "video" | "link";
  likes: number;
  dislikes: number;
  views: number;
  author: string;
  authorId?: string;
  timestamp: string;
  topic?: string;
  fileUrl?: string;
}

interface NotePreviewModalProps {
  note: Note | null;
  open: boolean;
  onClose: () => void;
  onAskAI?: () => void;
}

const fileTypeIcons = {
  pdf: FileText,
  image: Image,
  video: Video,
  link: Link,
};

const fileTypeColors = {
  pdf: "bg-destructive/10 text-destructive",
  image: "bg-chart-1/20 text-chart-4",
  video: "bg-primary/10 text-primary",
  link: "bg-secondary/20 text-secondary",
};

const getDownloadLabel = (fileType: string) => {
  switch (fileType) {
    case "pdf": return "Download PDF";
    case "image": return "Download Image";
    case "video": return "Download Video";
    case "link": return "Open Link";
    default: return "Download";
  }
};

export function NotePreviewModal({ note, open, onClose, onAskAI }: NotePreviewModalProps) {
  const navigate = useNavigate();
  const { isNoteSaved, toggleSave } = useSavedNotes();
  const [isDownloading, setIsDownloading] = useState(false);

  if (!note) return null;

  const FileIcon = fileTypeIcons[note.fileType];
  const saved = isNoteSaved(note.id);

  const handleDownload = async () => {
    if (!note.fileUrl) {
      toast({ title: "No file available", description: "This note doesn't have a downloadable file.", variant: "destructive" });
      return;
    }

    setIsDownloading(true);
    try {
      if (note.fileType === "link") {
        window.open(note.fileUrl, '_blank');
      } else if (auth.currentUser) {
        await notesService.downloadNote(note.id, auth.currentUser.uid, {
          title: note.title,
          subject: note.subject,
          fileUrl: note.fileUrl,
        });
        toast({ title: "Download Started", description: "Your file is being prepared." });
      } else {
        window.open(note.fileUrl, '_blank');
      }
    } catch (error) {
      console.error("Download error:", error);
      window.open(note.fileUrl, '_blank');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleSave = () => {
    toggleSave(note as any);
    toast({ 
      title: saved ? "Removed from saved" : "Saved!", 
      description: saved ? "Note removed from your collection" : "Note added to your collection" 
    });
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/notes/${note.id}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: note.title, url });
      } catch (err) { console.error(err); }
    } else {
      await navigator.clipboard.writeText(url);
      toast({ title: "Link Copied", description: "Share it with your friends!" });
    }
  };

  const handleAskAI = () => {
  navigate("/gemini", {
    state: {
      title: note.title,
      subject: note.subject,
      fileUrl: note.fileUrl,
    },
  });
  onClose();
};


  const renderMediaPreview = () => {
    if (!note.fileUrl) return null;

    switch (note.fileType) {
      case "image":
        return (
          <div className="mt-4 rounded-xl overflow-hidden border border-border">
            <img 
              src={note.fileUrl} 
              alt={note.title} 
              className="w-full max-h-[300px] object-contain bg-muted"
            />
          </div>
        );
      case "video":
        return (
          <div className="mt-4 aspect-video rounded-xl overflow-hidden border border-border">
            <video 
              src={note.fileUrl} 
              controls 
              className="w-full h-full bg-muted"
            />
          </div>
        );
      case "pdf":
        return (
          <div className="mt-4 rounded-xl overflow-hidden border border-border">
            <iframe 
              src={`${note.fileUrl}#view=FitH`}
              title={note.title}
              className="w-full h-[400px]"
            />
          </div>
        );
      case "link":
        return (
          <div className="mt-4 p-4 bg-muted/50 rounded-xl border border-border">
            <a 
              href={note.fileUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-primary hover:underline"
            >
              <ExternalLink className="w-4 h-4" />
              Open External Resource
            </a>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] p-0 flex flex-col">
        <DialogHeader className="p-6 pb-0">
          <div className="flex items-start gap-4">
            <div className={cn("p-3 rounded-xl", fileTypeColors[note.fileType])}>
              <FileIcon className="w-6 h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-xl font-semibold text-foreground leading-tight">
                {note.title}
              </DialogTitle>
              <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                <User className="w-4 h-4" />
                <span>{note.author}</span>
                <span>•</span>
                <span>{note.timestamp}</span>
              </div>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 max-h-[50vh]">
          <div className="p-6 pt-4 space-y-6">
            {/* Tags */}
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary" className="bg-muted text-foreground">
                {note.subject}
              </Badge>
              <Badge variant="secondary" className="bg-muted text-foreground">
                {note.branch}
              </Badge>
              <Badge variant="secondary" className="bg-muted text-foreground">
                {note.year}
              </Badge>
              {note.topic && (
                <Badge variant="outline" className="border-primary/30 text-primary">
                  {note.topic}
                </Badge>
              )}
            </div>

            {/* Media Preview */}
            {renderMediaPreview()}

            {/* Stats */}
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <ThumbsUp className="w-4 h-4" />
                <span>{note.likes} likes</span>
              </div>
              <div className="flex items-center gap-1.5">
                <ThumbsDown className="w-4 h-4" />
                <span>{note.dislikes} dislikes</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Eye className="w-4 h-4" />
                <span>{note.views} views</span>
              </div>
            </div>

            <Separator />

            {/* Comments Section */}
            <NoteCommentsSection 
              noteId={note.id}
              ownerId={note.authorId}
              noteTitle={note.title}
            />
          </div>
        </ScrollArea>

        {/* Actions */}
        <div className="p-6 pt-0 flex flex-wrap gap-2 border-t border-border mt-auto">
          <Button 
            onClick={handleDownload}
            disabled={isDownloading}
            className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2 flex-1"
          >
            {isDownloading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : note.fileType === "link" ? (
              <ExternalLink className="w-4 h-4" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            {getDownloadLabel(note.fileType)}
          </Button>
          <Button 
            variant="outline" 
            onClick={handleSave}
            className={cn("gap-2 flex-1", saved && "text-primary border-primary/30")}
          >
            <Bookmark className={cn("w-4 h-4", saved && "fill-current")} />
            {saved ? "Saved" : "Save"}
          </Button>
          <Button variant="outline" onClick={handleShare} className="gap-2 flex-1">
            <Share2 className="w-4 h-4" />
            Share
          </Button>
          <Button 
            variant="outline" 
            onClick={handleAskAI}
            className="gap-2 flex-1 border-primary/30 text-primary hover:bg-primary hover:text-primary-foreground"
          >
            <Bot className="w-4 h-4" />
            Ask AI
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
