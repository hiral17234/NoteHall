import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { NoteCard } from "@/components/notes/NoteCard";
import { NoteCardSkeleton, ProfileStatsSkeleton } from "@/components/ui/skeleton-card";
import { EmptyState } from "@/components/ui/empty-state";
import { EditProfileDialog } from "@/components/profile/EditProfileDialog";
import { ContributionCard, Contribution } from "@/components/helpdesk/ContributionCard";
import { StatDetailModal, AchievementsSection } from "@/components/profile/StatDetailModal";
import { useSavedNotes } from "@/contexts/SavedNotesContext";
import { useHelpRequests } from "@/contexts/HelpRequestsContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useUser } from "@/contexts/UserContext";
import { 
  Edit2, 
  Github, 
  Linkedin, 
  Globe, 
  FileText, 
  Bookmark, 
  HandHelping, 
  BarChart3,
  ThumbsUp,
  Eye,
  Users,
  TrendingUp,
  Award,
  Star,
  Zap,
  Instagram,
  Twitter,
  Clock,
  Target,
  BookOpen,
  Flame,
  Share2,
  Lock,
  Trophy,
  ArrowLeft,
  Medal
} from "lucide-react";

// Mock data for other users
const otherUsersData: Record<string, any> = {
  "user-2": {
    id: "user-2",
    name: "Priya Sharma",
    bio: "Sharing knowledge is caring! 📚✨ Always ready to help fellow students.",
    college: "MITS Gwalior",
    branch: "Computer Science",
    year: "3rd Year",
    degree: "btech",
    avatar: "",
    github: "priyasharma",
    linkedin: "priyasharma",
    portfolio: "",
    instagram: "priya.sharma",
    twitter: "",
    streak: 21,
    stats: {
      uploads: 45,
      totalLikes: 2150,
      totalViews: 12500,
      helpedRequests: 32,
      contributionScore: 98,
    },
    badges: [
      { id: "top", label: "Top Contributor", icon: "Award", color: "bg-primary/20 text-primary" },
      { id: "helpful", label: "Helpful", icon: "Star", color: "bg-chart-1/20 text-chart-1" },
      { id: "streak-14", label: "14 Day Streak", icon: "Flame", color: "bg-red-500/20 text-red-500" },
    ],
  },
  "user-3": {
    id: "user-3",
    name: "Amit Kumar",
    bio: "ECE student | Tech enthusiast | Notes collector 🎯",
    college: "MITS Gwalior",
    branch: "ECE",
    year: "2nd Year",
    degree: "btech",
    avatar: "",
    github: "amitkumar",
    linkedin: "amitkumar",
    portfolio: "",
    instagram: "",
    twitter: "amitkumar",
    streak: 14,
    stats: {
      uploads: 18,
      totalLikes: 890,
      totalViews: 5200,
      helpedRequests: 12,
      contributionScore: 78,
    },
    badges: [
      { id: "helpful", label: "Helpful", icon: "Star", color: "bg-chart-1/20 text-chart-1" },
      { id: "streak-7", label: "7 Day Streak", icon: "Flame", color: "bg-orange-500/20 text-orange-500" },
    ],
  },
};

const mockUploadedNotes = [
  {
    id: "1",
    title: "Data Structures - Complete Notes",
    subject: "DSA",
    branch: "CSE",
    year: "2nd Year",
    fileType: "pdf" as const,
    likes: 245,
    dislikes: 12,
    views: 1520,
    author: "John Doe",
    timestamp: "2 days ago",
  },
  {
    id: "2",
    title: "Operating Systems - Process Diagrams",
    subject: "OS",
    branch: "CSE",
    year: "3rd Year",
    fileType: "image" as const,
    likes: 189,
    dislikes: 8,
    views: 890,
    author: "John Doe",
    timestamp: "1 week ago",
  },
];

