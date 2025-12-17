import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { RequestCard } from "@/components/helpdesk/RequestCard";
import { RequestCardSkeleton } from "@/components/ui/skeleton-card";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, FileText, Image, Video, Clock, CheckCircle2, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const mockRequests = [
  {
    id: "1",
    title: "DBMS ER Diagram Notes - Unit 2",
    description: "Looking for detailed notes on Entity-Relationship diagrams with examples. Please include cardinality and participation constraints.",
    subject: "DBMS",
    branch: "CSE",
    year: "2nd Year",
    requestType: "pdf" as const,
    status: "urgent" as const,
    requestedBy: "Amit Sharma",
    timestamp: "3 hours ago",
    helpersCount: 2,
  },
  {
    id: "2",
    title: "Computer Networks - TCP/IP Diagrams",
    description: "Need clear diagrams showing TCP/IP protocol stack and how data flows through each layer.",
    subject: "CN",
    branch: "CSE",
    year: "3rd Year",
    requestType: "image" as const,
    status: "open" as const,
    requestedBy: "Priya Patel",
    timestamp: "5 hours ago",
    helpersCount: 0,
  },
  {
    id: "3",
    title: "Operating Systems - Process Synchronization Video",
    description: "Looking for a video explanation of semaphores and mutex with real-world examples.",
    subject: "OS",
    branch: "CSE",
    year: "3rd Year",
    requestType: "video" as const,
    status: "fulfilled" as const,
    requestedBy: "Rahul Verma",
    timestamp: "1 day ago",
    helpersCount: 3,
  },
  {
    id: "4",
    title: "Data Structures - AVL Tree Implementation",
    description: "Need PDF with step-by-step AVL tree insertion and deletion with rotations explained.",
    subject: "DSA",
    branch: "CSE",
    year: "2nd Year",
    requestType: "pdf" as const,
    status: "open" as const,
    requestedBy: "Sneha Gupta",
    timestamp: "2 days ago",
    helpersCount: 1,
  },
];

const requestTypes = [
  { id: "pdf", label: "PDF", icon: FileText },
  { id: "image", label: "Image", icon: Image },
  { id: "video", label: "Video", icon: Video },
];

export default function HelpDesk() {
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedType, setSelectedType] = useState("pdf");
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    subject: "",
    branch: "",
    year: "",
  });

  // Simulate loading
  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  const openRequests = mockRequests.filter((r) => r.status === "open" || r.status === "urgent");
  const fulfilledRequests = mockRequests.filter((r) => r.status === "fulfilled");
  const urgentCount = mockRequests.filter((r) => r.status === "urgent").length;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Request created!",
      description: "Your request has been posted. Others can now help you.",
    });
    setDialogOpen(false);
    setFormData({ title: "", description: "", subject: "", branch: "", year: "" });
  };

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Help Desk</h1>
            <p className="text-muted-foreground">Request or share study materials</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2">
                <Plus className="w-4 h-4" />
                Create Request
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Create New Request</DialogTitle>
                <DialogDescription>
                  Describe what materials you're looking for
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label>Request Type</Label>
                  <div className="flex gap-2">
                    {requestTypes.map((type) => (
                      <button
                        key={type.id}
                        type="button"
                        onClick={() => setSelectedType(type.id)}
                        className={cn(
                          "flex items-center gap-2 px-4 py-2 rounded-lg border transition-all flex-1 justify-center",
                          selectedType === type.id
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border hover:border-primary/50"
                        )}
                      >
                        <type.icon className="w-4 h-4" />
                        <span className="text-sm font-medium">{type.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="req-title">Title *</Label>
                  <Input
                    id="req-title"
                    placeholder="What are you looking for?"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="req-desc">Description</Label>
                  <Textarea
                    id="req-desc"
                    placeholder="Provide more details about what you need..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <Select
                    value={formData.subject}
                    onValueChange={(value) => setFormData({ ...formData, subject: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Subject" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dsa">DSA</SelectItem>
                      <SelectItem value="os">OS</SelectItem>
                      <SelectItem value="dbms">DBMS</SelectItem>
                      <SelectItem value="cn">CN</SelectItem>
                      <SelectItem value="ml">ML</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select
                    value={formData.branch}
                    onValueChange={(value) => setFormData({ ...formData, branch: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Branch" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cse">CSE</SelectItem>
                      <SelectItem value="ece">ECE</SelectItem>
                      <SelectItem value="eee">EEE</SelectItem>
                      <SelectItem value="me">ME</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select
                    value={formData.year}
                    onValueChange={(value) => setFormData({ ...formData, year: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Year" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1st Year</SelectItem>
                      <SelectItem value="2">2nd Year</SelectItem>
                      <SelectItem value="3">3rd Year</SelectItem>
                      <SelectItem value="4">4th Year</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
                  Post Request
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="open" className="space-y-4">
          <TabsList className="bg-muted">
            <TabsTrigger value="open" className="gap-1.5 data-[state=active]:bg-card">
              <Clock className="w-4 h-4" />
              Open ({openRequests.length})
              {urgentCount > 0 && (
                <span className="ml-1 w-5 h-5 rounded-full bg-destructive text-destructive-foreground text-xs flex items-center justify-center">
                  {urgentCount}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="fulfilled" className="gap-1.5 data-[state=active]:bg-card">
              <CheckCircle2 className="w-4 h-4" />
              Fulfilled ({fulfilledRequests.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="open" className="space-y-4">
            {loading ? (
              <>
                <RequestCardSkeleton />
                <RequestCardSkeleton />
                <RequestCardSkeleton />
              </>
            ) : openRequests.length > 0 ? (
              openRequests.map((request) => (
                <RequestCard key={request.id} request={request} />
              ))
            ) : (
              <EmptyState type="requests" />
            )}
          </TabsContent>

          <TabsContent value="fulfilled" className="space-y-4">
            {loading ? (
              <>
                <RequestCardSkeleton />
                <RequestCardSkeleton />
              </>
            ) : fulfilledRequests.length > 0 ? (
              fulfilledRequests.map((request) => (
                <RequestCard key={request.id} request={request} />
              ))
            ) : (
              <EmptyState 
                type="requests" 
                title="No fulfilled requests" 
                description="Requests that have been fulfilled will appear here." 
              />
            )}
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
