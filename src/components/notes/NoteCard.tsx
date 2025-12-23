import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { formatDate } from "@/lib/formatDate";
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
  MessageSquare,
  CheckCircle2,
  Clock,
  ShieldCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { useSavedNotes } from "@/contexts/SavedNotesContext";

// --- FIREBASE & SERVICES ---
import { db, auth } from "@/lib/firebase";
import { doc, updateDoc, arrayUnion, arrayRemove, onSnapshot, increment } from "firebase/firestore";
import { notesService } from "@/services/firestoreService";
import type { NoteCardNote } from "@/lib/noteCard";

interface NoteCardProps {
  note: NoteCardNote;
  onExpand?: () => void;
}

const fileTypeIcons = {
  pdf: FileText,
  image: Image,
  video: Video,
  link: Link,
};

const fileTypeColors = {
  pdf: "bg-red-500/10 text-red-500 dark:bg-red-500/20",
  image: "bg-blue-500/10 text-blue-500 dark:bg-blue-500/20",
  video: "bg-purple-500/10 text-purple-500 dark:bg-purple-500/20",
  link: "bg-green-500/10 text-green-500 dark:bg-green-500/20",
};

const difficultyColors = {
  easy: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  medium: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  hard: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
};

export function NoteCard({ note, onExpand }: NoteCardProps) {
  const navigate = useNavigate();
  const { isNoteSaved, toggleSave } = useSavedNotes();
  
  // Interaction States
  const [liked, setLiked] = useState(false);
  const [disliked, setDisliked] = useState(false);
  const [likes, setLikes] = useState(note.likes || 0);
  const [dislikes, setDislikes] = useState(note.dislikes || 0);
  const [views, setViews] = useState(note.views || 0);
  // Session-based unique view tracking - only count once per session
  useEffect(() => {
    if (note.id) {
      const viewedKey = `viewed_${note.id}`;
      const hasViewed = sessionStorage.getItem(viewedKey);
      
      if (!hasViewed) {
        const timer = setTimeout(() => {
          notesService.incrementViews(note.id);
          sessionStorage.setItem(viewedKey, 'true');
        }, 2000);
        return () => clearTimeout(timer);
      }
    }
  }, [note.id]);
  
  // Animation States
  const [likeAnimating, setLikeAnimating] = useState(false);
  const [dislikeAnimating, setDislikeAnimating] = useState(false);
  const [saveAnimating, setSaveAnimating] = useState(false);
  
  // Dialog & Rating States
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [ratingDialogOpen, setRatingDialogOpen] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reportDetails, setReportDetails] = useState("");
  const [userRating, setUserRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [userDifficulty, setUserDifficulty] = useState<"easy" | "medium" | "hard" | "">("");
  const [currentRating, setCurrentRating] = useState(note.ratings?.average || 0);
  const [ratingCount, setRatingCount] = useState(note.ratings?.count || 0);

  const saved = isNoteSaved(note.id);
  const FileIcon = fileTypeIcons[note.fileType] || FileText;

  // REAL-TIME DATABASE SYNC
// REAL-TIME DATABASE SYNC
  useEffect(() => {
    if (!note.id) return;
    const unsubscribe = onSnapshot(doc(db, "notes", note.id), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setLikes(data.likes || 0);
        setDislikes(data.dislikes || 0);
        
        // --- ADD/EDIT THIS LINE BELOW ---
        setViews(data.views || 0); 
        
        setCurrentRating(data.ratings?.average || 0);
        setRatingCount(data.ratings?.count || 0);
        
        if (auth.currentUser) {
          const userId = auth.currentUser.uid;
          setLiked(data.likedBy?.includes(userId) || false);
          setDisliked(data.dislikedBy?.includes(userId) || false);
        }
      }
    });
    return () => unsubscribe();
  }, [note.id]);

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!auth.currentUser) {
      toast({ title: "Login Required", description: "Please sign in to like notes", variant: "destructive" });
      return;
    }
    setLikeAnimating(true);
    setTimeout(() => setLikeAnimating(false), 400);
    try {
      const noteRef = doc(db, "notes", note.id);
      if (liked) {
        // Remove like
        await updateDoc(noteRef, { likes: increment(-1), likedBy: arrayRemove(auth.currentUser.uid) });
      } else {
        // Add like and remove dislike if exists
        await updateDoc(noteRef, { 
          likes: increment(1), 
          likedBy: arrayUnion(auth.currentUser.uid),
          ...(disliked ? { dislikes: increment(-1), dislikedBy: arrayRemove(auth.currentUser.uid) } : {})
        });
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleDislike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!auth.currentUser) {
      toast({ title: "Login Required", description: "Please sign in to dislike notes", variant: "destructive" });
      return;
    }
    setDislikeAnimating(true);
    setTimeout(() => setDislikeAnimating(false), 400);
    try {
      const noteRef = doc(db, "notes", note.id);
      if (disliked) {
        // Remove dislike
        await updateDoc(noteRef, { dislikes: increment(-1), dislikedBy: arrayRemove(auth.currentUser.uid) });
      } else {
        // Add dislike and remove like if exists
        await updateDoc(noteRef, { 
          dislikes: increment(1), 
          dislikedBy: arrayUnion(auth.currentUser.uid),
          ...(liked ? { likes: increment(-1), likedBy: arrayRemove(auth.currentUser.uid) } : {})
        });
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleSave = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSaveAnimating(true);
    setTimeout(() => setSaveAnimating(false), 400);
    toggleSave(note);
  };

  const handleDownload = async () => {
    if (!note.fileUrl) return;
    try {
      if (auth.currentUser) {
        await notesService.downloadNote(note.id, auth.currentUser.uid, {
          title: note.title,
          subject: note.subject,
          fileUrl: note.fileUrl,
        });
      }
      toast({ title: "Download Started", description: "Your file is being prepared." });
    } catch (error) {
      window.open(note.fileUrl, '_blank');
    }
  };

  const handleRatingSubmit = async () => {
    if (userRating === 0 || !userDifficulty || !auth.currentUser) {
      toast({ title: "Missing Information", description: "Please select both rating and difficulty.", variant: "destructive" });
      return;
    }
    try {
      await notesService.rateNote(note.id, auth.currentUser.uid, userRating, userDifficulty as any);
      setRatingDialogOpen(false);
      toast({ title: "Thank You!", description: "Your feedback helps the community." });
    } catch (e) {
      console.error(e);
    }
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

  const handleAskAI = (e: React.MouseEvent) => {
  e.stopPropagation();

  if (!note.fileUrl) {
    toast({
      title: "No file found",
      description: "This note has no attached media",
      variant: "destructive",
    });
    return;
  }

  navigate("/gemini", {
    state: {
      fileUrl: note.fileUrl,
      fileType: note.fileType, // pdf | image | video | link
      title: note.title,
      subject: note.subject,
    },
  });
};



  return (
    <>
      <Card
  className="group relative bg-card border-border/50 hover:border-primary/50 transition-all duration-300 hover:shadow-2xl hover:shadow-primary/5 overflow-hidden flex flex-col h-full cursor-pointer"
  onClick={(e) => {
  if ((e.target as HTMLElement).closest("button, [role='menuitem']")) return;
  onExpand?.();
}}

>

        {/* TOP BADGE AREA */}
        <div className="absolute top-3 right-3 z-10 flex gap-2">
          {note.isTrusted && (
            <Badge className="bg-blue-500 hover:bg-blue-600 text-white border-none px-2 py-0.5 flex items-center gap-1 shadow-lg shadow-blue-500/20">
              <ShieldCheck className="w-3 h-3" /> Trusted
            </Badge>
          )}
        </div>

        <CardHeader className="p-5 pb-3">
          <div className="flex items-start gap-4">
            <div className={cn(
              "p-3 rounded-2xl transition-all duration-500 group-hover:scale-110 group-hover:rotate-3 shadow-sm",
              fileTypeColors[note.fileType as keyof typeof fileTypeColors]
            )}>
              <FileIcon className="w-6 h-6" />
            </div>
            <div className="space-y-1 flex-1 min-w-0">
              <h3 className="font-bold text-lg leading-tight tracking-tight text-foreground group-hover:text-primary transition-colors line-clamp-2">
                {note.title}
              </h3>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="truncate">by <span className="font-medium text-foreground/80">{note.authorName}</span></span>
                <span>•</span>
                <span className="flex items-center gap-1">
  <Clock className="w-3 h-3" /> {formatDate(note.timestamp)}
</span>

              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-5 pt-0 flex-1">
          {/* TAGS SECTION */}
          <div className="flex flex-wrap gap-2 mb-4">
            <Badge variant="outline" className="bg-background/50 backdrop-blur-sm border-border/50">{note.subject}</Badge>
            <Badge variant="outline" className="bg-background/50 backdrop-blur-sm border-border/50">{note.branch}</Badge>
            <Badge variant="outline" className="bg-background/50 backdrop-blur-sm border-border/50">{note.year}</Badge>
            {note.topic && (
              <Badge className="bg-primary/5 text-primary border-primary/20 hover:bg-primary/10 transition-colors">
                {note.topic}
              </Badge>
            )}
            {note.difficulty && (
              <Badge variant="outline" className={cn("capitalize font-medium", difficultyColors[note.difficulty])}>
                {note.difficulty}
              </Badge>
            )}
          </div>

          {/* RATING DISPLAY */}
          <div className="flex items-center gap-3">
            <div className="flex items-center">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star 
                  key={star} 
                  className={cn(
                    "w-4 h-4 transition-all duration-300",
                    star <= Math.round(currentRating) 
                      ? "fill-yellow-400 text-yellow-400 scale-110" 
                      : "text-muted-foreground/30"
                  )} 
                />
              ))}
            </div>
            {ratingCount > 0 && (
              <span className="text-xs font-semibold text-muted-foreground">
                {currentRating.toFixed(1)} <span className="font-normal opacity-60">({ratingCount})</span>
              </span>
            )}
          </div>
        </CardContent>

        <CardFooter className="p-4 pt-0 border-t border-border/40 bg-muted/20 backdrop-blur-sm flex items-center justify-between">
          <div className="flex items-center gap-1">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleLike}
              className={cn(
                "h-9 px-3 gap-1.5 transition-all duration-300 rounded-full",
                liked ? "text-primary bg-primary/10" : "hover:text-primary hover:bg-primary/5",
                likeAnimating && "scale-125"
              )}
            >
              <ThumbsUp className={cn("w-4 h-4 transition-transform", liked && "fill-current scale-110")} />
              <span className="text-xs font-bold">{likes}</span>
            </Button>

            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleDislike}
              className={cn(
                "h-9 px-3 gap-1.5 transition-all duration-300 rounded-full",
                disliked ? "text-destructive bg-destructive/10" : "hover:text-destructive hover:bg-destructive/5",
                dislikeAnimating && "scale-125"
              )}
            >
              <ThumbsDown className={cn("w-4 h-4 transition-transform", disliked && "fill-current scale-110")} />
              <span className="text-xs font-bold">{dislikes}</span>
            </Button>

            <div className="flex items-center gap-1.5 px-3 text-muted-foreground/60">
              <Eye className="w-4 h-4" />
              <span className="text-xs font-medium">{views}</span>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleSave}
              className={cn(
                "h-9 w-9 rounded-full transition-all duration-300",
                saved ? "text-primary bg-primary/10" : "hover:text-primary hover:bg-primary/5",
                saveAnimating && "rotate-12 scale-125"
              )}
            >
              <Bookmark className={cn("w-4 h-4 transition-transform", saved && "fill-current scale-110")} />
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full hover:bg-muted"><MoreVertical className="w-4 h-4" /></Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 animate-in fade-in zoom-in duration-200">
                <DropdownMenuItem onClick={handleShare}><Share2 className="w-4 h-4 mr-2" /> Share Link</DropdownMenuItem>
                <DropdownMenuItem onClick={handleDownload}><Download className="w-4 h-4 mr-2" /> {note.fileType === 'pdf' ? 'Download PDF' : note.fileType === 'image' ? 'Download Image' : note.fileType === 'video' ? 'Download Video' : 'Open Link'}</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setRatingDialogOpen(true)}><Star className="w-4 h-4 mr-2" /> Rate Quality</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onExpand}><Expand className="w-4 h-4 mr-2" /> Full Details</DropdownMenuItem>
                <DropdownMenuItem onClick={handleAskAI} className="text-primary font-medium focus:text-primary">
                  <Bot className="w-4 h-4 mr-2 animate-pulse" /> Ask AI Gemini
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => setReportDialogOpen(true)}>
                  <Flag className="w-4 h-4 mr-2" /> Report Issue
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

           <Button
  size="sm"
  onClick={handleAskAI}
  className="h-9 ml-1 rounded-full bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 border-none px-4 gap-2 transition-all hover:scale-105 active:scale-95"
