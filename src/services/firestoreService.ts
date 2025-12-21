import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc,
  query, 
  where, 
  orderBy, 
  limit,
  addDoc,
  increment,
  arrayUnion,
  arrayRemove,
  onSnapshot,
} from 'firebase/firestore';
import { db, getServerTimestamp } from '@/lib/firebase';
import { createNotification } from '@/services/notificationService';

// ==================== INTERFACES ====================

export interface Note {
  id: string;
  title: string;
  subject: string;
  branch: string;
  year: string;
  fileType: 'pdf' | 'image' | 'video' | 'link';
  fileUrl: string;
  description?: string;
  topic?: string;
  likes: number;
  dislikes: number;
  views: number;
  authorId: string;
  authorName: string;
  authorUsername: string;
  isTrusted: boolean;
  ratings: {
    total: number;
    count: number;
    average: number;
  };
  difficulty: {
    easy: number;
    medium: number;
    hard: number;
  };
  savedBy: string[];
  likedBy: string[];
  createdAt: any;
  updatedAt: any;
}

export interface HelpRequest {
  id: string;
  title: string;
  description: string;
  subject: string;
  branch: string;
  year: string;
  semester?: string;
  requesterId: string;
  requesterName: string;
  requesterUsername: string;
  status: 'open' | 'in_progress' | 'fulfilled' | 'closed';
  contributionsCount: number;
  likes?: string[];
  commentsCount?: number;
  createdAt: any;
  updatedAt: any;
}

export interface Contribution {
  id: string;
  requestId: string;
  contributorId: string;
  contributorName: string;
  contributorUsername: string;
  type: 'pdf' | 'image' | 'video' | 'link' | 'explanation';
  content: string;
  fileUrl?: string;
  createdAt: any;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  requirement: {
    type: 'uploads' | 'helped' | 'likes' | 'views' | 'streak';
    count: number;
  };
  points: number;
}

export interface UserProfile {
  id: string;
  name: string;
  username: string;
  email: string;
  avatar?: string;
  bio?: string;
  college?: string;
  branch?: string;
  year?: string;
  streak?: number;
  github?: string;
  linkedin?: string;
  degree?: string;
  portfolio?: string;
  instagram?: string;
  twitter?: string;
  stats: {
    uploads: number;
    totalLikes: number;
    totalViews: number;
    helpedRequests: number;
    contributionScore: number;
  };
}

export interface SearchResult {
  id: string;
  type: 'note' | 'user';
  title: string;
  subtitle: string;
  data: Note | UserProfile;
}

// ==================== NOTES SERVICE ====================

