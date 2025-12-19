import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { toast } from "@/hooks/use-toast";

export interface HelpRequest {
  id: string;
  title: string;
  description: string;
  subject: string;
  branch: string;
  year: string;
  requestType: "pdf" | "image" | "video";
  status: "open" | "urgent" | "fulfilled";
  requestedBy: string;
  requestedById: string;
  timestamp: string;
  helpersCount: number;
  likes: number;
  comments: number;
}

interface HelpRequestsContextType {
  requests: HelpRequest[];
  addRequest: (request: Omit<HelpRequest, "id" | "timestamp" | "helpersCount" | "likes" | "comments" | "status" | "requestedBy" | "requestedById">) => void;
  closeRequest: (requestId: string) => void;
  getUserRequests: (userId: string) => HelpRequest[];
}

const STORAGE_KEY = "notehall_help_requests";

const initialRequests: HelpRequest[] = [
  {
    id: "1",
    title: "DBMS ER Diagram Notes - Unit 2",
    description: "Looking for detailed notes on Entity-Relationship diagrams with examples. Please include cardinality and participation constraints.",
    subject: "DBMS",
    branch: "CSE",
    year: "2nd Year",
    requestType: "pdf",
    status: "urgent",
    requestedBy: "Amit Sharma",
    requestedById: "user-2",
    timestamp: "3 hours ago",
    helpersCount: 2,
    likes: 15,
    comments: 4,
  },
  {
    id: "2",
    title: "Computer Networks - TCP/IP Diagrams",
    description: "Need clear diagrams showing TCP/IP protocol stack and how data flows through each layer.",
    subject: "CN",
    branch: "CSE",
    year: "3rd Year",
    requestType: "image",
    status: "open",
    requestedBy: "Priya Patel",
    requestedById: "user-3",
    timestamp: "5 hours ago",
    helpersCount: 0,
    likes: 8,
    comments: 2,
  },
  {
    id: "3",
    title: "Operating Systems - Process Synchronization Video",
    description: "Looking for a video explanation of semaphores and mutex with real-world examples.",
    subject: "OS",
    branch: "CSE",
    year: "3rd Year",
    requestType: "video",
    status: "fulfilled",
    requestedBy: "Rahul Verma",
    requestedById: "user-4",
    timestamp: "1 day ago",
    helpersCount: 3,
    likes: 24,
    comments: 7,
  },
  {
    id: "4",
    title: "Data Structures - AVL Tree Implementation",
    description: "Need PDF with step-by-step AVL tree insertion and deletion with rotations explained.",
    subject: "DSA",
    branch: "CSE",
    year: "2nd Year",
    requestType: "pdf",
    status: "open",
    requestedBy: "Sneha Gupta",
    requestedById: "user-5",
    timestamp: "2 days ago",
    helpersCount: 1,
    likes: 12,
    comments: 3,
  },
  {
    id: "5",
    title: "Machine Learning - Neural Network Basics",
    description: "Need simple notes explaining neural networks for beginners with diagrams.",
    subject: "ML",
    branch: "CSE",
    year: "4th Year",
    requestType: "pdf",
    status: "open",
    requestedBy: "Vikash Kumar",
    requestedById: "user-6",
    timestamp: "3 days ago",
    helpersCount: 0,
    likes: 18,
    comments: 5,
  },
];

const HelpRequestsContext = createContext<HelpRequestsContextType | undefined>(undefined);

export function HelpRequestsProvider({ children }: { children: ReactNode }) {
  const [requests, setRequests] = useState<HelpRequest[]>([]);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setRequests(JSON.parse(stored));
      } else {
        setRequests(initialRequests);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(initialRequests));
      }
    } catch (error) {
      console.error("Error loading help requests:", error);
      setRequests(initialRequests);
    }
  }, []);

  // Persist to localStorage
  useEffect(() => {
    if (requests.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(requests));
    }
  }, [requests]);

  const addRequest = useCallback((request: Omit<HelpRequest, "id" | "timestamp" | "helpersCount" | "likes" | "comments" | "status" | "requestedBy" | "requestedById">) => {
    const newRequest: HelpRequest = {
      ...request,
      id: `req-${Date.now()}`,
      timestamp: "Just now",
      helpersCount: 0,
      likes: 0,
      comments: 0,
      status: "open",
      requestedBy: "John Doe", // Current user
      requestedById: "current-user",
    };
    
    setRequests(prev => [newRequest, ...prev]);
    toast({
      title: "Request created!",
      description: "Your request has been posted. Others can now help you.",
    });
  }, []);

  const closeRequest = useCallback((requestId: string) => {
    setRequests(prev => prev.map(r => 
      r.id === requestId ? { ...r, status: "fulfilled" as const } : r
    ));
    toast({
      title: "Request closed",
      description: "Your request has been marked as fulfilled.",
    });
  }, []);

  const getUserRequests = useCallback((userId: string) => {
    return requests.filter(r => r.requestedById === userId);
  }, [requests]);

  return (
    <HelpRequestsContext.Provider value={{ requests, addRequest, closeRequest, getUserRequests }}>
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
