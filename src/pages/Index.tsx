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

const mockNotes = [
  {
    id: "1",
    title: "Data Structures and Algorithms - Complete Notes Unit 1-5",
    subject: "DSA",
    branch: "CSE",
    year: "2nd Year",
    fileType: "pdf" as const,
    likes: 245,
    dislikes: 12,
    views: 1520,
    author: "Priya Sharma",
    timestamp: "2 hours ago",
    topic: "Unit 1-5",
    isTrusted: true,
  },
  {
    id: "2",
    title: "Operating Systems - Process Scheduling Diagrams",
    subject: "OS",
    branch: "CSE",
    year: "3rd Year",
    fileType: "image" as const,
    likes: 189,
    dislikes: 8,
    views: 890,
    author: "Rahul Verma",
    timestamp: "5 hours ago",
    topic: "Process Scheduling",
    isTrusted: false,
  },
  {
    id: "3",
    title: "DBMS - Normalization Explained Video Tutorial",
    subject: "DBMS",
    branch: "CSE",
    year: "2nd Year",
    fileType: "video" as const,
    likes: 312,
    dislikes: 15,
    views: 2100,
    author: "Ankit Kumar",
    timestamp: "1 day ago",
    topic: "Normalization",
    isTrusted: true,
  },
  {
    id: "4",
    title: "Computer Networks - OSI Model Reference",
    subject: "CN",
    branch: "CSE",
    year: "3rd Year",
    fileType: "link" as const,
    likes: 156,
    dislikes: 5,
    views: 680,
    author: "Sneha Patel",
    timestamp: "2 days ago",
    isTrusted: false,
  },
  {
    id: "5",
    title: "Machine Learning - Linear Regression Notes",
    subject: "ML",
    branch: "CSE",
    year: "4th Year",
    fileType: "pdf" as const,
    likes: 278,
    dislikes: 9,
    views: 1340,
    author: "Vikash Singh",
    timestamp: "3 days ago",
    topic: "Linear Regression",
    isTrusted: true,
  },
  {
    id: "6",
    title: "Digital Electronics - Logic Gates Diagrams",
    subject: "DE",
    branch: "ECE",
    year: "2nd Year",
    fileType: "image" as const,
    likes: 134,
    dislikes: 6,
    views: 720,
    author: "Meera Gupta",
    timestamp: "4 days ago",
    topic: "Logic Gates",
    isTrusted: false,
  },
];

const recommendedNotes = [
  {
    id: "r1",
    title: "DSA - Quick Revision Notes for Exams",
    subject: "DSA",
    branch: "CSE",
    year: "2nd Year",
    fileType: "pdf" as const,
    likes: 189,
    dislikes: 4,
    views: 1200,
    author: "Top Contributor",
    timestamp: "1 day ago",
    topic: "Quick Revision",
  },
  {
    id: "r2",
    title: "OS - Interview Questions Collection",
    subject: "OS",
    branch: "CSE",
    year: "3rd Year",
    fileType: "pdf" as const,
    likes: 256,
    dislikes: 8,
    views: 980,
    author: "Placement Cell",
    timestamp: "2 days ago",
    topic: "Interviews",
  },
] as typeof mockNotes;

export default function Index() {
  const [selectedBranch, setSelectedBranch] = useState<string>("all");
  const [selectedYear, setSelectedYear] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [selectedNote, setSelectedNote] = useState<typeof mockNotes[0] | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("trending");

  // Simulate loading
  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1200);
    return () => clearTimeout(timer);
  }, []);

  const filteredNotes = mockNotes.filter((note) => {
    if (selectedBranch !== "all" && note.branch !== selectedBranch) return false;
    if (selectedYear !== "all" && note.year !== selectedYear) return false;
    return true;
  });

  // Sort notes based on active tab
  const sortedNotes = [...filteredNotes].sort((a, b) => {
    if (activeTab === "trending") return b.views - a.views;
    if (activeTab === "top") return b.likes - a.likes;
    return 0; // latest - keep original order
  });

  const handleExpand = (note: typeof mockNotes[0]) => {
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
        {!loading && (
          <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20 mb-6">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                Recommended for You
                <Badge variant="outline" className="ml-2 border-primary/30 text-primary">
                  AI Powered
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                {recommendedNotes.map((note) => (
                  <NoteCard 
                    key={note.id} 
                    note={note} 
                    onExpand={() => handleExpand(note)}
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
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Quality Indicator Legend */}
        <div className="flex items-center gap-4 mb-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Award className="w-4 h-4 text-primary" />
            <span>Trusted Contributor</span>
          </div>
          <div className="flex items-center gap-1">
            <BookOpen className="w-4 h-4" />
            <span>Faculty Verified</span>
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
                note={note} 
                onExpand={() => handleExpand(note)}
              />
            ))}
          </div>
        ) : (
          <EmptyState type="notes" />
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
