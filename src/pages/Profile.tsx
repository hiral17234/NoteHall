import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { NoteCard } from "@/components/notes/NoteCard";
import { NoteCardSkeleton, ProfileStatsSkeleton } from "@/components/ui/skeleton-card";
import { EmptyState } from "@/components/ui/empty-state";
import { EditProfileDialog } from "@/components/profile/EditProfileDialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
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
  BookOpen
} from "lucide-react";

const initialProfile = {
  name: "John Doe",
  bio: "CSE student passionate about coding and sharing knowledge 🚀🔥 Love to help others learn! 📚",
  college: "MITS Gwalior",
  branch: "Computer Science",
  year: "3rd Year",
  degree: "btech",
  avatar: "",
  github: "johndoe",
  linkedin: "johndoe",
  portfolio: "johndoe.dev",
  instagram: "johndoe",
  twitter: "johndoe",
  stats: {
    uploads: 24,
    totalLikes: 1250,
    totalViews: 8500,
    helpedRequests: 15,
    contributionScore: 92,
  },
  badges: [
    { id: "top", label: "Top Contributor", icon: Award, color: "bg-primary/20 text-primary" },
    { id: "helpful", label: "Helpful", icon: Star, color: "bg-chart-1/20 text-chart-1" },
    { id: "mentor", label: "Mentor", icon: Zap, color: "bg-chart-2/20 text-chart-2" },
  ],
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

const mockContributions = [
  { id: "1", title: "Helped with Computer Networks Notes", subject: "CN", timestamp: "1 week ago", type: "help" },
  { id: "2", title: "Shared DBMS ER Diagram Materials", subject: "DBMS", timestamp: "2 weeks ago", type: "help" },
  { id: "3", title: "Uploaded DSA Complete Notes", subject: "DSA", timestamp: "3 weeks ago", type: "upload" },
  { id: "4", title: "Answered 5 doubts in OS", subject: "OS", timestamp: "1 month ago", type: "ai_help" },
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

export default function Profile() {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(initialProfile);
  const [stats, setStats] = useState(initialProfile.stats);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  useEffect(() => {
    const loadTimer = setTimeout(() => setLoading(false), 1000);
    
    const statsInterval = setInterval(() => {
      setStats(prev => ({
        ...prev,
        totalViews: prev.totalViews + Math.floor(Math.random() * 5),
        totalLikes: prev.totalLikes + (Math.random() > 0.7 ? 1 : 0),
      }));
    }, 5000);

    return () => {
      clearTimeout(loadTimer);
      clearInterval(statsInterval);
    };
  }, []);

  const handleProfileSave = (updatedProfile: typeof profile) => {
    setProfile({ ...profile, ...updatedProfile });
  };

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto">
        {/* Profile Header */}
        <Card className="bg-card border-border mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-6">
              {/* Avatar */}
              <div className="flex flex-col items-center sm:items-start">
                <Avatar className="w-24 h-24 border-4 border-primary/20">
                  <AvatarImage src={profile.avatar} />
                  <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                    {profile.name.split(" ").map(n => n[0]).join("")}
                  </AvatarFallback>
                </Avatar>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-3 gap-1"
                  onClick={() => setEditDialogOpen(true)}
                >
                  <Edit2 className="w-3 h-3" />
                  Edit Profile
                </Button>
              </div>

              {/* Info */}
              <div className="flex-1 text-center sm:text-left">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <h1 className="text-2xl font-bold text-foreground">{profile.name}</h1>
                  {profile.badges.map(badge => (
                    <Badge key={badge.id} className={badge.color}>
                      <badge.icon className="w-3 h-3 mr-1" />
                      {badge.label}
                    </Badge>
                  ))}
                </div>
                <p className="text-muted-foreground mt-1">{profile.bio}</p>
                
                <div className="flex flex-wrap justify-center sm:justify-start gap-4 mt-4 text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">{profile.college}</span>
                  <span>•</span>
                  <span>{profile.branch}</span>
                  <span>•</span>
                  <span>{profile.year}</span>
                </div>

                {/* Social Links */}
                <div className="flex flex-wrap justify-center sm:justify-start gap-2 mt-4">
                  {profile.github && (
                    <Button variant="outline" size="sm" className="gap-1.5" asChild>
                      <a href={`https://github.com/${profile.github}`} target="_blank" rel="noopener noreferrer">
                        <Github className="w-4 h-4" />
                        GitHub
                      </a>
                    </Button>
                  )}
                  {profile.linkedin && (
                    <Button variant="outline" size="sm" className="gap-1.5" asChild>
                      <a href={`https://linkedin.com/in/${profile.linkedin}`} target="_blank" rel="noopener noreferrer">
                        <Linkedin className="w-4 h-4" />
                        LinkedIn
                      </a>
                    </Button>
                  )}
                  {profile.portfolio && (
                    <Button variant="outline" size="sm" className="gap-1.5" asChild>
                      <a href={`https://${profile.portfolio}`} target="_blank" rel="noopener noreferrer">
                        <Globe className="w-4 h-4" />
                        Portfolio
                      </a>
                    </Button>
                  )}
                  {profile.instagram && (
                    <Button variant="outline" size="sm" className="gap-1.5" asChild>
                      <a href={`https://instagram.com/${profile.instagram}`} target="_blank" rel="noopener noreferrer">
                        <Instagram className="w-4 h-4" />
                      </a>
                    </Button>
                  )}
                  {profile.twitter && (
                    <Button variant="outline" size="sm" className="gap-1.5" asChild>
                      <a href={`https://x.com/${profile.twitter}`} target="_blank" rel="noopener noreferrer">
                        <Twitter className="w-4 h-4" />
                      </a>
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
              <Card className="bg-card border-border group hover:border-primary/30 transition-colors">
                <CardContent className="pt-4 text-center">
                  <FileText className="w-6 h-6 mx-auto text-primary mb-2" />
                  <p className="text-2xl font-bold text-foreground">{stats.uploads}</p>
                  <p className="text-xs text-muted-foreground">Uploads</p>
                </CardContent>
              </Card>
              <Card className="bg-card border-border group hover:border-primary/30 transition-colors">
                <CardContent className="pt-4 text-center">
                  <ThumbsUp className="w-6 h-6 mx-auto text-primary mb-2" />
                  <div className="flex items-center justify-center gap-1">
                    <p className="text-2xl font-bold text-foreground">{stats.totalLikes.toLocaleString()}</p>
                    <TrendingUp className="w-4 h-4 text-chart-1" />
                  </div>
                  <p className="text-xs text-muted-foreground">Likes</p>
                </CardContent>
              </Card>
              <Card className="bg-card border-border group hover:border-primary/30 transition-colors">
                <CardContent className="pt-4 text-center">
                  <Eye className="w-6 h-6 mx-auto text-primary mb-2" />
                  <div className="flex items-center justify-center gap-1">
                    <p className="text-2xl font-bold text-foreground">{stats.totalViews.toLocaleString()}</p>
                    <TrendingUp className="w-4 h-4 text-chart-1" />
                  </div>
                  <p className="text-xs text-muted-foreground">Views</p>
                </CardContent>
              </Card>
              <Card className="bg-card border-border group hover:border-primary/30 transition-colors">
                <CardContent className="pt-4 text-center">
                  <Users className="w-6 h-6 mx-auto text-primary mb-2" />
                  <p className="text-2xl font-bold text-foreground">{stats.helpedRequests}</p>
                  <p className="text-xs text-muted-foreground">Helped</p>
                </CardContent>
              </Card>
              <Card className="bg-card border-border group hover:border-primary/30 transition-colors">
                <CardContent className="pt-4 text-center">
                  <Target className="w-6 h-6 mx-auto text-primary mb-2" />
                  <p className="text-2xl font-bold text-foreground">{stats.contributionScore}</p>
                  <p className="text-xs text-muted-foreground">Score</p>
                </CardContent>
              </Card>
            </>
          )}
        </div>

        {/* Tabs */}
        <Tabs defaultValue="uploaded" className="space-y-4">
          <TabsList className="bg-muted w-full justify-start overflow-x-auto">
            <TabsTrigger value="uploaded" className="gap-1.5 data-[state=active]:bg-card">
              <FileText className="w-4 h-4" />
              Uploaded
            </TabsTrigger>
            <TabsTrigger value="saved" className="gap-1.5 data-[state=active]:bg-card">
              <Bookmark className="w-4 h-4" />
              Saved
            </TabsTrigger>
            <TabsTrigger value="requests" className="gap-1.5 data-[state=active]:bg-card">
              <HandHelping className="w-4 h-4" />
              Requests
            </TabsTrigger>
            <TabsTrigger value="contributions" className="gap-1.5 data-[state=active]:bg-card">
              <Award className="w-4 h-4" />
              Contributions
            </TabsTrigger>
            <TabsTrigger value="stats" className="gap-1.5 data-[state=active]:bg-card">
              <BarChart3 className="w-4 h-4" />
              Stats
            </TabsTrigger>
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

          <TabsContent value="saved" className="space-y-4">
            {loading ? (
              <div className="grid gap-4 md:grid-cols-2">
                <NoteCardSkeleton />
              </div>
            ) : mockSavedNotes.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2">
                {mockSavedNotes.map((note) => (
                  <NoteCard key={note.id} note={note} />
                ))}
              </div>
            ) : (
              <EmptyState type="saved" />
            )}
          </TabsContent>

          <TabsContent value="requests" className="space-y-4">
            {loading ? (
              <NoteCardSkeleton />
            ) : mockHelpRequests.length > 0 ? (
              mockHelpRequests.map((request) => (
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
                    <Badge className={request.status === "fulfilled" ? "bg-chart-1 text-primary-foreground" : "bg-primary text-primary-foreground"}>
                      {request.status === "fulfilled" ? "Fulfilled" : "Open"}
                    </Badge>
                  </CardContent>
                </Card>
              ))
            ) : (
              <EmptyState type="requests" title="No requests yet" description="Create a request to get help from others!" />
            )}
          </TabsContent>

          <TabsContent value="contributions" className="space-y-4">
            {loading ? (
              <NoteCardSkeleton />
            ) : mockContributions.length > 0 ? (
              mockContributions.map((contribution) => (
                <Card key={contribution.id} className="bg-card border-border hover:border-primary/30 transition-colors">
                  <CardContent className="py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        {contribution.type === "help" && <HandHelping className="w-5 h-5 text-primary" />}
                        {contribution.type === "upload" && <FileText className="w-5 h-5 text-primary" />}
                        {contribution.type === "ai_help" && <BookOpen className="w-5 h-5 text-primary" />}
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{contribution.title}</p>
                        <p className="text-sm text-muted-foreground">{contribution.subject} • {contribution.timestamp}</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="border-primary/30 text-primary">
                      {contribution.type === "help" ? "Helped" : contribution.type === "upload" ? "Uploaded" : "AI Help"}
                    </Badge>
                  </CardContent>
                </Card>
              ))
            ) : (
              <EmptyState type="helped" />
            )}
          </TabsContent>

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
        </Tabs>
      </div>

      {/* Edit Profile Dialog */}
      <EditProfileDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        profile={profile}
        onSave={handleProfileSave}
      />
    </MainLayout>
  );
}
