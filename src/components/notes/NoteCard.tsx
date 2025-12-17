import { useState } from "react";
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
  MoreVertical
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

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
  };
  onAskAI?: () => void;
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
  link: "bg-secondary/20 text-secondary",
};

export function NoteCard({ note, onAskAI }: NoteCardProps) {
  const [liked, setLiked] = useState(false);
  const [disliked, setDisliked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [likes, setLikes] = useState(note.likes);
  const [dislikes, setDislikes] = useState(note.dislikes);

  const FileIcon = fileTypeIcons[note.fileType];

  const handleLike = () => {
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
    }
  };

  const handleDislike = () => {
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

  return (
    <Card className="bg-card border-border hover:shadow-lg transition-all duration-200 group">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className={cn("p-2.5 rounded-xl", fileTypeColors[note.fileType])}>
              <FileIcon className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="font-semibold text-foreground line-clamp-2 group-hover:text-primary transition-colors">
                {note.title}
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                by {note.author} • {note.timestamp}
              </p>
            </div>
          </div>
          <Button variant="ghost" size="icon" className="flex-shrink-0">
            <MoreVertical className="w-4 h-4" />
          </Button>
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
        </div>
      </CardContent>

      <CardFooter className="pt-3 border-t border-border flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLike}
            className={cn(
              "h-8 px-2 gap-1",
              liked && "text-primary bg-primary/10"
            )}
          >
            <ThumbsUp className="w-4 h-4" />
            <span className="text-xs">{likes}</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDislike}
            className={cn(
              "h-8 px-2 gap-1",
              disliked && "text-destructive bg-destructive/10"
            )}
          >
            <ThumbsDown className="w-4 h-4" />
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
            onClick={() => setSaved(!saved)}
            className={cn(
              "h-8 px-2",
              saved && "text-primary bg-primary/10"
            )}
          >
            <Bookmark className={cn("w-4 h-4", saved && "fill-current")} />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onAskAI}
            className="h-8 gap-1 border-primary/30 text-primary hover:bg-primary hover:text-primary-foreground"
          >
            <Bot className="w-4 h-4" />
            <span className="text-xs">Ask AI</span>
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
