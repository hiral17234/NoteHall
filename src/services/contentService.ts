// Content Service - Handles notes, help requests, contributions
// TODO: Replace with API calls when backend is ready

export interface Note {
  id: string;
  title: string;
  subject: string;
  branch: string;
  year: string;
  fileType: "pdf" | "image" | "video" | "link";
  likes: number;
  dislikes: number;
  views: number;
  saves: number;
  author: {
    id: string;
    name: string;
    avatar?: string;
  };
  timestamp: string;
  createdAt: string;
  unit?: string;
  description?: string;
  fileUrl?: string;
  driveLink?: string;
}

export interface HelpRequest {
  id: string;
  title: string;
  description: string;
  subject: string;
  branch: string;
  year: string;
  requestType: "pdf" | "image" | "video";
  status: "open" | "fulfilled" | "urgent";
  requestedBy: {
    id: string;
    name: string;
    avatar?: string;
  };
  timestamp: string;
  createdAt: string;
  helpersCount: number;
  likes: number;
  comments: number;
  contributions: Contribution[];
}

export interface Contribution {
  id: string;
  type: "pdf" | "image" | "video" | "link";
  fileName?: string;
  link?: string;
  message?: string;
  contributor: {
    id: string;
    name: string;
    avatar?: string;
  };
  timestamp: string;
  likes: number;
  requestId: string;
}

const NOTES_KEY = "notehall_notes";
const REQUESTS_KEY = "notehall_requests";
const CONTRIBUTIONS_KEY = "notehall_contributions";
const USER_LIKES_KEY = "notehall_user_likes";
const USER_SAVES_KEY = "notehall_user_saves";

const mockDelay = (ms: number = 300) => new Promise(resolve => setTimeout(resolve, ms));

export const contentService = {
  // NOTES
  async getNotes(): Promise<Note[]> {
    await mockDelay();
    const stored = localStorage.getItem(NOTES_KEY);
    return stored ? JSON.parse(stored) : [];
  },

  async saveNote(note: Note): Promise<void> {
    await mockDelay();
    const notes = await this.getNotes();
    const existing = notes.findIndex(n => n.id === note.id);
    if (existing >= 0) {
      notes[existing] = note;
    } else {
      notes.unshift(note);
    }
    localStorage.setItem(NOTES_KEY, JSON.stringify(notes));
  },

  async deleteNote(noteId: string): Promise<void> {
    await mockDelay();
    const notes = await this.getNotes();
    const filtered = notes.filter(n => n.id !== noteId);
    localStorage.setItem(NOTES_KEY, JSON.stringify(filtered));
  },

  async likeNote(noteId: string, userId: string): Promise<void> {
    await mockDelay();
    const likes = JSON.parse(localStorage.getItem(USER_LIKES_KEY) || "{}");
    likes[`${userId}_${noteId}`] = true;
    localStorage.setItem(USER_LIKES_KEY, JSON.stringify(likes));
  },

  async unlikeNote(noteId: string, userId: string): Promise<void> {
    await mockDelay();
    const likes = JSON.parse(localStorage.getItem(USER_LIKES_KEY) || "{}");
    delete likes[`${userId}_${noteId}`];
    localStorage.setItem(USER_LIKES_KEY, JSON.stringify(likes));
  },

  async isNoteLiked(noteId: string, userId: string): Promise<boolean> {
    const likes = JSON.parse(localStorage.getItem(USER_LIKES_KEY) || "{}");
    return !!likes[`${userId}_${noteId}`];
  },

  async saveNoteToCollection(noteId: string, userId: string): Promise<void> {
    await mockDelay();
    const saves = JSON.parse(localStorage.getItem(USER_SAVES_KEY) || "{}");
    if (!saves[userId]) saves[userId] = [];
    if (!saves[userId].includes(noteId)) {
      saves[userId].push(noteId);
    }
    localStorage.setItem(USER_SAVES_KEY, JSON.stringify(saves));
  },

  async unsaveNote(noteId: string, userId: string): Promise<void> {
    await mockDelay();
    const saves = JSON.parse(localStorage.getItem(USER_SAVES_KEY) || "{}");
    if (saves[userId]) {
      saves[userId] = saves[userId].filter((id: string) => id !== noteId);
    }
    localStorage.setItem(USER_SAVES_KEY, JSON.stringify(saves));
  },

  async getSavedNotes(userId: string): Promise<string[]> {
    const saves = JSON.parse(localStorage.getItem(USER_SAVES_KEY) || "{}");
    return saves[userId] || [];
  },

  // HELP REQUESTS
  async getHelpRequests(): Promise<HelpRequest[]> {
    await mockDelay();
    const stored = localStorage.getItem(REQUESTS_KEY);
    return stored ? JSON.parse(stored) : [];
  },

  async createHelpRequest(request: Omit<HelpRequest, "id" | "createdAt" | "contributions">): Promise<HelpRequest> {
    await mockDelay();
    const requests = await this.getHelpRequests();
    const newRequest: HelpRequest = {
      ...request,
      id: `req-${Date.now()}`,
      createdAt: new Date().toISOString(),
      contributions: [],
    };
    requests.unshift(newRequest);
    localStorage.setItem(REQUESTS_KEY, JSON.stringify(requests));
    return newRequest;
  },

  async updateRequestStatus(requestId: string, status: HelpRequest["status"]): Promise<void> {
    await mockDelay();
    const requests = await this.getHelpRequests();
    const updated = requests.map(r => 
      r.id === requestId ? { ...r, status } : r
    );
    localStorage.setItem(REQUESTS_KEY, JSON.stringify(updated));
  },

  // CONTRIBUTIONS
  async getContributions(userId?: string): Promise<Contribution[]> {
    await mockDelay();
    const stored = localStorage.getItem(CONTRIBUTIONS_KEY);
    const all: Contribution[] = stored ? JSON.parse(stored) : [];
    return userId ? all.filter(c => c.contributor.id === userId) : all;
  },

  async addContribution(contribution: Omit<Contribution, "id">): Promise<Contribution> {
    await mockDelay();
    const contributions = await this.getContributions();
    const newContribution: Contribution = {
      ...contribution,
      id: `contrib-${Date.now()}`,
    };
    contributions.unshift(newContribution);
    localStorage.setItem(CONTRIBUTIONS_KEY, JSON.stringify(contributions));
    return newContribution;
  },

  async getContributionsForRequest(requestId: string): Promise<Contribution[]> {
    const all = await this.getContributions();
    return all.filter(c => c.requestId === requestId);
  },
};
