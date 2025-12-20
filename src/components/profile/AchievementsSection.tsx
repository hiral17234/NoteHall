import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Award, Crown, Star, Flame, Zap, Eye, Upload, Files, HandHeart, Sparkles, Lock, Trophy } from "lucide-react";
import { ACHIEVEMENTS, achievementsService, Achievement } from "@/services/firestoreService";
import { format } from "date-fns";

interface AchievementsSectionProps {
  stats: {
    uploads: number;
    totalLikes: number;
    totalViews: number;
    helpedRequests: number;
    contributionScore: number;
  };
  streak: number;
  earnedBadges?: Array<{
    id: string;
    label: string;
    icon: string;
    color: string;
    earnedAt?: string;
  }>;
}

const iconMap: Record<string, any> = {
  Award, Crown, Star, Flame, Zap, Eye, Upload, Files, HandHeart, Sparkles, Trophy,
};

export function AchievementsSection({ stats, streak, earnedBadges = [] }: AchievementsSectionProps) {
  const [selectedAchievement, setSelectedAchievement] = useState<Achievement | null>(null);
  
  const earnedAchievements = achievementsService.checkAchievements(stats, streak);
  const activeAchievement = achievementsService.getActiveAchievement(stats, streak);
  
  const getProgress = (achievement: Achievement): number => {
    let count = 0;
    switch (achievement.requirement.type) {
      case 'uploads': count = stats.uploads; break;
      case 'helped': count = stats.helpedRequests; break;
      case 'likes': count = stats.totalLikes; break;
      case 'views': count = stats.totalViews; break;
      case 'streak': count = streak; break;
    }
    return Math.min(100, (count / achievement.requirement.count) * 100);
  };

  const isEarned = (achievementId: string) => 
    earnedAchievements.some(a => a.id === achievementId);

  const getEarnedDate = (achievementId: string) => {
    const badge = earnedBadges.find(b => b.id === achievementId);
    return badge?.earnedAt ? format(new Date(badge.earnedAt), "MMM d, yyyy") : "Recently earned";
  };

  return (
    <div className="space-y-6">
      {/* Active Achievement - Currently Working On */}
      {activeAchievement && (
        <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Trophy className="w-4 h-4 text-primary" />
              Currently Working On
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div 
              className="flex items-center gap-4 cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => setSelectedAchievement(activeAchievement)}
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${activeAchievement.color}`}>
                {iconMap[activeAchievement.icon] && 
                  (() => { const Icon = iconMap[activeAchievement.icon]; return <Icon className="w-6 h-6" />; })()
                }
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground">{activeAchievement.label}</h3>
                <p className="text-sm text-muted-foreground">{activeAchievement.description}</p>
                <div className="mt-2 space-y-1">
                  <Progress value={getProgress(activeAchievement)} className="h-2" />
                  <p className="text-xs text-muted-foreground">
                    {Math.round(getProgress(activeAchievement))}% complete
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Earned Achievements */}
      {earnedAchievements.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Award className="w-5 h-5 text-primary" />
              Earned Achievements
              <Badge variant="secondary" className="ml-2">{earnedAchievements.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {earnedAchievements.map((achievement) => (
                <div
                  key={achievement.id}
                  className={`p-3 rounded-xl cursor-pointer hover:scale-105 transition-transform ${achievement.color}`}
                  onClick={() => setSelectedAchievement(achievement)}
                >
                  <div className="flex flex-col items-center text-center gap-2">
                    {iconMap[achievement.icon] && 
                      (() => { const Icon = iconMap[achievement.icon]; return <Icon className="w-8 h-8" />; })()
                    }
                    <div>
                      <p className="text-sm font-medium">{achievement.label}</p>
                      <p className="text-xs opacity-70 capitalize">{achievement.tier}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Locked Achievements */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Lock className="w-5 h-5 text-muted-foreground" />
            Locked Achievements
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {ACHIEVEMENTS.filter(a => !isEarned(a.id)).map((achievement) => (
              <div
                key={achievement.id}
                className="p-3 rounded-xl bg-muted/50 cursor-pointer hover:bg-muted transition-colors opacity-60"
                onClick={() => setSelectedAchievement(achievement)}
              >
                <div className="flex flex-col items-center text-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                    <Lock className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{achievement.label}</p>
                    <Progress value={getProgress(achievement)} className="h-1 mt-1" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Achievement Detail Modal */}
      <Dialog open={!!selectedAchievement} onOpenChange={() => setSelectedAchievement(null)}>
        <DialogContent>
          {selectedAchievement && (
            <>
              <DialogHeader>
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 ${selectedAchievement.color}`}>
                  {iconMap[selectedAchievement.icon] && 
                    (() => { const Icon = iconMap[selectedAchievement.icon]; return <Icon className="w-8 h-8" />; })()
                  }
                </div>
                <DialogTitle className="text-center text-xl">
                  {selectedAchievement.label}
                </DialogTitle>
                <DialogDescription className="text-center">
                  {selectedAchievement.description}
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 mt-4">
                <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                  <span className="text-sm text-muted-foreground">Tier</span>
                  <Badge variant="outline" className="capitalize">{selectedAchievement.tier}</Badge>
                </div>
                
                <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                  <span className="text-sm text-muted-foreground">Requirement</span>
                  <span className="text-sm font-medium">
                    {selectedAchievement.requirement.count} {selectedAchievement.requirement.type}
                  </span>
                </div>

                {isEarned(selectedAchievement.id) ? (
                  <div className="flex justify-between items-center p-3 bg-chart-1/10 rounded-lg border border-chart-1/20">
                    <span className="text-sm text-chart-1">Earned</span>
                    <span className="text-sm font-medium text-chart-1">
                      {getEarnedDate(selectedAchievement.id)}
                    </span>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="font-medium">{Math.round(getProgress(selectedAchievement))}%</span>
                    </div>
                    <Progress value={getProgress(selectedAchievement)} className="h-2" />
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
