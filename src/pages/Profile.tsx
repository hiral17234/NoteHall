import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { NoteCard } from "@/components/notes/NoteCard";
import { NoteCardSkeleton, ProfileStatsSkeleton } from "@/components/ui/skeleton-card";
import { EmptyState } from "@/components/ui/empty-state";
import { EditProfileDialog } from "@/components/profile/EditProfileDialog";
import { ContributionCard } from "@/components/helpdesk/ContributionCard";
import { StatDetailModal, AchievementsSection } from "@/components/profile/StatDetailModal";
import { HelloWaveIcon } from "@/components/profile/HelloWaveIcon";
import { useAuth } from "@/contexts/AuthContext";
import { 
  usersService, 
  notesService, 
  Note, 
  contributionsService, 
  achievementsService, 
  UserProfile,
  Contribution,
  AchievementBadge,
  helpRequestsService
} from "@/services/firestoreService";
import { mapFirestoreNoteToCardNote } from "@/lib/noteCard";
import { parseSocialLink } from "@/lib/socialLinks";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { db } from "@/lib/firebase";
import { collection, query, where, onSnapshot, orderBy, limit, getDocs } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { 
  Edit2, Github, Linkedin, Globe, FileText, HandHelping, BarChart3,
  ThumbsUp, Eye, Award, Flame, ArrowLeft, Share2, Calendar, MapPin,
  History, Star, TrendingUp, ShieldCheck, Trophy, ExternalLink
} from "lucide-react";

