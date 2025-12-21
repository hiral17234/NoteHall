import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { NoteCard } from "@/components/notes/NoteCard";
import { NoteCardSkeleton, ProfileStatsSkeleton } from "@/components/ui/skeleton-card";
import { EmptyState } from "@/components/ui/empty-state";
import { EditProfileDialog } from "@/components/profile/EditProfileDialog";
import { ContributionCard, Contribution } from "@/components/helpdesk/ContributionCard";
import { StatDetailModal, AchievementsSection, Achievement } from "@/components/profile/StatDetailModal";
import { useAuth, UserProfile } from "@/contexts/AuthContext";
import { usersService, notesService, Note, contributionsService, achievementsService } from "@/services/firestoreService";
import { mapFirestoreNoteToCardNote } from "@/lib/noteCard";
import { parseSocialLink } from "@/lib/socialLinks";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { db } from "@/lib/firebase";
import { collection, query, where, onSnapshot, orderBy } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
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
  TrendingUp,
  Award,
  Star,
  Zap,
  Instagram,
  Twitter,
  Flame,
  Share2,
  ArrowLeft,
  Download,
  MessageSquare
} from "lucide-react";

const getBadgeIcon = (iconName: string) => {
  const icons: Record<string, any> = { Award, Star, Zap, Flame };
  return icons[iconName] || Award;
};

const streakBadges = [
  { days: 7, label: "7 Day Streak", color: "bg-orange-500/20 text-orange-500" },
  { days: 14, label: "14 Day Streak", color: "bg-red-500/20 text-red-500" },
  { days: 30, label: "30 Day Streak", color: "bg-purple-500/20 text-purple-500" },
  { days: 50, label: "50 Day Streak", color: "bg-primary/20 text-primary" },
  { days: 100, label: "100 Day Legend", color: "bg-chart-1/20 text-chart-1" },
];

