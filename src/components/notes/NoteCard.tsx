import { useState, useEffect } from "react";
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
  Download,
  Star,
  AlertCircle
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
import { useSavedNotes } from "@/contexts/SavedNotesContext";

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
    difficulty?: "easy" | "medium" | "hard";
    rating?: number;
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

const difficultyColors = {
  easy: "bg-chart-1/20 text-chart-1",
  medium: "bg-chart-4/20 text-chart-4",
  hard: "bg-destructive/20 text-destructive",
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
  const { isNoteSaved, toggleSave } = useSavedNotes();
  const [liked, setLiked] = useState(false);
  const [disliked, setDisliked] = useState(false);
  const [likes, setLikes] = useState(note.likes);
  const [dislikes, setDislikes] = useState(note.dislikes);
  const [likeAnimating, setLikeAnimating] = useState(false);
  const [dislikeAnimating, setDislikeAnimating] = useState(false);
  const [saveAnimating, setSaveAnimating] = useState(false);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [ratingDialogOpen, setRatingDialogOpen] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reportDetails, setReportDetails] = useState("");
  const [userRating, setUserRating] = useState(0);
  const [userDifficulty, setUserDifficulty] = useState<"easy" | "medium" | "hard" | "">("");
  const [currentRating, setCurrentRating] = useState(note.rating || 0);
  
  const saved = isNoteSaved(note.id);

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
    toggleSave({ id: note.id, title: note.title, subject: note.subject });
  };

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/note/${note.id}`;
    const shareData = {
      title: note.title,
      text: `Check out "${note.title}" on NoteHall`,
      url: shareUrl,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
        toast({
          title: "Shared!",
          description: "Note shared successfully",
        });
      } else {
        await navigator.clipboard.writeText(shareUrl);
        toast({
          title: "Link copied!",
          description: "Note link copied to clipboard",
        });
      }
    } catch (err) {
      // User cancelled or error
      await navigator.clipboard.writeText(shareUrl);
      toast({
        title: "Link copied!",
        description: "Note link copied to clipboard",
      });
    }
  };

  const handleDownload = () => {
    // Store in downloaded notes
    const downloadedNotes = JSON.parse(localStorage.getItem("notehall_downloaded_notes") || "[]");
    if (!downloadedNotes.some((n: any) => n.id === note.id)) {
      downloadedNotes.push({
        id: note.id,
        title: note.title,
        subject: note.subject,
        downloadedAt: new Date().toISOString(),
      });
      localStorage.setItem("notehall_downloaded_notes", JSON.stringify(downloadedNotes));
    }
    
    toast({
      title: "Download started",
      description: "Your file will be downloaded shortly. Check 'Downloaded Content' in your profile.",
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

  const handleRatingSubmit = () => {
    if (userRating === 0) {
      toast({
        title: "Please select a rating",
        variant: "destructive",
      });
      return;
    }
    
    // Store rating
    const ratings = JSON.parse(localStorage.getItem("notehall_ratings") || "{}");
    ratings[note.id] = { rating: userRating, difficulty: userDifficulty };
    localStorage.setItem("notehall_ratings", JSON.stringify(ratings));
    
    setCurrentRating(userRating);
    setRatingDialogOpen(false);
    toast({
      title: "Rating submitted!",
      description: "Thanks for helping others find quality content.",
    });
  };

  const renderStars = (rating: number, interactive = false, onRate?: (r: number) => void) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            disabled={!interactive}
            onClick={() => onRate?.(star)}
            className={cn(
              "transition-colors",
              interactive && "cursor-pointer hover:scale-110"
            )}
          >
            <Star
              className={cn(
                "w-4 h-4",
                star <= rating ? "fill-chart-1 text-chart-1" : "text-muted-foreground"
              )}
            />
          </button>
        ))}
      </div>
    );
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
                <DropdownMenuContent align="end" className="bg-popover border-border">
                  <DropdownMenuItem onClick={handleShare}>
                    <Share2 className="w-4 h-4 mr-2" />
                    Share
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleDownload}>
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setRatingDialogOpen(true)}>
                    <Star className="w-4 h-4 mr-2" />
                    Rate
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
            {note.difficulty && (
              <Badge className={difficultyColors[note.difficulty]}>
                {note.difficulty.charAt(0).toUpperCase() + note.difficulty.slice(1)}
              </Badge>
            )}
          </div>
          
          {/* Rating display */}
          {currentRating > 0 && (
            <div className="flex items-center gap-2 mt-2">
              {renderStars(currentRating)}
              <span className="text-xs text-muted-foreground">({currentRating.toFixed(1)})</span>
            </div>
          )}
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
              <span className="text-xs">Gemini</span>
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

      {/* Rating Dialog */}
      <Dialog open={ratingDialogOpen} onOpenChange={setRatingDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Rate this Note</DialogTitle>
            <DialogDescription>
              Help others find quality content by rating this note
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 mt-4">
            {/* Quality Rating */}
            <div className="space-y-3">
              <Label>Quality Rating</Label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setUserRating(star)}
                    className="transition-transform hover:scale-110"
                  >
                    <Star
                      className={cn(
                        "w-8 h-8 transition-colors",
                        star <= userRating ? "fill-chart-1 text-chart-1" : "text-muted-foreground hover:text-chart-1/50"
                      )}
                    />
                  </button>
                ))}
                {userRating > 0 && (
                  <span className="ml-2 text-sm text-muted-foreground">
                    {userRating === 1 && "Poor"}
                    {userRating === 2 && "Below Average"}
                    {userRating === 3 && "Average"}
                    {userRating === 4 && "Good"}
                    {userRating === 5 && "Excellent"}
                  </span>
                )}
              </div>
            </div>

            {/* Difficulty Rating */}
            <div className="space-y-3">
              <Label>Difficulty Level</Label>
              <div className="flex gap-2">
                {(["easy", "medium", "hard"] as const).map((level) => (
                  <Button
                    key={level}
                    type="button"
                    variant={userDifficulty === level ? "default" : "outline"}
                    size="sm"
                    onClick={() => setUserDifficulty(level)}
                    className={cn(
                      userDifficulty === level && difficultyColors[level],
                      "capitalize"
                    )}
                  >
                    {level === "easy" && "😊 Easy"}
                    {level === "medium" && "🤔 Medium"}
                    {level === "hard" && "😰 Hard"}
                  </Button>
                ))}
              </div>
            </div>

            <Button 
              onClick={handleRatingSubmit} 
              className="w-full bg-primary hover:bg-primary/90"
              disabled={userRating === 0}
            >
              <Star className="w-4 h-4 mr-2" />
              Submit Rating
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
