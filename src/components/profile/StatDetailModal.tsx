import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  FileText, ThumbsUp, Eye, Users, Target, X, TrendingUp, 
  Award, Star, Flame, Crown, Zap, Heart, BookOpen, HelpCircle, Trophy
} from "lucide-react";

interface StatDetailModalProps {
  open: boolean;
  onClose: () => void;
  statType: "uploads" | "likes" | "views" | "helped" | "score";
  value: number;
  isOwner: boolean;
}

const statDetails = {
  uploads: {
    icon: FileText,
    title: "Total Uploads",
    description: "Notes, PDFs, images, and videos you've shared with the community.",
    howItWorks: [
      "Each file you upload counts as 1 upload",
      "Quality uploads with high ratings boost your contributor status",
      "More uploads = more visibility in the community"
    ],
    tip: "Upload high-quality, well-organized notes to gain more likes!"
  },
  likes: {
    icon: ThumbsUp,
    title: "Total Likes",
    description: "The appreciation you've received from other students for your shared content.",
    howItWorks: [
      "Each like on your notes adds to this count",
      "Likes indicate your content is helpful",
      "High-liked content appears in recommendations"
    ],
    tip: "Add clear titles and descriptions to get more likes!"
  },
  views: {
    icon: Eye,
    title: "Total Views",
    description: "How many times your content has been viewed by other students.",
    howItWorks: [
      "Each unique view on your content counts",
      "Views show your content reach",
      "Popular content gets featured on the homepage"
    ],
    tip: "Use relevant tags and subjects to increase discoverability!"
  },
  helped: {
    icon: Users,
    title: "Students Helped",
    description: "Number of help requests you've contributed to.",
    howItWorks: [
      "Each fulfilled help request you contribute to counts",
      "Helping others earns you contributor badges",
      "Active helpers become verified contributors"
    ],
    tip: "Check the Help Desk regularly to find requests you can help with!"
  },
  score: {
    icon: Target,
    title: "Contribution Score",
    description: "Your overall contribution score calculated from multiple factors.",
    howItWorks: [
      "Uploads × 2 points each",
      "Likes received × 0.5 points",
      "Help contributions × 3 points",
      "Quality ratings boost multiplier",
      "Streak bonuses add extra points"
    ],
    formula: "Score = (Uploads × 2) + (Likes × 0.5) + (Helped × 3) + Bonuses",
    tip: "Consistent quality contributions will maximize your score!"
  }
};

