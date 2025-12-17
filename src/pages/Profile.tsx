import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { NoteCard } from "@/components/notes/NoteCard";
import { NoteCardSkeleton, ProfileStatsSkeleton } from "@/components/ui/skeleton-card";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
  TrendingUp
} from "lucide-react";

const mockProfile = {
  name: "John Doe",
  bio: "CSE student passionate about coding and sharing knowledge 🚀 Love to help others learn!",
  college: "IIT Delhi",
  branch: "Computer Science",
  year: "3rd Year",
  avatar: "",
  github: "johndoe",
  linkedin: "johndoe",
  portfolio: "johndoe.dev",
  stats: {
    uploads: 24,
    totalLikes: 1250,
    totalViews: 8500,
    helpedRequests: 15,
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

const mockHelpedRequests = [
  {
    id: "1",
    title: "Helped with Computer Networks Notes",
    subject: "CN",
    timestamp: "1 week ago",
  },
  {
    id: "2",
    title: "Shared DBMS ER Diagram Materials",
    subject: "DBMS",
    timestamp: "2 weeks ago",
  },
];

export default function Profile() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(mockProfile.stats);

  // Simulate loading and auto-update stats
  useEffect(() => {
    const loadTimer = setTimeout(() => setLoading(false), 1000);
    
    // Mock auto-updating stats
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
                  <AvatarImage src={mockProfile.avatar} />
                  <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                    JD
                  </AvatarFallback>
                </Avatar>
                <Button variant="outline" size="sm" className="mt-3 gap-1">
                  <Edit2 className="w-3 h-3" />
                  Edit Profile
                </Button>
              </div>

              {/* Info */}
              <div className="flex-1 text-center sm:text-left">
                <h1 className="text-2xl font-bold text-foreground">{mockProfile.name}</h1>
                <p className="text-muted-foreground mt-1">{mockProfile.bio}</p>
                
                <div className="flex flex-wrap justify-center sm:justify-start gap-4 mt-4 text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">{mockProfile.college}</span>
                  <span>•</span>
                  <span>{mockProfile.branch}</span>
                  <span>•</span>
                  <span>{mockProfile.year}</span>
                </div>

                {/* Social Links */}
                <div className="flex justify-center sm:justify-start gap-2 mt-4">
                  <Button variant="outline" size="sm" className="gap-1.5">
                    <Github className="w-4 h-4" />
                    GitHub
                  </Button>
                  <Button variant="outline" size="sm" className="gap-1.5">
                    <Linkedin className="w-4 h-4" />
                    LinkedIn
                  </Button>
                  <Button variant="outline" size="sm" className="gap-1.5">
                    <Globe className="w-4 h-4" />
                    Portfolio
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {loading ? (
            <>
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
                  <p className="text-sm text-muted-foreground">Uploads</p>
                </CardContent>
              </Card>
              <Card className="bg-card border-border group hover:border-primary/30 transition-colors">
                <CardContent className="pt-4 text-center">
                  <ThumbsUp className="w-6 h-6 mx-auto text-primary mb-2" />
                  <div className="flex items-center justify-center gap-1">
                    <p className="text-2xl font-bold text-foreground">{stats.totalLikes.toLocaleString()}</p>
                    <TrendingUp className="w-4 h-4 text-chart-1" />
                  </div>
                  <p className="text-sm text-muted-foreground">Total Likes</p>
                </CardContent>
              </Card>
              <Card className="bg-card border-border group hover:border-primary/30 transition-colors">
                <CardContent className="pt-4 text-center">
                  <Eye className="w-6 h-6 mx-auto text-primary mb-2" />
                  <div className="flex items-center justify-center gap-1">
                    <p className="text-2xl font-bold text-foreground">{stats.totalViews.toLocaleString()}</p>
                    <TrendingUp className="w-4 h-4 text-chart-1" />
                  </div>
                  <p className="text-sm text-muted-foreground">Total Views</p>
                </CardContent>
              </Card>
              <Card className="bg-card border-border group hover:border-primary/30 transition-colors">
                <CardContent className="pt-4 text-center">
                  <Users className="w-6 h-6 mx-auto text-primary mb-2" />
                  <p className="text-2xl font-bold text-foreground">{stats.helpedRequests}</p>
                  <p className="text-sm text-muted-foreground">Helped</p>
                </CardContent>
              </Card>
            </>
          )}
        </div>

        {/* Tabs */}
        <Tabs defaultValue="uploaded" className="space-y-4">
          <TabsList className="bg-muted w-full justify-start">
            <TabsTrigger value="uploaded" className="gap-1.5 data-[state=active]:bg-card">
              <FileText className="w-4 h-4" />
              Uploaded
            </TabsTrigger>
            <TabsTrigger value="saved" className="gap-1.5 data-[state=active]:bg-card">
              <Bookmark className="w-4 h-4" />
              Saved
            </TabsTrigger>
            <TabsTrigger value="helped" className="gap-1.5 data-[state=active]:bg-card">
              <HandHelping className="w-4 h-4" />
              Helped
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

          <TabsContent value="helped" className="space-y-4">
            {loading ? (
              <div className="space-y-4">
                <NoteCardSkeleton />
              </div>
            ) : mockHelpedRequests.length > 0 ? (
              mockHelpedRequests.map((request) => (
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
                  </CardContent>
                </Card>
              ))
            ) : (
              <EmptyState type="helped" />
            )}
          </TabsContent>

          <TabsContent value="stats" className="space-y-4">
            <Card className="bg-card border-border">
              <CardContent className="py-6">
                <h3 className="font-semibold text-foreground mb-4">Activity Overview</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Notes Uploaded</span>
                    <span className="font-medium text-foreground">{stats.uploads}</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div className="bg-primary h-2 rounded-full transition-all duration-500" style={{ width: "60%" }} />
                  </div>
                  
                  <div className="flex items-center justify-between mt-4">
                    <span className="text-muted-foreground">Engagement Rate</span>
                    <span className="font-medium text-foreground">85%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div className="bg-primary h-2 rounded-full transition-all duration-500" style={{ width: "85%" }} />
                  </div>
                  
                  <div className="flex items-center justify-between mt-4">
                    <span className="text-muted-foreground">Help Score</span>
                    <span className="font-medium text-foreground">92/100</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div className="bg-primary h-2 rounded-full transition-all duration-500" style={{ width: "92%" }} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
