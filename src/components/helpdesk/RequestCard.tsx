import { useState } from "react";
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
  ChevronUp
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
    requestedById?: string;
    timestamp: string;
    helpersCount: number;
    likes?: number;
    comments?: number;
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

// Mock contributions data
const mockContributions: Contribution[] = [
  {
    id: "c1",
    type: "pdf",
    fileName: "DBMS_ER_Diagram_Notes.pdf",
    message: "Complete notes with examples!",
    contributorId: "user-2",
    contributorName: "Priya Sharma",
    timestamp: "2 hours ago",
    likes: 8,
  },
  {
    id: "c2",
    type: "link",
    link: "https://drive.google.com/file/example",
    message: "Google Drive link with additional resources",
    contributorId: "user-3",
    contributorName: "Amit Kumar",
    timestamp: "1 hour ago",
    likes: 5,
  },
];

export function RequestCard({ request, onHelp }: RequestCardProps) {
  const navigate = useNavigate();
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(request.likes || 0);
  const [showHelpDialog, setShowHelpDialog] = useState(false);
  const [showCommentsDialog, setShowCommentsDialog] = useState(false);
  const [showContributions, setShowContributions] = useState(false);
  const [helpData, setHelpData] = useState({
    file: null as File | null,
    link: "",
    message: "",
  });
  const [newComment, setNewComment] = useState("");
  const [comments, setComments] = useState([
    { id: "1", author: "Amit K.", text: "I have these notes, will upload soon!", time: "2h ago" },
    { id: "2", author: "Priya S.", text: "Check Google Drive, there's a good PDF", time: "1h ago" },
  ]);

  const contributions = request.contributions || (request.helpersCount > 0 ? mockContributions : []);

  const FileIcon = fileTypeIcons[request.requestType];
  const status = statusConfig[request.status];
  const StatusIcon = status.icon;
  const isOpen = request.status !== "fulfilled" && request.status !== "closed";

  const handleLike = () => {
    setLiked(!liked);
    setLikeCount(liked ? likeCount - 1 : likeCount + 1);
    if (!liked) {
      toast({ title: "Liked!", description: "You supported this request" });
    }
  };

  const handleHelpSubmit = () => {
    if (!helpData.file && !helpData.link) {
      toast({ title: "Please provide a file or link", variant: "destructive" });
      return;
    }
    toast({
      title: "Thank you for helping!",
      description: "Your contribution has been submitted for review.",
    });
    setShowHelpDialog(false);
    setHelpData({ file: null, link: "", message: "" });
    onHelp?.();
  };

  const handleAddComment = () => {
    if (!newComment.trim()) return;
    setComments([
      ...comments,
      { id: Date.now().toString(), author: "You", text: newComment, time: "Just now" },
    ]);
    setNewComment("");
    toast({ title: "Comment added!" });
  };

  const handleViewProfile = (userId: string) => {
    navigate(`/profile/${userId}`);
  };

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
            <Badge variant="secondary" className="bg-muted text-foreground">
              {request.subject}
            </Badge>
            <Badge variant="secondary" className="bg-muted text-foreground">
              {request.branch}
            </Badge>
            <Badge variant="secondary" className="bg-muted text-foreground">
              {request.year}
            </Badge>
          </div>

          {/* Contributions Section */}
          {contributions.length > 0 && (
            <Collapsible open={showContributions} onOpenChange={setShowContributions} className="mt-4">
              <CollapsibleTrigger asChild>
                <Button variant="outline" size="sm" className="w-full justify-between gap-2">
                  <span className="flex items-center gap-2">
                    <Eye className="w-4 h-4" />
                    View Contributions ({contributions.length})
                  </span>
                  {showContributions ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-3 space-y-2">
                {contributions.map((contribution) => (
                  <ContributionCard
                    key={contribution.id}
                    contribution={contribution}
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
              onClick={() => handleViewProfile(request.requestedById || "user-1")}
              className="flex items-center gap-1 hover:text-primary transition-colors"
            >
              <User className="w-4 h-4" />
              <span>{request.requestedBy}</span>
            </button>
            <span className="hidden sm:inline">•</span>
            <span className="hidden sm:inline">{request.timestamp}</span>
            {request.helpersCount > 0 && (
              <>
                <span>•</span>
                <span className="text-primary font-medium">{request.helpersCount} helpers</span>
              </>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Like Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLike}
              className={cn(
                "h-8 px-2 gap-1",
                liked && "text-primary bg-primary/10"
              )}
            >
              <ThumbsUp className={cn("w-4 h-4", liked && "fill-current")} />
              <span className="text-xs">{likeCount}</span>
            </Button>

            {/* Comment Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowCommentsDialog(true)}
              className="h-8 px-2 gap-1"
            >
              <MessageCircle className="w-4 h-4" />
              <span className="text-xs">{request.comments || comments.length}</span>
            </Button>

            {/* Help Button */}
            {isOpen && (
              <Button
                onClick={() => setShowHelpDialog(true)}
                className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2"
              >
                <Upload className="w-4 h-4" />
                Help
              </Button>
            )}
          </div>
        </CardFooter>
      </Card>

      {/* Help Dialog */}
      <Dialog open={showHelpDialog} onOpenChange={setShowHelpDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Help with this request</DialogTitle>
            <DialogDescription>
              Upload a file or share a link to help fulfill this request.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Upload File</Label>
              <label
                htmlFor={`help-file-${request.id}`}
                className={cn(
                  "flex flex-col items-center justify-center w-full h-28 border-2 border-dashed rounded-xl cursor-pointer transition-colors",
                  helpData.file
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                )}
              >
                {helpData.file ? (
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-primary" />
                    <span className="text-sm text-foreground">{helpData.file.name}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={(e) => {
                        e.preventDefault();
                        setHelpData({ ...helpData, file: null });
                      }}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-1">
                    <Upload className="w-6 h-6 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Click to upload</span>
                  </div>
                )}
                <input
                  id={`help-file-${request.id}`}
                  type="file"
                  className="hidden"
                  onChange={(e) => setHelpData({ ...helpData, file: e.target.files?.[0] || null })}
                />
              </label>
            </div>

            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-border" />
              <span className="text-xs text-muted-foreground">OR</span>
              <div className="h-px flex-1 bg-border" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="help-link">Share Link (Google Drive, etc.)</Label>
              <div className="relative">
                <Link className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="help-link"
                  placeholder="https://drive.google.com/..."
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
                placeholder="Add a note about your contribution..."
                value={helpData.message}
                onChange={(e) => setHelpData({ ...helpData, message: e.target.value })}
                rows={2}
              />
            </div>

            <Button onClick={handleHelpSubmit} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
              Submit Contribution
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Comments Dialog */}
      <Dialog open={showCommentsDialog} onOpenChange={setShowCommentsDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Comments</DialogTitle>
            <DialogDescription>
              Discussion about this request
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4 max-h-64 overflow-y-auto">
            {comments.map((comment) => (
              <div key={comment.id} className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <User className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm text-foreground">{comment.author}</span>
                    <span className="text-xs text-muted-foreground">{comment.time}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{comment.text}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="flex gap-2 mt-4">
            <Input
              placeholder="Add a comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddComment()}
            />
            <Button onClick={handleAddComment} className="bg-primary hover:bg-primary/90 text-primary-foreground">
              Send
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
