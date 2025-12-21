import { useState, useEffect } from "react";
import { 
  FileText, Image, Video, Link, ThumbsUp, ThumbsDown, 
  Eye, Bookmark, Bot, MoreVertical, Expand, Flag, Share2, 
  Download, Star, AlertCircle
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

// --- FIREBASE & SERVICES ---
import { db, auth } from "@/lib/firebase"; 
import { doc, updateDoc, arrayUnion, arrayRemove, onSnapshot, increment } from "firebase/firestore";
import { notesService } from "@/services/firestoreService";

interface NoteCardProps {
  note: {
    id: string;
    title: string;
    subject: string;
    branch: string;
    year: string;
    fileType: "pdf" | "image" | "video" | "link";
    fileUrl?: string;
    likes: number;
    dislikes: number;
    views: number;
    author: string;
    authorId?: string;
    timestamp: string;
    topic?: string;
    difficulty?: "easy" | "medium" | "hard";
    rating?: number;
    likedBy?: string[];
    dislikedBy?: string[];
    ratings?: {
      average: number;
      count: number;
    };
  };
  onAskAI?: () => void;
  onExpand?: () => void;
}

const fileTypeIcons = { pdf: FileText, image: Image, video: Video, link: Link };
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
  const [likes, setLikes] = useState(note.likes || 0);
  const [dislikes, setDislikes] = useState(note.dislikes || 0);
  const [likeAnimating, setLikeAnimating] = useState(false);
  const [dislikeAnimating, setDislikeAnimating] = useState(false);
  const [saveAnimating, setSaveAnimating] = useState(false);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [ratingDialogOpen, setRatingDialogOpen] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reportDetails, setReportDetails] = useState("");
  const [userRating, setUserRating] = useState(0);
  const [userDifficulty, setUserDifficulty] = useState<"easy" | "medium" | "hard" | "">("");
  const [currentRating, setCurrentRating] = useState(note.ratings?.average || note.rating || 0);
  
  const saved = isNoteSaved(note.id);
  const FileIcon = fileTypeIcons[note.fileType] || FileText;

  // Real-time listener for Likes/Ratings
  useEffect(() => {
    if (!note.id) return;
    const unsubscribe = onSnapshot(doc(db, "notes", note.id), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setLikes(data.likes || 0);
        setDislikes(data.dislikes || 0);
        setCurrentRating(data.ratings?.average || data.rating || 0);
        if (auth.currentUser) {
          setLiked(data.likedBy?.includes(auth.currentUser.uid) || false);
          setDisliked(data.dislikedBy?.includes(auth.currentUser.uid) || false);
        }
      }
    });
    return () => unsubscribe();
  }, [note.id]);

  const handleLike = async () => {
    if (!auth.currentUser) return toast({ title: "Please sign in", variant: "destructive" });
    setLikeAnimating(true);
    setTimeout(() => setLikeAnimating(false), 300);
    try {
      await notesService.toggleLike(note.id, auth.currentUser.uid, auth.currentUser.displayName || "User", liked);
    } catch (e) { console.error(e); }
  };

  const handleDislike = async () => {
    if (!auth.currentUser) return;
    setDislikeAnimating(true);
    setTimeout(() => setDislikeAnimating(false), 300);
    try {
      const noteRef = doc(db, "notes", note.id);
      if (disliked) {
        await updateDoc(noteRef, { dislikes: increment(-1), dislikedBy: arrayRemove(auth.currentUser.uid) });
      } else {
        await updateDoc(noteRef, { 
          dislikes: increment(1), 
          dislikedBy: arrayUnion(auth.currentUser.uid),
          ...(liked ? { likes: increment(-1), likedBy: arrayRemove(auth.currentUser.uid) } : {})
        });
      }
    } catch (e) { console.error(e); }
  };

  const handleDownload = async () => {
    if (!note.fileUrl) return;
    try {
      if (auth.currentUser) {
        await notesService.downloadNote(note.id, auth.currentUser.uid, note);
      }
      const res = await fetch(note.fileUrl);
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${note.title.replace(/\s+/g, '_')}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast({ title: "Success", description: "Download started" });
    } catch (e) {
      window.open(note.fileUrl, '_blank');
    }
  };

  const handleRatingSubmit = async () => {
    if (!userRating || !userDifficulty || !auth.currentUser) return;
    try {
      await notesService.rateNote(note.id, auth.currentUser.uid, userRating, userDifficulty as any);
      setRatingDialogOpen(false);
      toast({ title: "Rating submitted!" });
    } catch (e) { console.error(e); }
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
                <p className="text-sm text-muted-foreground mt-1">by {note.author} • {note.timestamp}</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity" onClick={onExpand}>
                <Expand className="w-4 h-4" />
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="w-4 h-4" /></Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => {}}><Share2 className="w-4 h-4 mr-2" /> Share</DropdownMenuItem>
                  <DropdownMenuItem onClick={handleDownload}><Download className="w-4 h-4 mr-2" /> Download</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setRatingDialogOpen(true)}><Star className="w-4 h-4 mr-2" /> Rate</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setReportDialogOpen(true)} className="text-destructive"><Flag className="w-4 h-4 mr-2" /> Report</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pb-3">
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">{note.subject}</Badge>
            <Badge variant="secondary">{note.branch}</Badge>
            <Badge variant="secondary">{note.year}</Badge>
            {note.topic && <Badge variant="outline" className="text-primary">{note.topic}</Badge>}
            {note.difficulty && <Badge className={difficultyColors[note.difficulty]}>{note.difficulty}</Badge>}
          </div>
          {currentRating > 0 && (
            <div className="flex items-center gap-2 mt-2">
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star key={s} className={cn("w-4 h-4", s <= Math.round(currentRating) ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground")} />
                ))}
              </div>
              <span className="text-xs text-muted-foreground">({currentRating.toFixed(1)})</span>
            </div>
          )}
        </CardContent>

        <CardFooter className="pt-3 border-t border-border flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" onClick={handleLike} className={cn(liked && "text-primary bg-primary/10", likeAnimating && "scale-110")}>
              <ThumbsUp className={cn("w-4 h-4 mr-1", liked && "fill-current")} /> {likes}
            </Button>
            <Button variant="ghost" size="sm" onClick={handleDislike} className={cn(disliked && "text-destructive bg-destructive/10", dislikeAnimating && "scale-110")}>
              <ThumbsDown className={cn("w-4 h-4 mr-1", disliked && "fill-current")} /> {dislikes}
            </Button>
            <div className="flex items-center gap-1 text-muted-foreground px-2 text-xs"><Eye className="w-4 h-4" /> {note.views}</div>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" onClick={() => { setSaveAnimating(true); setTimeout(() => setSaveAnimating(false), 300); toggleSave(note); }} className={cn(saved && "text-primary bg-primary/10", saveAnimating && "scale-110")}>
              <Bookmark className={cn("w-4 h-4", saved && "fill-current")} />
            </Button>
            <Button variant="outline" size="sm" onClick={onAskAI} className="h-8 gap-1 border-primary/30 text-primary hover:bg-primary hover:text-primary-foreground">
              <Bot className="w-4 h-4" /> Gemini
            </Button>
          </div>
        </CardFooter>
      </Card>

      {/* RATING DIALOG */}
      <Dialog open={ratingDialogOpen} onOpenChange={setRatingDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Rate this Note</DialogTitle></DialogHeader>
          <div className="space-y-6 py-4">
            <div className="space-y-2 text-center">
              <Label>Quality Rating</Label>
              <div className="flex justify-center gap-2">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star key={s} onClick={() => setUserRating(s)} className={cn("w-8 h-8 cursor-pointer", s <= userRating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground")} />
                ))}
              </div>
            </div>
            <div className="space-y-2 text-center">
              <Label>Difficulty Level</Label>
              <div className="flex gap-2 justify-center">
                {["easy", "medium", "hard"].map((l) => (
                  <Button key={l} variant={userDifficulty === l ? "default" : "outline"} onClick={() => setUserDifficulty(l as any)} className="capitalize">{l}</Button>
                ))}
              </div>
            </div>
            <Button onClick={handleRatingSubmit} className="w-full">Submit Feedback</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
