// User Service - Handles all user-related operations
// TODO: Replace localStorage with API calls when backend is ready

const STORAGE_KEYS = {
  USER: "notehall_user",
  PREFERENCES: "notehall_preferences",
  PRIVACY: "notehall_privacy",
} as const;

// Mock delay to simulate API calls
const mockDelay = (ms: number = 300) => new Promise(resolve => setTimeout(resolve, ms));

export const userService = {
  // Get user profile from storage
  async getUser(): Promise<any | null> {
    await mockDelay();
    const stored = localStorage.getItem(STORAGE_KEYS.USER);
    return stored ? JSON.parse(stored) : null;
  },

  // Save user profile to storage
  async saveUser(user: any): Promise<void> {
    await mockDelay();
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
  },

  // Update user profile
  async updateUser(updates: any): Promise<any> {
    await mockDelay();
    const current = await this.getUser();
    const updated = { ...current, ...updates };
    await this.saveUser(updated);
    return updated;
  },

  // Get user preferences
  async getPreferences(): Promise<any | null> {
    await mockDelay();
    const stored = localStorage.getItem(STORAGE_KEYS.PREFERENCES);
    return stored ? JSON.parse(stored) : null;
  },

  // Save user preferences
  async savePreferences(prefs: any): Promise<void> {
    await mockDelay();
    localStorage.setItem(STORAGE_KEYS.PREFERENCES, JSON.stringify(prefs));
  },

  // Get privacy settings
  async getPrivacySettings(): Promise<any | null> {
    await mockDelay();
    const stored = localStorage.getItem(STORAGE_KEYS.PRIVACY);
    return stored ? JSON.parse(stored) : null;
  },

  // Save privacy settings
  async savePrivacySettings(settings: any): Promise<void> {
    await mockDelay();
    localStorage.setItem(STORAGE_KEYS.PRIVACY, JSON.stringify(settings));
  },

  // Soft delete account (mark as inactive)
  async softDeleteAccount(userId: string): Promise<void> {
    await mockDelay();
    const user = await this.getUser();
    if (user) {
      await this.saveUser({ ...user, isActive: false, deletedAt: new Date().toISOString() });
    }
  },

  // Reactivate account
  async reactivateAccount(userId: string): Promise<void> {
    await mockDelay();
    const user = await this.getUser();
    if (user) {
      await this.saveUser({ ...user, isActive: true, deletedAt: undefined });
    }
  },
};
