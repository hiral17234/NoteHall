import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { UserProvider } from "@/contexts/UserContext";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { SavedNotesProvider } from "@/contexts/SavedNotesContext";
import { SearchProvider } from "@/contexts/SearchContext";
import { HelpRequestsProvider } from "@/contexts/HelpRequestsContext";
import Index from "./pages/Index";
import Upload from "./pages/Upload";
import HelpDesk from "./pages/HelpDesk";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import Gemini from "./pages/Gemini";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Placeholder from "./pages/Placeholder";
import NotFound from "./pages/NotFound";
import { OnboardingDialog } from "@/components/onboarding/OnboardingDialog";

const queryClient = new QueryClient();

// Protected Route wrapper - only used inside AuthProvider
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
}

// Auth Route wrapper - only used inside AuthProvider
function AuthRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
}

// Onboarding dialog - only used inside AuthProvider
function OnboardingWrapper() {
  const { needsOnboarding, completeOnboarding, userProfile } = useAuth();
  
  return (
    <OnboardingDialog 
      open={needsOnboarding} 
      onComplete={completeOnboarding}
      userName={userProfile?.name}
    />
  );
}

// All routes and auth-dependent components - MUST be inside AuthProvider
function AuthenticatedApp() {
  return (
    <UserProvider>
      <SavedNotesProvider>
        <HelpRequestsProvider>
          <SearchProvider>
            <Routes>
              <Route path="/login" element={<AuthRoute><Login /></AuthRoute>} />
              <Route path="/signup" element={<AuthRoute><Signup /></AuthRoute>} />
              <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
              <Route path="/upload" element={<ProtectedRoute><Upload /></ProtectedRoute>} />
              <Route path="/helpdesk" element={<ProtectedRoute><HelpDesk /></ProtectedRoute>} />
              <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
              <Route path="/profile/:userId" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
              <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
              <Route path="/gemini" element={<ProtectedRoute><Gemini /></ProtectedRoute>} />
              <Route 
                path="/campusvoice" 
                element={<Placeholder title="CampusVoice" description="Share your campus experiences and feedback. Coming soon!" externalUrl="https://campusvoice-git-main-hiral-goyals-projects.vercel.app/" />} 
              />
              <Route 
                path="/campusbuzz" 
                element={<Placeholder title="CampusBuzz" description="Stay updated with the latest campus news and events. Coming soon!" />} 
              />
              <Route path="*" element={<NotFound />} />
            </Routes>
            <OnboardingWrapper />
          </SearchProvider>
        </HelpRequestsProvider>
      </SavedNotesProvider>
    </UserProvider>
  );
}

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <AuthenticatedApp />
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
