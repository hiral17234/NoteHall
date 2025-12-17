import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { NoteCard } from "@/components/notes/NoteCard";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, TrendingUp, Clock, Star } from "lucide-react";
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
  },
];

export default function Index() {
  const [selectedBranch, setSelectedBranch] = useState<string>("all");
  const [selectedYear, setSelectedYear] = useState<string>("all");

  const filteredNotes = mockNotes.filter((note) => {
    if (selectedBranch !== "all" && note.branch !== selectedBranch) return false;
    if (selectedYear !== "all" && note.year !== selectedYear) return false;
    return true;
  });

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

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <Tabs defaultValue="trending" className="flex-1">
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

        {/* Notes Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
          {filteredNotes.map((note) => (
            <NoteCard key={note.id} note={note} />
          ))}
        </div>

        {filteredNotes.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No notes found matching your filters.</p>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
