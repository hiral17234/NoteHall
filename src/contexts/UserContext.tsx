import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { notificationService, Notification } from "@/services/notificationService";

// Types
export interface UserProfile {
  id: string;
  name: string;
  username: string;
  email: string;
  phone?: string;
  bio: string;
  college: string;
  branch: string;
  year: string;
  degree: string;
  avatar: string;
  github: string;
  linkedin: string;
  portfolio: string;
  instagram: string;
  twitter: string;
  streak: number;
  lastActiveDate: string;
  isActive: boolean;
  deletedAt?: string;
  stats: {
    uploads: number;
    totalLikes: number;
    totalViews: number;
    helpedRequests: number;
    contributionScore: number;
  };
  badges: Array<{
    id: string;
    label: string;
    icon: string;
    color: string;
    earnedAt?: string;
  }>;
}

export interface UserPreferences {
  theme: "light" | "dark" | "system";
  fontSize: "small" | "medium" | "large";
  compactMode: boolean;
  notifications: {
    likes: boolean;
    helpRequests: boolean;
    requestFulfilled: boolean;
    weeklyDigest: boolean;
  };
}

export interface PrivacySettings {
  publicProfile: boolean;
  showOnlineStatus: boolean;
  allowDirectMessages: boolean;
}

interface UserContextType {
  // User
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  updateUser: (updates: Partial<UserProfile>) => void;
  setUser: (user: UserProfile | null) => void;
  isOwner: (profileId: string) => boolean;
  
  // Preferences
  preferences: UserPreferences;
  updatePreferences: (updates: Partial<UserPreferences>) => void;
  
  // Privacy
  privacy: PrivacySettings;
  updatePrivacy: (updates: Partial<PrivacySettings>) => void;
  
  // Notifications
  notifications: Notification[];
  unreadCount: number;
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;
  addNotification: (notification: Omit<Notification, "id" | "createdAt" | "read">) => void;
  
  // Auth actions
  logout: () => void;
  softDeleteAccount: () => void;
}

const defaultPreferences: UserPreferences = {
  theme: "light",
  fontSize: "medium",
  compactMode: false,
  notifications: {
    likes: true,
    helpRequests: true,
    requestFulfilled: true,
    weeklyDigest: false,
  },
};

const defaultPrivacy: PrivacySettings = {
  publicProfile: true,
  showOnlineStatus: true,
  allowDirectMessages: true,
};

const defaultUser: UserProfile = {
  id: "current-user",
  name: "John Doe",
  username: "johndoe",
  email: "john@example.com",
  phone: "+91 9876543210",
  bio: "CSE student passionate about coding and sharing knowledge 🚀🔥 Love to help others learn! 📚",
  college: "MITS Gwalior",
  branch: "Computer Science",
  year: "3rd Year",
  degree: "btech",
  avatar: "",
  github: "johndoe",
  linkedin: "johndoe",
  portfolio: "johndoe.dev",
  instagram: "johndoe",
  twitter: "johndoe",
  streak: 12,
  lastActiveDate: new Date().toISOString(),
  isActive: true,
  stats: {
    uploads: 24,
    totalLikes: 1250,
    totalViews: 8500,
    helpedRequests: 15,
    contributionScore: 92,
  },
  badges: [
    { id: "top", label: "Top Contributor", icon: "Award", color: "bg-primary/20 text-primary" },
    { id: "helpful", label: "Helpful", icon: "Star", color: "bg-chart-1/20 text-chart-1" },
    { id: "streak-7", label: "7 Day Streak", icon: "Flame", color: "bg-orange-500/20 text-orange-500", earnedAt: "2024-01-10" },
  ],
};