>
  <Bot className="w-4 h-4" />
  <span className="text-xs font-bold">Ask AI</span>
</Button>

          </div>
        </CardFooter>
      </Card>

      {/* RATING DIALOG */}
      <Dialog open={ratingDialogOpen} onOpenChange={setRatingDialogOpen}>
        <DialogContent className="sm:max-w-[400px] rounded-3xl p-6">
          <DialogHeader className="items-center text-center">
            <div className="w-12 h-12 rounded-2xl bg-yellow-400/10 flex items-center justify-center mb-2">
              <Star className="w-6 h-6 text-yellow-500 fill-yellow-500" />
            </div>
            <DialogTitle className="text-2xl font-bold">Rate this Note</DialogTitle>
            <DialogDescription>Your feedback helps other students find the best resources.</DialogDescription>
          </DialogHeader>
          
          <div className="space-y-8 py-6">
            <div className="space-y-3">
              <Label className="text-center block text-sm font-bold uppercase tracking-widest opacity-60">Quality Rating</Label>
              <div className="flex justify-center gap-3">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    onClick={() => setUserRating(star)}
                    className="transition-transform active:scale-90 duration-200"
                  >
                    <Star 
                      className={cn(
                        "w-10 h-10 transition-all duration-300",
                        star <= (hoverRating || userRating) ? "fill-yellow-400 text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.4)]" : "text-muted-foreground/20"
                      )} 
                    />
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <Label className="text-center block text-sm font-bold uppercase tracking-widest opacity-60">How hard was this topic?</Label>
              <RadioGroup value={userDifficulty} onValueChange={(val: any) => setUserDifficulty(val)} className="flex justify-center gap-3">
                {["easy", "medium", "hard"].map((level) => (
                  <div key={level} className="flex-1 max-w-[100px]">
                    <RadioGroupItem value={level} id={level} className="sr-only" />
                    <Label
                      htmlFor={level}
                      className={cn(
                        "flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all cursor-pointer capitalize text-xs font-bold",
                        userDifficulty === level 
                          ? "border-primary bg-primary/5 text-primary" 
                          : "border-border hover:border-border/80 text-muted-foreground"
                      )}
                    >
                      {level}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          </div>

          <DialogFooter>
            <Button onClick={handleRatingSubmit} className="w-full h-12 rounded-xl font-bold text-base shadow-lg shadow-primary/20">
              Submit Feedback
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
