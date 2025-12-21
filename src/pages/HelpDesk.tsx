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
import { Card, CardContent } from "@/components/ui/card";
import { Plus, FileText, Image, Video, Clock, CheckCircle2, TrendingUp, Users } from "lucide-react";
import { TopContributors } from "@/components/helpdesk/TopContributors";
import { useNavigate } from "react-router-dom";
import { useHelpRequests, HelpRequest } from "@/contexts/HelpRequestsContext";

export default function HelpDesk() {
  const navigate = useNavigate();
  const { requests, loading, addRequest, closeRequest } = useHelpRequests();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    subject: "",
    branch: "",
    year: "",
  });

  const openRequests = requests.filter((r) => r.status === "open" || r.status === "in_progress");
  const fulfilledRequests = requests.filter((r) => r.status === "fulfilled" || r.status === "closed");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return; // Prevent double submission
    
    setIsSubmitting(true);
    try {
      await addRequest({
        title: formData.title,
        description: formData.description,
        subject: formData.subject.toUpperCase(),
        branch: formData.branch.toUpperCase(),
        year: formData.year === "1" ? "1st Year" : formData.year === "2" ? "2nd Year" : formData.year === "3" ? "3rd Year" : "4th Year",
      });
      
      setDialogOpen(false);
      setFormData({ title: "", description: "", subject: "", branch: "", year: "" });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Transform HelpRequest to RequestCard format
  const transformRequest = (request: HelpRequest) => ({
    id: request.id,
    title: request.title,
    description: request.description,
    subject: request.subject,
    branch: request.branch,
    year: request.year,
    requestType: "pdf" as const,
    status:
      request.status === "in_progress"
        ? ("open" as const)
        : request.status === "closed"
          ? ("fulfilled" as const)
          : (request.status as "open" | "fulfilled" | "urgent"),
    requestedBy: request.requesterName,
    requestedById: request.requesterId,
    timestamp: request.createdAt,
    helpersCount: request.contributionsCount,
    likes: request.likes || [],
    commentsCount: request.commentsCount || 0,
  });

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
                  <Label htmlFor="req-title">Title *</Label>
                  <Input
                    id="req-title"
                    placeholder="e.g., Need OS Unit-3 PDF"
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
                      <SelectItem value="DSA">DSA</SelectItem>
                      <SelectItem value="OS">OS</SelectItem>
                      <SelectItem value="DBMS">DBMS</SelectItem>
                      <SelectItem value="CN">CN</SelectItem>
                      <SelectItem value="ML">ML</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
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
                      <SelectItem value="CSE">CSE</SelectItem>
                      <SelectItem value="ECE">ECE</SelectItem>
                      <SelectItem value="EEE">EEE</SelectItem>
                      <SelectItem value="ME">ME</SelectItem>
                      <SelectItem value="CE">CE</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
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
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  {isSubmitting ? "Posting..." : "Post Request"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Top Contributors of the Week */}
        <TopContributors onViewProfile={(userId) => navigate(`/profile/${userId}`)} />

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card className="bg-card border-border">
            <CardContent className="pt-4 text-center">
              <TrendingUp className="w-6 h-6 mx-auto text-primary mb-2" />
              <p className="text-2xl font-bold text-foreground">{requests.length}</p>
              <p className="text-xs text-muted-foreground">Total Requests</p>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="pt-4 text-center">
              <Clock className="w-6 h-6 mx-auto text-primary mb-2" />
              <p className="text-2xl font-bold text-foreground">{openRequests.length}</p>
              <p className="text-xs text-muted-foreground">Open</p>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="pt-4 text-center">
              <CheckCircle2 className="w-6 h-6 mx-auto text-chart-1 mb-2" />
              <p className="text-2xl font-bold text-foreground">{fulfilledRequests.length}</p>
              <p className="text-xs text-muted-foreground">Fulfilled</p>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="pt-4 text-center">
              <Users className="w-6 h-6 mx-auto text-chart-2 mb-2" />
              <p className="text-2xl font-bold text-foreground">{requests.reduce((acc, r) => acc + r.contributionsCount, 0)}</p>
              <p className="text-xs text-muted-foreground">Contributions</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="open" className="space-y-4">
          <TabsList className="bg-muted">
            <TabsTrigger value="open" className="gap-1.5 data-[state=active]:bg-card">
              <Clock className="w-4 h-4" />
              Open ({openRequests.length})
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
                <RequestCard 
                  key={request.id} 
                  request={transformRequest(request)} 
                  onMarkFulfilled={closeRequest}
                />
              ))
            ) : (
              <EmptyState 
                type="requests" 
                title="No open requests"
                description="Create a request to get help from your peers!"
              />
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
                <RequestCard 
                  key={request.id} 
                  request={transformRequest(request)} 
                  onMarkFulfilled={closeRequest}
                />
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
