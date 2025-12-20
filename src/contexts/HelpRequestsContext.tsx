import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { helpRequestsService, HelpRequest } from "@/services/firestoreService";

// Re-export HelpRequest type
export type { HelpRequest } from "@/services/firestoreService";

interface HelpRequestsContextType {
  requests: HelpRequest[];
  loading: boolean;
  addRequest: (request: { title: string; description: string; subject: string; branch: string; year: string }) => Promise<void>;
  closeRequest: (requestId: string) => Promise<void>;
  getUserRequests: (userId: string) => HelpRequest[];
  refreshRequests: () => Promise<void>;
}

const HelpRequestsContext = createContext<HelpRequestsContextType | undefined>(undefined);

export function HelpRequestsProvider({ children }: { children: ReactNode }) {
  const { userProfile } = useAuth();
  const [requests, setRequests] = useState<HelpRequest[]>([]);
  const [loading, setLoading] = useState(true);

  // Load requests from Firestore
  const fetchRequests = useCallback(async () => {
    try {
      const fetchedRequests = await helpRequestsService.getAll();
      setRequests(fetchedRequests);
    } catch (error) {
      console.error("Error loading help requests:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const addRequest = useCallback(async (request: { title: string; description: string; subject: string; branch: string; year: string }) => {
    if (!userProfile) {
      toast({
        title: "Please log in",
        description: "You need to be logged in to create a request.",
        variant: "destructive",
      });
      return;
    }

    try {
      const requestId = await helpRequestsService.create({
        ...request,
        requesterId: userProfile.id,
        requesterName: userProfile.name,
        requesterUsername: userProfile.username,
      });
      
      // Fetch the new request and add to state
      const newRequest: HelpRequest = {
        id: requestId,
        ...request,
        requesterId: userProfile.id,
        requesterName: userProfile.name,
        requesterUsername: userProfile.username,
        status: 'open',
        contributionsCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      setRequests(prev => [newRequest, ...prev]);
      toast({
        title: "Request created!",
        description: "Your request has been posted. Others can now help you.",
      });
    } catch (error) {
      console.error("Error creating request:", error);
      toast({
        title: "Error",
        description: "Failed to create request. Please try again.",
        variant: "destructive",
      });
    }
  }, [userProfile]);

  const closeRequest = useCallback(async (requestId: string) => {
    try {
      await helpRequestsService.updateStatus(requestId, "fulfilled");
      setRequests(prev => prev.map(r => 
        r.id === requestId ? { ...r, status: "fulfilled" as const } : r
      ));
      toast({
        title: "Request closed",
        description: "Your request has been marked as fulfilled.",
      });
    } catch (error) {
      console.error("Error closing request:", error);
      toast({
        title: "Error",
        description: "Failed to close request. Please try again.",
        variant: "destructive",
      });
    }
  }, []);

  const getUserRequests = useCallback((userId: string) => {
    return requests.filter(r => r.requesterId === userId);
  }, [requests]);

  const refreshRequests = useCallback(async () => {
    setLoading(true);
    await fetchRequests();
  }, [fetchRequests]);

  return (
    <HelpRequestsContext.Provider value={{ requests, loading, addRequest, closeRequest, getUserRequests, refreshRequests }}>
      {children}
    </HelpRequestsContext.Provider>
  );
}

export function useHelpRequests() {
  const context = useContext(HelpRequestsContext);
  if (!context) {
    throw new Error("useHelpRequests must be used within a HelpRequestsProvider");
  }
  return context;
}
