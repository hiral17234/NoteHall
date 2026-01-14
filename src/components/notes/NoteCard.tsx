import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { NoteCardNote } from "@/lib/noteCard";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { notesService, commentsService } from "@/services/firestoreService";
import { ThumbsUp, ThumbsDown, Eye, Download, Bookmark, BookmarkCheck, MessageCircle, Share2, FileText, Image as ImageIcon, Video, Link as LinkIcon, Star, Expand, MoreVertical, Flag, Loader2, Play, Sparkles, Volume2, VolumeX } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface NoteCardProps { note: NoteCardNote; onExpand?: () => void; compact?: boolean; }

const fileTypeIcons = { pdf: FileText, image: ImageIcon, video: Video, link: LinkIcon };
const fileTypeColors = { pdf: "bg-red-500/10 text-red-500", image: "bg-green-500/10 text-green-500", video: "bg-purple-500/10 text-purple-500", link: "bg-blue-500/10 text-blue-500" };

export function NoteCard({ note, onExpand, compact = false }: NoteCardProps) {
  const navigate = useNavigate();
  const { userProfile } = useAuth();
  const { toast } = useToast();
  const [isLiked, setIsLiked] = useState(false);
  const [isDisliked, setIsDisliked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [likeCount, setLikeCount] = useState(note.likes);
  const [dislikeCount, setDislikeCount] = useState(note.dislikes);
  const [commentsCount, setCommentsCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [isReporting, setIsReporting] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    if (userProfile?.id) {
      setIsLiked(note.likedBy?.includes(userProfile.id) ?? false);
      setIsDisliked(note.dislikedBy?.includes(userProfile.id) ?? false);
      setIsSaved(note.savedBy?.includes(userProfile.id) ?? false);
    }
    setLikeCount(note.likes);
    setDislikeCount(note.dislikes);
  }, [note, userProfile?.id]);

  useEffect(() => {
    commentsService.getByNote(note.id).then(c => setCommentsCount(c.length)).catch(() => {});
  }, [note.id]);

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!userProfile) { toast({ title: "Login required", variant: "destructive" }); return; }
    if (isLoading) return;
    setIsLoading(true);
    const wasLiked = isLiked, wasDisliked = isDisliked;
    // Optimistic update
    if (wasLiked) { setIsLiked(false); setLikeCount(p => p - 1); }
    else { setIsLiked(true); setLikeCount(p => p + 1); if (wasDisliked) { setIsDisliked(false); setDislikeCount(p => p - 1); } }
    try {
      await notesService.toggleLike(note.id, userProfile.id, userProfile.name, wasLiked);
    } catch (error) {
      // Revert on error
      if (wasLiked) { setIsLiked(true); setLikeCount(p => p + 1); }
      else { setIsLiked(false); setLikeCount(p => p - 1); if (wasDisliked) { setIsDisliked(true); setDislikeCount(p => p + 1); } }
      toast({ title: "Error", variant: "destructive" });
    }
    setIsLoading(false);
  };

  const handleDislike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!userProfile) { toast({ title: "Login required", variant: "destructive" }); return; }
    if (isLoading) return;
    setIsLoading(true);
    const wasLiked = isLiked, wasDisliked = isDisliked;
    // Optimistic update
    if (wasDisliked) { setIsDisliked(false); setDislikeCount(p => p - 1); }
    else { setIsDisliked(true); setDislikeCount(p => p + 1); if (wasLiked) { setIsLiked(false); setLikeCount(p => p - 1); } }
    try {
      await notesService.toggleDislike(note.id, userProfile.id, wasDisliked);
    } catch (error) {
      // Revert on error
      if (wasDisliked) { setIsDisliked(true); setDislikeCount(p => p + 1); }
      else { setIsDisliked(false); setDislikeCount(p => p - 1); if (wasLiked) { setIsLiked(true); setLikeCount(p => p + 1); } }
      toast({ title: "Error", variant: "destructive" });
    }
    setIsLoading(false);
  };

  const handleSave = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!userProfile) { toast({ title: "Login required", variant: "destructive" }); return; }
    const was = isSaved;
    setIsSaved(!was);
    try { was ? await notesService.unsaveNote(note.id, userProfile.id) : await notesService.saveNote(note.id, userProfile.id); toast({ title: was ? "Removed" : "Saved" }); }
    catch { setIsSaved(was); toast({ title: "Error", variant: "destructive" }); }
  };

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!userProfile || !note.fileUrl) return;
    try { await notesService.downloadNote(note.id, userProfile.id, { title: note.title, subject: note.subject, fileUrl: note.fileUrl, fileType: note.fileType }); toast({ title: "Download started" }); }
    catch { toast({ title: "Error", variant: "destructive" }); }
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const shareUrl = `${window.location.origin}/note/${note.id}`;
    if (navigator.share) {
      try { await navigator.share({ title: note.title, text: `Check out this note: ${note.title}`, url: shareUrl }); }
      catch (err) { if ((err as Error).name !== 'AbortError') { navigator.clipboard.writeText(shareUrl); toast({ title: "Link copied" }); } }
    } else {
      navigator.clipboard.writeText(shareUrl);
      toast({ title: "Link copied" });
    }
  };

  const handleReport = async () => {
    if (!userProfile || !reportReason.trim()) return;
    setIsReporting(true);
    try { await notesService.reportNote(note.id, userProfile.id, reportReason); toast({ title: "Report submitted" }); setShowReportDialog(false); setReportReason(""); }
    catch { toast({ title: "Error", variant: "destructive" }); }
    finally { setIsReporting(false); }
  };

  const handleAskAI = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate("/gemini", { state: { title: note.title, subject: note.subject, fileUrl: note.fileUrl, fileType: note.fileType } });
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setIsMuted(!isMuted);
    }
  };

  if (note.isHidden || (note.reportCount && note.reportCount >= 15)) return null;
  const FileIcon = fileTypeIcons[note.fileType] || FileText;

  return (
    <>
      <Card className={cn("bg-card border-border hover:border-primary/30 transition-all cursor-pointer group", compact && "p-3")} onClick={() => onExpand?.()}>
        <CardHeader className={cn("pb-3", compact && "p-0 pb-2")}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", fileTypeColors[note.fileType])}><FileIcon className="w-5 h-5" /></div>
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-foreground line-clamp-1 group-hover:text-primary transition-colors">{note.title}</h3>
                <div className="flex items-center gap-2 mt-1"><Badge variant="secondary" className="text-xs">{note.subject}</Badge>{note.isTrusted && <Badge className="bg-chart-1/20 text-chart-1 text-xs">Verified</Badge>}</div>
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={e => e.stopPropagation()}><Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="w-4 h-4" /></Button></DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-popover z-50">
                <DropdownMenuItem onClick={handleShare}><Share2 className="w-4 h-4 mr-2" />Share</DropdownMenuItem>
                {userProfile && note.authorId !== userProfile.id && <DropdownMenuItem onClick={e => { e.stopPropagation(); setShowReportDialog(true); }} className="text-destructive"><Flag className="w-4 h-4 mr-2" />Report</DropdownMenuItem>}
              </DropdownMenuContent>
            </DropdownMenu>
            <Button variant="default" size="sm" onClick={handleAskAI} className="gap-1.5 h-7 px-2 bg-yellow-500 hover:bg-yellow-600 text-black"><Sparkles className="w-3.5 h-3.5" />Ask AI</Button>
          </div>
        </CardHeader>
        <CardContent className={cn("pb-3", compact && "p-0 pb-2")}>
          <div className="flex items-center gap-2 mb-3 cursor-pointer hover:opacity-80" onClick={e => { e.stopPropagation(); navigate(`/profile/${note.authorId}`); }}>
            <Avatar className="w-6 h-6"><AvatarFallback className="text-xs bg-primary/20 text-primary">{note.authorName?.[0]}</AvatarFallback></Avatar>
            <span className="text-sm text-muted-foreground">{note.authorName}</span>
            {note.timestamp && <><span className="text-muted-foreground">•</span><span className="text-xs text-muted-foreground">{note.timestamp}</span></>}
          </div>
          {note.fileType === "video" && note.fileUrl && (
            <div className="relative w-full aspect-video rounded-lg overflow-hidden mb-3 bg-muted" onClick={e => e.stopPropagation()}>
              <video ref={videoRef} src={note.fileUrl} className="w-full h-full object-cover" preload="metadata" muted={isMuted} controls />
              <Button variant="ghost" size="icon" className="absolute top-2 right-2 h-8 w-8 bg-black/50 hover:bg-black/70" onClick={toggleMute}>
                {isMuted ? <VolumeX className="w-4 h-4 text-white" /> : <Volume2 className="w-4 h-4 text-white" />}
              </Button>
            </div>
          )}
          {note.fileType === "image" && note.fileUrl && <div className="w-full aspect-video rounded-lg overflow-hidden mb-3 bg-muted"><img src={note.fileUrl} alt={note.title} className="w-full h-full object-cover" /></div>}
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1"><Eye className="w-4 h-4" />{note.views}</div>
            {note.ratings?.count > 0 && <div className="flex items-center gap-1"><Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />{note.ratings.average.toFixed(1)}</div>}
            {note.difficulty && <Badge variant="outline" className="text-xs capitalize">{note.difficulty}</Badge>}
          </div>
        </CardContent>
        <CardFooter className={cn("pt-0 pb-3 gap-1 flex-wrap", compact && "p-0")}>
          <Button variant="ghost" size="sm" onClick={handleLike} disabled={isLoading} className={cn("gap-1.5 h-8", isLiked && "text-primary bg-primary/10")}><ThumbsUp className={cn("w-4 h-4", isLiked && "fill-current")} />{likeCount}</Button>
          <Button variant="ghost" size="sm" onClick={handleDislike} disabled={isLoading} className={cn("gap-1.5 h-8", isDisliked && "text-destructive bg-destructive/10")}><ThumbsDown className={cn("w-4 h-4", isDisliked && "fill-current")} />{dislikeCount}</Button>
          <Button variant="ghost" size="sm" className="gap-1.5 h-8"><MessageCircle className="w-4 h-4" />{commentsCount}</Button>
          <Button variant="ghost" size="sm" onClick={handleSave} className={cn("gap-1.5 h-8", isSaved && "text-chart-1 bg-chart-1/10")}>{isSaved ? <BookmarkCheck className="w-4 h-4 fill-current" /> : <Bookmark className="w-4 h-4" />}</Button>
          {note.fileUrl && note.fileType !== "link" && <Button variant="ghost" size="sm" onClick={handleDownload} className="gap-1.5 h-8"><Download className="w-4 h-4" /></Button>}
          {onExpand && <Button variant="ghost" size="sm" className="gap-1.5 h-8 ml-auto"><Expand className="w-4 h-4" /></Button>}
        </CardFooter>
      </Card>
      <Dialog open={showReportDialog} onOpenChange={setShowReportDialog}>
        <DialogContent onClick={e => e.stopPropagation()}>
          <DialogHeader><DialogTitle>Report Note</DialogTitle><DialogDescription>Help us understand what's wrong</DialogDescription></DialogHeader>
          <div className="py-4"><Label>Reason</Label><Textarea placeholder="Describe the issue..." value={reportReason} onChange={e => setReportReason(e.target.value)} rows={4} /></div>
          <DialogFooter><Button variant="outline" onClick={() => setShowReportDialog(false)}>Cancel</Button><Button onClick={handleReport} disabled={!reportReason.trim() || isReporting} variant="destructive">{isReporting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Submitting...</> : "Submit Report"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
