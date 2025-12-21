import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/contexts/AuthContext";
import { usersService } from "@/services/firestoreService";
import { 
  BarChart3, 
  TrendingUp, 
  FileText, 
  ThumbsUp, 
  Eye, 
  HandHelping,
  Star,
  Trophy,
  ArrowLeft
} from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function ScorePage() {
  const { userProfile } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    uploads: 0,
    totalLikes: 0,
    totalViews: 0,
    helpedRequests: 0,
    contributionScore: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userProfile?.id) return;

    const fetchStats = async () => {
      try {
        const profile = await usersService.getById(userProfile.id);
        if (profile) {
          setStats(profile.stats || {
            uploads: 0,
            totalLikes: 0,
            totalViews: 0,
            helpedRequests: 0,
            contributionScore: 0,
          });
        }
      } catch (error) {
        console.error("Error fetching stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [userProfile?.id]);

  const scoreBreakdown = [
    { label: "Uploads", value: stats.uploads, points: stats.uploads * 10, icon: FileText, color: "text-blue-500" },
    { label: "Likes Received", value: stats.totalLikes, points: stats.totalLikes * 5, icon: ThumbsUp, color: "text-pink-500" },
    { label: "Views", value: stats.totalViews, points: Math.floor(stats.totalViews / 10), icon: Eye, color: "text-indigo-500" },
    { label: "Help Given", value: stats.helpedRequests, points: stats.helpedRequests * 50, icon: HandHelping, color: "text-green-500" },
  ];

  const getRank = (score: number) => {
    if (score >= 1000) return { title: "Legend", color: "bg-yellow-500" };
    if (score >= 500) return { title: "Expert", color: "bg-purple-500" };
    if (score >= 200) return { title: "Contributor", color: "bg-blue-500" };
    if (score >= 50) return { title: "Rising Star", color: "bg-green-500" };
    return { title: "Newcomer", color: "bg-muted" };
  };

  const rank = getRank(stats.contributionScore);

  return (
    <MainLayout>
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Contribution Score</h1>
            <p className="text-muted-foreground">See how your contributions add up</p>
          </div>
        </div>

        {/* Total Score Card */}
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20 mb-6">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center">
                  <BarChart3 className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Score</p>
                  <p className="text-4xl font-black text-foreground">{stats.contributionScore}</p>
                </div>
              </div>
              <div className="text-right">
                <Badge className={`${rank.color} text-primary-foreground px-4 py-1`}>
                  <Trophy className="w-4 h-4 mr-1" />
                  {rank.title}
                </Badge>
                <p className="text-xs text-muted-foreground mt-2">Your current rank</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Score Breakdown */}
        <Card className="bg-card border-border mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Score Breakdown
            </CardTitle>
            <CardDescription>How your contributions earn points</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {scoreBreakdown.map((item) => (
                <div key={item.label} className="flex items-center justify-between p-4 bg-muted/50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl bg-background flex items-center justify-center ${item.color}`}>
                      <item.icon className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{item.label}</p>
                      <p className="text-sm text-muted-foreground">{item.value} total</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-primary">+{item.points}</p>
                    <p className="text-xs text-muted-foreground">points</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* How to Earn Points */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-500" />
              How to Earn Points
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <span className="font-bold text-primary">+10</span> Upload a new note
              </li>
              <li className="flex items-center gap-2">
                <span className="font-bold text-primary">+5</span> Receive a like on your note
              </li>
              <li className="flex items-center gap-2">
                <span className="font-bold text-primary">+1</span> Every 10 views on your notes
              </li>
              <li className="flex items-center gap-2">
                <span className="font-bold text-primary">+50</span> Help someone with their request
              </li>
              <li className="flex items-center gap-2">
                <span className="font-bold text-primary">+2</span> Rate or comment on notes
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