export default function Profile() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { userProfile: currentUser, updateUserProfile } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState<UserProfile | null>(null);
  const [uploadedNotes, setUploadedNotes] = useState<Note[]>([]);
  const [savedNotes, setSavedNotes] = useState<Note[]>([]);
  const [downloadedNotes, setDownloadedNotes] = useState<any[]>([]);
  const [userRequests, setUserRequests] = useState<any[]>([]);
  const [contributions, setContributions] = useState<any[]>([]);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [statModalOpen, setStatModalOpen] = useState<"uploads" | "likes" | "views" | "helped" | "score" | null>(null);

  const isOwnProfile = !userId || userId === "current-user" || userId === currentUser?.id;
  const targetUserId = isOwnProfile ? currentUser?.id : userId;

  // SECURE BLOB DOWNLOAD LOGIC
  const handleSecureDownload = async (item: any) => {
    try {
      toast({
        title: "Preparing download",
        description: "Fetching secure file stream...",
      });

      let fileUrl = item.fileUrl;
      // Inject Cloudinary attachment flag for direct download
      if (fileUrl.includes('cloudinary.com') && !fileUrl.includes('fl_attachment')) {
        fileUrl = fileUrl.replace('/upload/', '/upload/fl_attachment/');
      }

      const response = await fetch(fileUrl);
      if (!response.ok) throw new Error("Failed to fetch file");
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `${item.title || 'note'}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Download error:", error);
      toast({
        title: "Download failed",
        description: "Redirecting to direct link...",
        variant: "destructive"
      });
      window.open(item.fileUrl, '_blank');
    }
  };

  // REAL-TIME PROFILE SUBSCRIPTION
  useEffect(() => {
    if (!targetUserId) {
      setLoading(false);
      return;
    }

    const unsubscribe = usersService.subscribeToProfile(targetUserId, (profile) => {
      if (profile) {
        setProfileData(profile as unknown as UserProfile);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [targetUserId]);

  // REAL-TIME CONTENT SUBSCRIPTIONS
  useEffect(() => {
    if (!profileData?.id) return;

    // 1. Live Uploads
    const qUploads = query(
      collection(db, "notes"), 
      where("userId", "==", profileData.id), 
      orderBy("createdAt", "desc")
    );
    const unsubUploads = onSnapshot(qUploads, (snap) => {
      setUploadedNotes(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Note)));
    });

    // 2. Live Contributions
    const unsubContribs = contributionsService.subscribeToUserContributions(profileData.id, (contribs) => {
      setContributions(contribs);
    });

    let unsubSaved = () => {};
    let unsubDownloaded = () => {};
    let unsubRequests = () => {};

    if (isOwnProfile) {
      // 3. Live Saved Notes (Requires fetching Note data for each ref)
      unsubSaved = usersService.subscribeToSavedNotes(profileData.id, async (savedRefs) => {
        const notes = await Promise.all(
          savedRefs.map(ref => notesService.getById(ref.noteId))
        );
        setSavedNotes(notes.filter((n): n is Note => n !== null));
      });

      // 4. Live Download History
      unsubDownloaded = usersService.subscribeToDownloadedNotes(profileData.id, (downloaded) => {
        setDownloadedNotes(downloaded);
      });

      // 5. Live My Requests (New Feature from Report)
      const qRequests = query(
        collection(db, "requests"),
        where("requesterId", "==", profileData.id),
        orderBy("createdAt", "desc")
      );
      unsubRequests = onSnapshot(qRequests, (snap) => {
        setUserRequests(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      });
    }

    return () => {
      unsubUploads();
      unsubContribs();
      unsubSaved();
      unsubDownloaded();
      unsubRequests();
    };
  }, [profileData?.id, isOwnProfile]);

  const handleProfileSave = async (updatedProfile: any) => {
    await updateUserProfile(updatedProfile);
    setProfileData(prev => prev ? { ...prev, ...updatedProfile } : null);
  };

  const currentStreakBadge = streakBadges.filter(b => (profileData?.streak || 0) >= b.days).pop();
  const stats = profileData?.stats || { uploads: 0, totalLikes: 0, totalViews: 0, helpedRequests: 0, contributionScore: 0 };

  const earnedAchievementsList = profileData?.stats ? achievementsService.checkAchievements(profileData.stats, profileData.streak || 0) : [];
  const displayAchievements: Achievement[] = earnedAchievementsList.map(a => ({
    id: a.id,
    title: a.label,
    description: a.description,
    icon: a.icon,
    color: a.color,
    earnedAt: new Date().toISOString(),
  }));

  if (loading) {
    return (
      <MainLayout>
        <div className="max-w-4xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            <ProfileStatsSkeleton />
            <ProfileStatsSkeleton />
            <ProfileStatsSkeleton />
            <ProfileStatsSkeleton />
            <ProfileStatsSkeleton />
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto px-4 pb-20">
        {!isOwnProfile && (
          <Button variant="ghost" size="sm" className="mb-4 gap-2" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-4 h-4" /> Back
          </Button>
        )}

        {/* Profile Header */}
        <Card className="bg-card border-border mb-6 overflow-hidden">
          <CardContent className="pt-8 px-6">
            <div className="flex flex-col sm:flex-row gap-6 items-center sm:items-start text-center sm:text-left">
              <div className="relative">
                <Avatar className="w-28 h-28 border-4 border-primary/10 shadow-xl">
                  <AvatarImage src={profileData?.avatar} />
                  <AvatarFallback className="bg-primary text-primary-foreground text-3xl">
                    {profileData?.name?.[0] || "?"}
                  </AvatarFallback>
                </Avatar>
                {isOwnProfile && (
                  <Button 
                    variant="secondary" 
                    size="icon" 
                    className="absolute bottom-0 right-0 rounded-full w-8 h-8 shadow-md"
                    onClick={() => setEditDialogOpen(true)}
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                )}
              </div>

              <div className="flex-1 w-full">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-2">
                  <h1 className="text-3xl font-bold">{profileData?.name}</h1>
                  {profileData?.badges?.map((badge: any) => {
                    const IconComponent = getBadgeIcon(badge.icon);
                    return (
                      <Badge key={badge.id} className={`${badge.color} border-none`}>
                        <IconComponent className="w-3 h-3 mr-1" />
                        {badge.label}
                      </Badge>
                    );
                  })}
                </div>
                
                <p className="text-muted-foreground text-lg mb-4">{profileData?.bio || "Learning and sharing knowledge."}</p>
                
                <div className="flex flex-wrap justify-center sm:justify-start gap-y-2 gap-x-6 text-sm">
                  <div className="flex items-center gap-1.5"><Globe className="w-4 h-4 text-primary" /> {profileData?.college || "Global Learner"}</div>
                  <div className="flex items-center gap-1.5"><FileText className="w-4 h-4 text-primary" /> {profileData?.branch || "Student"}</div>
                  {(profileData?.streak || 0) > 0 && (
                    <div className="flex items-center gap-1.5 text-orange-500 font-bold">
                      <Flame className="w-4 h-4 fill-orange-500" /> {profileData?.streak} Day Streak
                    </div>
                  )}
                </div>

                {/* Socials */}
                <div className="flex flex-wrap justify-center sm:justify-start gap-3 mt-6">
                  {profileData?.github && (
                    <Button variant="outline" size="sm" onClick={() => window.open(parseSocialLink(profileData.github, 'github'), '_blank')}>
                      <Github className="w-4 h-4 mr-2" /> GitHub
                    </Button>
                  )}
                  {profileData?.linkedin && (
                    <Button variant="outline" size="sm" onClick={() => window.open(parseSocialLink(profileData.linkedin, 'linkedin'), '_blank')}>
                      <Linkedin className="w-4 h-4 mr-2" /> LinkedIn
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <StatItem icon={FileText} label="Uploads" value={stats.uploads} onClick={() => setStatModalOpen("uploads")} />
          <StatItem icon={ThumbsUp} label="Likes" value={stats.totalLikes} onClick={() => setStatModalOpen("likes")} />
          <StatItem icon={Eye} label="Views" value={stats.totalViews} onClick={() => setStatModalOpen("views")} />
          <StatItem icon={HandHelping} label="Helped" value={stats.helpedRequests} onClick={() => setStatModalOpen("helped")} />
          <StatItem icon={BarChart3} label="Score" value={stats.contributionScore} onClick={() => setStatModalOpen("score")} />
        </div>

        <AchievementsSection achievements={displayAchievements} isOwner={isOwnProfile} />

        <Tabs defaultValue="uploads" className="w-full mt-8">
          <TabsList className="w-full justify-start bg-transparent border-b rounded-none h-auto p-0 mb-6 space-x-6 overflow-x-auto no-scrollbar">
            <TabsTrigger value="uploads" className="data-[state=active]:border-primary border-b-2 border-transparent rounded-none px-2 pb-3 bg-transparent">Uploads ({uploadedNotes.length})</TabsTrigger>
            {isOwnProfile && <TabsTrigger value="requests" className="data-[state=active]:border-primary border-b-2 border-transparent rounded-none px-2 pb-3 bg-transparent">My Requests ({userRequests.length})</TabsTrigger>}
            {isOwnProfile && <TabsTrigger value="saved" className="data-[state=active]:border-primary border-b-2 border-transparent rounded-none px-2 pb-3 bg-transparent">Saved ({savedNotes.length})</TabsTrigger>}
            {isOwnProfile && <TabsTrigger value="downloaded" className="data-[state=active]:border-primary border-b-2 border-transparent rounded-none px-2 pb-3 bg-transparent">History ({downloadedNotes.length})</TabsTrigger>}
            <TabsTrigger value="contributions" className="data-[state=active]:border-primary border-b-2 border-transparent rounded-none px-2 pb-3 bg-transparent">Help ({contributions.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="uploads">
            {uploadedNotes.length === 0 ? <EmptyState type="notes" title="No uploads" description="Share notes to help others!" /> :
              <div className="grid gap-4">{uploadedNotes.map(n => <NoteCard key={n.id} note={mapFirestoreNoteToCardNote(n)} />)}</div>}
          </TabsContent>

          <TabsContent value="requests">
            <div className="grid gap-4">
              {userRequests.length === 0 ? <EmptyState type="notes" title="No requests" description="Ask for help if you're stuck!" /> :
                userRequests.map(req => (
                  <Card key={req.id} className="p-5 border-l-4 border-l-primary hover:bg-accent/30 transition-colors">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="font-bold text-lg">{req.title}</h3>
                        <p className="text-sm text-muted-foreground">{req.subject} • Status: <span className="capitalize text-primary font-medium">{req.status}</span></p>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => navigate(`/help-desk?id=${req.id}`)}>View</Button>
                    </div>
                  </Card>
                ))}
            </div>
          </TabsContent>

          <TabsContent value="downloaded">
            <div className="grid gap-4">
              {downloadedNotes.length === 0 ? <EmptyState type="notes" title="No history" description="Downloaded notes appear here." /> :
                downloadedNotes.map((item) => (
                  <Card 
                    key={item.id} 
                    className="p-4 hover:border-primary/50 cursor-pointer transition-all flex items-center justify-between"
                    onClick={() => handleSecureDownload(item)}
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-2.5 bg-primary/10 rounded-full"><Download className="w-5 h-5 text-primary" /></div>
                      <div>
                        <h4 className="font-semibold">{item.title}</h4>
                        <p className="text-xs text-muted-foreground">Downloaded {new Date(item.downloadedAt?.seconds * 1000).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">Open PDF</Button>
                  </Card>
                ))}
            </div>
          </TabsContent>

          <TabsContent value="saved">
             <div className="grid gap-4">{savedNotes.map(n => <NoteCard key={n.id} note={mapFirestoreNoteToCardNote(n)} />)}</div>
          </TabsContent>

          <TabsContent value="contributions">
            <div className="grid gap-4">{contributions.map(c => <ContributionCard key={c.id} contribution={c as Contribution} />)}</div>
          </TabsContent>
        </Tabs>

        {/* Modals */}
        {isOwnProfile && <EditProfileDialog open={editDialogOpen} onOpenChange={setEditDialogOpen} profile={profileData} onSave={handleProfileSave} />}
        <StatDetailModal 
          open={statModalOpen !== null} 
          onClose={() => setStatModalOpen(null)} 
          statType={statModalOpen || "uploads"} 
          value={stats[statModalOpen === "likes" ? "totalLikes" : statModalOpen === "views" ? "totalViews" : statModalOpen === "helped" ? "helpedRequests" : statModalOpen === "score" ? "contributionScore" : "uploads"] || 0} 
          isOwner={isOwnProfile} 
        />
      </div>
    </MainLayout>
  );
}

function StatItem({ icon: Icon, label, value, onClick }: any) {
  return (
    <Card className="bg-card border-border hover:border-primary/40 transition-all cursor-pointer shadow-sm group" onClick={onClick}>
      <CardContent className="pt-5 pb-4 px-2 text-center">
        <Icon className="w-7 h-7 mx-auto text-primary mb-2 group-hover:scale-110 transition-transform" />
        <p className="text-2xl font-extrabold">{value.toLocaleString()}</p>
        <p className="text-[10px] uppercase tracking-widest text-muted-foreground mt-1">{label}</p>
      </CardContent>
    </Card>
  );
}
