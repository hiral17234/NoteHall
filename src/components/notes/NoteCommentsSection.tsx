import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { commentsService } from "@/services/firestoreService";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { formatDistanceToNow } from "date-fns";
import { Send, Trash2, Loader2, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface Comment { id: string; userId: string; userName: string; userAvatar?: string; text: string; createdAt: any; }

interface NoteCommentsSectionProps { noteId: string; ownerId?: string; noteTitle?: string; className?: string; }

export function NoteCommentsSection({ noteId, ownerId, noteTitle, className }: NoteCommentsSectionProps) {
  const { userProfile } = useAuth();
  const { toast } = useToast();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (!noteId) return;
    const q = query(collection(db, "notes", noteId, "comments"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => { setComments(snap.docs.map(d => ({ id: d.id, ...d.data() } as Comment))); setIsLoading(false); }, () => setIsLoading(false));
    return () => unsub();
  }, [noteId]);

  const handleSubmit = async () => {
    if (!userProfile || !newComment.trim()) return;
    setIsSubmitting(true);
    try { await commentsService.addNoteComment(noteId, userProfile.id, userProfile.name, newComment.trim(), ownerId, noteTitle, userProfile.avatar); setNewComment(""); toast({ title: "Comment added" }); }
    catch { toast({ title: "Error", variant: "destructive" }); }
    finally { setIsSubmitting(false); }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try { await commentsService.deleteComment(`notes/${noteId}/comments`, id); toast({ title: "Deleted" }); }
    catch { toast({ title: "Error", variant: "destructive" }); }
    finally { setDeletingId(null); }
  };

  const formatTime = (ts: any) => { try { return formatDistanceToNow(ts?.toDate?.() || new Date(ts), { addSuffix: true }); } catch { return "Just now"; } };

  return (
    <div className={cn("flex flex-col", className)}>
      <div className="flex items-center gap-2 mb-4"><MessageCircle className="w-5 h-5 text-primary" /><h3 className="font-semibold">Comments ({comments.length})</h3></div>
      {userProfile ? (
        <div className="flex gap-3 mb-4">
          <Avatar className="w-8 h-8"><AvatarImage src={userProfile.avatar} /><AvatarFallback className="text-xs bg-primary/20 text-primary">{userProfile.name?.[0]}</AvatarFallback></Avatar>
          <div className="flex-1 flex gap-2">
            <Textarea placeholder="Write a comment..." value={newComment} onChange={e => setNewComment(e.target.value)} className="flex-1 min-h-[60px] resize-none bg-background" disabled={isSubmitting} />
            <Button size="icon" onClick={handleSubmit} disabled={!newComment.trim() || isSubmitting} className="h-[60px] w-10">{isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}</Button>
          </div>
        </div>
      ) : <p className="text-sm text-muted-foreground mb-4">Please login to comment</p>}
      {isLoading ? <div className="flex items-center justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div> : comments.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground"><MessageCircle className="w-10 h-10 mx-auto mb-2 opacity-50" /><p className="text-sm">No comments yet</p></div>
      ) : (
        <ScrollArea className="flex-1 max-h-[400px]">
          <div className="space-y-4 pr-4">
            {comments.map(c => (
              <div key={c.id} className="flex gap-3 group">
                <Avatar className="w-8 h-8"><AvatarImage src={c.userAvatar} /><AvatarFallback className="text-xs bg-primary/20 text-primary">{c.userName?.[0]}</AvatarFallback></Avatar>
                <div className="flex-1 min-w-0"><div className="flex items-center gap-2"><span className="font-medium text-sm">{c.userName}</span><span className="text-xs text-muted-foreground">{formatTime(c.createdAt)}</span></div><p className="text-sm text-muted-foreground mt-1 break-words">{c.text}</p></div>
                {userProfile?.id === c.userId && <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100" onClick={() => handleDelete(c.id)} disabled={deletingId === c.id}>{deletingId === c.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4 text-destructive" />}</Button>}
              </div>
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}