export function StatDetailModal({ open, onClose, statType, value, isOwner }: StatDetailModalProps) {
  const stat = statDetails[statType];
  const Icon = stat.icon;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon className="w-5 h-5 text-primary" />
            {stat.title}
          </DialogTitle>
          <DialogDescription>{stat.description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Current Value */}
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="pt-4 text-center">
              <p className="text-4xl font-bold text-primary">{value.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground mt-1">{isOwner ? "Your" : "Their"} {stat.title.toLowerCase()}</p>
            </CardContent>
          </Card>

          {/* How it works */}
          <div>
            <h4 className="font-medium text-foreground mb-2">How it works:</h4>
            <ul className="space-y-2">
              {stat.howItWorks.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <TrendingUp className="w-4 h-4 mt-0.5 text-primary flex-shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Formula for score */}
          {'formula' in stat && (
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-xs font-mono text-muted-foreground">{stat.formula}</p>
            </div>
          )}

          {/* Tip */}
          {isOwner && (
            <div className="p-3 bg-chart-1/10 border border-chart-1/20 rounded-lg">
              <p className="text-sm text-foreground">
                <span className="font-medium">💡 Tip: </span>
                {stat.tip}
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Achievement types
export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  earnedAt?: string;
  progress?: number;
  target?: number;
  isActive?: boolean;
}

interface AchievementsSectionProps {
  achievements: Achievement[];
  isOwner: boolean;
}

const achievementIcons: Record<string, any> = {
  Award, Star, Flame, Crown, Zap, Heart, BookOpen, HelpCircle, Trophy, Target
};

const mockAchievements: Achievement[] = [
  { id: "first-upload", title: "First Upload", description: "Upload your first note", icon: "FileText", color: "bg-primary/20 text-primary", earnedAt: "2024-01-15", isActive: true },
  { id: "helpful-10", title: "Helpful Hand", description: "Help 10 students with their requests", icon: "Heart", color: "bg-chart-1/20 text-chart-1", earnedAt: "2024-01-20", progress: 15, target: 10 },
  { id: "streak-7", title: "Week Warrior", description: "Maintain a 7-day streak", icon: "Flame", color: "bg-orange-500/20 text-orange-500", earnedAt: "2024-01-25" },
  { id: "top-contributor", title: "Top Contributor", description: "Reach top 10 contributors", icon: "Crown", color: "bg-chart-1/20 text-chart-1", isActive: true },
  { id: "likes-100", title: "Popular Notes", description: "Get 100 likes on your content", icon: "ThumbsUp", color: "bg-primary/20 text-primary", progress: 92, target: 100 },
  { id: "verified", title: "Verified Contributor", description: "Maintain quality standards", icon: "Award", color: "bg-chart-1/20 text-chart-1" },
];

export function AchievementsSection({ achievements = mockAchievements, isOwner }: AchievementsSectionProps) {
  const activeAchievement = achievements.find(a => a.isActive);
  const pastAchievements = achievements.filter(a => a.earnedAt && !a.isActive);
  const inProgressAchievements = achievements.filter(a => a.progress !== undefined && a.progress < (a.target || 100));

  return (
    <div className="space-y-6">
      {/* Active Achievement */}
      {activeAchievement && (
        <div>
          <h4 className="text-sm font-medium text-muted-foreground mb-3">Active Achievement</h4>
          <Card className="bg-gradient-to-r from-primary/10 to-chart-1/10 border-primary/20">
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-xl ${activeAchievement.color}`}>
                  {(() => {
                    const IconComponent = achievementIcons[activeAchievement.icon] || Award;
                    return <IconComponent className="w-6 h-6" />;
                  })()}
                </div>
                <div>
                  <h5 className="font-semibold text-foreground">{activeAchievement.title}</h5>
                  <p className="text-sm text-muted-foreground">{activeAchievement.description}</p>
                </div>
                <Badge className="ml-auto bg-primary/20 text-primary">Active</Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* In Progress */}
      {inProgressAchievements.length > 0 && isOwner && (
        <div>
          <h4 className="text-sm font-medium text-muted-foreground mb-3">In Progress</h4>
          <div className="grid gap-3">
            {inProgressAchievements.map(achievement => (
              <Card key={achievement.id} className="bg-card border-border">
                <CardContent className="pt-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${achievement.color}`}>
                      {(() => {
                        const IconComponent = achievementIcons[achievement.icon] || Award;
                        return <IconComponent className="w-5 h-5" />;
                      })()}
                    </div>
                    <div className="flex-1">
                      <h5 className="font-medium text-foreground text-sm">{achievement.title}</h5>
                      <div className="flex items-center gap-2 mt-1">
                        <Progress value={(achievement.progress! / achievement.target!) * 100} className="h-1.5 flex-1" />
                        <span className="text-xs text-muted-foreground">
                          {achievement.progress}/{achievement.target}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Past Achievements */}
      {pastAchievements.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-muted-foreground mb-3">Earned Achievements</h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {pastAchievements.map(achievement => (
              <Card key={achievement.id} className="bg-card border-border hover:border-primary/30 transition-colors">
                <CardContent className="pt-4 text-center">
                  <div className={`w-12 h-12 mx-auto rounded-xl ${achievement.color} flex items-center justify-center mb-2`}>
                    {(() => {
                      const IconComponent = achievementIcons[achievement.icon] || Award;
                      return <IconComponent className="w-6 h-6" />;
                    })()}
                  </div>
                  <h5 className="font-medium text-foreground text-sm">{achievement.title}</h5>
                  {achievement.earnedAt && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(achievement.earnedAt).toLocaleDateString()}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
