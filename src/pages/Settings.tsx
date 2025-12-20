import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { User, Bell, Shield, Palette, LogOut, AlertTriangle, Key, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/contexts/UserContext";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "@/lib/firebase";

export default function Settings() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user, updateUser, preferences, updatePreferences, privacy, updatePrivacy, softDeleteAccount } = useUser();
  const { userProfile } = useAuth();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [passwordResetLoading, setPasswordResetLoading] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
    college: user?.college || "MITS Gwalior",
    branch: user?.branch || "",
    year: user?.year || "",
    github: user?.github || "",
    linkedin: user?.linkedin || "",
    portfolio: user?.portfolio || "",
    instagram: user?.instagram || "",
    twitter: user?.twitter || "",
  });

  const handleSaveAccount = () => {
    updateUser({
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      college: formData.college,
      branch: formData.branch,
      year: formData.year,
      github: formData.github,
      linkedin: formData.linkedin,
      portfolio: formData.portfolio,
      instagram: formData.instagram,
      twitter: formData.twitter,
    });
    toast({
      title: "Settings saved",
      description: "Your profile has been updated everywhere.",
    });
  };

  const handleNotificationChange = (key: keyof typeof preferences.notifications, value: boolean) => {
    updatePreferences({
      notifications: { ...preferences.notifications, [key]: value },
    });
    toast({
      title: "Notification preference updated",
      description: `${key.charAt(0).toUpperCase() + key.slice(1)} notifications ${value ? "enabled" : "disabled"}.`,
    });
  };

  const handlePrivacyChange = (key: keyof typeof privacy, value: boolean) => {
    updatePrivacy({ [key]: value });
    toast({
      title: "Privacy setting updated",
      description: "Your privacy preferences have been saved.",
    });
  };

  const handleThemeChange = (theme: "light" | "dark" | "system") => {
    updatePreferences({ theme });
    toast({
      title: "Theme changed",
      description: `Theme set to ${theme}.`,
    });
  };

  const handleFontSizeChange = (fontSize: "small" | "medium" | "large") => {
    updatePreferences({ fontSize });
    toast({
      title: "Font size changed",
      description: `Font size set to ${fontSize}.`,
    });
  };

  const handleCompactModeChange = (compactMode: boolean) => {
    updatePreferences({ compactMode });
    toast({
      title: "Compact mode " + (compactMode ? "enabled" : "disabled"),
    });
  };

  const handleDeleteAccount = () => {
    softDeleteAccount();
    setDeleteDialogOpen(false);
    toast({
      title: "Account deactivated",
      description: "Your account has been deactivated. You can log back in to reactivate.",
    });
    navigate("/login");
  };

  return (
    <MainLayout>
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground">Manage your account preferences</p>
        </div>

        <Tabs defaultValue="account" className="space-y-6">
          <TabsList className="bg-muted">
            <TabsTrigger value="account" className="gap-1.5 data-[state=active]:bg-card">
              <User className="w-4 h-4" />
              Account
            </TabsTrigger>
            <TabsTrigger value="notifications" className="gap-1.5 data-[state=active]:bg-card">
              <Bell className="w-4 h-4" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="privacy" className="gap-1.5 data-[state=active]:bg-card">
              <Shield className="w-4 h-4" />
              Privacy
            </TabsTrigger>
            <TabsTrigger value="appearance" className="gap-1.5 data-[state=active]:bg-card">
              <Palette className="w-4 h-4" />
              Appearance
            </TabsTrigger>
          </TabsList>

          <TabsContent value="account">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle>Account Information</CardTitle>
                <CardDescription>Update your personal details - changes reflect everywhere</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input 
                      id="name" 
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="bg-background" 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone (Private)</Label>
                    <Input 
                      id="phone" 
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="bg-background" 
                      placeholder="+91 9876543210"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">Email (Private)</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="bg-background" 
                  />
                  <p className="text-xs text-muted-foreground">Your email is private and not visible to others</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="college">College</Label>
                  <Input 
                    id="college" 
                    value={formData.college}
                    onChange={(e) => setFormData({ ...formData, college: e.target.value })}
                    className="bg-background" 
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Branch</Label>
                    <Select value={formData.branch} onValueChange={(v) => setFormData({ ...formData, branch: v })}>
                      <SelectTrigger className="bg-background">
                        <SelectValue placeholder="Select branch" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Computer Science">CSE</SelectItem>
                        <SelectItem value="ECE">ECE</SelectItem>
                        <SelectItem value="EEE">EEE</SelectItem>
                        <SelectItem value="ME">ME</SelectItem>
                        <SelectItem value="CE">CE</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Year</Label>
                    <Select value={formData.year} onValueChange={(v) => setFormData({ ...formData, year: v })}>
                      <SelectTrigger className="bg-background">
                        <SelectValue placeholder="Select year" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1st Year">1st Year</SelectItem>
                        <SelectItem value="2nd Year">2nd Year</SelectItem>
                        <SelectItem value="3rd Year">3rd Year</SelectItem>
                        <SelectItem value="4th Year">4th Year</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h4 className="font-medium text-foreground">Social Links</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="github">GitHub</Label>
                      <Input 
                        id="github" 
                        value={formData.github}
                        onChange={(e) => setFormData({ ...formData, github: e.target.value })}
                        className="bg-background" 
                        placeholder="username"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="linkedin">LinkedIn</Label>
                      <Input 
                        id="linkedin" 
                        value={formData.linkedin}
                        onChange={(e) => setFormData({ ...formData, linkedin: e.target.value })}
                        className="bg-background" 
                        placeholder="username"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="portfolio">Portfolio</Label>
                      <Input 
                        id="portfolio" 
                        value={formData.portfolio}
                        onChange={(e) => setFormData({ ...formData, portfolio: e.target.value })}
                        className="bg-background" 
                        placeholder="yoursite.dev"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="instagram">Instagram</Label>
                      <Input 
                        id="instagram" 
                        value={formData.instagram}
                        onChange={(e) => setFormData({ ...formData, instagram: e.target.value })}
                        className="bg-background" 
                        placeholder="username"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="twitter">X (Twitter)</Label>
                    <Input 
                      id="twitter" 
                      value={formData.twitter}
                      onChange={(e) => setFormData({ ...formData, twitter: e.target.value })}
                      className="bg-background" 
                      placeholder="username"
                    />
                  </div>
                </div>

                <Button onClick={handleSaveAccount} className="bg-primary hover:bg-primary/90 text-primary-foreground">
                  Save Changes
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>Choose what updates you receive in real-time</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">Note Likes</p>
                    <p className="text-sm text-muted-foreground">Get notified when someone likes your notes</p>
                  </div>
                  <Switch 
                    checked={preferences.notifications.likes}
                    onCheckedChange={(checked) => handleNotificationChange("likes", checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">Help Requests</p>
                    <p className="text-sm text-muted-foreground">Get notified about new help requests</p>
                  </div>
                  <Switch 
                    checked={preferences.notifications.helpRequests}
                    onCheckedChange={(checked) => handleNotificationChange("helpRequests", checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">Request Fulfilled</p>
                    <p className="text-sm text-muted-foreground">Get notified when your request is fulfilled</p>
                  </div>
                  <Switch 
                    checked={preferences.notifications.requestFulfilled}
                    onCheckedChange={(checked) => handleNotificationChange("requestFulfilled", checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">Weekly Digest</p>
                    <p className="text-sm text-muted-foreground">Receive weekly summary of activity</p>
                  </div>
                  <Switch 
                    checked={preferences.notifications.weeklyDigest}
                    onCheckedChange={(checked) => handleNotificationChange("weeklyDigest", checked)}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="privacy">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle>Privacy Settings</CardTitle>
                <CardDescription>Control your data and visibility</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">Public Profile</p>
                    <p className="text-sm text-muted-foreground">Allow others to view your profile</p>
                  </div>
                  <Switch 
                    checked={privacy.publicProfile}
                    onCheckedChange={(checked) => handlePrivacyChange("publicProfile", checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">Show Online Status</p>
                    <p className="text-sm text-muted-foreground">Display your online status to others</p>
                  </div>
                  <Switch 
                    checked={privacy.showOnlineStatus}
                    onCheckedChange={(checked) => handlePrivacyChange("showOnlineStatus", checked)}
                  />
                </div>
                
                <Separator />

                <div className="space-y-4">
                  <h4 className="font-medium text-foreground flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-destructive" />
                    Danger Zone
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Deleting your account will deactivate it. You can log back in anytime to reactivate.
                  </p>
                  <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="destructive" className="gap-2">
                        <LogOut className="w-4 h-4" />
                        Delete Account
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Deactivate Account?</DialogTitle>
                        <DialogDescription>
                          Your account will be deactivated but not permanently deleted. 
                          You can log back in anytime to reactivate your account and access your data.
                        </DialogDescription>
                      </DialogHeader>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button variant="destructive" onClick={handleDeleteAccount}>
                          Deactivate Account
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="appearance">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle>Appearance</CardTitle>
                <CardDescription>Customize how NoteHall looks</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>Theme</Label>
                  <Select value={preferences.theme} onValueChange={handleThemeChange}>
                    <SelectTrigger className="bg-background">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">Light</SelectItem>
                      <SelectItem value="dark">Dark</SelectItem>
                      <SelectItem value="system">System</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Font Size</Label>
                  <Select value={preferences.fontSize} onValueChange={handleFontSizeChange}>
                    <SelectTrigger className="bg-background">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="small">Small</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="large">Large</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">Compact Mode</p>
                    <p className="text-sm text-muted-foreground">Reduce spacing between elements</p>
                  </div>
                  <Switch 
                    checked={preferences.compactMode}
                    onCheckedChange={handleCompactModeChange}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
