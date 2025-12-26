import { useState, useEffect } from "react";
import { MessageCircle, Send, X, CornerDownRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase";
import {
  collection,
  query,
  orderBy,
  limit,
  startAfter,
  getDocs,
  onSnapshot,
  addDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  updateDoc,
  increment,
  Timestamp,
  QueryDocumentSnapshot,
} from "firebase/firestore";


import { commentsService } from "@/services/firestoreService";
import { Timestamp } from "firebase/firestore";

interface NoteCommentsSectionProps {
  noteId: string;
  ownerId?: string;
  noteTitle?: string;
    onCountChange?: (count: number) => void;
}

interface Comment {
  id: string;
  userId: string;
  userName: string;
  text: string;
  parentId: string | null;
  createdAt?: Timestamp;
}

export function NoteCommentsSection({
  noteId,
  ownerId,
  noteTitle,
  onCountChange,
}: NoteCommentsSectionProps) {
  const { userProfile } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const PAGE_SIZE = 10;

const [lastDoc, setLastDoc] =
  useState<QueryDocumentSnapshot | null>(null);
const [hasMore, setHasMore] = useState(true);
const [loadingMore, setLoadingMore] = useState(false);


useEffect(() => {
  const initialQuery = query(
    collection(db, "notes", noteId, "comments"),
    orderBy("createdAt", "desc"),
    limit(PAGE_SIZE)
  );

  const unsubscribe = onSnapshot(initialQuery, (snap) => {
    if (snap.empty) {
      setComments([]);
      setHasMore(false);
      return;
    }

    const docs = snap.docs.map(
      (d) => ({ id: d.id, ...d.data() } as Comment)
    );

    // reverse so oldest appears first in UI
    setComments(docs.reverse());

    setLastDoc(snap.docs[snap.docs.length - 1]);
    setHasMore(snap.docs.length === PAGE_SIZE);

    onCountChange?.(snap.size);
  });

  return () => unsubscribe();
}, [noteId]);


  const handleAddComment = async () => {
    if (!newComment.trim() || !userProfile) {
      toast({ title: "Please login", description: "You need an account to comment." });
      return;
    }
    setIsSubmitting(true);
    try {
      await commentsService.addNoteComment(noteId, userProfile.id, userProfile.name, newComment.trim(), ownerId, noteTitle);
      await updateDoc(doc(db, "notes", noteId), {
      commentsCount: increment(1),
}
);
      setNewComment("");
      toast({ title: "Comment added!" });
    } catch (e: any) {
      console.error("Firestore addComment error:", e?.code || e);
      toast({ 
        title: "Error", 
        description: e?.code === 'permission-denied' ? 'Permission denied.' : 'Failed to post comment.', 
        variant: "destructive" 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddReply = async (parentId: string) => {
if (!userProfile) {
  toast({ title: "Please login", description: "You need an account to reply." });
  return;
}
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, "notes", noteId, "comments"), {
        userId: userProfile.id,
        userName: userProfile.name,
        text: replyText.trim(),
        parentId,
        createdAt: serverTimestamp(),
      });
      setReplyText("");
      setReplyingTo(null);
    } catch (e: any) {
      console.error("Firestore addReply error:", e?.code || e);
      toast({ title: "Error", description: "Failed to post reply.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!userProfile) return;
    try {
      await deleteDoc(doc(db, "notes", noteId, "comments", commentId));
const comment = comments.find(c => c.id === commentId);
if (!comment?.parentId) {
  await updateDoc(doc(db, "notes", noteId), {
    commentsCount: increment(-1),
  });
}

      const loadMoreComments = async () => {
  if (!lastDoc || !hasMore) return;

  setLoadingMore(true);

  const nextQuery = query(
    collection(db, "notes", noteId, "comments"),
    orderBy("createdAt", "desc"),
    startAfter(lastDoc),
    limit(PAGE_SIZE)
  );

  const snap = await getDocs(nextQuery);

  const moreComments = snap.docs.map(
    (d) => ({ id: d.id, ...d.data() } as Comment)
  );

  setComments((prev) => [...moreComments.reverse(), ...prev]);

  setLastDoc(snap.docs[snap.docs.length - 1] || null);
  setHasMore(snap.docs.length === PAGE_SIZE);
  setLoadingMore(false);
};


      toast({ title: "Deleted", description: "Comment removed." });
    } catch (e: any) {
      console.error("Firestore deleteComment error:", e?.code || e);
      toast({ title: "Error", description: "Failed to delete comment.", variant: "destructive" });
    }
  };

  // Organize comments into threads
  const topLevelComments = comments.filter(c => !c.parentId);
  const replies = comments.filter(c => c.parentId);

  const getCommentReplies = (parentId: string) => replies.filter(r => r.parentId === parentId);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm font-medium text-foreground">
        <MessageCircle className="w-4 h-4" />
        Comments ({comments.length})
      </div>

      {/* Comment Input */}
      <div className="flex gap-2">
        <Textarea
          placeholder="Add a comment..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          className="min-h-[60px] text-sm resize-none"
        />
        <Button 
          size="icon" 
          onClick={handleAddComment}
          disabled={!newComment.trim() || isSubmitting}
          className="h-10 w-10 shrink-0"
        >
          {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </Button>
      </div>

      {/* Comments List */}
      <ScrollArea className="max-h-[300px]">
        {hasMore && (
    <Button
      variant="ghost"
      size="sm"
      onClick={loadMoreComments}
      disabled={loadingMore}
      className="w-full text-xs mb-2"
    >
      {loadingMore ? "Loading..." : "Load older comments"}
    </Button>
  )}
        <div className="space-y-3">
          {topLevelComments.map((comment) => (
            <div key={comment.id} className="space-y-2">
              {/* Main Comment */}
              <div className="group bg-muted/50 rounded-lg p-3 relative">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-foreground">{comment.userName}</span>
                      <span className="text-xs text-muted-foreground">
                        {comment.createdAt?.toDate?.()?.toLocaleDateString() || 'Just now'}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">{comment.text}</p>
                  </div>
                  
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                      className="h-7 px-2 text-xs"
                    >
                      Reply
                    </Button>
                    {comment.userId === userProfile?.id && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteComment(comment.id)}
                        className="h-7 w-7 text-destructive hover:text-destructive"
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              {/* Reply Input */}
              {replyingTo === comment.id && (
                <div className="ml-6 flex gap-2">
                  <Textarea
                    placeholder="Write a reply..."
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    className="min-h-[50px] text-sm resize-none"
                  />
                  <div className="flex flex-col gap-1">
                    <Button 
                      size="icon" 
                      onClick={() => handleAddReply(comment.id)}
                      disabled={!replyText.trim() || isSubmitting}
                      className="h-8 w-8"
                    >
                      {isSubmitting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                    </Button>
                    <Button 
                      size="icon" 
                      variant="ghost"
                      onClick={() => { setReplyingTo(null); setReplyText(""); }}
                      className="h-8 w-8"
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              )}

              {/* Replies */}
              {getCommentReplies(comment.id).map((reply) => (
                <div key={reply.id} className="ml-6 group bg-muted/30 rounded-lg p-3 relative">
                  <div className="flex items-start gap-2">
                    <CornerDownRight className="w-3 h-3 text-muted-foreground mt-1 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-foreground">{reply.userName}</span>
                        <span className="text-xs text-muted-foreground">
                          {reply.createdAt?.toDate?.()?.toLocaleDateString() || 'Just now'}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">{reply.text}</p>
                    </div>
                    {reply.userId === userProfile?.id && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteComment(reply.id)}
                        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ))}

          {topLevelComments.length === 0 && (
            <p className="text-center text-sm text-muted-foreground py-4">
              No comments yet. Be the first to comment!
            </p>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
