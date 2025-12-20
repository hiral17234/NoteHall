import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Check, GraduationCap, BookOpen, Loader2 } from "lucide-react";
import logo from "@/assets/logo.png";

interface OnboardingDialogProps {
  open: boolean;
  onComplete: (data: OnboardingData) => void;
  userName?: string;
}

interface OnboardingData {
  year: string;
  branch: string;
  college: string;
  interests: string[];
}

const subjectInterests = [
  { id: "mathematics", label: "Mathematics" },
  { id: "computer-science", label: "Computer Science" },
  { id: "coding", label: "Coding & Programming" },
  { id: "core-subjects", label: "Core Engineering" },
  { id: "physics", label: "Physics" },
  { id: "electronics", label: "Electronics" },
  { id: "data-science", label: "Data Science & AI" },
];

export function OnboardingDialog({ open, onComplete, userName }: OnboardingDialogProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    year: "",
    customYear: "",
    branch: "",
    college: "",
    interests: [] as string[],
    customInterest: "",
  });

  const toggleInterest = (id: string) => {
    setFormData(prev => ({
      ...prev,
      interests: prev.interests.includes(id)
        ? prev.interests.filter(i => i !== id)
        : [...prev.interests, id]
    }));
  };

  const addCustomInterest = () => {
    if (formData.customInterest.trim() && !formData.interests.includes(formData.customInterest.trim())) {
      setFormData(prev => ({
        ...prev,
        interests: [...prev.interests, prev.customInterest.trim()],
        customInterest: ""
      }));
    }
  };

  const handleSubmit = async () => {
    if (!formData.college) {
      toast({ title: "College name required", variant: "destructive" });
      return;
    }

    const year = formData.year === "custom" ? formData.customYear : formData.year;
    if (!year) {
      toast({ title: "Year required", variant: "destructive" });
      return;
    }

    if (!formData.branch) {
      toast({ title: "Branch required", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    
    try {
      await onComplete({
        year,
        branch: formData.branch,
        college: formData.college,
        interests: formData.interests,
      });
    } catch (error) {
      toast({ title: "Failed to save", description: "Please try again", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader className="text-center">
          <div className="flex justify-center mb-2">
            <img src={logo} alt="NoteHall" className="h-12 w-auto" />
          </div>
          <DialogTitle className="text-xl flex items-center justify-center gap-2">
            <GraduationCap className="w-5 h-5 text-primary" />
            {userName ? `Welcome, ${userName}!` : "Complete Your Profile"}
          </DialogTitle>
          <DialogDescription>
            Help us personalize your experience with better recommendations
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 mt-4">
          {/* College */}
          <div className="space-y-2">
            <Label htmlFor="college">College Name *</Label>
            <Input
              id="college"
              placeholder="e.g., MITS Gwalior"
              value={formData.college}
              onChange={(e) => setFormData({ ...formData, college: e.target.value })}
            />
          </div>

          {/* Year & Branch */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Year *</Label>
              <Select
                value={formData.year}
                onValueChange={(value) => setFormData({ ...formData, year: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select year" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1st Year">1st Year</SelectItem>
                  <SelectItem value="2nd Year">2nd Year</SelectItem>
                  <SelectItem value="3rd Year">3rd Year</SelectItem>
                  <SelectItem value="4th Year">4th Year</SelectItem>
                  <SelectItem value="custom">Other</SelectItem>
                </SelectContent>
              </Select>
              {formData.year === "custom" && (
                <Input
                  placeholder="Enter year"
                  value={formData.customYear}
                  onChange={(e) => setFormData({ ...formData, customYear: e.target.value })}
                  className="mt-2"
                />
              )}
            </div>

            <div className="space-y-2">
              <Label>Branch *</Label>
              <Input
                placeholder="e.g., CSE, ECE"
                value={formData.branch}
                onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
              />
            </div>
          </div>

          {/* Subject Interests */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              Subject Interests (Select all that apply)
            </Label>
            <div className="flex flex-wrap gap-2">
              {subjectInterests.map((subject) => (
                <Badge
                  key={subject.id}
                  variant={formData.interests.includes(subject.id) ? "default" : "outline"}
                  className={`cursor-pointer transition-all ${
                    formData.interests.includes(subject.id)
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-muted"
                  }`}
                  onClick={() => toggleInterest(subject.id)}
                >
                  {formData.interests.includes(subject.id) && (
                    <Check className="w-3 h-3 mr-1" />
                  )}
                  {subject.label}
                </Badge>
              ))}
            </div>

            {/* Custom interest */}
            <div className="flex gap-2 mt-2">
              <Input
                placeholder="Add other interest..."
                value={formData.customInterest}
                onChange={(e) => setFormData({ ...formData, customInterest: e.target.value })}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCustomInterest())}
                className="flex-1"
              />
              <Button type="button" variant="outline" onClick={addCustomInterest}>
                Add
              </Button>
            </div>
          </div>

          <Button
            onClick={handleSubmit}
            className="w-full bg-primary hover:bg-primary/90"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Setting up...
              </>
            ) : (
              "Complete Setup"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
