import { useState, forwardRef } from "react";
import { 
  FileText, 
  Image, 
  Video, 
  Link2, 
  Download, 
  User, 
  Flag,
  ExternalLink,
  MoreVertical,
  ThumbsUp
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

export interface Contribution {
  id: string;
  type: "pdf" | "image" | "video" | "link";
  fileName?: string;
  link?: string;
  message?: string;
  contributorId: string;
  contributorName: string;
  contributorAvatar?: string;
  timestamp: string;
  likes: number;
}

interface ContributionCardProps {
  contribution: Contribution;
  onViewProfile?: (userId: string) => void;
}

const typeIcons = {
  pdf: FileText,
  image: Image,
  video: Video,
  link: Link2,
};

const typeColors = {
  pdf: "bg-red-500/10 text-red-500",
  image: "bg-blue-500/10 text-blue-500",
  video: "bg-purple-500/10 text-purple-500",
  link: "bg-green-500/10 text-green-500",
};

const reportReasons = [
  "Inappropriate or offensive content",
  "Copyrighted material",
  "Spam or misleading",
  "Incorrect/wrong file",
  "Other",
];

export const ContributionCard = forwardRef<HTMLDivElement, ContributionCardProps>(
  function ContributionCard({ contribution, onViewProfile }, ref) {
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(contribution.likes);
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reportDetails, setReportDetails] = useState("");

  const Icon = typeIcons[contribution.type];

  const handleLike = () => {
    setLiked(!liked);
    setLikeCount(liked ? likeCount - 1 : likeCount + 1);
    if (!liked) {
      toast({ title: "Liked!", description: "You found this helpful" });
    }
  };

  const handleDownload = () => {
    toast({ title: "Downloading...", description: contribution.fileName || "File" });
  };

  const handleOpenLink = () => {
    if (contribution.link) {
      window.open(contribution.link, "_blank");
    }
  };

  const handleReport = () => {
    if (!reportReason) {
      toast({ title: "Please select a reason", variant: "destructive" });
      return;
    }
    toast({ 
      title: "Report submitted", 
      description: "Thank you for helping keep NoteHall safe." 
    });
    setShowReportDialog(false);
    setReportReason("");
    setReportDetails("");
  };

  return (
    <>
      <Card className="bg-muted/50 border-border">
        <CardContent className="py-3">
          <div className="flex items-start gap-3">
            {/* Type Icon */}
            <div className={cn("p-2 rounded-lg", typeColors[contribution.type])}>
              <Icon className="w-4 h-4" />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium text-foreground text-sm truncate">
                  {contribution.fileName || contribution.link}
                </span>
                <Badge variant="outline" className="text-[10px] h-5">
                  {contribution.type.toUpperCase()}
                </Badge>
              </div>

              {contribution.message && (
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                  "{contribution.message}"
                </p>
              )}

              {/* Contributor Info */}
              <div className="flex items-center gap-2 mt-2">
                <Avatar className="w-5 h-5">
                  <AvatarImage src={contribution.contributorAvatar} />
                  <AvatarFallback className="text-[10px] bg-primary/20 text-primary">
                    {contribution.contributorName.split(" ").map(n => n[0]).join("")}
                  </AvatarFallback>
                </Avatar>
                <button 
                  onClick={() => onViewProfile?.(contribution.contributorId)}
                  className="text-xs text-muted-foreground hover:text-primary transition-colors"
                >
                  {contribution.contributorName}
                </button>
                <span className="text-xs text-muted-foreground">•</span>
                <span className="text-xs text-muted-foreground">{contribution.timestamp}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLike}
                className={cn("h-7 px-2 gap-1", liked && "text-primary bg-primary/10")}
              >
                <ThumbsUp className={cn("w-3 h-3", liked && "fill-current")} />
                <span className="text-xs">{likeCount}</span>
              </Button>

              {contribution.type === "link" ? (
                <Button variant="ghost" size="sm" onClick={handleOpenLink} className="h-7 px-2">
                  <ExternalLink className="w-3 h-3" />
                </Button>
              ) : (
                <Button variant="ghost" size="sm" onClick={handleDownload} className="h-7 px-2">
                  <Download className="w-3 h-3" />
                </Button>
              )}

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                    <MoreVertical className="w-3 h-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onViewProfile?.(contribution.contributorId)}>
                    <User className="w-4 h-4 mr-2" />
                    View Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => setShowReportDialog(true)}
                    className="text-destructive"
                  >
                    <Flag className="w-4 h-4 mr-2" />
                    Report
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Report Dialog */}
      <Dialog open={showReportDialog} onOpenChange={setShowReportDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Report Content</DialogTitle>
            <DialogDescription>
              Help us understand why this content is problematic
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <RadioGroup value={reportReason} onValueChange={setReportReason}>
              {reportReasons.map((reason) => (
                <div key={reason} className="flex items-center space-x-2">
                  <RadioGroupItem value={reason} id={reason} />
                  <Label htmlFor={reason} className="text-sm">{reason}</Label>
                </div>
              ))}
            </RadioGroup>

            <div className="space-y-2">
              <Label>Additional details (optional)</Label>
              <Textarea
                placeholder="Provide more context..."
                value={reportDetails}
                onChange={(e) => setReportDetails(e.target.value)}
                rows={2}
              />
            </div>

            <Button 
              onClick={handleReport} 
              className="w-full bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            >
              Submit Report
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
});
