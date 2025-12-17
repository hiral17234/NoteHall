import { createContext, useContext, useState, ReactNode } from "react";

export interface UserProfile {
  id: string;
  name: string;
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

interface ProfileContextType {
  profile: UserProfile;
  updateProfile: (updates: Partial<UserProfile>) => void;
  isOwner: (profileId: string) => boolean;
}

const defaultProfile: UserProfile = {
  id: "current-user",
  name: "John Doe",
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

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<UserProfile>(defaultProfile);

  const updateProfile = (updates: Partial<UserProfile>) => {
    setProfile(prev => ({ ...prev, ...updates }));
  };

  const isOwner = (profileId: string) => {
    return profileId === profile.id || profileId === "current-user";
  };

  return (
    <ProfileContext.Provider value={{ profile, updateProfile, isOwner }}>
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  const context = useContext(ProfileContext);
  if (!context) {
    throw new Error("useProfile must be used within a ProfileProvider");
  }
  return context;
}