const mockSavedNotes = [
  {
    id: "3",
    title: "DBMS - Normalization Explained",
    subject: "DBMS",
    branch: "CSE",
    year: "2nd Year",
    fileType: "video" as const,
    likes: 312,
    dislikes: 15,
    views: 2100,
    author: "Priya Sharma",
    timestamp: "3 days ago",
  },
];

const mockHelpRequests = [
  { id: "1", title: "DBMS ER Diagram Notes - Unit 2", status: "fulfilled", timestamp: "1 week ago", subject: "DBMS" },
  { id: "2", title: "OS Process Synchronization", status: "open", timestamp: "3 days ago", subject: "OS" },
];

const mockSharedContributions: Contribution[] = [
  {
    id: "sc1",
    type: "pdf",
    fileName: "CN_Unit3_Complete.pdf",
    message: "Complete notes with diagrams",
    contributorId: "current-user",
    contributorName: "John Doe",
    timestamp: "3 days ago",
    likes: 15,
  },
  {
    id: "sc2",
    type: "link",
    link: "https://drive.google.com/file/dbms-notes",
    message: "DBMS ER Diagram materials",
    contributorId: "current-user",
    contributorName: "John Doe",
    timestamp: "1 week ago",
    likes: 23,
  },
  {
    id: "sc3",
    type: "image",
    fileName: "OS_Process_Diagram.png",
    message: "Visual explanation of process states",
    contributorId: "current-user",
    contributorName: "John Doe",
    timestamp: "2 weeks ago",
    likes: 18,
  },
];

const studyInsights = {
  mostStudied: [
    { subject: "DSA", percentage: 85 },
    { subject: "OS", percentage: 65 },
    { subject: "DBMS", percentage: 50 },
  ],
  timeSpent: "42 hours this month",
  weakAreas: ["Computer Networks", "Machine Learning"],
};

const streakBadges = [
  { days: 7, label: "7 Day Streak", color: "bg-orange-500/20 text-orange-500" },
  { days: 14, label: "14 Day Streak", color: "bg-red-500/20 text-red-500" },
  { days: 30, label: "30 Day Streak", color: "bg-purple-500/20 text-purple-500" },
  { days: 50, label: "50 Day Streak", color: "bg-primary/20 text-primary" },
  { days: 100, label: "100 Day Legend", color: "bg-chart-1/20 text-chart-1" },
];

const getBadgeIcon = (iconName: string) => {
  const icons: Record<string, any> = { Award, Star, Zap, Flame };
  return icons[iconName] || Award;
};

