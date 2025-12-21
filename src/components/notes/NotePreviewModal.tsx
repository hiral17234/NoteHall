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
  User
} from "lucide-react";
import { cn } from "@/lib/utils";
import { NoteCommentsSection } from "./NoteCommentsSection";

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

const mockContent = {
  pdf: "This is a comprehensive PDF document covering all the essential topics. The content includes detailed explanations, diagrams, and examples to help you understand the subject better.",
  image: "High-quality diagram illustrating the key concepts. The image includes annotations and labels for easy understanding.",
  video: "A detailed video tutorial explaining the topic step by step. Duration: 15 minutes. Covers basics to advanced concepts.",
  link: "External resource link to verified study materials from reputable educational sources.",
};

export function NotePreviewModal({ note, open, onClose, onAskAI }: NotePreviewModalProps) {
  if (!note) return null;

  const FileIcon = fileTypeIcons[note.fileType];

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

            {/* Preview Content */}
            <div className="bg-muted/50 rounded-xl p-4">
              <h4 className="text-sm font-medium text-foreground mb-2">Preview</h4>
              <p className="text-sm text-muted-foreground">
                {mockContent[note.fileType]}
              </p>
              
              {note.fileType === "image" && (
                <div className="mt-4 aspect-video bg-muted rounded-lg flex items-center justify-center">
                  <Image className="w-12 h-12 text-muted-foreground" />
                </div>
              )}
              
              {note.fileType === "video" && (
                <div className="mt-4 aspect-video bg-muted rounded-lg flex items-center justify-center">
                  <Video className="w-12 h-12 text-muted-foreground" />
                </div>
              )}
            </div>

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
          <Button className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2 flex-1">
            <Download className="w-4 h-4" />
            Download
          </Button>
          <Button variant="outline" className="gap-2 flex-1">
            <Bookmark className="w-4 h-4" />
            Save
          </Button>
          <Button variant="outline" className="gap-2 flex-1">
            <Share2 className="w-4 h-4" />
            Share
          </Button>
          <Button 
            variant="outline" 
            onClick={onAskAI}
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
