// Auth Service - Handles authentication operations
// TODO: Replace with actual API calls when backend is ready

export interface AuthUser {
  id: string;
  email: string;
  phone?: string;
  name: string;
  username: string;
  avatar?: string;
}

export interface SignUpData {
  name: string;
  username: string;
  email: string;
  phone?: string;
  password: string;
}

export interface LoginData {
  emailOrUsername: string;
  password: string;
}

const STORAGE_KEY = "notehall_auth";
const USERS_KEY = "notehall_users";

// Mock delay to simulate API calls
const mockDelay = (ms: number = 500) => new Promise(resolve => setTimeout(resolve, ms));

// Mock users database
const getMockUsers = (): Record<string, AuthUser & { password: string }> => {
  const stored = localStorage.getItem(USERS_KEY);
  return stored ? JSON.parse(stored) : {};
};

const saveMockUsers = (users: Record<string, AuthUser & { password: string }>) => {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
};

export const authService = {
  // Check if username is unique
  async checkUsernameAvailable(username: string): Promise<boolean> {
    await mockDelay(200);
    const users = getMockUsers();
    return !Object.values(users).some(u => u.username.toLowerCase() === username.toLowerCase());
  },

  // Check if email is already registered
  async checkEmailAvailable(email: string): Promise<boolean> {
    await mockDelay(200);
    const users = getMockUsers();
    return !Object.values(users).some(u => u.email.toLowerCase() === email.toLowerCase());
  },

  // Sign up new user
  async signUp(data: SignUpData): Promise<{ user: AuthUser; error?: string }> {
    await mockDelay();
    
    // Check username availability
    const usernameAvailable = await this.checkUsernameAvailable(data.username);
    if (!usernameAvailable) {
      return { user: null as any, error: "Username already taken" };
    }

    // Check email availability
    const emailAvailable = await this.checkEmailAvailable(data.email);
    if (!emailAvailable) {
      return { user: null as any, error: "Email already registered" };
    }

    const users = getMockUsers();
    const userId = `user-${Date.now()}`;
    
    const newUser: AuthUser & { password: string } = {
      id: userId,
      email: data.email,
      phone: data.phone,
      name: data.name,
      username: data.username,
      password: data.password, // In real app, this would be hashed
    };

    users[userId] = newUser;
    saveMockUsers(users);

    const { password, ...authUser } = newUser;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(authUser));

    return { user: authUser };
  },

  // Login user
  async login(data: LoginData): Promise<{ user: AuthUser | null; error?: string }> {
    await mockDelay();
    
    const users = getMockUsers();
    const user = Object.values(users).find(
      u => (u.email.toLowerCase() === data.emailOrUsername.toLowerCase() || 
            u.username.toLowerCase() === data.emailOrUsername.toLowerCase()) &&
           u.password === data.password
    );

    if (!user) {
      return { user: null, error: "Invalid credentials" };
    }

    const { password, ...authUser } = user;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(authUser));

    return { user: authUser };
  },

  // Login with Google (mock)
  async loginWithGoogle(): Promise<{ user: AuthUser | null; error?: string }> {
    await mockDelay(1000);
    
    // Mock Google login - creates a demo user
    const mockGoogleUser: AuthUser = {
      id: `google-${Date.now()}`,
      email: "demo@gmail.com",
      name: "Google User",
      username: `google_user_${Date.now()}`,
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(mockGoogleUser));
    return { user: mockGoogleUser };
  },

  // Login with GitHub (mock)
  async loginWithGitHub(): Promise<{ user: AuthUser | null; error?: string }> {
    await mockDelay(1000);
    
    // Mock GitHub login - creates a demo user
    const mockGitHubUser: AuthUser = {
      id: `github-${Date.now()}`,
      email: "demo@github.com",
      name: "GitHub User",
      username: `github_user_${Date.now()}`,
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(mockGitHubUser));
    return { user: mockGitHubUser };
  },

  // Logout user
  async logout(): Promise<void> {
    await mockDelay(200);
    localStorage.removeItem(STORAGE_KEY);
  },

  // Get current auth user
  async getCurrentUser(): Promise<AuthUser | null> {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  },

  // Check if user is authenticated
  async isAuthenticated(): Promise<boolean> {
    const user = await this.getCurrentUser();
    return !!user;
  },
};
