import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { 
  FileText, 
  Image, 
  Video, 
  Upload, 
  CheckCircle2, 
  Clock, 
  User, 
  AlertCircle,
  ThumbsUp,
  MessageCircle,
  Link,
  X,
  Eye,
  ChevronDown,
  ChevronUp,
  Loader2,
  Reply,
  CornerDownRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { ContributionCard, Contribution } from "./ContributionCard";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase";
import { 
  collection, 
  query, 
  onSnapshot, 
  orderBy, 
  addDoc, 
  deleteDoc,
  serverTimestamp, 
  updateDoc, 
  doc, 
  arrayUnion, 
  arrayRemove 
} from "firebase/firestore";
import { contributionsService } from "@/services/firestoreService";

interface RequestCardProps {
  request: {
    id: string;
    title: string;
    description: string;
    subject: string;
    branch: string;
    year: string;
    requestType: "pdf" | "image" | "video";
    status: "open" | "fulfilled" | "urgent" | "closed";
    requestedBy: string;
    requestedById: string;
    timestamp: any;
    helpersCount: number;
    likes?: string[]; 
    commentsCount?: number;
    contributions?: Contribution[];
  };
  onHelp?: () => void;
}

const fileTypeIcons = {
  pdf: FileText,
  image: Image,
  video: Video,
};

const statusConfig = {
  open: {
    icon: Clock,
    label: "Open",
    className: "bg-primary text-primary-foreground",
  },
  fulfilled: {
    icon: CheckCircle2,
    label: "Fulfilled",
    className: "bg-chart-1 text-primary-foreground",
  },
  urgent: {
    icon: AlertCircle,
    label: "Urgent",
    className: "bg-destructive text-destructive-foreground animate-pulse",
  },
  closed: {
    icon: CheckCircle2,
    label: "Closed",
    className: "bg-muted text-muted-foreground",
  },
};

export function RequestCard({ request, onHelp, onMarkFulfilled }: RequestCardProps & { onMarkFulfilled?: (requestId: string) => void }) {
  const navigate = useNavigate();
  const { userProfile } = useAuth();
  
  // States
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showHelpDialog, setShowHelpDialog] = useState(false);
  const [showCommentsDialog, setShowCommentsDialog] = useState(false);
  const [showContributions, setShowContributions] = useState(false);
  
  // Real-time Data States
  const [liveContributions, setLiveContributions] = useState<any[]>([]);
  const [liveComments, setLiveComments] = useState<any[]>([]);
  const [liveLikes, setLiveLikes] = useState<string[]>(request.likes || []);
  const [newComment, setNewComment] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [helpData, setHelpData] = useState({
    file: null as File | null,
    link: "",
    message: "",
  });
  
  const isOwner = userProfile?.id === request.requestedById;

  const liked = liveLikes.includes(userProfile?.id || "");
  const likeCount = liveLikes.length;

  // Real-time Listener for Request doc (for likes)
  useEffect(() => {
    const requestRef = doc(db, "requests", request.id);
    const unsubscribe = onSnapshot(
      requestRef, 
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setLiveLikes(data.likes || []);
        }
      },
      (error) => {
        console.error("Real-time request likes error:", error?.code || error);
      }
    );
    return () => unsubscribe();
  }, [request.id]);

  // Real-time Listener for Contributions
  useEffect(() => {
    const q = query(
      collection(db, "requests", request.id, "contributions"),
      orderBy("createdAt", "desc")
    );
    const unsubscribe = onSnapshot(
      q, 
      (snap) => {
        setLiveContributions(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as any)));
      },
      (error) => {
        console.error("Real-time contributions error:", error?.code || error);
      }
    );
    return () => unsubscribe();
  }, [request.id]);

  // Real-time Listener for Comments
  useEffect(() => {
    const q = query(
      collection(db, "requests", request.id, "comments"),
      orderBy("createdAt", "asc")
    );
    const unsubscribe = onSnapshot(
      q, 
      (snap) => {
        setLiveComments(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      },
      (error) => {
        console.error("Real-time comments error:", error?.code || error);
      }
    );
    return () => unsubscribe();
  }, [request.id]);

  const handleLike = async () => {
    if (!userProfile) {
      toast({ title: "Please login", description: "You need an account to like requests." });
      return;
    }
    const requestRef = doc(db, "requests", request.id);
    try {
      await updateDoc(requestRef, {
        likes: liked ? arrayRemove(userProfile.id) : arrayUnion(userProfile.id)
      });
    } catch (e) {
      console.error("Error updating like:", e);
    }
  };

  const handleHelpSubmit = async () => {
    if (!userProfile) return;
    if (!helpData.file && !helpData.link) {
      toast({ title: "Missing information", description: "Please provide a file or a link.", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    try {
      let fileUrl = helpData.link;
      
      // Handle Cloudinary Upload if a file exists
      if (helpData.file) {
        const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || "dxapljgci";
        const formData = new FormData();
        formData.append("file", helpData.file);
        formData.append("upload_preset", "notehall_uploads"); 
        
        const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`, {
          method: "POST",
          body: formData
        });
        
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          console.error("Cloudinary error response:", errData);
          throw new Error(errData?.error?.message || "Cloudinary upload failed");
        }
        const data = await res.json();
        fileUrl = data.secure_url;
      }

      await contributionsService.addContribution(request.id, {
        contributorId: userProfile.id,
        contributorName: userProfile.name,
        contributorUsername: userProfile.username || userProfile.name,
        type: helpData.file ? "pdf" : "link",
        fileUrl: fileUrl,
        message: helpData.message,
        fileName: helpData.file?.name || "Shared Resource Link"
      });

      toast({ title: "Contribution shared!", description: "You've earned contribution points!" });
      setShowHelpDialog(false);
      setHelpData({ file: null, link: "", message: "" });
      onHelp?.();
    } catch (error: any) {
      console.error("Firestore contribution error:", error?.code || error);
      toast({ 
        title: "Submission failed", 
        description: error?.code === 'permission-denied' 
          ? "Permission denied. Check Firestore rules." 
          : "Could not upload your help. Try again.", 
        variant: "destructive" 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !userProfile) return;
    try {
      await addDoc(collection(db, "requests", request.id, "comments"), {
        userId: userProfile.id,
        author: userProfile.name,
        text: newComment,
        parentId: null, // Top-level comment
        createdAt: serverTimestamp()
      });
      setNewComment("");
    } catch (e: any) {
      console.error("Firestore addComment error:", e?.code || e);
      toast({ title: "Error", description: `Failed to post comment. ${e?.code === 'permission-denied' ? 'Permission denied.' : ''}`, variant: "destructive" });
    }
  };

  const handleAddReply = async (parentCommentId: string) => {
    if (!replyText.trim() || !userProfile) return;
    try {
      await addDoc(collection(db, "requests", request.id, "comments"), {
        userId: userProfile.id,
        author: userProfile.name,
        text: replyText,
        parentId: parentCommentId,
        createdAt: serverTimestamp()
      });
      setReplyText("");
      setReplyingTo(null);
    } catch (e: any) {
      console.error("Firestore addReply error:", e?.code || e);
      toast({ title: "Error", description: `Failed to post reply. ${e?.code === 'permission-denied' ? 'Permission denied.' : ''}`, variant: "destructive" });
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!userProfile) return;
    try {
      await deleteDoc(doc(db, "requests", request.id, "comments", commentId));
      toast({ title: "Deleted", description: "Comment removed." });
    } catch (e: any) {
      console.error("Firestore deleteComment error:", e?.code || e);
      toast({ title: "Error", description: `Failed to delete comment. ${e?.code === 'permission-denied' ? 'Permission denied.' : ''}`, variant: "destructive" });
    }
  };

  const handleViewProfile = (userId: string) => {
    navigate(`/profile/${userId}`);
  };

  // Organize comments into threads
  const organizedComments = useMemo(() => {
    const topLevel = liveComments.filter(c => !c.parentId);
    const replies = liveComments.filter(c => c.parentId);
    
    return topLevel.map(comment => ({
      ...comment,
      replies: replies.filter(r => r.parentId === comment.id)
    }));
  }, [liveComments]);

  const FileIcon = fileTypeIcons[request.requestType] || FileText;
  const status = statusConfig[request.status];
  const StatusIcon = status.icon;
  const isOpen = request.status !== "fulfilled" && request.status !== "closed";

  return (
    <>
      <Card className={cn(
        "bg-card border-border hover:shadow-lg transition-all duration-200",
        !isOpen && "opacity-75"
      )}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className={cn(
                "p-2.5 rounded-xl",
                isOpen ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
              )}>
                <FileIcon className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-semibold text-foreground line-clamp-1">
                    {request.title}
                  </h3>
                  <Badge className={cn("flex-shrink-0", status.className)}>
                    <StatusIcon className="w-3 h-3 mr-1" />
                    {status.label}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                  {request.description}
                </p>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pb-3">
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary" className="bg-muted text-foreground">{request.subject}</Badge>
            <Badge variant="secondary" className="bg-muted text-foreground">{request.branch}</Badge>
            <Badge variant="secondary" className="bg-muted text-foreground">{request.year}</Badge>
          </div>

          {liveContributions.length > 0 && (
            <Collapsible open={showContributions} onOpenChange={setShowContributions} className="mt-4">
              <CollapsibleTrigger asChild>
                <Button variant="outline" size="sm" className="w-full justify-between gap-2">
                  <span className="flex items-center gap-2">
                    <Eye className="w-4 h-4" />
                    View Contributions ({liveContributions.length})
                  </span>
                  {showContributions ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-3 space-y-2">
                {liveContributions.map((contribution) => (
                  <ContributionCard
                    key={contribution.id}
                    contribution={{
                      id: contribution.id,
                      type: contribution.type === 'explanation' ? 'link' : (contribution.type || 'link'),
                      fileName: contribution.fileName || contribution.message || 'Contribution',
                      link: contribution.fileUrl,
                      message: contribution.message,
                      contributorId: contribution.contributorId,
                      contributorName: contribution.contributorName || 'Anonymous',
                      timestamp: contribution.createdAt?.toDate?.()?.toLocaleDateString() || 'Recently',
                      likes: 0,
                    }}
                    onViewProfile={handleViewProfile}
                  />
                ))}
              </CollapsibleContent>
            </Collapsible>
          )}
        </CardContent>

        <CardFooter className="pt-3 border-t border-border flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <button 
              onClick={() => handleViewProfile(request.requestedById)}
              className="flex items-center gap-1 hover:text-primary transition-colors"
            >
              <User className="w-4 h-4" />
              <span>{request.requestedBy}</span>
            </button>
            <span className="hidden sm:inline">•</span>
            <span className="hidden sm:inline text-xs">
               {request.timestamp?.seconds ? new Date(request.timestamp.seconds * 1000).toLocaleDateString() : "Just now"}
            </span>
            {liveContributions.length > 0 && (
              <>
                <span>•</span>
                <span className="text-primary font-medium">{liveContributions.length} helpers</span>
              </>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLike}
              className={cn("h-8 px-2 gap-1", liked && "text-primary bg-primary/10")}
            >
              <ThumbsUp className={cn("w-4 h-4", liked && "fill-current")} />
              <span className="text-xs">{likeCount}</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowCommentsDialog(true)}
              className="h-8 px-2 gap-1"
            >
              <MessageCircle className="w-4 h-4" />
              <span className="text-xs">{liveComments.length}</span>
            </Button>

            {isOpen && (
              <>
                <Button
                  onClick={() => setShowHelpDialog(true)}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2"
                >
                  <Upload className="w-4 h-4" />
                  Help
                </Button>
                {isOwner && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onMarkFulfilled?.(request.id)}
                    className="gap-1 border-chart-1 text-chart-1 hover:bg-chart-1/10"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Mark Fulfilled
                  </Button>
                )}
              </>
            )}
          </div>
        </CardFooter>
      </Card>

      {/* Help Dialog */}
      <Dialog open={showHelpDialog} onOpenChange={setShowHelpDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Help with this request</DialogTitle>
            <DialogDescription>Upload a file or share a link to help fulfill this request.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Upload File</Label>
              <label
                className={cn(
                  "flex flex-col items-center justify-center w-full h-28 border-2 border-dashed rounded-xl cursor-pointer transition-colors",
                  helpData.file ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                )}
              >
                {helpData.file ? (
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-primary" />
                    <span className="text-sm text-foreground truncate max-w-[200px]">{helpData.file.name}</span>
                    <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => { e.preventDefault(); setHelpData({ ...helpData, file: null }); }}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-1">
                    <Upload className="w-6 h-6 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Click to upload PDF/Image</span>
                  </div>
                )}
                <input type="file" className="hidden" onChange={(e) => setHelpData({ ...helpData, file: e.target.files?.[0] || null })} />
              </label>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-border" />
              <span className="text-xs text-muted-foreground">OR</span>
              <div className="h-px flex-1 bg-border" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="help-link">Share Link</Label>
              <div className="relative">
                <Link className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="help-link"
                  placeholder="Drive link..."
                  value={helpData.link}
                  onChange={(e) => setHelpData({ ...helpData, link: e.target.value })}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="help-message">Message (optional)</Label>
              <Textarea
                id="help-message"
                placeholder="Briefly describe your contribution..."
                value={helpData.message}
                onChange={(e) => setHelpData({ ...helpData, message: e.target.value })}
                rows={2}
              />
            </div>
            <Button onClick={handleHelpSubmit} className="w-full" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Submit Contribution"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Comments Dialog with Threading */}
      <Dialog open={showCommentsDialog} onOpenChange={setShowCommentsDialog}>
        <DialogContent className="sm:max-w-lg max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Comments ({liveComments.length})</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4 max-h-[400px] overflow-y-auto pr-2">
            {organizedComments.length === 0 && <p className="text-sm text-center text-muted-foreground py-8">No comments yet. Be the first to comment!</p>}
            {organizedComments.map((comment) => (
              <div key={comment.id} className="space-y-2">
                {/* Main Comment */}
                <div className="flex gap-3 group">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <User className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm text-foreground">{comment.author}</span>
                        <span className="text-[10px] text-muted-foreground">
                          {comment.createdAt?.seconds ? new Date(comment.createdAt.seconds * 1000).toLocaleTimeString() : "Just now"}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-muted-foreground hover:text-primary"
                          onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                        >
                          <Reply className="w-3 h-3" />
                        </Button>
                        {comment.userId === userProfile?.id && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => handleDeleteComment(comment.id)}
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{comment.text}</p>
                    
                    {/* Reply Input */}
                    {replyingTo === comment.id && (
                      <div className="flex gap-2 mt-2">
                        <Input
                          placeholder="Write a reply..."
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && handleAddReply(comment.id)}
                          className="h-8 text-sm"
                          autoFocus
                        />
                        <Button onClick={() => handleAddReply(comment.id)} size="sm" className="h-8 px-3">
                          Reply
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Replies */}
                {comment.replies && comment.replies.length > 0 && (
                  <div className="ml-8 pl-3 border-l-2 border-border space-y-2">
                    {comment.replies.map((reply: any) => (
                      <div key={reply.id} className="flex gap-2 group">
                        <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center shrink-0">
                          <User className="w-3 h-3 text-muted-foreground" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-xs text-foreground">{reply.author}</span>
                              <span className="text-[10px] text-muted-foreground">
                                {reply.createdAt?.seconds ? new Date(reply.createdAt.seconds * 1000).toLocaleTimeString() : "Just now"}
                              </span>
                            </div>
                            {reply.userId === userProfile?.id && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive hover:bg-destructive/10"
                                onClick={() => handleDeleteComment(reply.id)}
                              >
                                <X className="w-2.5 h-2.5" />
                              </Button>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">{reply.text}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="flex gap-2 mt-4 pt-4 border-t border-border">
            <Input
              placeholder="Add a comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddComment()}
            />
            <Button onClick={handleAddComment} size="sm">Send</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
