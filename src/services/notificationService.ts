// Notification Service - Handles all notification-related operations
// TODO: Replace with real-time WebSocket/API when backend is ready

export interface Notification {
  id: string;
  type: "like" | "comment" | "reply" | "help_contribution" | "request_fulfilled" | "mention" | "system";
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  actionUrl?: string;
  fromUser?: {
    id: string;
    name: string;
    avatar?: string;
  };
}

const STORAGE_KEY = "notehall_notifications";

// Mock delay to simulate API calls
const mockDelay = (ms: number = 200) => new Promise(resolve => setTimeout(resolve, ms));

// Get notifications from storage
const getStoredNotifications = (): Notification[] => {
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored ? JSON.parse(stored) : [];
};

// Save notifications to storage
const saveNotifications = (notifications: Notification[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
};

// Generate mock notifications for demo
const generateMockNotifications = (): Notification[] => {
  return [
    {
      id: "1",
      type: "like",
      title: "New Like",
      message: "Priya Sharma liked your note 'DSA Complete Notes'",
      read: false,
      createdAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
      actionUrl: "/profile",
      fromUser: { id: "user-2", name: "Priya Sharma" },
    },
    {
      id: "2",
      type: "help_contribution",
      title: "Help Contribution",
      message: "Amit Kumar uploaded a PDF for your DBMS request",
      read: false,
      createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      actionUrl: "/helpdesk",
      fromUser: { id: "user-3", name: "Amit Kumar" },
    },
    {
      id: "3",
      type: "reply",
      title: "New Reply",
      message: "Sneha replied to your comment on 'OS Notes'",
      read: false,
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      actionUrl: "/",
      fromUser: { id: "user-4", name: "Sneha Gupta" },
    },
    {
      id: "4",
      type: "request_fulfilled",
      title: "Request Fulfilled",
      message: "Your request for 'CN Diagrams' has been fulfilled!",
      read: true,
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      actionUrl: "/helpdesk",
    },
    {
      id: "5",
      type: "system",
      title: "Welcome to NoteHall!",
      message: "Start sharing notes and helping others 🚀",
      read: true,
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ];
};

export const notificationService = {
  // Initialize notifications (called on app start)
  async initialize(): Promise<Notification[]> {
    await mockDelay();
    let notifications = getStoredNotifications();
    
    // If no notifications, generate mock ones
    if (notifications.length === 0) {
      notifications = generateMockNotifications();
      saveNotifications(notifications);
    }
    
    return notifications;
  },

  // Get all notifications
  async getNotifications(): Promise<Notification[]> {
    await mockDelay();
    return getStoredNotifications();
  },

  // Get unread count
  async getUnreadCount(): Promise<number> {
    const notifications = getStoredNotifications();
    return notifications.filter(n => !n.read).length;
  },

  // Mark notification as read
  async markAsRead(id: string): Promise<void> {
    await mockDelay();
    const notifications = getStoredNotifications();
    const updated = notifications.map(n => 
      n.id === id ? { ...n, read: true } : n
    );
    saveNotifications(updated);
  },

  // Mark all as read
  async markAllAsRead(): Promise<void> {
    await mockDelay();
    const notifications = getStoredNotifications();
    const updated = notifications.map(n => ({ ...n, read: true }));
    saveNotifications(updated);
  },

  // Add new notification
  async addNotification(notification: Omit<Notification, "id" | "createdAt" | "read">): Promise<Notification> {
    await mockDelay();
    const notifications = getStoredNotifications();
    const newNotification: Notification = {
      ...notification,
      id: `notif-${Date.now()}`,
      createdAt: new Date().toISOString(),
      read: false,
    };
    saveNotifications([newNotification, ...notifications]);
    return newNotification;
  },

  // Delete notification
  async deleteNotification(id: string): Promise<void> {
    await mockDelay();
    const notifications = getStoredNotifications();
    const filtered = notifications.filter(n => n.id !== id);
    saveNotifications(filtered);
  },

  // Clear all notifications
  async clearAll(): Promise<void> {
    await mockDelay();
    saveNotifications([]);
  },

  // Simulate receiving a new notification (for demo purposes)
  simulateNewNotification(): Notification {
    const types: Notification["type"][] = ["like", "comment", "reply", "help_contribution"];
    const randomType = types[Math.floor(Math.random() * types.length)];
    const users = [
      { id: "user-2", name: "Priya Sharma" },
      { id: "user-3", name: "Amit Kumar" },
      { id: "user-4", name: "Sneha Gupta" },
      { id: "user-5", name: "Rahul Verma" },
    ];
    const randomUser = users[Math.floor(Math.random() * users.length)];

    const messages: Record<Notification["type"], string> = {
      like: `${randomUser.name} liked your note`,
      comment: `${randomUser.name} commented on your note`,
      reply: `${randomUser.name} replied to your comment`,
      help_contribution: `${randomUser.name} helped with your request`,
      request_fulfilled: "Your request has been fulfilled!",
      mention: `${randomUser.name} mentioned you`,
      system: "System notification",
    };

    return {
      id: `notif-${Date.now()}`,
      type: randomType,
      title: randomType.charAt(0).toUpperCase() + randomType.slice(1).replace("_", " "),
      message: messages[randomType],
      read: false,
      createdAt: new Date().toISOString(),
      fromUser: randomUser,
    };
  },
};