const STORAGE_KEYS = {
  USER: "notehall_user",
  PREFERENCES: "notehall_preferences",
  PRIVACY: "notehall_privacy",
};

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<UserProfile | null>(null);
  const [preferences, setPreferences] = useState<UserPreferences>(defaultPreferences);
  const [privacy, setPrivacy] = useState<PrivacySettings>(defaultPrivacy);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize from localStorage
  useEffect(() => {
    const initializeUser = async () => {
      try {
        // Load user
        const storedUser = localStorage.getItem(STORAGE_KEYS.USER);
        if (storedUser) {
          setUserState(JSON.parse(storedUser));
        } else {
          // Use default user for demo
          setUserState(defaultUser);
          localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(defaultUser));
        }

        // Load preferences
        const storedPrefs = localStorage.getItem(STORAGE_KEYS.PREFERENCES);
        if (storedPrefs) {
          setPreferences(JSON.parse(storedPrefs));
        }

        // Load privacy
        const storedPrivacy = localStorage.getItem(STORAGE_KEYS.PRIVACY);
        if (storedPrivacy) {
          setPrivacy(JSON.parse(storedPrivacy));
        }

        // Load notifications
        const notifs = await notificationService.initialize();
        setNotifications(notifs);
      } catch (error) {
        console.error("Error initializing user:", error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeUser();
  }, []);

  // Apply theme
  useEffect(() => {
    const root = document.documentElement;
    
    if (preferences.theme === "system") {
      const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      root.classList.toggle("dark", isDark);
    } else {
      root.classList.toggle("dark", preferences.theme === "dark");
    }
  }, [preferences.theme]);

  // Apply font size
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("text-sm", "text-base", "text-lg");
    
    switch (preferences.fontSize) {
      case "small":
        root.style.fontSize = "14px";
        break;
      case "large":
        root.style.fontSize = "18px";
        break;
      default:
        root.style.fontSize = "16px";
    }
  }, [preferences.fontSize]);

  // Apply compact mode
  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("compact", preferences.compactMode);
  }, [preferences.compactMode]);

  const updateUser = useCallback((updates: Partial<UserProfile>) => {
    setUserState(prev => {
      if (!prev) return prev;
      const updated = { ...prev, ...updates };
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const setUser = useCallback((newUser: UserProfile | null) => {
    setUserState(newUser);
    if (newUser) {
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(newUser));
    } else {
      localStorage.removeItem(STORAGE_KEYS.USER);
    }
  }, []);

  const updatePreferences = useCallback((updates: Partial<UserPreferences>) => {
    setPreferences(prev => {
      const updated = { ...prev, ...updates };
      localStorage.setItem(STORAGE_KEYS.PREFERENCES, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const updatePrivacy = useCallback((updates: Partial<PrivacySettings>) => {
    setPrivacy(prev => {
      const updated = { ...prev, ...updates };
      localStorage.setItem(STORAGE_KEYS.PRIVACY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const isOwner = useCallback((profileId: string) => {
    return profileId === user?.id || profileId === "current-user";
  }, [user?.id]);

  const markNotificationAsRead = useCallback(async (id: string) => {
    await notificationService.markAsRead(id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  }, []);

  const markAllNotificationsAsRead = useCallback(async () => {
    await notificationService.markAllAsRead();
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  const addNotification = useCallback(async (notification: Omit<Notification, "id" | "createdAt" | "read">) => {
    const newNotif = await notificationService.addNotification(notification);
    setNotifications(prev => [newNotif, ...prev]);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEYS.USER);
    setUserState(null);
  }, []);

  const softDeleteAccount = useCallback(() => {
    if (user) {
      const deleted = { ...user, isActive: false, deletedAt: new Date().toISOString() };
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(deleted));
      setUserState(null);
    }
  }, [user]);

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <UserContext.Provider
      value={{
        user,
        isAuthenticated: !!user && user.isActive,
        isLoading,
        updateUser,
        setUser,
        isOwner,
        preferences,
        updatePreferences,
        privacy,
        updatePrivacy,
        notifications,
        unreadCount,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        addNotification,
        logout,
        softDeleteAccount,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
}

// Backwards compatibility with old ProfileContext
export const useProfile = useUser;
export const ProfileProvider = UserProvider;
