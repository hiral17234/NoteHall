import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { EmptyState } from "@/components/ui/empty-state";
import { useAuth } from "@/contexts/AuthContext";
import { contributionsService, Contribution } from "@/services/firestoreService";
import { 
  HandHelping, 
  FileText, 
  Image, 
  Video, 
  Link,
  ExternalLink,
  ArrowLeft,
  Trophy
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const typeIcons = {
  pdf: FileText,
  image: Image,
  video: Video,
  link: Link,
};

export default function HelpedPage() {
  const { userProfile } = useAuth();
  const navigate = useNavigate();
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userProfile?.id) return;

    const unsubscribe = contributionsService.subscribeToUserContributions(userProfile.id, (data) => {
      setContributions(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userProfile?.id]);

  return (
    <MainLayout>
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Requests You've Helped</h1>
            <p className="text-muted-foreground">Your contributions to the community</p>
          </div>
        </div>

        {/* Summary Card */}
        <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20 mb-6">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-green-500/20 flex items-center justify-center">
                <HandHelping className="w-8 h-8 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Contributions</p>
                <p className="text-4xl font-black text-foreground">{contributions.length}</p>
              </div>
              {contributions.length >= 10 && (
                <Badge className="ml-auto bg-green-500 text-primary-foreground">
                  <Trophy className="w-4 h-4 mr-1" />
                  Top Helper
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Contributions List */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle>Your Contributions</CardTitle>
            <CardDescription>All the requests you've helped fulfill</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-20 bg-muted animate-pulse rounded-xl" />
                ))}
              </div>
            ) : contributions.length === 0 ? (
              <EmptyState 
                type="helped" 
                title="No contributions yet" 
                description="Help others with their requests to see your contributions here!" 
              />
            ) : (
              <ScrollArea className="h-[400px] pr-4">
                <div className="space-y-4">
                  {contributions.map((contribution) => {
                    const TypeIcon = typeIcons[contribution.type as keyof typeof typeIcons] || Link;
                    return (
                      <div 
                        key={contribution.id} 
                        className="flex items-center justify-between p-4 bg-muted/50 rounded-xl hover:bg-muted transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center text-green-600">
                            <TypeIcon className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="font-medium text-foreground">{contribution.content}</p>
                            <p className="text-sm text-muted-foreground">
                              {contribution.type} • {contribution.createdAt?.toDate?.()?.toLocaleDateString() || 'Recently'}
                            </p>
                          </div>
                        </div>
                        {contribution.fileUrl && (
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => window.open(contribution.fileUrl, '_blank')}
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
