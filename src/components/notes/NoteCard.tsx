import { useState } from "react";
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
  MoreVertical,
  Expand,
  Flag,
  Share2,
  Download
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

interface NoteCardProps {
  note: {
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
    timestamp: string;
    topic?: string;
  };
  onAskAI?: () => void;
  onExpand?: () => void;
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
  link: "bg-secondary/20 text-secondary-foreground",
};

const reportReasons = [
  { id: "inappropriate", label: "Inappropriate content" },
  { id: "wrong", label: "Wrong/misleading information" },
  { id: "spam", label: "Spam or advertisement" },
  { id: "copyright", label: "Copyright violation" },
  { id: "quality", label: "Low quality content" },
  { id: "other", label: "Other" },
];

export function NoteCard({ note, onAskAI, onExpand }: NoteCardProps) {
  const [liked, setLiked] = useState(false);
  const [disliked, setDisliked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [likes, setLikes] = useState(note.likes);
  const [dislikes, setDislikes] = useState(note.dislikes);
  const [likeAnimating, setLikeAnimating] = useState(false);
  const [dislikeAnimating, setDislikeAnimating] = useState(false);
  const [saveAnimating, setSaveAnimating] = useState(false);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reportDetails, setReportDetails] = useState("");

  const FileIcon = fileTypeIcons[note.fileType];

  const handleLike = () => {
    setLikeAnimating(true);
    setTimeout(() => setLikeAnimating(false), 300);
    
    if (liked) {
      setLiked(false);
      setLikes(likes - 1);
    } else {
      setLiked(true);
      setLikes(likes + 1);
      if (disliked) {
        setDisliked(false);
        setDislikes(dislikes - 1);
      }
      toast({
        title: "Liked!",
        description: "You liked this note",
      });
    }
  };

  const handleDislike = () => {
    setDislikeAnimating(true);
    setTimeout(() => setDislikeAnimating(false), 300);
    
    if (disliked) {
      setDisliked(false);
      setDislikes(dislikes - 1);
    } else {
      setDisliked(true);
      setDislikes(dislikes + 1);
      if (liked) {
        setLiked(false);
        setLikes(likes - 1);
      }
    }
  };

  const handleSave = () => {
    setSaveAnimating(true);
    setTimeout(() => setSaveAnimating(false), 300);
    
    setSaved(!saved);
    toast({
      title: saved ? "Removed from saved" : "Saved!",
      description: saved ? "Note removed from your collection" : "Note added to your collection",
    });
  };

  const handleShare = () => {
    navigator.clipboard.writeText(`https://notehall.app/note/${note.id}`);
    toast({
      title: "Link copied!",
      description: "Note link copied to clipboard",
    });
  };

  const handleDownload = () => {
    toast({
      title: "Download started",
      description: "Your file will be downloaded shortly",
    });
  };

  const handleReport = () => {
    if (!reportReason) {
      toast({
        title: "Please select a reason",
        variant: "destructive",
      });
      return;
    }
    toast({
      title: "Report submitted",
      description: "Thank you for helping keep NoteHall clean!",
    });
    setReportDialogOpen(false);
    setReportReason("");
    setReportDetails("");
  };

  return (
    <>
      <Card className="bg-card border-border hover:shadow-lg transition-all duration-200 group">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <div className={cn("p-2.5 rounded-xl flex-shrink-0", fileTypeColors[note.fileType])}>
                <FileIcon className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-foreground line-clamp-2 group-hover:text-primary transition-colors cursor-pointer" onClick={onExpand}>
                  {note.title}
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  by {note.author} • {note.timestamp}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity" onClick={onExpand}>
                <Expand className="w-4 h-4" />
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleShare}>
                    <Share2 className="w-4 h-4 mr-2" />
                    Share
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleDownload}>
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setReportDialogOpen(true)} className="text-destructive focus:text-destructive">
                    <Flag className="w-4 h-4 mr-2" />
                    Report
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pb-3">
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
        </CardContent>

        <CardFooter className="pt-3 border-t border-border flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLike}
              className={cn(
                "h-8 px-2 gap-1 transition-all",
                liked && "text-primary bg-primary/10",
                likeAnimating && "scale-125"
              )}
            >
              <ThumbsUp className={cn("w-4 h-4 transition-transform", likeAnimating && "animate-bounce")} />
              <span className="text-xs">{likes}</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDislike}
              className={cn(
                "h-8 px-2 gap-1 transition-all",
                disliked && "text-destructive bg-destructive/10",
                dislikeAnimating && "scale-125"
              )}
            >
              <ThumbsDown className={cn("w-4 h-4 transition-transform", dislikeAnimating && "animate-bounce")} />
              <span className="text-xs">{dislikes}</span>
            </Button>
            <div className="flex items-center gap-1 text-muted-foreground px-2">
              <Eye className="w-4 h-4" />
              <span className="text-xs">{note.views}</span>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSave}
              className={cn(
                "h-8 px-2 transition-all",
                saved && "text-primary bg-primary/10",
                saveAnimating && "scale-125"
              )}
            >
              <Bookmark className={cn("w-4 h-4 transition-transform", saved && "fill-current", saveAnimating && "animate-bounce")} />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onAskAI}
              className="h-8 gap-1 border-primary/30 text-primary hover:bg-primary hover:text-primary-foreground"
            >
              <Bot className="w-4 h-4" />
              <span className="text-xs">Ask AI</span>
            </Button>
          </div>
        </CardFooter>
      </Card>

      {/* Report Dialog */}
      <Dialog open={reportDialogOpen} onOpenChange={setReportDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Report Content</DialogTitle>
            <DialogDescription>
              Help us maintain quality by reporting inappropriate content
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Reason for reporting</Label>
              <RadioGroup value={reportReason} onValueChange={setReportReason}>
                {reportReasons.map((reason) => (
                  <div key={reason.id} className="flex items-center space-x-2">
                    <RadioGroupItem value={reason.id} id={reason.id} />
                    <Label htmlFor={reason.id} className="font-normal cursor-pointer">
                      {reason.label}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="report-details">Additional details (optional)</Label>
              <Textarea
                id="report-details"
                placeholder="Provide more context..."
                value={reportDetails}
                onChange={(e) => setReportDetails(e.target.value)}
                rows={3}
              />
            </div>

            <Button onClick={handleReport} className="w-full bg-destructive hover:bg-destructive/90 text-destructive-foreground">
              <Flag className="w-4 h-4 mr-2" />
              Submit Report
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
