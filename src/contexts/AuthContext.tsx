import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { 
  User,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  updateProfile
} from "firebase/auth";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { auth, db, googleProvider, githubProvider, getServerTimestamp } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";

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
  interests: string[];
  onboardingComplete: boolean;
  createdAt: any;
  updatedAt: any;
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

interface AuthContextType {
  firebaseUser: User | null;
  userProfile: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  needsOnboarding: boolean;
  
  // Auth methods
  signUp: (email: string, password: string, name: string, username: string) => Promise<{ error?: string }>;
  login: (email: string, password: string) => Promise<{ error?: string }>;
  loginWithGoogle: () => Promise<{ error?: string; needsOnboarding?: boolean }>;
  loginWithGitHub: () => Promise<{ error?: string; needsOnboarding?: boolean }>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error?: string }>;
  
  // Profile methods
  updateUserProfile: (updates: Partial<UserProfile>) => Promise<void>;
  completeOnboarding: (data: Partial<UserProfile>) => Promise<void>;
  refreshUserProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const defaultStats = {
  uploads: 0,
  totalLikes: 0,
  totalViews: 0,
  helpedRequests: 0,
  contributionScore: 0,
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);

  // Fetch user profile from Firestore
  const fetchUserProfile = useCallback(async (uid: string): Promise<UserProfile | null> => {
    try {
      const userRef = doc(db, "users", uid);
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists()) {
        const data = userSnap.data() as UserProfile;
        return { ...data, id: uid };
      }
      return null;
    } catch (error) {
      console.error("Error fetching user profile:", error);
      return null;
    }
  }, []);

  // Create initial user profile
  const createUserProfile = async (
    uid: string, 
    email: string, 
    name: string, 
    username: string,
    avatar?: string
  ): Promise<UserProfile> => {
    const newProfile: Omit<UserProfile, 'id'> = {
      name,
      username,
      email,
      bio: "New to NoteHall! 🚀",
      college: "",
      branch: "",
      year: "",
      degree: "btech",
      avatar: avatar || "",
      github: "",
      linkedin: "",
      portfolio: "",
      instagram: "",
      twitter: "",
      streak: 0,
      lastActiveDate: new Date().toISOString(),
      isActive: true,
      interests: [],
      onboardingComplete: false,
      createdAt: getServerTimestamp(),
      updatedAt: getServerTimestamp(),
      stats: defaultStats,
      badges: [],
    };

    await setDoc(doc(db, "users", uid), newProfile);
    return { ...newProfile, id: uid };
  };

  // Listen to auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      
      if (user) {
        const profile = await fetchUserProfile(user.uid);
        if (profile) {
          setUserProfile(profile);
          setNeedsOnboarding(!profile.onboardingComplete);
        } else {
          setNeedsOnboarding(true);
        }
      } else {
        setUserProfile(null);
        setNeedsOnboarding(false);
      }
      
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [fetchUserProfile]);

  const signUp = async (email: string, password: string, name: string, username: string) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(userCredential.user, { displayName: name });
      
      const profile = await createUserProfile(
        userCredential.user.uid,
        email,
        name,
        username
      );
      
      setUserProfile(profile);
      setNeedsOnboarding(true);
      
      return {};
    } catch (error: any) {
      console.error("Signup error:", error);
      
      let errorMessage = "Failed to create account";
      if (error.code === "auth/email-already-in-use") {
        errorMessage = "Email already registered";
      } else if (error.code === "auth/weak-password") {
        errorMessage = "Password too weak";
      } else if (error.code === "auth/invalid-email") {
        errorMessage = "Invalid email format";
      }
      
      return { error: errorMessage };
    }
  };

  const login = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      return {};
    } catch (error: any) {
      console.error("Login error:", error);
      
      let errorMessage = "Invalid credentials";
      if (error.code === "auth/user-not-found") {
        errorMessage = "No account found with this email";
      } else if (error.code === "auth/wrong-password") {
        errorMessage = "Incorrect password";
      } else if (error.code === "auth/invalid-email") {
        errorMessage = "Invalid email format";
      } else if (error.code === "auth/too-many-requests") {
        errorMessage = "Too many attempts. Try again later";
      }
      
      return { error: errorMessage };
    }
  };

  const loginWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      
      // Check if profile exists
      let profile = await fetchUserProfile(user.uid);
      
      if (!profile) {
        // Create new profile for Google user
        const username = user.email?.split("@")[0] || `user_${Date.now()}`;
        profile = await createUserProfile(
          user.uid,
          user.email || "",
          user.displayName || "Google User",
          username,
          user.photoURL || ""
        );
        setNeedsOnboarding(true);
      }
      
      setUserProfile(profile);
      return { needsOnboarding: !profile.onboardingComplete };
    } catch (error: any) {
      console.error("Google login error:", error);
      return { error: "Google sign-in failed" };
    }
  };

  const loginWithGitHub = async () => {
    try {
      const result = await signInWithPopup(auth, githubProvider);
      const user = result.user;
      
      let profile = await fetchUserProfile(user.uid);
      
      if (!profile) {
        const username = user.email?.split("@")[0] || `github_${Date.now()}`;
        profile = await createUserProfile(
          user.uid,
          user.email || "",
          user.displayName || "GitHub User",
          username,
          user.photoURL || ""
        );
        setNeedsOnboarding(true);
      }
      
      setUserProfile(profile);
      return { needsOnboarding: !profile.onboardingComplete };
    } catch (error: any) {
      console.error("GitHub login error:", error);
      return { error: "GitHub sign-in failed" };
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setUserProfile(null);
      toast({ title: "Logged out", description: "See you soon!" });
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const resetPassword = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
      return {};
    } catch (error: any) {
      return { error: "Failed to send reset email" };
    }
  };

  const updateUserProfile = async (updates: Partial<UserProfile>) => {
    if (!firebaseUser) return;
    
    try {
      const userRef = doc(db, "users", firebaseUser.uid);
      await updateDoc(userRef, {
        ...updates,
        updatedAt: getServerTimestamp(),
      });
      
      setUserProfile(prev => prev ? { ...prev, ...updates } : null);
    } catch (error) {
      console.error("Error updating profile:", error);
      throw error;
    }
  };

  const completeOnboarding = async (data: Partial<UserProfile>) => {
    if (!firebaseUser) return;
    
    try {
      const userRef = doc(db, "users", firebaseUser.uid);
      await updateDoc(userRef, {
        ...data,
        onboardingComplete: true,
        updatedAt: getServerTimestamp(),
      });
      
      setUserProfile(prev => prev ? { ...prev, ...data, onboardingComplete: true } : null);
      setNeedsOnboarding(false);
      
      toast({
        title: "Welcome to NoteHall! 🎉",
        description: "Your profile is set up. Start exploring notes!",
      });
    } catch (error) {
      console.error("Error completing onboarding:", error);
      throw error;
    }
  };

  const refreshUserProfile = async () => {
    if (!firebaseUser) return;
    const profile = await fetchUserProfile(firebaseUser.uid);
    if (profile) {
      setUserProfile(profile);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        firebaseUser,
        userProfile,
        isAuthenticated: !!firebaseUser && !!userProfile,
        isLoading,
        needsOnboarding,
        signUp,
        login,
        loginWithGoogle,
        loginWithGitHub,
        logout,
        resetPassword,
        updateUserProfile,
        completeOnboarding,
        refreshUserProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
