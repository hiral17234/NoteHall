import { FileText, Image, Video, Upload, CheckCircle2, Clock, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface RequestCardProps {
  request: {
    id: string;
    title: string;
    description: string;
    subject: string;
    branch: string;
    year: string;
    requestType: "pdf" | "image" | "video";
    status: "open" | "fulfilled";
    requestedBy: string;
    timestamp: string;
    helpersCount: number;
  };
  onHelp?: () => void;
}

const fileTypeIcons = {
  pdf: FileText,
  image: Image,
  video: Video,
};

export function RequestCard({ request, onHelp }: RequestCardProps) {
  const FileIcon = fileTypeIcons[request.requestType];
  const isOpen = request.status === "open";

  return (
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
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-foreground line-clamp-1">
                  {request.title}
                </h3>
                <Badge
                  variant={isOpen ? "default" : "secondary"}
                  className={cn(
                    "flex-shrink-0",
                    isOpen 
                      ? "bg-primary text-primary-foreground" 
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {isOpen ? (
                    <>
                      <Clock className="w-3 h-3 mr-1" />
                      Open
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      Fulfilled
                    </>
                  )}
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
      </CardContent>

      <CardFooter className="pt-3 border-t border-border flex items-center justify-between">
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <User className="w-4 h-4" />
            <span>{request.requestedBy}</span>
          </div>
          <span>•</span>
          <span>{request.timestamp}</span>
          {request.helpersCount > 0 && (
            <>
              <span>•</span>
              <span>{request.helpersCount} helpers</span>
            </>
          )}
        </div>

        {isOpen && (
          <Button
            onClick={onHelp}
            className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2"
          >
            <Upload className="w-4 h-4" />
            Help
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
