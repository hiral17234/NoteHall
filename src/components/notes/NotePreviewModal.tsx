import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { NoteCommentsSection } from "./NoteCommentsSection";
import { NoteCardNote } from "@/lib/noteCard";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { notesService } from "@/services/firestoreService";
import { Download, ExternalLink, ThumbsUp, ThumbsDown, Star, Eye, Bookmark, BookmarkCheck, Share2, FileText, Image as ImageIcon, Video, Link as LinkIcon, Loader2, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface NotePreviewModalProps { note: NoteCardNote | null; open: boolean; onClose: () => void; }

const fileTypeIcons = { pdf: FileText, image: ImageIcon, video: Video, link: LinkIcon };

export function NotePreviewModal({ note, open, onClose }: NotePreviewModalProps) {
  const navigate = useNavigate();
  const { userProfile } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("preview");
  const [isLiked, setIsLiked] = useState(false);
  const [isDisliked, setIsDisliked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [dislikeCount, setDislikeCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [rating, setRating] = useState(0);
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard" | null>(null);
  const [isRating, setIsRating] = useState(false);

  useEffect(() => {
    if (note) {
      setIsLiked(userProfile ? note.likedBy?.includes(userProfile.id) ?? false : false);
      setIsDisliked(userProfile ? note.dislikedBy?.includes(userProfile.id) ?? false : false);
      setIsSaved(userProfile ? note.savedBy?.includes(userProfile.id) ?? false : false);
      setLikeCount(note.likes);
      setDislikeCount(note.dislikes);
      setActiveTab("preview");
      setRating(0);
      setDifficulty(null);
      notesService.incrementViews(note.id).catch(() => {});
    }
  }, [note, userProfile]);

  if (!note) return null;
  const FileIcon = fileTypeIcons[note.fileType] || FileText;

  const handleLike = async () => {
    if (!userProfile) { toast({ title: "Login required", variant: "destructive" }); return; }
    if (isLoading) return;
    setIsLoading(true);
    const wasLiked = isLiked, wasDisliked = isDisliked;
    if (wasLiked) { setIsLiked(false); setLikeCount(p => p - 1); } 
    else { setIsLiked(true); setLikeCount(p => p + 1); if (wasDisliked) { setIsDisliked(false); setDislikeCount(p => p - 1); } }
    try {
      await notesService.toggleLike(note.id, userProfile.id, userProfile.name, wasLiked);
    } catch {
      if (wasLiked) { setIsLiked(true); setLikeCount(p => p + 1); } 
      else { setIsLiked(false); setLikeCount(p => p - 1); if (wasDisliked) { setIsDisliked(true); setDislikeCount(p => p + 1); } }
      toast({ title: "Error", variant: "destructive" });
    }
    setIsLoading(false);
  };

  const handleDislike = async () => {
    if (!userProfile) { toast({ title: "Login required", variant: "destructive" }); return; }
    if (isLoading) return;
    setIsLoading(true);
    const wasLiked = isLiked, wasDisliked = isDisliked;
    if (wasDisliked) { setIsDisliked(false); setDislikeCount(p => p - 1); } 
    else { setIsDisliked(true); setDislikeCount(p => p + 1); if (wasLiked) { setIsLiked(false); setLikeCount(p => p - 1); } }
    try {
      await notesService.toggleDislike(note.id, userProfile.id, wasDisliked);
    } catch {
      if (wasDisliked) { setIsDisliked(true); setDislikeCount(p => p + 1); } 
      else { setIsDisliked(false); setDislikeCount(p => p - 1); if (wasLiked) { setIsLiked(true); setLikeCount(p => p + 1); } }
      toast({ title: "Error", variant: "destructive" });
    }
    setIsLoading(false);
  };

  const handleSave = async () => {
    if (!userProfile) { toast({ title: "Login required", variant: "destructive" }); return; }
    const was = isSaved; setIsSaved(!was);
    try { was ? await notesService.unsaveNote(note.id, userProfile.id) : await notesService.saveNote(note.id, userProfile.id); toast({ title: was ? "Removed" : "Saved" }); }
    catch { setIsSaved(was); toast({ title: "Error", variant: "destructive" }); }
  };

  const handleDownload = async () => {
    if (!userProfile || !note.fileUrl) return;
    try { await notesService.downloadNote(note.id, userProfile.id, { title: note.title, subject: note.subject, fileUrl: note.fileUrl, fileType: note.fileType }); toast({ title: "Download started" }); }
    catch { toast({ title: "Error", variant: "destructive" }); }
  };

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/note/${note.id}`;
    if (navigator.share) {
      try { await navigator.share({ title: note.title, text: `Check out: ${note.title}`, url: shareUrl }); }
      catch (err) { if ((err as Error).name !== 'AbortError') { navigator.clipboard.writeText(shareUrl); toast({ title: "Link copied" }); } }
    } else {
      navigator.clipboard.writeText(shareUrl);
      toast({ title: "Link copied" });
    }
  };

  const handleSubmitRating = async () => {
    if (!userProfile || rating === 0 || !difficulty) { toast({ title: "Select rating and difficulty", variant: "destructive" }); return; }
    setIsRating(true);
    try { await notesService.rateNote(note.id, userProfile.id, rating, difficulty); toast({ title: "Rating submitted" }); }
    catch { toast({ title: "Error", variant: "destructive" }); }
    finally { setIsRating(false); }
  };

  const renderPreview = () => {
    if (!note.fileUrl) return <div className="flex items-center justify-center h-[400px] bg-muted rounded-lg"><p className="text-muted-foreground">No preview available</p></div>;
    switch (note.fileType) {
      case "pdf": return <iframe src={`${note.fileUrl}#view=FitH`} className="w-full h-[500px] rounded-lg border" title={note.title} />;
      case "image": return <div className="flex items-center justify-center bg-muted rounded-lg p-4"><img src={note.fileUrl} alt={note.title} className="max-w-full max-h-[500px] object-contain rounded-lg" /></div>;
      case "video": return <video src={note.fileUrl} controls className="w-full max-h-[500px] rounded-lg" preload="metadata" />;
      case "link": return <div className="flex flex-col items-center justify-center h-[300px] bg-muted rounded-lg gap-4"><LinkIcon className="w-12 h-12 text-muted-foreground" /><Button onClick={() => window.open(note.fileUrl, "_blank")}><ExternalLink className="w-4 h-4 mr-2" />Open Link</Button></div>;
      default: return <div className="flex items-center justify-center h-[400px] bg-muted rounded-lg"><p className="text-muted-foreground">Preview not available</p></div>;
    }
  };

  return (
    <Dialog open={open} onOpenChange={isOpen => !isOpen && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="shrink-0">
          <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center"><FileIcon className="w-5 h-5 text-primary" /></div><div><DialogTitle>{note.title}</DialogTitle><div className="flex items-center gap-2 mt-1"><Badge variant="secondary">{note.subject}</Badge><Badge variant="outline">{note.branch}</Badge><Badge variant="outline">{note.year}</Badge></div></div></div>
          <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground"><span className="flex items-center gap-1"><Eye className="w-4 h-4" />{note.views}</span>{note.ratings?.count > 0 && <span className="flex items-center gap-1"><Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />{note.ratings.average.toFixed(1)}</span>}<span>by {note.authorName}</span></div>
        </DialogHeader>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 overflow-hidden flex flex-col">
          <TabsList className="shrink-0 bg-muted"><TabsTrigger value="preview">Preview</TabsTrigger><TabsTrigger value="comments">Comments</TabsTrigger><TabsTrigger value="rate">Rate</TabsTrigger></TabsList>
          <ScrollArea className="flex-1 mt-4">
            <TabsContent value="preview" className="mt-0">{renderPreview()}</TabsContent>
            <TabsContent value="comments" className="mt-0"><NoteCommentsSection noteId={note.id} ownerId={note.authorId} noteTitle={note.title} /></TabsContent>
            <TabsContent value="rate" className="mt-0">
              <div className="space-y-6 max-w-md">
                <div><h4 className="font-medium mb-3">Quality Rating</h4><div className="flex gap-1">{[1,2,3,4,5].map(s => <button key={s} onClick={() => setRating(s)} className="p-1 hover:scale-110 transition-transform"><Star className={cn("w-8 h-8", rating >= s ? "text-yellow-500 fill-yellow-500" : "text-muted-foreground")} /></button>)}</div></div>
                <div><h4 className="font-medium mb-3">Difficulty</h4><div className="flex gap-2">{(["easy","medium","hard"] as const).map(l => <Button key={l} variant={difficulty === l ? "default" : "outline"} onClick={() => setDifficulty(l)} className="capitalize">{l}</Button>)}</div></div>
                <Button onClick={handleSubmitRating} disabled={rating === 0 || !difficulty || isRating} className="w-full">{isRating ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Submitting...</> : "Submit Rating"}</Button>
              </div>
            </TabsContent>
          </ScrollArea>
        </Tabs>
        <Separator className="my-4" />
        <div className="flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" onClick={handleLike} disabled={isLoading} className={cn(isLiked && "text-primary bg-primary/10")}><ThumbsUp className={cn("w-4 h-4 mr-1", isLiked && "fill-current")} />{likeCount}</Button>
            <Button variant="ghost" size="sm" onClick={handleDislike} disabled={isLoading} className={cn(isDisliked && "text-destructive bg-destructive/10")}><ThumbsDown className={cn("w-4 h-4 mr-1", isDisliked && "fill-current")} />{dislikeCount}</Button>
            <Button variant="ghost" size="sm" onClick={handleSave} className={cn(isSaved && "text-chart-1 bg-chart-1/10")}>{isSaved ? <BookmarkCheck className="w-4 h-4 mr-1 fill-current" /> : <Bookmark className="w-4 h-4 mr-1" />}{isSaved ? "Saved" : "Save"}</Button>
            <Button variant="ghost" size="sm" onClick={handleShare}><Share2 className="w-4 h-4 mr-1" />Share</Button>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="default" size="sm" className="bg-yellow-500 hover:bg-yellow-600 text-black" onClick={() => { navigate("/gemini", { state: { title: note.title, subject: note.subject, fileUrl: note.fileUrl, fileType: note.fileType } }); onClose(); }}><Sparkles className="w-4 h-4 mr-1" />Ask AI</Button>
            {note.fileUrl && note.fileType !== "link" && <Button size="sm" onClick={handleDownload}><Download className="w-4 h-4 mr-1" />Download</Button>}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
