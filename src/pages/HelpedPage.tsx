import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { EmptyState } from "@/components/ui/empty-state";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
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

interface Contribution {
  id: string;
  type: string;
  content: string;
  fileUrl?: string;
  createdAt: any;
  requestId?: string;
}

const typeIcons: Record<string, any> = {
  pdf: FileText,
  image: Image,
  video: Video,
  link: Link,
  explanation: FileText,
};

export default function HelpedPage() {
  const { userProfile } = useAuth();
  const navigate = useNavigate();
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userProfile?.id) {
      setLoading(false);
      return;
    }

    const fetchContributions = async () => {
      try {
        const q = query(
          collection(db, "contributions"),
          where("contributorId", "==", userProfile.id)
        );
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Contribution[];
        
        // Sort by createdAt descending
        data.sort((a, b) => {
          const dateA = a.createdAt?.toDate?.()?.getTime() || 0;
          const dateB = b.createdAt?.toDate?.()?.getTime() || 0;
          return dateB - dateA;
        });
        
        setContributions(data);
        setError(null);
      } catch (err: any) {
        console.error("Error fetching contributions:", err);
        setError(err?.code === 'permission-denied' 
          ? "Permission denied. Please check Firestore rules." 
          : "Failed to load contributions.");
        setContributions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchContributions();
  }, [userProfile?.id]);

  if (!userProfile) {
    return (
      <MainLayout>
        <div className="max-w-3xl mx-auto text-center py-12">
          <p className="text-muted-foreground">Please login to view your contributions.</p>
          <Button onClick={() => navigate("/login")} className="mt-4">Login</Button>
        </div>
      </MainLayout>
    );
  }

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
            ) : error ? (
              <div className="p-6 text-center">
                <p className="text-destructive mb-4">{error}</p>
                <Button variant="outline" onClick={() => window.location.reload()}>
                  Try Again
                </Button>
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
                    const TypeIcon = typeIcons[contribution.type] || Link;
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
                            <p className="font-medium text-foreground">{contribution.content || 'Contribution'}</p>
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