export default function Profile() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { user: currentUserProfile, updateUser, isOwner } = useUser();
  const { savedNotes } = useSavedNotes();
  const { getUserRequests, closeRequest } = useHelpRequests();
  
  const [loading, setLoading] = useState(true);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [statModalOpen, setStatModalOpen] = useState<"uploads" | "likes" | "views" | "helped" | "score" | null>(null);
  
  // Get user's help requests
  const userRequests = getUserRequests("current-user");

  // Determine if viewing own profile or someone else's
  const isOwnProfile = !userId || userId === "current-user" || userId === currentUserProfile?.id;
  
  // Get the profile data to display
  const profileData = useMemo(() => {
    if (isOwnProfile) return currentUserProfile;
    // Look up other user's data
    const otherUser = otherUsersData[userId!];
    if (otherUser) return otherUser;
    // Check if it's the current user by username match
    if (currentUserProfile?.username === userId) return currentUserProfile;
    // Return mock data for unknown users
    return otherUsersData["user-2"] || currentUserProfile;
  }, [userId, isOwnProfile, currentUserProfile]);

  const [stats, setStats] = useState(profileData?.stats || currentUserProfile?.stats);

  useEffect(() => {
    setLoading(true);
    const loadTimer = setTimeout(() => setLoading(false), 1000);
    
    // Only auto-update stats for own profile
    let statsInterval: NodeJS.Timeout | undefined;
    if (isOwnProfile) {
      statsInterval = setInterval(() => {
        setStats(prev => ({
          ...prev,
          totalViews: prev.totalViews + Math.floor(Math.random() * 5),
          totalLikes: prev.totalLikes + (Math.random() > 0.7 ? 1 : 0),
        }));
      }, 5000);
    }

    return () => {
      clearTimeout(loadTimer);
      if (statsInterval) clearInterval(statsInterval);
    };
  }, [userId, isOwnProfile]);

  useEffect(() => {
    if (profileData?.stats) {
      setStats(profileData.stats);
    }
  }, [profileData]);

  const handleProfileSave = (updatedProfile: any) => {
    updateUser(updatedProfile);
  };

  const handleViewProfile = (userId: string) => {
    navigate(`/profile/${userId}`);
  };

  const currentStreakBadge = streakBadges.filter(b => (profileData?.streak || 0) >= b.days).pop();

  if (!profileData) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Profile not found</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto">
        {/* Back button for other profiles */}
        {!isOwnProfile && (
          <Button 
            variant="ghost" 
            size="sm" 
            className="mb-4 gap-2"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
        )}
        {/* Profile Header */}
        <Card className="bg-card border-border mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-6">
              {/* Avatar */}
              <div className="flex flex-col items-center sm:items-start">
                <Avatar className="w-24 h-24 border-4 border-primary/20">
                  <AvatarImage src={profileData.avatar} />
                  <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                    {profileData.name.split(" ").map((n: string) => n[0]).join("")}
                  </AvatarFallback>
                </Avatar>
                {isOwnProfile ? (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-3 gap-1"
                    onClick={() => setEditDialogOpen(true)}
                  >
                    <Edit2 className="w-3 h-3" />
                    Edit Profile
                  </Button>
                ) : (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-3 gap-1"
                  >
                    <Share2 className="w-3 h-3" />
                    Share Profile
                  </Button>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 text-center sm:text-left">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <h1 className="text-2xl font-bold text-foreground">{profileData.name}</h1>
                  {profileData.badges.map((badge: any) => {
                    const IconComponent = getBadgeIcon(badge.icon);
                    return (
                      <Badge key={badge.id} className={badge.color}>
                        <IconComponent className="w-3 h-3 mr-1" />
                        {badge.label}
                      </Badge>
                    );
                  })}
                  {currentStreakBadge && !profileData.badges.some((b: any) => b.id.includes("streak")) && (
                    <Badge className={currentStreakBadge.color}>
                      <Flame className="w-3 h-3 mr-1" />
                      {currentStreakBadge.label}
                    </Badge>
                  )}
                </div>
                <p className="text-muted-foreground mt-1">{profileData.bio}</p>
                
                {/* Streak Display */}
                {profileData.streak > 0 && (
                  <div className="flex items-center justify-center sm:justify-start gap-2 mt-2">
                    <Flame className="w-4 h-4 text-orange-500" />
                    <span className="text-sm font-medium text-foreground">{profileData.streak} day streak!</span>
                  </div>
                )}
                
                <div className="flex flex-wrap justify-center sm:justify-start gap-4 mt-4 text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">{profileData.college}</span>
                  <span>•</span>
                  <span>{profileData.branch}</span>
                  <span>•</span>
                  <span>{profileData.year}</span>
                </div>

                {/* Social Links */}
                <div className="flex flex-wrap justify-center sm:justify-start gap-2 mt-4">
                  {profileData.github && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="gap-1.5"
                      onClick={() => window.open(`https://github.com/${profileData.github}`, '_blank', 'noopener,noreferrer')}
                    >
                      <Github className="w-4 h-4" />
                      GitHub
                    </Button>
                  )}
                  {profileData.linkedin && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="gap-1.5"
                      onClick={() => window.open(`https://linkedin.com/in/${profileData.linkedin}`, '_blank', 'noopener,noreferrer')}
                    >
                      <Linkedin className="w-4 h-4" />
                      LinkedIn
                    </Button>
                  )}
                  {profileData.portfolio && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="gap-1.5"
                      onClick={() => window.open(`https://${profileData.portfolio}`, '_blank', 'noopener,noreferrer')}
                    >
                      <Globe className="w-4 h-4" />
                      Portfolio
                    </Button>
                  )}
                  {profileData.instagram && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="gap-1.5"
                      onClick={() => window.open(`https://instagram.com/${profileData.instagram}`, '_blank', 'noopener,noreferrer')}
                    >
                      <Instagram className="w-4 h-4" />
                    </Button>
                  )}
                  {profileData.twitter && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="gap-1.5"
                      onClick={() => window.open(`https://x.com/${profileData.twitter}`, '_blank', 'noopener,noreferrer')}
                    >
                      <Twitter className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          {loading ? (
            <>
              <ProfileStatsSkeleton />
              <ProfileStatsSkeleton />
              <ProfileStatsSkeleton />
              <ProfileStatsSkeleton />
              <ProfileStatsSkeleton />
            </>
          ) : (
            <>
              <Card 
                className="bg-card border-border group hover:border-primary/30 transition-colors cursor-pointer"
                onClick={() => setStatModalOpen("uploads")}
              >
                <CardContent className="pt-4 text-center">
                  <FileText className="w-6 h-6 mx-auto text-primary mb-2" />
                  <p className="text-2xl font-bold text-foreground">{stats.uploads}</p>
                  <p className="text-xs text-muted-foreground">Uploads</p>
                </CardContent>
              </Card>
              <Card 
                className="bg-card border-border group hover:border-primary/30 transition-colors cursor-pointer"
                onClick={() => setStatModalOpen("likes")}
              >
                <CardContent className="pt-4 text-center">
                  <ThumbsUp className="w-6 h-6 mx-auto text-primary mb-2" />
                  <div className="flex items-center justify-center gap-1">
                    <p className="text-2xl font-bold text-foreground">{stats.totalLikes.toLocaleString()}</p>
                    {isOwnProfile && <TrendingUp className="w-4 h-4 text-chart-1" />}
                  </div>
                  <p className="text-xs text-muted-foreground">Likes</p>
                </CardContent>
              </Card>
              <Card 
                className="bg-card border-border group hover:border-primary/30 transition-colors cursor-pointer"
                onClick={() => setStatModalOpen("views")}
              >
                <CardContent className="pt-4 text-center">
                  <Eye className="w-6 h-6 mx-auto text-primary mb-2" />
                  <div className="flex items-center justify-center gap-1">
                    <p className="text-2xl font-bold text-foreground">{stats.totalViews.toLocaleString()}</p>
                    {isOwnProfile && <TrendingUp className="w-4 h-4 text-chart-1" />}
                  </div>
                  <p className="text-xs text-muted-foreground">Views</p>
                </CardContent>
              </Card>
              <Card 
                className="bg-card border-border group hover:border-primary/30 transition-colors cursor-pointer"
                onClick={() => setStatModalOpen("helped")}
              >
                <CardContent className="pt-4 text-center">
                  <Users className="w-6 h-6 mx-auto text-primary mb-2" />
                  <p className="text-2xl font-bold text-foreground">{stats.helpedRequests}</p>
                  <p className="text-xs text-muted-foreground">Helped</p>
                </CardContent>
              </Card>
              <Card 
                className="bg-card border-border group hover:border-primary/30 transition-colors cursor-pointer"
                onClick={() => setStatModalOpen("score")}
              >
                <CardContent className="pt-4 text-center">
                  <Target className="w-6 h-6 mx-auto text-primary mb-2" />
                  <p className="text-2xl font-bold text-foreground">{stats.contributionScore}</p>
                  <p className="text-xs text-muted-foreground">Score</p>
                </CardContent>
              </Card>
            </>
          )}
        </div>

        {/* Tabs - Different for own profile vs others */}
        <Tabs defaultValue="uploaded" className="space-y-4">
          <TabsList className="bg-muted w-full justify-start overflow-x-auto">
            <TabsTrigger value="uploaded" className="gap-1.5 data-[state=active]:bg-card">
              <FileText className="w-4 h-4" />
              Uploaded
            </TabsTrigger>
            {isOwnProfile && (
              <TabsTrigger value="saved" className="gap-1.5 data-[state=active]:bg-card">
                <Bookmark className="w-4 h-4" />
                Saved
              </TabsTrigger>
            )}
            <TabsTrigger value="shared" className="gap-1.5 data-[state=active]:bg-card">
              <Share2 className="w-4 h-4" />
              Shared
            </TabsTrigger>
            {isOwnProfile && (
              <TabsTrigger value="requests" className="gap-1.5 data-[state=active]:bg-card">
                <HandHelping className="w-4 h-4" />
                Requests
              </TabsTrigger>
            )}
            <TabsTrigger value="contributions" className="gap-1.5 data-[state=active]:bg-card">
              <Award className="w-4 h-4" />
              Contributions
            </TabsTrigger>
            <TabsTrigger value="achievements" className="gap-1.5 data-[state=active]:bg-card">
              <Medal className="w-4 h-4" />
              Achievements
            </TabsTrigger>
            {isOwnProfile && (
              <TabsTrigger value="stats" className="gap-1.5 data-[state=active]:bg-card">
                <BarChart3 className="w-4 h-4" />
                Stats
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="uploaded" className="space-y-4">
            {loading ? (
              <div className="grid gap-4 md:grid-cols-2">
                <NoteCardSkeleton />
                <NoteCardSkeleton />
              </div>
            ) : mockUploadedNotes.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2">
                {mockUploadedNotes.map((note) => (
                  <NoteCard key={note.id} note={note} />
                ))}
              </div>
            ) : (
              <EmptyState type="notes" title="No uploads yet" description="Upload your first note to help others!" />
            )}
          </TabsContent>

          {isOwnProfile && (
            <TabsContent value="saved" className="space-y-4">
              {loading ? (
                <div className="grid gap-4 md:grid-cols-2">
                  <NoteCardSkeleton />
                </div>
              ) : savedNotes.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2">
                  {savedNotes.map((note) => (
                    <NoteCard key={note.id} note={{
                      id: note.id,
                      title: note.title,
                      subject: note.subject,
                      branch: "CSE",
                      year: "2nd Year",
                      fileType: "pdf" as const,
                      likes: 0,
                      dislikes: 0,
                      views: 0,
                      author: "Saved",
                      timestamp: new Date(note.savedAt).toLocaleDateString(),
                    }} />
                  ))}
                </div>
              ) : (
                <EmptyState type="saved" />
              )}
            </TabsContent>
          )}

          <TabsContent value="shared" className="space-y-4">
            {!isOwnProfile && (
              <p className="text-sm text-muted-foreground mb-4">
                Files and links shared by {profileData.name} to help others
              </p>
            )}
            {loading ? (
              <NoteCardSkeleton />
            ) : mockSharedContributions.length > 0 ? (
              <div className="space-y-3">
                {mockSharedContributions.map((contribution) => (
                  <ContributionCard
                    key={contribution.id}
                    contribution={contribution}
                  />
                ))}
              </div>
            ) : (
              <EmptyState type="helped" title="No shared content yet" description="Files and links shared will appear here." />
            )}
          </TabsContent>

          {isOwnProfile && (
            <TabsContent value="requests" className="space-y-4">
              {loading ? (
                <NoteCardSkeleton />
              ) : userRequests.length > 0 ? (
                userRequests.map((request) => (
                  <Card key={request.id} className="bg-card border-border hover:border-primary/30 transition-colors">
                    <CardContent className="py-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <HandHelping className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{request.title}</p>
                          <p className="text-sm text-muted-foreground">{request.subject} • {request.timestamp}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {request.status !== "fulfilled" && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => closeRequest(request.id)}
                          >
                            Close
                          </Button>
                        )}
                        <Badge className={request.status === "fulfilled" ? "bg-chart-1 text-primary-foreground" : "bg-primary text-primary-foreground"}>
                          {request.status === "fulfilled" ? "Fulfilled" : "Open"}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <EmptyState type="requests" title="No requests yet" description="Create a request to get help from others!" />
              )}
            </TabsContent>
          )}

          <TabsContent value="achievements" className="space-y-4">
            <AchievementsSection achievements={[]} isOwner={isOwnProfile} />
          </TabsContent>

          <TabsContent value="contributions" className="space-y-4">
            {loading ? (
              <NoteCardSkeleton />
            ) : (
              <>
                <Card className="bg-card border-border hover:border-primary/30 transition-colors">
                  <CardContent className="py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <HandHelping className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">Helped with Computer Networks Notes</p>
                        <p className="text-sm text-muted-foreground">CN • 1 week ago</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="border-primary/30 text-primary">Helped</Badge>
                  </CardContent>
                </Card>
                <Card className="bg-card border-border hover:border-primary/30 transition-colors">
                  <CardContent className="py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <FileText className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">Uploaded DSA Complete Notes</p>
                        <p className="text-sm text-muted-foreground">DSA • 3 weeks ago</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="border-primary/30 text-primary">Uploaded</Badge>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>

          {isOwnProfile && (
            <TabsContent value="stats" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                {/* Activity Overview */}
                <Card className="bg-card border-border">
                  <CardContent className="py-6">
                    <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                      <BarChart3 className="w-5 h-5 text-primary" />
                      Activity Overview
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm text-muted-foreground">Notes Uploaded</span>
                          <span className="text-sm font-medium text-foreground">{stats.uploads}</span>
                        </div>
                        <Progress value={60} className="h-2" />
                      </div>
                      
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm text-muted-foreground">Engagement Rate</span>
                          <span className="text-sm font-medium text-foreground">85%</span>
                        </div>
                        <Progress value={85} className="h-2" />
                      </div>
                      
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm text-muted-foreground">Help Score</span>
                          <span className="text-sm font-medium text-foreground">{stats.contributionScore}/100</span>
                        </div>
                        <Progress value={stats.contributionScore} className="h-2" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Study Insights */}
                <Card className="bg-card border-border">
                  <CardContent className="py-6">
                    <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                      <BookOpen className="w-5 h-5 text-primary" />
                      Study Insights
                    </h3>
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Time spent:</span>
                        <span className="font-medium text-foreground">{studyInsights.timeSpent}</span>
                      </div>
                      
                      <div>
                        <p className="text-sm text-muted-foreground mb-2">Most studied subjects:</p>
                        <div className="space-y-2">
                          {studyInsights.mostStudied.map(item => (
                            <div key={item.subject}>
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-sm text-foreground">{item.subject}</span>
                                <span className="text-xs text-muted-foreground">{item.percentage}%</span>
                              </div>
                              <Progress value={item.percentage} className="h-1.5" />
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <p className="text-sm text-muted-foreground mb-2">Areas to improve:</p>
                        <div className="flex flex-wrap gap-2">
                          {studyInsights.weakAreas.map(area => (
                            <Badge key={area} variant="outline" className="border-destructive/30 text-destructive">
                              {area}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          )}
        </Tabs>
      </div>

      {/* Edit Profile Dialog - Only for own profile */}
      {isOwnProfile && (
        <EditProfileDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          profile={currentUserProfile}
          onSave={handleProfileSave}
        />
      )}

      {/* Stat Detail Modal */}
      {statModalOpen && (
        <StatDetailModal
          open={!!statModalOpen}
          onClose={() => setStatModalOpen(null)}
          statType={statModalOpen}
          value={
            statModalOpen === "uploads" ? stats.uploads :
            statModalOpen === "likes" ? stats.totalLikes :
            statModalOpen === "views" ? stats.totalViews :
            statModalOpen === "helped" ? stats.helpedRequests :
            stats.contributionScore
          }
          isOwner={isOwnProfile}
        />
      )}
    </MainLayout>
  );
}
