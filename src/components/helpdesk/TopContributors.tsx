import { Award, Flame, TrendingUp, Crown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface Contributor {
  id: string;
  name: string;
  avatar?: string;
  branch: string;
  year: string;
  contributionsThisWeek: number;
  streak: number;
  rank: number;
}

const mockTopContributors: Contributor[] = [
  { id: "1", name: "Priya Sharma", branch: "CSE", year: "3rd Year", contributionsThisWeek: 12, streak: 21, rank: 1 },
  { id: "2", name: "Amit Kumar", branch: "CSE", year: "2nd Year", contributionsThisWeek: 9, streak: 14, rank: 2 },
  { id: "3", name: "John Doe", branch: "CSE", year: "3rd Year", contributionsThisWeek: 7, streak: 12, rank: 3 },
];

const streakBadges = [
  { days: 7, label: "7 Day", color: "bg-orange-500/20 text-orange-500" },
  { days: 14, label: "14 Day", color: "bg-red-500/20 text-red-500" },
  { days: 30, label: "30 Day", color: "bg-purple-500/20 text-purple-500" },
  { days: 50, label: "50 Day", color: "bg-primary/20 text-primary" },
  { days: 100, label: "100 Day", color: "bg-chart-1/20 text-chart-1" },
];

function getStreakBadge(streak: number) {
  return streakBadges.filter(b => streak >= b.days).pop();
}

const rankStyles = {
  1: "ring-2 ring-yellow-400 bg-yellow-400/10",
  2: "ring-2 ring-gray-300 bg-gray-300/10",
  3: "ring-2 ring-orange-400 bg-orange-400/10",
};

export function TopContributors({ onViewProfile }: { onViewProfile?: (userId: string) => void }) {
  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Crown className="w-5 h-5 text-primary" />
          Top Contributors This Week
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {mockTopContributors.map((contributor) => {
          const streakBadge = getStreakBadge(contributor.streak);
          return (
            <div
              key={contributor.id}
              className={cn(
                "flex items-center gap-3 p-2 rounded-lg cursor-pointer hover:bg-muted/50 transition-colors",
                rankStyles[contributor.rank as keyof typeof rankStyles]
              )}
              onClick={() => onViewProfile?.(contributor.id)}
            >
              {/* Rank */}
              <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                {contributor.rank === 1 ? (
                  <Crown className="w-3.5 h-3.5 text-yellow-500" />
                ) : (
                  <span className="text-xs font-bold text-muted-foreground">{contributor.rank}</span>
                )}
              </div>

              {/* Avatar */}
              <Avatar className="w-8 h-8">
                <AvatarImage src={contributor.avatar} />
                <AvatarFallback className="text-xs bg-primary/20 text-primary">
                  {contributor.name.split(" ").map(n => n[0]).join("")}
                </AvatarFallback>
              </Avatar>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{contributor.name}</p>
                <p className="text-xs text-muted-foreground">{contributor.branch} • {contributor.year}</p>
              </div>

              {/* Stats */}
              <div className="flex items-center gap-2">
                {streakBadge && (
                  <Badge className={cn("h-5 px-1.5 text-[10px] gap-0.5", streakBadge.color)}>
                    <Flame className="w-2.5 h-2.5" />
                    {streakBadge.label}
                  </Badge>
                )}
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <TrendingUp className="w-3 h-3 text-chart-1" />
                  <span className="font-medium">{contributor.contributionsThisWeek}</span>
                </div>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