export const notesService = {
  async getAll(): Promise<Note[]> {
    const q = query(collection(db, 'notes'), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Note));
  },

  async getById(id: string): Promise<Note | null> {
    const docRef = doc(db, 'notes', id);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } as Note : null;
  },

  async getByUser(userId: string): Promise<Note[]> {
    const q = query(collection(db, 'notes'), where('authorId', '==', userId), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Note));
  },

  async create(noteData: any): Promise<string> {
    const docRef = await addDoc(collection(db, 'notes'), {
      ...noteData,
      likes: 0,
      dislikes: 0,
      views: 0,
      ratings: { total: 0, count: 0, average: 0 },
      difficulty: { easy: 0, medium: 0, hard: 0 },
      savedBy: [],
      likedBy: [],
      createdAt: getServerTimestamp(),
      updatedAt: getServerTimestamp(),
    });

    await updateDoc(doc(db, 'users', noteData.authorId), {
      'stats.uploads': increment(1),
      'stats.contributionScore': increment(10),
    });

    return docRef.id;
  },

  async incrementViews(noteId: string): Promise<void> {
    const docRef = doc(db, 'notes', noteId);
    await updateDoc(docRef, { views: increment(1) });
    
    const note = await this.getById(noteId);
    if (note) {
      await updateDoc(doc(db, 'users', note.authorId), {
        'stats.totalViews': increment(1),
      });
    }
  },

  async toggleLike(noteId: string, userId: string, userName: string, isCurrentlyLiked: boolean): Promise<void> {
    const noteRef = doc(db, 'notes', noteId);
    const noteSnap = await getDoc(noteRef);
    if (!noteSnap.exists()) return;
    
    const note = noteSnap.data() as Note;
    const authorRef = doc(db, 'users', note.authorId);
    
    if (isCurrentlyLiked) {
      await updateDoc(noteRef, { likes: increment(-1), likedBy: arrayRemove(userId) });
      await updateDoc(authorRef, { 'stats.totalLikes': increment(-1), 'stats.contributionScore': increment(-5) });
    } else {
      await updateDoc(noteRef, { likes: increment(1), likedBy: arrayUnion(userId) });
      if (note.authorId !== userId) {
        await createNotification.like(note.authorId, { id: userId, name: userName }, note.title, noteId);
      }
      await updateDoc(authorRef, { 'stats.totalLikes': increment(1), 'stats.contributionScore': increment(5) });
    }
  },

  async saveNote(noteId: string, userId: string): Promise<void> {
    const noteRef = doc(db, 'notes', noteId);
    await updateDoc(noteRef, { savedBy: arrayUnion(userId) });
    await setDoc(doc(db, 'users', userId, 'savedNotes', noteId), { noteId, savedAt: getServerTimestamp() });
  },

  async unsaveNote(noteId: string, userId: string): Promise<void> {
    const noteRef = doc(db, 'notes', noteId);
    await updateDoc(noteRef, { savedBy: arrayRemove(userId) });
    await deleteDoc(doc(db, 'users', userId, 'savedNotes', noteId));
  },

  async getSavedNotes(userId: string): Promise<Note[]> {
    const savedDocsSnap = await getDocs(collection(db, 'users', userId, 'savedNotes'));
    const noteIds = savedDocsSnap.docs.map(d => d.data().noteId);
    if (noteIds.length === 0) return [];
    
    const notePromises = noteIds.map(id => this.getById(id));
    const results = await Promise.all(notePromises);
    return results.filter((n): n is Note => n !== null);
  },

  async downloadNote(noteId: string, userId: string, note: { title: string; subject: string; fileUrl: string }): Promise<void> {
    try {
      await setDoc(doc(db, 'users', userId, 'downloadedNotes', noteId), { 
        noteId,
        title: note.title,
        subject: note.subject,
        fileUrl: note.fileUrl,
        downloadedAt: getServerTimestamp() 
      });
      await updateDoc(doc(db, 'users', userId), { 'stats.contributionScore': increment(1) });
    } catch (error) {
      console.error('Error saving download history:', error);
    }
    
    let downloadUrl = note.fileUrl;
    if (downloadUrl.includes('cloudinary.com') && downloadUrl.includes('/upload/')) {
      downloadUrl = downloadUrl.replace('/upload/', '/upload/fl_attachment/');
    }
    
    try {
      const response = await fetch(downloadUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const fileName = note.title.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_');
      link.setAttribute('download', `${fileName}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      window.open(downloadUrl, '_blank');
    }
  },

  async getDownloadedNotes(userId: string): Promise<any[]> {
    const snapshot = await getDocs(collection(db, 'users', userId, 'downloadedNotes'));
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
  },

  async rateNote(noteId: string, userId: string, rating: number, difficulty: string): Promise<void> {
    await setDoc(doc(db, 'ratings', `${noteId}_${userId}`), { noteId, userId, rating, difficulty, createdAt: getServerTimestamp() });
    const noteRef = doc(db, 'notes', noteId);
    const noteSnap = await getDoc(noteRef);
    if (noteSnap.exists()) {
      const noteData = noteSnap.data() as Note;
      const newCount = (noteData.ratings?.count || 0) + 1;
      const newTotal = (noteData.ratings?.total || 0) + rating;
      await updateDoc(noteRef, {
        'ratings.count': newCount,
        'ratings.total': newTotal,
        'ratings.average': newTotal / newCount,
        [`difficulty.${difficulty}`]: increment(1),
        updatedAt: getServerTimestamp(),
      });
      await updateDoc(doc(db, 'users', userId), { 'stats.contributionScore': increment(2) });
    }
  },

  async search(searchQuery: string): Promise<Note[]> {
    const allNotes = await this.getAll();
    const q = searchQuery.toLowerCase();
    return allNotes.filter(n => 
      n.title.toLowerCase().includes(q) || 
      n.subject.toLowerCase().includes(q) ||
      n.authorName.toLowerCase().includes(q) ||
      (n.topic && n.topic.toLowerCase().includes(q)) ||
      n.branch.toLowerCase().includes(q)
    );
  },

  async searchAll(searchQuery: string): Promise<SearchResult[]> {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return [];
    const results: SearchResult[] = [];
    const allNotes = await this.getAll();
    const noteResults = allNotes.filter(n => 
      n.title.toLowerCase().includes(q) || 
      n.subject.toLowerCase().includes(q) ||
      n.authorName.toLowerCase().includes(q) ||
      (n.topic && n.topic.toLowerCase().includes(q)) ||
      n.branch.toLowerCase().includes(q)
    ).slice(0, 10);

    noteResults.forEach(note => {
      results.push({ id: note.id, type: 'note', title: note.title, subtitle: `${note.subject} • ${note.authorName}`, data: note });
    });

    const userResults = await usersService.search(searchQuery);
    userResults.forEach(user => {
      results.push({ id: user.id, type: 'user', title: user.name, subtitle: `@${user.username} • ${user.college || 'Student'}`, data: user });
    });
    return results;
  },
};

// ==================== HELP REQUESTS SERVICE ====================

export const helpRequestsService = {
  async getAll(): Promise<HelpRequest[]> {
    const q = query(collection(db, 'requests'), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as HelpRequest));
  },

  async create(data: any): Promise<string> {
    const docRef = await addDoc(collection(db, 'requests'), {
      ...data,
      status: 'open',
      contributionsCount: 0,
      createdAt: getServerTimestamp(),
      updatedAt: getServerTimestamp(),
    });
    await updateDoc(doc(db, 'users', data.requesterId), { 'stats.contributionScore': increment(5) });
    return docRef.id;
  },

  async updateStatus(requestId: string, status: string): Promise<void> {
    await updateDoc(doc(db, 'requests', requestId), { status, updatedAt: getServerTimestamp() });
  },

  async incrementContributions(requestId: string): Promise<void> {
    await updateDoc(doc(db, 'requests', requestId), { contributionsCount: increment(1), updatedAt: getServerTimestamp() });
  },
};

// ==================== CONTRIBUTIONS SERVICE ====================

export const contributionsService = {
  async getByUser(userId: string): Promise<Contribution[]> {
    const q = query(collection(db, 'contributions'), where('contributorId', '==', userId), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Contribution));
  },

  subscribeToUserContributions(userId: string, callback: (contributions: Contribution[]) => void): () => void {
    if (!userId) { callback([]); return () => {}; }
    const q = query(collection(db, 'contributions'), where('contributorId', '==', userId), orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snapshot) => {
      callback(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Contribution)));
    });
  },

  async create(data: any): Promise<string> {
    const docRef = await addDoc(collection(db, 'contributions'), { ...data, createdAt: getServerTimestamp() });
    await helpRequestsService.incrementContributions(data.requestId);
    await updateDoc(doc(db, 'users', data.contributorId), {
      'stats.helpedRequests': increment(1),
      'stats.contributionScore': increment(50),
      updatedAt: getServerTimestamp(),
    });

    if (data.requesterId && data.requesterId !== data.contributorId) {
      await createNotification.contribution(data.requesterId, { id: data.contributorId, name: data.contributorName }, data.requestTitle || 'your request', data.requestId);
    }
    return docRef.id;
  },

  async addContribution(requestId: string, data: any): Promise<string> {
    const requestRef = doc(db, 'requests', requestId);
    const requestSnap = await getDoc(requestRef);
    const request = requestSnap.exists() ? (requestSnap.data() as any) : null;

    await addDoc(collection(db, 'requests', requestId, 'contributions'), {
      ...data,
      requestId,
      createdAt: getServerTimestamp(),
    });

    return this.create({
      requestId,
      requesterId: request?.requesterId,
      requestTitle: request?.title,
      contributorId: data.contributorId,
      contributorName: data.contributorName,
      contributorUsername: data.contributorUsername,
      type: data.type ?? 'link',
      content: data.message ?? data.fileName ?? 'Contribution',
      fileUrl: data.fileUrl,
    });
  },
};

// ==================== COMMENTS SERVICE ====================

export const commentsService = {
  async getByNote(noteId: string) {
    const q = query(collection(db, 'notes', noteId, 'comments'), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },

  async addComment(noteId: string, userId: string, userName: string, text: string, ownerId?: string, itemTitle?: string) {
    await addDoc(collection(db, 'notes', noteId, 'comments'), {
      userId, userName, text, createdAt: getServerTimestamp(),
    });
    await updateDoc(doc(db, 'users', userId), { 'stats.contributionScore': increment(2) });
    if (ownerId && ownerId !== userId && itemTitle) {
      await createNotification.comment(ownerId, { id: userId, name: userName }, itemTitle, noteId, false);
    }
  }
};

// ==================== ACHIEVEMENTS ====================

export const ACHIEVEMENTS: Achievement[] = [
  { id: '1', title: 'First Note', description: 'Upload your first study note', icon: 'FileText', requirement: { type: 'uploads', count: 1 }, points: 10 },
  { id: '2', title: 'Contributor', description: 'Upload 5 study notes', icon: 'Upload', requirement: { type: 'uploads', count: 5 }, points: 50 },
  { id: '3', title: 'Helper', description: 'Help 1 student with their request', icon: 'HandHelping', requirement: { type: 'helped', count: 1 }, points: 20 },
];

export type AchievementBadge = Achievement & { label: string; tier: 'bronze' | 'silver' | 'gold'; color: string; };

const getTier = (points: number): AchievementBadge['tier'] => {
  if (points >= 50) return 'gold';
  if (points >= 20) return 'silver';
  return 'bronze';
};

const tierColor: Record<AchievementBadge['tier'], string> = {
  bronze: 'bg-primary/15 text-primary',
  silver: 'bg-chart-1/15 text-chart-1',
  gold: 'bg-chart-2/15 text-chart-2',
};

export const achievementsService = {
  getAll(): AchievementBadge[] {
    return ACHIEVEMENTS.map(a => ({ ...a, label: a.title, tier: getTier(a.points), color: tierColor[getTier(a.points)] }));
  },
  checkAchievements(stats: any, streak: number): AchievementBadge[] {
    const getCount = (type: string) => {
      if (type === 'uploads') return stats?.uploads ?? 0;
      if (type === 'helped') return stats?.helpedRequests ?? 0;
      if (type === 'likes') return stats?.totalLikes ?? 0;
      if (type === 'views') return stats?.totalViews ?? 0;
      if (type === 'streak') return streak ?? 0;
      return 0;
    };
    return this.getAll().filter(a => getCount(a.requirement.type) >= a.requirement.count);
  },
};

// ==================== USERS SERVICE ====================

export const usersService = {
  async getById(userId: string): Promise<UserProfile | null> {
    const snap = await getDoc(doc(db, 'users', userId));
    return snap.exists() ? ({ id: snap.id, ...snap.data() } as UserProfile) : null;
  },

  async getByUsername(username: string): Promise<UserProfile | null> {
    const q = query(collection(db, 'users'), where('username', '==', username), limit(1));
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    const d = snapshot.docs[0];
    return { id: d.id, ...d.data() } as UserProfile;
  },

  async search(queryText: string): Promise<UserProfile[]> {
    const q = queryText.toLowerCase().trim();
    if (!q) return [];
    const snapshot = await getDocs(collection(db, 'users'));
    const users: UserProfile[] = [];
    snapshot.docs.forEach((d) => {
      const data = d.data();
      if ((data.username || '').toLowerCase().includes(q) || (data.name || '').toLowerCase().includes(q)) {
        users.push({ id: d.id, ...data } as UserProfile);
      }
    });
    return users.slice(0, 10);
  },

  subscribeToProfile(userId: string, callback: (profile: UserProfile | null) => void): () => void {
    if (!userId) return () => {};
    return onSnapshot(doc(db, 'users', userId), (snap) => {
      callback(snap.exists() ? ({ id: snap.id, ...snap.data() } as UserProfile) : null);
    });
  },

  subscribeToSavedNotes(userId: string, callback: (notes: any[]) => void): () => void {
    if (!userId) return () => {};
    return onSnapshot(collection(db, 'users', userId, 'savedNotes'), (snapshot) => {
      callback(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
  },

  subscribeToDownloadedNotes(userId: string, callback: (notes: any[]) => void): () => void {
    if (!userId) return () => {};
    return onSnapshot(collection(db, 'users', userId, 'downloadedNotes'), (snapshot) => {
      callback(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
  },

  subscribeToComputedStats(userId: string, callback: (stats: { uploads: number; totalLikes: number; totalViews: number }) => void): () => void {
    if (!userId) { callback({ uploads: 0, totalLikes: 0, totalViews: 0 }); return () => {}; }
    const q = query(collection(db, 'notes'), where('authorId', '==', userId));
    return onSnapshot(q, (snapshot) => {
      let totalLikes = 0, totalViews = 0;
      snapshot.docs.forEach((d) => {
        const data = d.data();
        totalLikes += data.likes ?? 0;
        totalViews += data.views ?? 0;
      });
      callback({ uploads: snapshot.size, totalLikes, totalViews });
    });
  },

  subscribeToHelpedCount(userId: string, callback: (count: number) => void): () => void {
    if (!userId) { callback(0); return () => {}; }
    const q = query(collection(db, 'contributions'), where('contributorId', '==', userId));
    return onSnapshot(q, (snapshot) => {
      callback(snapshot.size);
    });
  },
};
