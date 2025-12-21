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
import { usersService, notesService, Note, contributionsService, helpRequestsService, achievementsService } from "@/services/firestoreService";
import { mapFirestoreNoteToCardNote } from "@/lib/noteCard";
import { parseSocialLink } from "@/lib/socialLinks";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
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
  const { userProfile: currentUser, updateUserProfile } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState<UserProfile | null>(null);
  const [uploadedNotes, setUploadedNotes] = useState<Note[]>([]);
  const [savedNotes, setSavedNotes] = useState<Note[]>([]);
  const [downloadedNotes, setDownloadedNotes] = useState<any[]>([]);
  const [contributions, setContributions] = useState<any[]>([]);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [statModalOpen, setStatModalOpen] = useState<"uploads" | "likes" | "views" | "helped" | "score" | null>(null);

  // Determine if viewing own profile or someone else's
  const isOwnProfile = !userId || userId === "current-user" || userId === currentUser?.id;
  const targetUserId = isOwnProfile ? currentUser?.id : userId;

  // Load profile data
  useEffect(() => {
    const loadProfile = async () => {
      setLoading(true);
      try {
        if (isOwnProfile && currentUser) {
          setProfileData(currentUser);
        } else if (targetUserId) {
          let profile = await usersService.getById(targetUserId);
          if (!profile) {
            profile = await usersService.getByUsername(targetUserId);
          }
          setProfileData(profile);
        }
      } catch (error) {
        console.error("Error loading profile:", error);
      }
    };

    loadProfile();
  }, [isOwnProfile, currentUser, targetUserId]);

  // Load user content
  useEffect(() => {
    const loadContent = async () => {
      if (!profileData?.id) return;

      try {
        const [notes, saved, contribs] = await Promise.all([
          notesService.getByUser(profileData.id),
          isOwnProfile ? notesService.getSavedNotes(profileData.id) : Promise.resolve([]),
          contributionsService.getByUser(profileData.id),
        ]);

        setUploadedNotes(notes);
        setSavedNotes(saved);
        setContributions(contribs);
        
        // Load downloaded notes from localStorage (only for own profile)
        if (isOwnProfile) {
          const downloaded = JSON.parse(localStorage.getItem("notehall_downloaded_notes") || "[]");
          setDownloadedNotes(downloaded);
        }
      } catch (error) {
        console.error("Error loading content:", error);
      } finally {
        setLoading(false);
      }
    };

    loadContent();
  }, [profileData?.id, isOwnProfile]);

  const handleProfileSave = async (updatedProfile: any) => {
    await updateUserProfile(updatedProfile);
    setProfileData(prev => prev ? { ...prev, ...updatedProfile } : null);
  };

  const currentStreakBadge = streakBadges.filter(b => (profileData?.streak || 0) >= b.days).pop();
  
  // Convert earned achievements to display format
  const earnedAchievementsList = profileData?.stats ? achievementsService.checkAchievements(profileData.stats, profileData.streak || 0) : [];
  const displayAchievements: Achievement[] = earnedAchievementsList.map(a => ({
    id: a.id,
    title: a.label,
    description: a.description,
    icon: a.icon,
    color: a.color,
    earnedAt: new Date().toISOString(),
  }));

  if (!profileData && !loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Profile not found</p>
        </div>
      </MainLayout>
    );
  }

  const stats = profileData?.stats || { uploads: 0, totalLikes: 0, totalViews: 0, helpedRequests: 0, contributionScore: 0 };

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
                  <AvatarImage src={profileData?.avatar} />
                  <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                    {profileData?.name?.split(" ").map((n: string) => n[0]).join("") || "?"}
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
                  <Button variant="outline" size="sm" className="mt-3 gap-1">
                    <Share2 className="w-3 h-3" />
                    Share Profile
                  </Button>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 text-center sm:text-left">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <h1 className="text-2xl font-bold text-foreground">{profileData?.name}</h1>
                  {profileData?.badges?.map((badge: any) => {
                    const IconComponent = getBadgeIcon(badge.icon);
                    return (
                      <Badge key={badge.id} className={badge.color}>
                        <IconComponent className="w-3 h-3 mr-1" />
                        {badge.label}
                      </Badge>
                    );
                  })}
                  {currentStreakBadge && (
                    <Badge className={currentStreakBadge.color}>
                      <Flame className="w-3 h-3 mr-1" />
                      {currentStreakBadge.label}
                    </Badge>
                  )}
                </div>
                <p className="text-muted-foreground mt-1">{profileData?.bio}</p>
                
                {(profileData?.streak || 0) > 0 && (
                  <div className="flex items-center justify-center sm:justify-start gap-2 mt-2">
                    <Flame className="w-4 h-4 text-orange-500" />
                    <span className="text-sm font-medium text-foreground">{profileData?.streak} day streak!</span>
                  </div>
                )}
                
                <div className="flex flex-wrap justify-center sm:justify-start gap-4 mt-4 text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">{profileData?.college || "No college set"}</span>
                  <span>•</span>
                  <span>{profileData?.branch || "No branch"}</span>
                  <span>•</span>
                  <span>{profileData?.year || "No year"}</span>
                </div>

                {/* Social Links */}
                <div className="flex flex-wrap justify-center sm:justify-start gap-2 mt-4">
                  {profileData?.github && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="gap-1.5"
                      onClick={() => window.open(parseSocialLink(profileData.github, 'github'), '_blank', 'noopener,noreferrer')}
                    >
                      <Github className="w-4 h-4" />
                      GitHub
                    </Button>
                  )}
                  {profileData?.linkedin && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="gap-1.5"
                      onClick={() => window.open(parseSocialLink(profileData.linkedin, 'linkedin'), '_blank', 'noopener,noreferrer')}
                    >
                      <Linkedin className="w-4 h-4" />
                      LinkedIn
                    </Button>
                  )}
                  {profileData?.portfolio && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="gap-1.5"
                      onClick={() => window.open(parseSocialLink(profileData.portfolio, 'portfolio'), '_blank', 'noopener,noreferrer')}
                    >
                      <Globe className="w-4 h-4" />
                      Portfolio
                    </Button>
                  )}
                  {profileData?.instagram && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="gap-1.5"
                      onClick={() => window.open(parseSocialLink(profileData.instagram, 'instagram'), '_blank', 'noopener,noreferrer')}
                    >
                      <Instagram className="w-4 h-4" />
                    </Button>
                  )}
                  {profileData?.twitter && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="gap-1.5"
                      onClick={() => window.open(parseSocialLink(profileData.twitter, 'twitter'), '_blank', 'noopener,noreferrer')}
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
                  <HandHelping className="w-6 h-6 mx-auto text-primary mb-2" />
                  <p className="text-2xl font-bold text-foreground">{stats.helpedRequests}</p>
                  <p className="text-xs text-muted-foreground">Helped</p>
                </CardContent>
              </Card>
              <Card 
                className="bg-card border-border group hover:border-primary/30 transition-colors cursor-pointer"
                onClick={() => setStatModalOpen("score")}
              >
                <CardContent className="pt-4 text-center">
                  <BarChart3 className="w-6 h-6 mx-auto text-primary mb-2" />
                  <p className="text-2xl font-bold text-foreground">{stats.contributionScore}</p>
                  <p className="text-xs text-muted-foreground">Score</p>
                </CardContent>
              </Card>
            </>
          )}
        </div>

        {/* Achievements Section */}
        <AchievementsSection 
          achievements={displayAchievements}
          isOwner={isOwnProfile}
        />

        {/* Tabs */}
        <Tabs defaultValue="uploads" className="mt-6">
          <TabsList className="bg-muted mb-4">
            <TabsTrigger value="uploads" className="gap-2 data-[state=active]:bg-card">
              <FileText className="w-4 h-4" />
              Uploads ({uploadedNotes.length})
            </TabsTrigger>
            {isOwnProfile && (
              <TabsTrigger value="saved" className="gap-2 data-[state=active]:bg-card">
                <Bookmark className="w-4 h-4" />
                Saved ({savedNotes.length})
              </TabsTrigger>
            )}
            {isOwnProfile && (
              <TabsTrigger value="downloaded" className="gap-2 data-[state=active]:bg-card">
                <Download className="w-4 h-4" />
                Downloaded ({downloadedNotes.length})
              </TabsTrigger>
            )}
            <TabsTrigger value="contributions" className="gap-2 data-[state=active]:bg-card">
              <HandHelping className="w-4 h-4" />
              Contributions ({contributions.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="uploads">
            {loading ? (
              <div className="grid gap-4">
                <NoteCardSkeleton />
                <NoteCardSkeleton />
              </div>
            ) : uploadedNotes.length === 0 ? (
              <EmptyState
                type="notes"
                title="No uploads yet"
                description={isOwnProfile ? "Share your first note with the community!" : "This user hasn't uploaded any notes yet."}
              />
            ) : (
              <div className="grid gap-4">
                {uploadedNotes.map((note) => (
                  <NoteCard
                    key={note.id}
                    note={mapFirestoreNoteToCardNote(note)}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          {isOwnProfile && (
            <TabsContent value="saved">
              {loading ? (
                <div className="grid gap-4">
                  <NoteCardSkeleton />
                </div>
              ) : savedNotes.length === 0 ? (
                <EmptyState
                  type="saved"
                  title="No saved notes"
                  description="Save notes you want to revisit later!"
                />
              ) : (
                <div className="grid gap-4">
                  {savedNotes.map((note) => (
                    <NoteCard
                      key={note.id}
                      note={mapFirestoreNoteToCardNote(note)}
                    />
                  ))}
                </div>
              )}
            </TabsContent>
          )}

          <TabsContent value="contributions">
            {loading ? (
              <div className="space-y-4">
                <NoteCardSkeleton />
              </div>
            ) : contributions.length === 0 ? (
              <EmptyState
                type="helped"
                title="No contributions yet"
                description={isOwnProfile ? "Help others by contributing to help requests!" : "This user hasn't contributed yet."}
              />
            ) : (
              <div className="space-y-4">
                {contributions.map((contrib) => {
                  const contribution: Contribution = {
                    id: contrib.id,
                    type: contrib.type,
                    message: contrib.content,
                    contributorId: contrib.contributorId,
                    contributorName: contrib.contributorName,
                    timestamp: contrib.createdAt?.toDate?.()?.toLocaleDateString() || "Recently",
                    likes: 0,
                    fileName: contrib.fileUrl ? "Attached file" : undefined,
                    link: contrib.type === 'link' ? contrib.content : undefined,
                  };
                  return (
                    <ContributionCard
                      key={contrib.id}
                      contribution={contribution}
                      onViewProfile={(id) => navigate(`/profile/${id}`)}
                    />
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Modals */}
        {profileData && (
          <EditProfileDialog
            open={editDialogOpen}
            onOpenChange={setEditDialogOpen}
            profile={{
              name: profileData.name,
              bio: profileData.bio,
              college: profileData.college,
              branch: profileData.branch,
              year: profileData.year,
              degree: profileData.degree,
              avatar: profileData.avatar,
              github: profileData.github,
              linkedin: profileData.linkedin,
              portfolio: profileData.portfolio,
              instagram: profileData.instagram,
              twitter: profileData.twitter,
            }}
            onSave={handleProfileSave}
          />
        )}

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
      </div>
    </MainLayout>
  );
}
