import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { notificationService, Notification } from "@/services/notificationService";
import { useAuth, UserProfile } from "@/contexts/AuthContext";

// Re-export UserProfile from AuthContext for backwards compatibility
export type { UserProfile } from "@/contexts/AuthContext";

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
  // User - synced from AuthContext
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

const STORAGE_KEYS = {
  PREFERENCES: "notehall_preferences",
  PRIVACY: "notehall_privacy",
};

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  // Sync user from AuthContext - this is the single source of truth
  const { userProfile, isAuthenticated: authIsAuthenticated, isLoading: authIsLoading, updateUserProfile, logout: authLogout } = useAuth();
  
  const [preferences, setPreferences] = useState<UserPreferences>(defaultPreferences);
  const [privacy, setPrivacy] = useState<PrivacySettings>(defaultPrivacy);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize preferences and privacy from localStorage
  useEffect(() => {
    const initializeSettings = async () => {
      try {
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
        console.error("Error initializing settings:", error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeSettings();
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
    // Delegate to AuthContext
    updateUserProfile(updates);
  }, [updateUserProfile]);

  const setUser = useCallback((_newUser: UserProfile | null) => {
    // This is now managed by AuthContext - no-op for backwards compatibility
    console.warn("setUser is deprecated, user state is managed by AuthContext");
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
    return profileId === userProfile?.id;
  }, [userProfile?.id]);

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
    authLogout();
  }, [authLogout]);

  const softDeleteAccount = useCallback(() => {
    // This would need proper implementation with Firebase
    console.warn("softDeleteAccount not yet implemented with Firebase");
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <UserContext.Provider
      value={{
        user: userProfile,
        isAuthenticated: authIsAuthenticated,
        isLoading: authIsLoading || isLoading,
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