export default function Profile() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { userProfile: currentUser, updateUserProfile } = useAuth();
  
  // --- STATE MANAGEMENT ---
  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState<UserProfile | null>(null);
  const [uploadedNotes, setUploadedNotes] = useState<Note[]>([]);
  const [savedNotes, setSavedNotes] = useState<Note[]>([]);
  const [downloadedNotes, setDownloadedNotes] = useState<any[]>([]);
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [activeTab, setActiveTab] = useState("uploads");
  const [totalUploadCount, setTotalUploadCount] = useState(0);
  
  // Dialog/Modal States
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [statModalOpen, setStatModalOpen] = useState<string | null>(null);
  
  // Live Computed Stats
  const [liveStats, setLiveStats] = useState({ uploads: 0, totalLikes: 0, totalViews: 0 });
  const [helpedCount, setHelpedCount] = useState(0);

  const isOwnProfile = useMemo(() => 
    !userId || userId === "current-user" || userId === currentUser?.id, 
    [userId, currentUser?.id]
  );
  
  const targetUserId = isOwnProfile ? currentUser?.id : userId;

  // --- REAL-TIME SUBSCRIPTIONS ---
  useEffect(() => {
    if (!targetUserId) return;

    setLoading(true);

    // 1. Subscribe to User Document (Name, Bio, Streak)
    const unsubProfile = usersService.subscribeToProfile(targetUserId, (data) => {
      if (data) setProfileData(data);
      setLoading(false);
    });

    // 2. Subscribe to Live Aggregate Stats (Auto-calculates from all notes)
    const unsubComputed = usersService.subscribeToComputedStats(targetUserId, (stats) => {
      setLiveStats(stats);
    });

    // 3. Subscribe to Help Contributions Count
    const unsubHelped = usersService.subscribeToHelpedCount(targetUserId, (count) => {
      setHelpedCount(count);
    });

    // 4. Subscribe to Uploaded Notes
    const qNotes = query(
      collection(db, "notes"), 
      where("authorId", "==", targetUserId), 
      orderBy("createdAt", "desc")
    );
    const unsubNotes = onSnapshot(
      qNotes, 
      (snap) => {
        setUploadedNotes(snap.docs.map(d => ({ id: d.id, ...d.data() } as Note)));
      },
      (error) => {
        console.error("Real-time notes error:", error?.code || error);
      }
    );

    // 5. Subscribe to Contributions (Help Desk interactions)
    const unsubContribs = contributionsService.subscribeToUserContributions(targetUserId, (data) => {
      setContributions(data);
    });

    // 6. User-Specific Private Data
    let unsubSaved = () => {};
    let unsubDownloads = () => {};

    if (isOwnProfile) {
      unsubSaved = usersService.subscribeToSavedNotes(targetUserId, async (refs) => {
        const notePromises = refs.map(r => notesService.getById(r.noteId));
        const results = await Promise.all(notePromises);
        setSavedNotes(results.filter((n): n is Note => n !== null));
      });

      unsubDownloads = usersService.subscribeToDownloadedNotes(targetUserId, (data) => {
        const sorted = data.sort((a, b) => 
          (b.downloadedAt?.seconds || 0) - (a.downloadedAt?.seconds || 0)
        );
        setDownloadedNotes(sorted);
      });
    }

    return () => {
      unsubProfile();
      unsubComputed();
      unsubHelped();
      unsubNotes();
      unsubContribs();
      unsubSaved();
      unsubDownloads();
    };
  }, [targetUserId, isOwnProfile]);

  // Fetch total uploads (notes + contributions to requests)
  useEffect(() => {
    if (!targetUserId) return;
    
    const fetchTotalUploads = async () => {
      try {
        const notesCount = uploadedNotes.length;
        const contribCount = contributions.length;
        setTotalUploadCount(notesCount + contribCount);
      } catch (error) {
        console.error("Error calculating total uploads:", error);
      }
    };
    
    fetchTotalUploads();
  }, [targetUserId, uploadedNotes.length, contributions.length]);

  // --- LOGIC HELPER ---
  const stats = {
    uploads: totalUploadCount || liveStats.uploads,
    totalLikes: liveStats.totalLikes,
    totalViews: liveStats.totalViews,
    helpedRequests: helpedCount,
    contributionScore: profileData?.stats?.contributionScore || 0,
  };

  const earnedAchievements = achievementsService.checkAchievements(stats, profileData?.streak || 0);

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: `${profileData?.name}'s Profile`, url });
      } catch (err) { console.error(err); }
    } else {
      navigator.clipboard.writeText(url);
      toast({ title: "Copied!", description: "Profile link copied to clipboard." });
    }
  };

  // --- RENDER ---
  if (loading) return <MainLayout><div className="max-w-5xl mx-auto px-4 pt-12"><ProfileStatsSkeleton /></div></MainLayout>;
  if (!profileData) return <MainLayout><EmptyState type="search" title="User Not Found" description="This profile may have been removed." /></MainLayout>;

  return (
    <MainLayout>
      <div className="max-w-5xl mx-auto px-4 pb-24 pt-6">
        
        {/* Header Navigation */}
        <div className="flex justify-between items-center mb-8">
          {!isOwnProfile ? (
            <Button variant="ghost" onClick={() => navigate(-1)} className="hover:bg-secondary/50">
              <ArrowLeft className="w-4 h-4 mr-2" /> Back
            </Button>
          ) : <div />}
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleShare} className="rounded-full shadow-sm">
              <Share2 className="w-4 h-4 mr-2" /> Share
            </Button>
          </div>
        </div>

        {/* Profile Info Card */}
        <Card className="relative overflow-hidden border-none shadow-2xl bg-gradient-to-br from-card via-card to-primary/5 mb-8">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary via-blue-500 to-purple-500" />
          <CardContent className="pt-10 pb-8 px-6 sm:px-10">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-8">
              <div className="relative group">
                {/* Hello Wave Icon for other user profiles */}
                {!isOwnProfile && <HelloWaveIcon show={!isOwnProfile} />}
                
                <Avatar className="w-36 h-36 border-4 border-background shadow-2xl transition-transform group-hover:scale-105 duration-300">
                  <AvatarImage src={profileData.avatar} />
                  <AvatarFallback className="bg-primary text-primary-foreground text-4xl font-bold">
                    {profileData.name?.[0]}
                  </AvatarFallback>
                </Avatar>
                <Badge className="absolute -bottom-2 right-4 px-3 py-1 bg-orange-500 hover:bg-orange-600 border-2 border-background shadow-lg flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5 fill-current" />
                  <span className="font-bold">{profileData.streak || 0}</span>
                </Badge>
              </div>

              <div className="flex-1 text-center sm:text-left space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center justify-center sm:justify-start gap-2">
                      <h1 className="text-4xl font-black tracking-tight">{profileData.name}</h1>
                      {stats.contributionScore > 500 && <ShieldCheck className="w-6 h-6 text-blue-500" />}
                    </div>
                    <p className="text-xl font-medium text-primary/80">@{profileData.username}</p>
                  </div>
                  {isOwnProfile && (
                    <Button onClick={() => setEditDialogOpen(true)} className="rounded-full px-8 shadow-lg hover:shadow-primary/20 transition-all">
                      <Edit2 className="w-4 h-4 mr-2" /> Edit Profile
                    </Button>
                  )}
                </div>

                <p className="text-muted-foreground text-lg max-w-2xl leading-relaxed italic">
                  "{profileData.bio || "Aspiring mind sharing knowledge on NoteHall."}"
                </p>

                <div className="flex flex-wrap justify-center sm:justify-start gap-6 text-sm font-medium">
                  <span className="flex items-center gap-2 bg-secondary/50 px-3 py-1.5 rounded-full">
                    <MapPin className="w-4 h-4 text-primary" /> {profileData.college || "Global Learner"}
                  </span>
                  <span className="flex items-center gap-2 bg-secondary/50 px-3 py-1.5 rounded-full">
                    <Globe className="w-4 h-4 text-primary" /> {profileData.branch || "Academic"}
                  </span>
                  <span className="flex items-center gap-2 bg-secondary/50 px-3 py-1.5 rounded-full">
                    <Calendar className="w-4 h-4 text-primary" /> {profileData.year || "Yearly"}
                  </span>
                </div>

                <div className="flex gap-4 pt-4 justify-center sm:justify-start">
                  {profileData.github && (
                    <Button variant="outline" size="sm" className="h-10 px-5 rounded-full" onClick={() => window.open(parseSocialLink(profileData.github!, 'github'), '_blank')}>
                      <Github className="w-4 h-4 mr-2" /> GitHub
                    </Button>
                  )}
                  {profileData.linkedin && (
                    <Button variant="outline" size="sm" className="h-10 px-5 rounded-full" onClick={() => window.open(parseSocialLink(profileData.linkedin!, 'linkedin'), '_blank')}>
                      <Linkedin className="w-4 h-4 mr-2" /> LinkedIn
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Real-time Stats Section */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-10">
          <StatCard icon={FileText} label="Uploads" value={stats.uploads} color="bg-blue-500/10 text-blue-600" onClick={() => setStatModalOpen("uploads")} />
          <StatCard icon={ThumbsUp} label="Likes" value={stats.totalLikes} color="bg-pink-500/10 text-pink-600" onClick={() => setStatModalOpen("likes")} />
          <StatCard icon={Eye} label="Views" value={stats.totalViews} color="bg-indigo-500/10 text-indigo-600" onClick={() => setStatModalOpen("views")} />
          <StatCard icon={HandHelping} label="Helped" value={stats.helpedRequests} color="bg-green-500/10 text-green-600" onClick={() => setStatModalOpen("helped")} />
          <StatCard icon={BarChart3} label="Score" value={stats.contributionScore} color="bg-orange-500/10 text-orange-600" onClick={() => setStatModalOpen("score")} />
        </div>

        {/* Achievements Component */}
        <AchievementsSection achievements={earnedAchievements as any} isOwner={isOwnProfile} />

        {/* Main Content Tabs */}
        <Tabs defaultValue="uploads" onValueChange={setActiveTab} className="mt-12">
          <TabsList className="w-full justify-start overflow-x-auto no-scrollbar bg-transparent border-b rounded-none h-auto p-0 mb-8 space-x-10">
            <TabTrigger value="uploads" label="Uploads" count={uploadedNotes.length} />
            {isOwnProfile && <TabTrigger value="saved" label="Saved" count={savedNotes.length} />}
            <TabTrigger value="contributions" label="Contributions" count={contributions.length} />
            {isOwnProfile && <TabTrigger value="activity" label="Activity" icon={History} />}
          </TabsList>

          <TabsContent value="uploads" className="mt-0">
            {uploadedNotes.length === 0 ? (
              <EmptyState type="notes" title="No notes found" description={isOwnProfile ? "Start by uploading your study materials!" : "This user hasn't shared any notes yet."} />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {uploadedNotes.map(n => <NoteCard key={n.id} note={mapFirestoreNoteToCardNote(n)} />)}
              </div>
            )}
          </TabsContent>

          <TabsContent value="saved">
            {savedNotes.length === 0 ? (
              <EmptyState type="notes" title="Nothing saved" description="Notes you save for later will appear here." />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {savedNotes.map(n => <NoteCard key={n.id} note={mapFirestoreNoteToCardNote(n)} />)}
              </div>
            )}
          </TabsContent>

          <TabsContent value="contributions">
            {contributions.length === 0 ? (
              <EmptyState type="helped" title="No help given yet" description="Helping others with their requests boosts your score!" />
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {contributions.map(c => (
                  <ContributionCard 
                    key={c.id} 
                    contribution={{
                      id: c.id,
                      type: c.type === 'explanation' ? 'link' : c.type,
                      fileName: c.content,
                      contributorId: c.contributorId,
                      contributorName: c.contributorName,
                      timestamp: c.createdAt?.toDate?.()?.toLocaleDateString() || 'Recently',
                      likes: 0,
                    }} 
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="activity">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle className="text-lg">Download History</CardTitle>
                  <CardDescription>Recently downloaded study materials</CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[400px] pr-4">
                    {downloadedNotes.length === 0 ? <p className="text-sm text-muted-foreground">No recent downloads.</p> : (
                      <div className="space-y-6">
                        {downloadedNotes.map((item, idx) => (
                          <div key={idx} className="flex items-center justify-between group">
                            <div className="flex items-center gap-4">
                              <div className="p-2.5 bg-secondary rounded-xl group-hover:bg-primary/10 transition-colors">
                                <DownloadIcon className="w-5 h-5 text-primary" />
                              </div>
                              <div>
                                <p className="font-bold text-sm leading-none mb-1">{item.title}</p>
                                <p className="text-xs text-muted-foreground">{item.subject} • {new Date(item.downloadedAt?.seconds * 1000).toLocaleDateString()}</p>
                              </div>
                            </div>
                            <Button variant="ghost" size="icon" onClick={() => window.open(item.fileUrl, '_blank')}>
                              <ExternalLink className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                   <div className="p-4 bg-primary/5 rounded-2xl flex items-center justify-between">
                      <div className="flex items-center gap-2 font-bold text-sm"><Star className="w-4 h-4 text-yellow-500 fill-yellow-500" /> Rank</div>
                      <Badge variant="outline">#{(stats.contributionScore / 10).toFixed(0)} Learner</Badge>
                   </div>
                   <div className="p-4 bg-primary/5 rounded-2xl flex items-center justify-between">
                      <div className="flex items-center gap-2 font-bold text-sm"><TrendingUp className="w-4 h-4 text-green-500" /> Growth</div>
                      <span className="text-sm font-bold text-green-600">+{stats.uploads * 5}%</span>
                   </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Modal Components */}
        {isOwnProfile && profileData && (
          <EditProfileDialog 
            open={editDialogOpen} 
            onOpenChange={setEditDialogOpen} 
            profile={{
              name: profileData.name || '',
              bio: profileData.bio || '',
              college: profileData.college || '',
              branch: profileData.branch || '',
              year: profileData.year || '',
              degree: (profileData as any).degree || '',
              avatar: profileData.avatar || '',
              github: profileData.github || '',
              linkedin: profileData.linkedin || '',
              portfolio: (profileData as any).portfolio || '',
              instagram: (profileData as any).instagram || '',
              twitter: (profileData as any).twitter || '',
            }} 
            onSave={updateUserProfile} 
          />
        )}
        
        <StatDetailModal 
          open={statModalOpen !== null} 
          onClose={() => setStatModalOpen(null)} 
          statType={(statModalOpen as "uploads" | "likes" | "views" | "helped" | "score") || "uploads"} 
          value={(stats as any)[statModalOpen || "uploads"]}
          isOwner={isOwnProfile} 
        />
      </div>

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .tab-btn {
          position: relative;
          background: transparent !important;
          border-radius: 0;
          border-bottom: 2px solid transparent;
          padding-bottom: 12px;
          color: hsl(var(--muted-foreground));
          transition: all 0.2s;
        }
        .tab-btn[data-state="active"] {
          color: hsl(var(--primary));
          border-bottom-color: hsl(var(--primary));
          font-weight: 700;
        }
      `}</style>
    </MainLayout>
  );
}

// --- SUB-COMPONENTS ---

function TabTrigger({ value, label, count, icon: Icon }: any) {
  return (
    <TabsTrigger value={value} className="tab-btn px-0 gap-2 font-semibold">
      {Icon && <Icon className="w-4 h-4" />}
      {label}
      {count !== undefined && (
        <Badge variant="secondary" className="ml-1 text-[10px] h-4 px-1 rounded-sm opacity-70">
          {count}
        </Badge>
      )}
    </TabsTrigger>
  );
}

function StatCard({ icon: Icon, label, value, color, onClick }: any) {
  return (
    <Card className="cursor-pointer border-none shadow-sm hover:shadow-md transition-all hover:-translate-y-1 bg-card/60" onClick={onClick}>
      <CardContent className="p-5 text-center flex flex-col items-center">
        <div className={`p-3 rounded-2xl mb-3 ${color}`}>
          <Icon className="w-6 h-6" />
        </div>
        <p className="text-2xl font-black tracking-tight leading-tight">{value.toLocaleString()}</p>
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-1">{label}</p>
      </CardContent>
    </Card>
  );
}

function DownloadIcon(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/>
    </svg>
  );
}
