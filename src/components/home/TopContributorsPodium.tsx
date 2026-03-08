import { useState, useEffect } from "react";
import { Crown, TrendingUp, Loader2, ChevronDown, ChevronUp, Medal } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { collection, getDocs, query, orderBy, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

interface Contributor {
  id: string;
  name: string;
  avatar?: string;
  branch: string;
  year: string;
  contributionScore: number;
  rank: number;
}

// Shimmer animation keyframes via inline style tag
const shimmerStyle = `
@keyframes crown-shimmer {
  0%, 100% { filter: drop-shadow(0 0 4px currentColor) brightness(1); }
  50% { filter: drop-shadow(0 0 10px currentColor) brightness(1.3); }
}
@keyframes border-glow {
  0%, 100% { box-shadow: 0 0 8px var(--glow-color); }
  50% { box-shadow: 0 0 18px var(--glow-color), 0 0 30px var(--glow-color); }
}
`;

const rankConfig = {
  1: {
    borderColor: "border-yellow-400",
    glowColor: "rgba(250, 204, 21, 0.5)",
    crownColor: "text-yellow-400",
    bgGradient: "from-yellow-400/10 to-yellow-500/5",
    label: "Gold",
    size: "w-20 h-20",
    crownSize: "w-7 h-7",
    crownOffset: "-top-4",
  },
  2: {
    borderColor: "border-gray-300",
    glowColor: "rgba(192, 192, 192, 0.5)",
    crownColor: "text-gray-400",
    bgGradient: "from-gray-300/10 to-gray-400/5",
    label: "Silver",
    size: "w-16 h-16",
    crownSize: "w-5 h-5",
    crownOffset: "-top-3",
  },
  3: {
    borderColor: "border-orange-600",
    glowColor: "rgba(194, 120, 62, 0.5)",
    crownColor: "text-orange-600",
    bgGradient: "from-orange-600/10 to-orange-700/5",
    label: "Bronze",
    size: "w-16 h-16",
    crownSize: "w-5 h-5",
    crownOffset: "-top-3",
  },
};

function PodiumProfile({ contributor, onClick }: { contributor: Contributor; onClick: () => void }) {
  const config = rankConfig[contributor.rank as keyof typeof rankConfig];
  if (!config) return null;

  return (
    <div
      className={cn(
        "flex flex-col items-center cursor-pointer group transition-transform hover:scale-105",
        contributor.rank === 1 ? "order-2 -mt-4" : contributor.rank === 2 ? "order-1 mt-4" : "order-3 mt-4"
      )}
      onClick={onClick}
    >
      {/* Crown */}
      <div className={cn("relative", config.crownOffset)}>
        <Crown
          className={cn(config.crownSize, config.crownColor, "rotate-[-15deg]")}
          style={{ animation: "crown-shimmer 2s ease-in-out infinite" }}
        />
      </div>

      {/* Avatar with glowing border */}
      <div
        className={cn(
          "rounded-full border-[3px] p-0.5",
          config.borderColor
        )}
        style={{
          ["--glow-color" as any]: config.glowColor,
          animation: "border-glow 2.5s ease-in-out infinite",
        }}
      >
        <Avatar className={cn(config.size)}>
          <AvatarImage src={contributor.avatar} />
          <AvatarFallback className="bg-primary/20 text-primary font-bold text-sm">
            {contributor.name.split(" ").map(n => n[0]).join("")}
          </AvatarFallback>
        </Avatar>
      </div>

      {/* Rank badge */}
      <Badge
        className={cn(
          "mt-1.5 text-[10px] px-2 py-0.5 font-bold",
          contributor.rank === 1
            ? "bg-yellow-400/20 text-yellow-600 border-yellow-400/30"
            : contributor.rank === 2
            ? "bg-gray-300/20 text-gray-500 border-gray-300/30"
            : "bg-orange-500/20 text-orange-600 border-orange-500/30"
        )}
        variant="outline"
      >
        #{contributor.rank}
      </Badge>

      {/* Name */}
      <p className="text-sm font-semibold text-foreground mt-1 text-center max-w-[100px] truncate group-hover:text-primary transition-colors">
        {contributor.name}
      </p>

      {/* Score */}
      <div className="flex items-center gap-1 text-xs text-muted-foreground">
        <TrendingUp className="w-3 h-3 text-primary" />
        <span className="font-medium">{contributor.contributionScore} pts</span>
      </div>
    </div>
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
        // Fetch more to show "see more" list
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

        setTopContributors(users.slice(0, 3));
        setAllContributors(users);
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
      <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20 mb-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Crown className="w-5 h-5 text-primary" />
            Top Contributors of the Week
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (topContributors.length === 0) {
    return (
      <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20 mb-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Crown className="w-5 h-5 text-primary" />
            Top Contributors of the Week
          </CardTitle>
        </CardHeader>
        <CardContent className="py-8 text-center text-muted-foreground">
          <p className="text-sm">No contributors yet. Be the first!</p>
        </CardContent>
      </Card>
    );
  }

  // Find current user's rank
  const currentUserRank = allContributors.findIndex(c => c.id === userProfile?.id);

  return (
    <>
      <style>{shimmerStyle}</style>
      <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20 mb-6">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Crown className="w-5 h-5 text-primary" />
            Top Contributors of the Week
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Podium - 3 profiles in row: 2nd | 1st (center, elevated) | 3rd */}
          <div className="flex items-end justify-center gap-6 sm:gap-10 pt-6 pb-2">
            {topContributors.map((contributor) => (
              <PodiumProfile
                key={contributor.id}
                contributor={contributor}
                onClick={() => handleViewProfile(contributor.id)}
              />
            ))}
          </div>

          {/* See More section */}
          {allContributors.length > 3 && (
            <div className="pt-2">
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-muted-foreground hover:text-foreground gap-1.5"
                onClick={() => setExpanded(!expanded)}
              >
                {expanded ? (
                  <>
                    <ChevronUp className="w-4 h-4" />
                    Show Less
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-4 h-4" />
                    See All Rankings
                  </>
                )}
              </Button>

              {expanded && (
                <div className="mt-3 space-y-1.5 max-h-64 overflow-y-auto">
                  {allContributors.slice(3).map((contributor) => {
                    const isCurrentUser = contributor.id === userProfile?.id;
                    return (
                      <div
                        key={contributor.id}
                        className={cn(
                          "flex items-center gap-3 p-2 rounded-lg cursor-pointer hover:bg-muted/50 transition-colors",
                          isCurrentUser && "bg-primary/10 border border-primary/20 ring-1 ring-primary/30"
                        )}
                        onClick={() => handleViewProfile(contributor.id)}
                      >
                        <span className="w-6 text-center text-xs font-bold text-muted-foreground">
                          #{contributor.rank}
                        </span>
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={contributor.avatar} />
                          <AvatarFallback className="text-xs bg-primary/20 text-primary">
                            {contributor.name.split(" ").map(n => n[0]).join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">
                            {contributor.name}
                            {isCurrentUser && (
                              <span className="ml-1.5 text-xs text-primary font-semibold">(You)</span>
                            )}
                          </p>
                          <p className="text-xs text-muted-foreground">{contributor.branch}{contributor.year ? ` • ${contributor.year}` : ""}</p>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <TrendingUp className="w-3 h-3 text-primary" />
                          <span className="font-medium">{contributor.contributionScore}</span>
                        </div>
                      </div>
                    );
                  })}

                  {/* Show current user if not in the list */}
                  {currentUserRank === -1 && userProfile && (
                    <div className="flex items-center gap-3 p-2 rounded-lg bg-muted/30 border border-dashed border-muted-foreground/30 mt-2">
                      <span className="w-6 text-center text-xs font-bold text-muted-foreground">—</span>
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={userProfile.avatar} />
                        <AvatarFallback className="text-xs bg-primary/20 text-primary">
                          {userProfile.name?.split(" ").map(n => n[0]).join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {userProfile.name}
                          <span className="ml-1.5 text-xs text-primary font-semibold">(You)</span>
                        </p>
                        <p className="text-xs text-muted-foreground">Start contributing to rank up!</p>
                      </div>
                      <Badge variant="outline" className="text-[10px] text-muted-foreground">Unranked</Badge>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
