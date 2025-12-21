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

  async create(noteData: Omit<Note, 'id' | 'createdAt' | 'updatedAt' | 'likes' | 'dislikes' | 'views' | 'ratings' | 'difficulty' | 'savedBy' | 'likedBy'>): Promise<string> {
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

    // Update user stats
    await updateDoc(doc(db, 'users', noteData.authorId), {
      'stats.uploads': increment(1),
      'stats.contributionScore': increment(10),
    });

    return docRef.id;
  },

  async incrementViews(noteId: string): Promise<void> {
    const docRef = doc(db, 'notes', noteId);
    await updateDoc(docRef, { views: increment(1) });
    
    // Also update total views for the author
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
      await updateDoc(noteRef, {
        likes: increment(-1),
        likedBy: arrayRemove(userId),
      });
      await updateDoc(authorRef, {
        'stats.totalLikes': increment(-1),
        'stats.contributionScore': increment(-5),
      });
    } else {
      await updateDoc(noteRef, {
        likes: increment(1),
        likedBy: arrayUnion(userId),
        dislikedBy: arrayRemove(userId)
      });
      
      if (note.authorId !== userId) {
        await createNotification.like(note.authorId, userId, userName, note.title, noteId);
      }
      
      await updateDoc(authorRef, {
        'stats.totalLikes': increment(1),
        'stats.contributionScore': increment(5),
      });
    }
  },

  async saveNote(noteId: string, userId: string): Promise<void> {
    const noteRef = doc(db, 'notes', noteId);
    await updateDoc(noteRef, { savedBy: arrayUnion(userId) });
    
    await setDoc(doc(db, 'users', userId, 'savedNotes', noteId), {
      noteId,
      savedAt: getServerTimestamp(),
    });
  },

  async unsaveNote(noteId: string, userId: string): Promise<void> {
    const noteRef = doc(db, 'notes', noteId);
    await updateDoc(noteRef, { savedBy: arrayRemove(userId) });
    await deleteDoc(doc(db, 'users', userId, 'savedNotes', noteId));
  },

  async isSavedByUser(noteId: string, userId: string): Promise<boolean> {
    const savedDoc = await getDoc(doc(db, 'users', userId, 'savedNotes', noteId));
    return savedDoc.exists();
  },

  async getSavedNotes(userId: string): Promise<Note[]> {
    const savedDocsSnap = await getDocs(collection(db, 'users', userId, 'savedNotes'));
    const noteIds = savedDocsSnap.docs.map(d => d.data().noteId);
    if (noteIds.length === 0) return [];
    
    const notes: Note[] = [];
    // Firebase 'in' queries are limited to 10-30 items, so we batch fetch or loop safely
    for (const noteId of noteIds) {
      const note = await this.getById(noteId);
      if (note) notes.push(note);
    }
    return notes;
  },

  async downloadNote(noteId: string, userId: string, note: { title: string; subject: string; fileUrl: string }): Promise<void> {
    await setDoc(doc(db, 'users', userId, 'downloadedNotes', noteId), {
      noteId,
      title: note.title,
      subject: note.subject,
      fileUrl: note.fileUrl,
      downloadedAt: getServerTimestamp(),
    });

    // Award point for downloading (interaction)
    await updateDoc(doc(db, 'users', userId), {
      'stats.contributionScore': increment(1),
    });

    const response = await fetch(note.fileUrl);
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${note.title.replace(/\s+/g, '_')}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },

  async rateNote(noteId: string, userId: string, rating: number, difficulty: 'easy' | 'medium' | 'hard'): Promise<void> {
    await setDoc(doc(db, 'ratings', `${noteId}_${userId}`), {
      noteId,
      userId,
      rating,
      difficulty,
      createdAt: getServerTimestamp(),
    });

    const noteRef = doc(db, 'notes', noteId);
    const noteSnap = await getDoc(noteRef);
    
    if (noteSnap.exists()) {
      const noteData = noteSnap.data() as Note;
      const newCount = (noteData.ratings?.count || 0) + 1;
      const newTotal = (noteData.ratings?.total || 0) + rating;
      const newAverage = newTotal / newCount;

      await updateDoc(noteRef, {
        'ratings.count': newCount,
        'ratings.total': newTotal,
        'ratings.average': newAverage,
        [`difficulty.${difficulty}`]: increment(1),
        updatedAt: getServerTimestamp(),
      });

      // Rater gets points for feedback
      await updateDoc(doc(db, 'users', userId), {
        'stats.contributionScore': increment(2),
      });
    }
  },

  async search(searchQuery: string): Promise<Note[]> {
    const allNotes = await this.getAll();
    const q = searchQuery.toLowerCase();
    
    return allNotes.filter(note => 
      note.title.toLowerCase().includes(q) ||
      note.subject.toLowerCase().includes(q) ||
      note.authorName.toLowerCase().includes(q) ||
      note.authorUsername.toLowerCase().includes(q) ||
      note.topic?.toLowerCase().includes(q) ||
      note.branch.toLowerCase().includes(q)
    );
  },
};

