import { useState } from "react";
import { Camera, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface ProfileData {
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
}

interface EditProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile: ProfileData | null;
  onSave: (profile: ProfileData) => void;
}

const defaultProfile: ProfileData = {
  name: "",
  bio: "",
  college: "",
  branch: "",
  year: "",
  degree: "",
  avatar: "",
  github: "",
  linkedin: "",
  portfolio: "",
  instagram: "",
  twitter: "",
};

export function EditProfileDialog({ open, onOpenChange, profile, onSave }: EditProfileDialogProps) {
  const safeProfile = profile ?? defaultProfile;
  const [formData, setFormData] = useState<ProfileData>(safeProfile);
  const [previewAvatar, setPreviewAvatar] = useState<string>(safeProfile.avatar);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setPreviewAvatar(result);
        setFormData({ ...formData, avatar: result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    onSave(formData);
    toast({
      title: "Profile updated!",
      description: "Your changes have been saved successfully.",
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
          <DialogDescription>
            Update your profile information
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Avatar Upload */}
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <Avatar className="w-24 h-24 border-4 border-primary/20">
                <AvatarImage src={previewAvatar} />
                <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                  {formData.name.split(" ").map(n => n[0]).join("")}
                </AvatarFallback>
              </Avatar>
              <label
                htmlFor="avatar-upload"
                className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center cursor-pointer hover:bg-primary/90 transition-colors"
              >
                <Camera className="w-4 h-4" />
                <input
                  id="avatar-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarChange}
                />
              </label>
            </div>
            <p className="text-sm text-muted-foreground">Click the camera icon to change photo</p>
          </div>

          {/* Basic Info */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Bio (supports emojis 😄🔥📚)</Label>
              <Textarea
                id="bio"
                placeholder="Tell us about yourself..."
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="college">College</Label>
              <Input
                id="college"
                value={formData.college}
                onChange={(e) => setFormData({ ...formData, college: e.target.value })}
                placeholder="e.g., MITS Gwalior"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label>Degree</Label>
                <Select
                  value={formData.degree}
                  onValueChange={(value) => setFormData({ ...formData, degree: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Degree" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="btech">B.Tech</SelectItem>
                    <SelectItem value="mtech">M.Tech</SelectItem>
                    <SelectItem value="bsc">B.Sc</SelectItem>
                    <SelectItem value="msc">M.Sc</SelectItem>
                    <SelectItem value="mca">MCA</SelectItem>
                    <SelectItem value="bca">BCA</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Branch</Label>
                <Select
                  value={formData.branch}
                  onValueChange={(value) => setFormData({ ...formData, branch: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Branch" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Computer Science">CSE</SelectItem>
                    <SelectItem value="Electronics">ECE</SelectItem>
                    <SelectItem value="Electrical">EEE</SelectItem>
                    <SelectItem value="Mechanical">ME</SelectItem>
                    <SelectItem value="Civil">CE</SelectItem>
                    <SelectItem value="IT">IT</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Year</Label>
                <Select
                  value={formData.year}
                  onValueChange={(value) => setFormData({ ...formData, year: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Year" />
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
          </div>

          {/* Social Links */}
          <div className="space-y-4">
            <Label className="text-base font-semibold">Social Links</Label>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="github" className="text-xs">GitHub</Label>
                <Input
                  id="github"
                  placeholder="username"
                  value={formData.github}
                  onChange={(e) => setFormData({ ...formData, github: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="linkedin" className="text-xs">LinkedIn</Label>
                <Input
                  id="linkedin"
                  placeholder="username"
                  value={formData.linkedin}
                  onChange={(e) => setFormData({ ...formData, linkedin: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="portfolio" className="text-xs">Portfolio</Label>
                <Input
                  id="portfolio"
                  placeholder="yoursite.dev"
                  value={formData.portfolio}
                  onChange={(e) => setFormData({ ...formData, portfolio: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="instagram" className="text-xs">Instagram</Label>
                <Input
                  id="instagram"
                  placeholder="username"
                  value={formData.instagram}
                  onChange={(e) => setFormData({ ...formData, instagram: e.target.value })}
                />
              </div>
              <div className="space-y-2 col-span-2">
                <Label htmlFor="twitter" className="text-xs">X (Twitter)</Label>
                <Input
                  id="twitter"
                  placeholder="username"
                  value={formData.twitter}
                  onChange={(e) => setFormData({ ...formData, twitter: e.target.value })}
                />
              </div>
            </div>
          </div>

          <Button onClick={handleSave} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
            Save Changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
