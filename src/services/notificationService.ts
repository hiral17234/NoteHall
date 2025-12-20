// Real-time Notification Service using Firestore
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc,
  doc,
  getDocs,
  writeBatch
} from 'firebase/firestore';
import { db, getServerTimestamp } from '@/lib/firebase';

export interface Notification {
  id: string;
  type: 'like' | 'comment' | 'reply' | 'help_contribution' | 'request_fulfilled' | 'mention' | 'general' | 'system';
  title: string;
  message: string;
  read: boolean;
  createdAt: any;
  toUserId: string;
  fromUserId?: string;
  fromUserName?: string;
  actionUrl?: string;
  relatedId?: string;
  fromUser?: {
    id: string;
    name: string;
    avatar?: string;
  };
}

export const notificationService = {
  // Subscribe to real-time notifications
  subscribeToNotifications(
    userId: string, 
    callback: (notifications: Notification[]) => void
  ): () => void {
    const q = query(
      collection(db, 'notifications'),
      where('toUserId', '==', userId),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notifications: Notification[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Notification));
      callback(notifications);
    }, (error) => {
      console.error('Error subscribing to notifications:', error);
      callback([]);
    });

    return unsubscribe;
  },

  // Create notification
  async create(notification: Omit<Notification, 'id' | 'createdAt' | 'read'>): Promise<string> {
    const docRef = await addDoc(collection(db, 'notifications'), {
      ...notification,
      read: false,
      createdAt: getServerTimestamp(),
    });
    return docRef.id;
  },

  // Mark as read
  async markAsRead(notificationId: string): Promise<void> {
    await updateDoc(doc(db, 'notifications', notificationId), { read: true });
  },

  // Mark all as read for a user
  async markAllAsRead(userId: string): Promise<void> {
    const q = query(
      collection(db, 'notifications'),
      where('toUserId', '==', userId),
      where('read', '==', false)
    );
    const snapshot = await getDocs(q);
    
    const batch = writeBatch(db);
    snapshot.docs.forEach(docSnap => {
      batch.update(docSnap.ref, { read: true });
    });
    await batch.commit();
  },

  // Delete notification
  async delete(notificationId: string): Promise<void> {
    await deleteDoc(doc(db, 'notifications', notificationId));
  },

  // Legacy methods for backwards compatibility
  async initialize(): Promise<Notification[]> {
    return [];
  },

  async getNotifications(): Promise<Notification[]> {
    return [];
  },

  async getUnreadCount(): Promise<number> {
    return 0;
  },

  async addNotification(notification: Omit<Notification, 'id' | 'createdAt' | 'read'>): Promise<Notification> {
    const id = await this.create(notification);
    return { ...notification, id, read: false, createdAt: new Date().toISOString() };
  },

  async deleteNotification(id: string): Promise<void> {
    await this.delete(id);
  },

  async clearAll(): Promise<void> {
    // Not implemented for Firestore
  },

  simulateNewNotification(): Notification {
    return {
      id: `notif-${Date.now()}`,
      type: 'general',
      title: 'New Notification',
      message: 'This is a test notification',
      read: false,
      createdAt: new Date().toISOString(),
      toUserId: '',
    };
  },
};

// Helper to create notifications for specific events
export const createNotification = {
  async like(noteAuthorId: string, fromUserId: string, fromUserName: string, noteTitle: string, noteId: string) {
    if (noteAuthorId === fromUserId) return;
    
    await notificationService.create({
      type: 'like',
      title: 'New Like',
      message: `${fromUserName} liked your note "${noteTitle}"`,
      toUserId: noteAuthorId,
      fromUserId,
      fromUserName,
      relatedId: noteId,
      actionUrl: `/note/${noteId}`,
    });
  },

  async contribution(requesterId: string, fromUserId: string, fromUserName: string, requestTitle: string, requestId: string) {
    if (requesterId === fromUserId) return;
    
    await notificationService.create({
      type: 'help_contribution',
      title: 'New Contribution',
      message: `${fromUserName} contributed to your request "${requestTitle}"`,
      toUserId: requesterId,
      fromUserId,
      fromUserName,
      relatedId: requestId,
      actionUrl: `/helpdesk`,
    });
  },

  async requestFulfilled(requesterId: string, requestTitle: string, requestId: string) {
    await notificationService.create({
      type: 'request_fulfilled',
      title: 'Request Fulfilled',
      message: `Your request "${requestTitle}" has been fulfilled!`,
      toUserId: requesterId,
      relatedId: requestId,
      actionUrl: `/helpdesk`,
    });
  },
};