// ==================== HELP REQUESTS SERVICE ====================

export const helpRequestsService = {
  async getAll(): Promise<HelpRequest[]> {
    const q = query(collection(db, 'requests'), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as HelpRequest));
  },

  async getByUser(userId: string): Promise<HelpRequest[]> {
    const q = query(collection(db, 'requests'), where('requesterId', '==', userId), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as HelpRequest));
  },

  async create(data: Omit<HelpRequest, 'id' | 'createdAt' | 'updatedAt' | 'contributionsCount' | 'status'>): Promise<string> {
    const docRef = await addDoc(collection(db, 'requests'), {
      ...data,
      status: 'open',
      contributionsCount: 0,
      createdAt: getServerTimestamp(),
      updatedAt: getServerTimestamp(),
    });
    return docRef.id;
  },

  async updateStatus(requestId: string, status: HelpRequest['status']): Promise<void> {
    const requestRef = doc(db, 'requests', requestId);
    const requestSnap = await getDoc(requestRef);
    
    await updateDoc(requestRef, {
      status,
      updatedAt: getServerTimestamp(),
    });
    
    if (status === 'fulfilled' && requestSnap.exists()) {
      const request = requestSnap.data() as HelpRequest;
      await createNotification.requestFulfilled(request.requesterId, request.title, requestId);
    }
  },

  async incrementContributions(requestId: string): Promise<void> {
    await updateDoc(doc(db, 'requests', requestId), {
      contributionsCount: increment(1),
      updatedAt: getServerTimestamp(),
    });
  },
};

// ==================== CONTRIBUTIONS SERVICE ====================

export const contributionsService = {
  async getByRequest(requestId: string): Promise<Contribution[]> {
    const q = query(collection(db, 'contributions'), where('requestId', '==', requestId), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Contribution));
  },

  async getByUser(userId: string): Promise<Contribution[]> {
    const q = query(collection(db, 'contributions'), where('contributorId', '==', userId), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Contribution));
  },

  async create(data: Omit<Contribution, 'id' | 'createdAt'>): Promise<string> {
    const docRef = await addDoc(collection(db, 'contributions'), {
      ...data,
      createdAt: getServerTimestamp(),
    });
    
    await helpRequestsService.incrementContributions(data.requestId);
    
    // Major point award for helping
    await updateDoc(doc(db, 'users', data.contributorId), {
      'stats.helpedRequests': increment(1),
      'stats.contributionScore': increment(50),
      updatedAt: getServerTimestamp(),
    });
    
    const requestRef = doc(db, 'requests', data.requestId);
    const requestSnap = await getDoc(requestRef);
    if (requestSnap.exists()) {
      const request = requestSnap.data() as HelpRequest;
      await createNotification.contribution(
        request.requesterId, 
        data.contributorId, 
        data.contributorName, 
        request.title, 
        data.requestId
      );
    }
    
    return docRef.id;
  },
};

