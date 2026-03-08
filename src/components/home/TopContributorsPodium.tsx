import { useState, useEffect } from "react";
import { Crown, TrendingUp, Loader2, ChevronDown, ChevronUp, Sparkles, Star, Eye } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { collection, getDocs, query, orderBy, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { recordTopContributorAchievement } from "@/services/firestoreService";

interface Contributor {
  id: string;
  name: string;
  avatar?: string;
  branch: string;
  year: string;
  contributionScore: number;
  rank: number;
}

const podiumStyles = `
@keyframes crown-float {
  0%, 100% { transform: translateY(0) rotate(-12deg); filter: drop-shadow(0 0 6px rgba(255, 215, 0, 0.6)); }
  50% { transform: translateY(-4px) rotate(-12deg); filter: drop-shadow(0 0 14px rgba(255, 215, 0, 0.9)); }
}
@keyframes crown-float-silver {
  0%, 100% { transform: translateY(0) rotate(-12deg); filter: drop-shadow(0 0 4px rgba(192, 192, 192, 0.5)); }
  50% { transform: translateY(-3px) rotate(-12deg); filter: drop-shadow(0 0 10px rgba(192, 192, 192, 0.7)); }
}
@keyframes crown-float-bronze {
  0%, 100% { transform: translateY(0) rotate(-12deg); filter: drop-shadow(0 0 4px rgba(205, 127, 50, 0.5)); }
  50% { transform: translateY(-3px) rotate(-12deg); filter: drop-shadow(0 0 10px rgba(205, 127, 50, 0.7)); }
}
@keyframes ring-pulse-gold {
  0%, 100% { box-shadow: 0 0 0 3px rgba(255, 215, 0, 0.15), 0 0 12px rgba(255, 215, 0, 0.2); }
  50% { box-shadow: 0 0 0 5px rgba(255, 215, 0, 0.25), 0 0 24px rgba(255, 215, 0, 0.35); }
}
@keyframes ring-pulse-silver {
  0%, 100% { box-shadow: 0 0 0 2px rgba(192, 192, 192, 0.15), 0 0 8px rgba(192, 192, 192, 0.15); }
  50% { box-shadow: 0 0 0 4px rgba(192, 192, 192, 0.2), 0 0 16px rgba(192, 192, 192, 0.25); }
}
@keyframes ring-pulse-bronze {
  0%, 100% { box-shadow: 0 0 0 2px rgba(205, 127, 50, 0.15), 0 0 8px rgba(205, 127, 50, 0.15); }
  50% { box-shadow: 0 0 0 4px rgba(205, 127, 50, 0.2), 0 0 16px rgba(205, 127, 50, 0.25); }
}
@keyframes sparkle-drift {
  0%, 100% { opacity: 0.3; transform: scale(0.8) rotate(0deg); }
  50% { opacity: 1; transform: scale(1.1) rotate(180deg); }
}
@keyframes score-count {
  0% { opacity: 0; transform: translateY(6px); }
  100% { opacity: 1; transform: translateY(0); }
}
`;

const rankConfig = {
  1: {
    avatarSize: "w-[72px] h-[72px]",
    borderStyle: "border-[3px]" as const,
    borderColor: "border-[#FFD700]",
    crownSize: "w-8 h-8",
    crownAnim: "crown-float",
    ringAnim: "ring-pulse-gold",
    badgeBg: "bg-[#FFD700]/20 text-[#B8860B] border-[#FFD700]/40",
    nameSize: "text-sm font-bold",
    scoreColor: "text-[#B8860B]",
    elevation: "-mt-6",
    order: "order-2",
  },
  2: {
    avatarSize: "w-14 h-14",
    borderStyle: "border-[2.5px]" as const,
    borderColor: "border-[#C0C0C0]",
    crownSize: "w-6 h-6",
    crownAnim: "crown-float-silver",
    ringAnim: "ring-pulse-silver",
    badgeBg: "bg-[#C0C0C0]/20 text-[#6B6B6B] border-[#C0C0C0]/40",
    nameSize: "text-xs font-semibold",
    scoreColor: "text-[#6B6B6B]",
    elevation: "mt-4",
    order: "order-1",
  },
  3: {
    avatarSize: "w-14 h-14",
    borderStyle: "border-[2.5px]" as const,
    borderColor: "border-[#CD7F32]",
    crownSize: "w-6 h-6",
    crownAnim: "crown-float-bronze",
    ringAnim: "ring-pulse-bronze",
    badgeBg: "bg-[#CD7F32]/20 text-[#8B5E3C] border-[#CD7F32]/40",
    nameSize: "text-xs font-semibold",
    scoreColor: "text-[#8B5E3C]",
    elevation: "mt-4",
    order: "order-3",
  },
};

function PodiumProfile({ contributor, onClick }: { contributor: Contributor; onClick: () => void }) {
  const config = rankConfig[contributor.rank as keyof typeof rankConfig];
  if (!config) return null;

  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={cn(
              "flex flex-col items-center cursor-pointer group transition-all duration-300 hover:-translate-y-1.5",
              config.order,
              config.elevation
            )}
            onClick={onClick}
          >
            {/* Crown */}
            <div className="relative mb-1">
              {contributor.rank === 1 && (
                <>
                  <Sparkles
                    className="absolute -left-4 -top-1 w-3 h-3 text-[#FFD700]/60"
                    style={{ animation: "sparkle-drift 2.5s ease-in-out infinite" }}
                  />
                  <Sparkles
                    className="absolute -right-4 top-0 w-2.5 h-2.5 text-[#FFD700]/50"
                    style={{ animation: "sparkle-drift 3s ease-in-out infinite 0.5s" }}
                  />
                </>
              )}
              <Crown
                className={cn(config.crownSize, "text-current")}
                style={{
                  animation: `${config.crownAnim} 2.5s ease-in-out infinite`,
                  color: contributor.rank === 1 ? "#FFD700" : contributor.rank === 2 ? "#C0C0C0" : "#CD7F32",
                }}
              />
            </div>

            {/* Avatar ring */}
            <div
              className={cn("rounded-full p-[3px]", config.borderStyle, config.borderColor)}
              style={{ animation: `${config.ringAnim} 3s ease-in-out infinite` }}
            >
              <Avatar className={cn(config.avatarSize, "ring-2 ring-background")}>
                <AvatarImage src={contributor.avatar} className="object-cover" />
                <AvatarFallback className="bg-primary/10 text-primary font-bold text-base">
                  {contributor.name.split(" ").map(n => n[0]).join("")}
                </AvatarFallback>
              </Avatar>
            </div>

            {/* Rank badge */}
            <Badge
              variant="outline"
              className={cn("mt-2 text-[10px] px-2 py-0 font-extrabold tracking-wide", config.badgeBg)}
            >
              #{contributor.rank}
            </Badge>

            {/* Name */}
            <p className={cn(
              "mt-1 text-foreground text-center max-w-[100px] truncate group-hover:text-primary transition-colors",
              config.nameSize
            )}>
              {contributor.name}
            </p>

            {/* Score */}
            <div
              className={cn("flex items-center gap-1 mt-0.5", config.scoreColor)}
              style={{ animation: "score-count 0.5s ease-out forwards" }}
            >
              <Star className="w-3 h-3 fill-current" />
              <span className="text-xs font-bold">{contributor.contributionScore} pts</span>
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="text-xs">
          <div className="flex items-center gap-1">
            <Eye className="w-3 h-3" />
            View {contributor.name.split(" ")[0]}'s profile
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export function TopContributorsPodium() {
  const { userProfile } = useAuth();
  const navigate = useNavigate();
  const [topContributors, setTopContributors] = useState<Contributor[]>([]);
  const [allContributors, setAllContributors] = useState<Contributor[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const fetchContributors = async () => {
      try {
        const usersRef = collection(db, "users");
        const q = query(usersRef, orderBy("stats.contributionScore", "desc"), limit(20));
        const snapshot = await getDocs(q);

        const users: Contributor[] = snapshot.docs
          .map((doc, index) => {
            const data = doc.data();
            if (!data || !(data.stats?.contributionScore > 0)) return null;
            return {
              id: doc.id,
              name: data.name || "Anonymous",
              avatar: data.avatar ?? "",
              branch: data.branch || "Unknown",
              year: data.year || "",
              contributionScore: data.stats?.contributionScore || 0,
              rank: index + 1,
            };
          })
          .filter((u): u is NonNullable<typeof u> => u !== null);

        const top3 = users.slice(0, 3);
        setTopContributors(top3);
        setAllContributors(users);

        top3.forEach((contributor) => {
          recordTopContributorAchievement(contributor.id, contributor.rank);
        });
      } catch (error) {
        console.error("Error fetching contributors:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchContributors();
  }, []);

  const handleViewProfile = (userId: string) => {
    navigate(`/profile/${userId}`);
  };

  if (loading) {
    return (
      <Card className="mb-6 overflow-hidden border-primary/15"
        style={{ background: "linear-gradient(135deg, hsl(40 40% 96%), hsl(43 50% 93%))" }}>
        <div className="p-6 flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      </Card>
    );
  }

  if (topContributors.length === 0) {
    return (
      <Card className="mb-6 overflow-hidden border-primary/15"
        style={{ background: "linear-gradient(135deg, hsl(40 40% 96%), hsl(43 50% 93%))" }}>
        <div className="p-6 text-center text-muted-foreground py-10">
          <Crown className="w-8 h-8 mx-auto mb-2 text-primary/40" />
          <p className="text-sm font-medium">No contributors yet. Be the first!</p>
        </div>
      </Card>
    );
  }

  const currentUserRank = allContributors.findIndex(c => c.id === userProfile?.id);

  return (
    <>
      <style>{podiumStyles}</style>
      <Card
        className="mb-6 overflow-hidden border-primary/15 rounded-[20px] shadow-md"
        style={{ background: "linear-gradient(145deg, hsl(42 35% 96%), hsl(40 45% 92%), hsl(37 40% 94%))" }}
      >
        {/* Header */}
        <div className="px-6 pt-6 pb-2 flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-primary/10">
            <Crown className="w-5 h-5 text-primary" />
          </div>
          <h2 className="text-lg font-bold text-foreground tracking-tight">
            Top Contributors of the Week
          </h2>
          <Sparkles className="w-4 h-4 text-primary/50 ml-auto" />
        </div>

        <CardContent className="px-6 pb-6 pt-2">
          {/* Podium */}
          <div className="flex items-end justify-center gap-6 sm:gap-12 pt-8 pb-4">
            {topContributors.map((contributor) => (
              <PodiumProfile
                key={contributor.id}
                contributor={contributor}
                onClick={() => handleViewProfile(contributor.id)}
              />
            ))}
          </div>

          {/* Divider */}
          <div className="h-px bg-border/60 my-3" />

          {/* View Full Leaderboard */}
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-muted-foreground hover:text-primary hover:bg-primary/5 gap-1.5 font-medium"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? (
              <>
                <ChevronUp className="w-4 h-4" />
                Hide Leaderboard
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4" />
                View Full Leaderboard
              </>
            )}
          </Button>

          {expanded && (
            <div className="mt-3 space-y-1 max-h-72 overflow-y-auto rounded-xl bg-card/50 p-2">
              {allContributors.slice(3).map((contributor) => {
                const isCurrentUser = contributor.id === userProfile?.id;
                return (
                  <TooltipProvider key={contributor.id} delayDuration={300}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div
                          className={cn(
                            "flex items-center gap-3 p-2.5 rounded-xl cursor-pointer transition-all duration-200 hover:bg-muted/60 hover:-translate-y-0.5 hover:shadow-sm",
                            isCurrentUser && "bg-primary/8 border border-primary/20 ring-1 ring-primary/20"
                          )}
                          onClick={() => handleViewProfile(contributor.id)}
                        >
                          <span className="w-7 text-center text-xs font-bold text-muted-foreground tabular-nums">
                            #{contributor.rank}
                          </span>
                          <Avatar className="w-8 h-8">
                            <AvatarImage src={contributor.avatar} className="object-cover" />
                            <AvatarFallback className="text-xs bg-primary/10 text-primary font-semibold">
                              {contributor.name.split(" ").map(n => n[0]).join("")}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">
                              {contributor.name}
                              {isCurrentUser && (
                                <span className="ml-1.5 text-[10px] text-primary font-bold">(You)</span>
                              )}
                            </p>
                            <p className="text-[11px] text-muted-foreground">
                              {contributor.branch}{contributor.year ? ` • ${contributor.year}` : ""}
                            </p>
                          </div>
                          <div className="flex items-center gap-1 text-xs font-semibold text-muted-foreground">
                            <Star className="w-3 h-3 text-primary fill-primary/30" />
                            {contributor.contributionScore}
                          </div>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="left" className="text-xs">View profile</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                );
              })}

              {/* Current user if unranked */}
              {currentUserRank === -1 && userProfile && (
                <div className="flex items-center gap-3 p-2.5 rounded-xl bg-muted/30 border border-dashed border-muted-foreground/20 mt-1.5">
                  <span className="w-7 text-center text-xs font-bold text-muted-foreground">—</span>
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={userProfile.avatar} className="object-cover" />
                    <AvatarFallback className="text-xs bg-primary/10 text-primary font-semibold">
                      {userProfile.name?.split(" ").map(n => n[0]).join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {userProfile.name}
                      <span className="ml-1.5 text-[10px] text-primary font-bold">(You)</span>
                    </p>
                    <p className="text-[11px] text-muted-foreground">Start contributing to rank up!</p>
                  </div>
                  <Badge variant="outline" className="text-[10px] text-muted-foreground">Unranked</Badge>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
