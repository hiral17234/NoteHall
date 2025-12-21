// Firebase Cloud Messaging Service
import { getMessaging, getToken, onMessage, isSupported } from 'firebase/messaging';
import app from '@/lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

// VAPID Key from Firebase Console
const VAPID_KEY = 'BGd1mHAGO3DjELYzlXd7fXk0vfBLOp-8EJ4u2fq1rEZjaWHtpK834eNZ4LPMxbxxM5SMmTP6uzJrhpiuZK1H5V0';

let messaging: ReturnType<typeof getMessaging> | null = null;

// Initialize messaging (only in supported browsers)
async function initializeMessaging() {
  try {
    const supported = await isSupported();
    if (!supported) {
      console.log('FCM not supported in this browser');
      return null;
    }
    
    if (!messaging) {
      messaging = getMessaging(app);
    }
    return messaging;
  } catch (error) {
    console.error('Error initializing FCM:', error);
    return null;
  }
}

export const fcmService = {
  // Request permission and get FCM token
  async requestPermission(userId: string): Promise<string | null> {
    try {
      // Check if Notification API is available
      if (!('Notification' in window)) {
        console.log('Notifications not supported');
        return null;
      }
      
      // Check if service workers are supported
      if (!('serviceWorker' in navigator)) {
        console.log('Service workers not supported');
        return null;
      }

      const permission = await Notification.requestPermission();
      
      if (permission !== 'granted') {
        console.log('Notification permission denied');
        return null;
      }

      const msg = await initializeMessaging();
      if (!msg) return null;

      // Register service worker with error handling
      let registration;
      try {
        registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
        console.log('Service Worker registered:', registration);
      } catch (swError) {
        console.log('Service Worker registration failed:', swError);
        return null;
      }

      // Get FCM token with error handling
      try {
        const token = await getToken(msg, {
          vapidKey: VAPID_KEY,
          serviceWorkerRegistration: registration,
        });

        if (token) {
          console.log('FCM Token obtained');
          await this.saveTokenToFirestore(userId, token);
          return token;
        }
      } catch (tokenError) {
        console.log('Error getting FCM token:', tokenError);
        return null;
      }
      
      return null;
    } catch (error) {
      console.log('FCM initialization error (non-critical):', error);
      return null;
    }
  },

  // Save FCM token to Firestore
  async saveTokenToFirestore(userId: string, token: string): Promise<void> {
    try {
      await updateDoc(doc(db, 'users', userId), {
        fcmToken: token,
        fcmTokenUpdatedAt: new Date(),
      });
    } catch (error) {
      console.error('Error saving FCM token:', error);
    }
  },

  // Listen for foreground messages
  onForegroundMessage(callback: (payload: any) => void): () => void {
    let unsubscribe = () => {};
    
    initializeMessaging().then((msg) => {
      if (msg) {
        unsubscribe = onMessage(msg, (payload) => {
          console.log('Foreground message received:', payload);
          callback(payload);
        });
      }
    });

    return () => unsubscribe();
  },

  // Check if notifications are supported
  async isSupported(): Promise<boolean> {
    return await isSupported();
  },

  // Check current permission status
  getPermissionStatus(): NotificationPermission {
    if (!('Notification' in window)) {
      return 'denied';
    }
    return Notification.permission;
  },
};

export default fcmService;
