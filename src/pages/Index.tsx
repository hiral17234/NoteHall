import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { NoteCard } from "@/components/notes/NoteCard";
import { NoteCardSkeleton } from "@/components/ui/skeleton-card";
import { EmptyState } from "@/components/ui/empty-state";
import { NotePreviewModal } from "@/components/notes/NotePreviewModal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, TrendingUp, Clock, Star, Sparkles, BookOpen, Award } from "lucide-react";
import { Link } from "react-router-dom";
import { notesService, Note } from "@/services/firestoreService";
import { mapFirestoreNoteToCardNote } from "@/lib/noteCard";

export default function Index() {
  const [selectedBranch, setSelectedBranch] = useState<string>("all");
  const [selectedYear, setSelectedYear] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedNote, setSelectedNote] = useState<any>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("trending");

  // Fetch notes from Firestore
  useEffect(() => {
    const fetchNotes = async () => {
      try {
        const fetchedNotes = await notesService.getAll();
        setNotes(fetchedNotes);
      } catch (error) {
        console.error("Error fetching notes:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchNotes();
  }, []);

  const toCardNote = (note: Note) => mapFirestoreNoteToCardNote(note);

  const filteredNotes = notes.filter((note) => {
    if (selectedBranch !== "all" && note.branch !== selectedBranch) return false;
    if (selectedYear !== "all" && note.year !== selectedYear) return false;
    return true;
  });

  // Sort notes based on active tab
  const sortedNotes = [...filteredNotes].sort((a, b) => {
    if (activeTab === "trending") return b.views - a.views;
    if (activeTab === "top") return b.likes - a.likes;
    if (activeTab === "latest") {
      const dateA = a.createdAt?.toDate?.() ?? new Date(0);
      const dateB = b.createdAt?.toDate?.() ?? new Date(0);
      return dateB.getTime() - dateA.getTime();
    }
    return 0;
  });

  // Get recommended notes (top 2 most liked)
  const recommendedNotes = [...notes]
    .sort((a, b) => b.likes - a.likes)
    .slice(0, 2);

  const handleExpand = (note: any) => {
    setSelectedNote(note);
    setPreviewOpen(true);
  };

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Notes Feed</h1>
            <p className="text-muted-foreground">Discover and share study materials</p>
          </div>
          <Link to="/upload">
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2">
              <Plus className="w-4 h-4" />
              Upload Note
            </Button>
          </Link>
        </div>

        {/* Recommended Section */}
        {!loading && recommendedNotes.length > 0 && (
          <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20 mb-6">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                Recommended for You
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                {recommendedNotes.map((note) => (
                  <NoteCard 
                    key={note.id} 
                    note={toCardNote(note)} 
                    onExpand={() => handleExpand(toCardNote(note))}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
            <TabsList className="bg-muted">
              <TabsTrigger value="trending" className="gap-1.5 data-[state=active]:bg-card">
                <TrendingUp className="w-4 h-4" />
                Trending
              </TabsTrigger>
              <TabsTrigger value="latest" className="gap-1.5 data-[state=active]:bg-card">
                <Clock className="w-4 h-4" />
                Latest
              </TabsTrigger>
              <TabsTrigger value="top" className="gap-1.5 data-[state=active]:bg-card">
                <Star className="w-4 h-4" />
                Top Rated
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex gap-2">
            <Select value={selectedBranch} onValueChange={setSelectedBranch}>
              <SelectTrigger className="w-32 bg-card">
                <SelectValue placeholder="Branch" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Branches</SelectItem>
                <SelectItem value="CSE">CSE</SelectItem>
                <SelectItem value="ECE">ECE</SelectItem>
                <SelectItem value="EEE">EEE</SelectItem>
                <SelectItem value="ME">ME</SelectItem>
                <SelectItem value="CE">CE</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger className="w-32 bg-card">
                <SelectValue placeholder="Year" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Years</SelectItem>
                <SelectItem value="1st Year">1st Year</SelectItem>
                <SelectItem value="2nd Year">2nd Year</SelectItem>
                <SelectItem value="3rd Year">3rd Year</SelectItem>
                <SelectItem value="4th Year">4th Year</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Notes Grid */}
        {loading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <NoteCardSkeleton key={i} />
            ))}
          </div>
        ) : sortedNotes.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
            {sortedNotes.map((note) => (
              <NoteCard 
                key={note.id} 
                note={toCardNote(note)} 
                onExpand={() => handleExpand(toCardNote(note))}
              />
            ))}
          </div>
        ) : (
          <EmptyState 
            type="notes" 
            title="No notes yet"
            description="Be the first to upload a note and help your fellow students!"
          />
        )}
      </div>

      {/* Note Preview Modal */}
      <NotePreviewModal
        note={selectedNote}
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
      />
    </MainLayout>
  );
}