// ==================== ACHIEVEMENTS DATA & SERVICE ====================

export const ACHIEVEMENTS: Achievement[] = [
  { id: '1', title: 'First Note', description: 'Upload your first study note', icon: 'FileText', requirement: { type: 'uploads', count: 1 }, points: 10 },
  { id: '2', title: 'Contributor', description: 'Upload 5 study notes', icon: 'Upload', requirement: { type: 'uploads', count: 5 }, points: 50 },
  { id: '3', title: 'Helper', description: 'Help 1 student with their request', icon: 'HandHelping', requirement: { type: 'helped', count: 1 }, points: 20 },
  { id: '4', title: 'Top Helper', description: 'Help 10 students with their requests', icon: 'Trophy', requirement: { type: 'helped', count: 10 }, points: 200 },
  { id: '5', title: 'Popular', description: 'Get 50 likes on your notes', icon: 'Heart', requirement: { type: 'likes', count: 50 }, points: 100 },
  { id: '6', title: 'Viral', description: 'Get 500 views on your notes', icon: 'Eye', requirement: { type: 'views', count: 500 }, points: 150 },
  { id: '7', title: 'Consistent', description: 'Maintain a 7-day streak', icon: 'Zap', requirement: { type: 'streak', count: 7 }, points: 70 },
];

export const achievementsService = {
  checkAchievements(stats: { uploads: number; helpedRequests: number; totalLikes: number; totalViews: number }, streak: number) {
    const earned: Achievement[] = [];
    ACHIEVEMENTS.forEach(achievement => {
      let count = 0;
      switch (achievement.requirement.type) {
        case 'uploads': count = stats.uploads; break;
        case 'helped': count = stats.helpedRequests; break;
        case 'likes': count = stats.totalLikes; break;
        case 'views': count = stats.totalViews; break;
        case 'streak': count = streak; break;
      }
      if (count >= achievement.requirement.count) earned.push(achievement);
    });
    return earned;
  },
  
  getActiveAchievement(stats: { uploads: number; helpedRequests: number; totalLikes: number; totalViews: number }, streak: number): Achievement | null {
    let closest: { achievement: Achievement; progress: number } | null = null;
    ACHIEVEMENTS.forEach(achievement => {
      let count = 0;
      switch (achievement.requirement.type) {
        case 'uploads': count = stats.uploads; break;
        case 'helped': count = stats.helpedRequests; break;
        case 'likes': count = stats.totalLikes; break;
        case 'views': count = stats.totalViews; break;
        case 'streak': count = streak; break;
      }
      const progress = count / achievement.requirement.count;
      if (progress < 1 && progress > 0) {
        if (!closest || progress > closest.progress) closest = { achievement, progress };
      }
    });
    return closest?.achievement || null;
  }
};

// ==================== USERS SERVICE ====================

export const usersService = {
  async getById(userId: string): Promise<any | null> {
    const docRef = doc(db, 'users', userId);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null;
  },

  async getByUsername(username: string): Promise<any | null> {
    if (!username || username.length < 3) return null;
    const q = query(collection(db, 'users'), where('username', '==', username), limit(1));
    const snapshot = await getDocs(q);
    return snapshot.empty ? null : { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
  },

  async getTopContributors(limitCount: number = 5): Promise<any[]> {
    const q = query(collection(db, 'users'), orderBy('stats.contributionScore', 'desc'), limit(limitCount));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },

  async search(searchQuery: string): Promise<any[]> {
    const allUsersSnap = await getDocs(collection(db, 'users'));
    const q = searchQuery.toLowerCase();
    return allUsersSnap.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter((user: any) => 
        user.username?.toLowerCase().includes(q) ||
        user.name?.toLowerCase().includes(q)
      );
  }
};
