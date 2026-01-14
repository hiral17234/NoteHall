import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SelectWithOther } from "@/components/ui/select-with-other";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { FileText, Image, Video, Link, Upload as UploadIcon, X, CheckCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { cloudinaryService } from "@/services/cloudinaryService";
import { notesService } from "@/services/firestoreService";

const uploadTypes = [
  { id: "pdf", label: "PDF Document", icon: FileText, accept: ".pdf" },
  { id: "image", label: "Image", icon: Image, accept: "image/*" },
  { id: "video", label: "Short Video", icon: Video, accept: "video/*" },
  { id: "link", label: "External Link", icon: Link, accept: "" },
];

export default function Upload() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { userProfile } = useAuth();
  
  const [selectedType, setSelectedType] = useState<string>("pdf");
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    subject: "",
    branch: "",
    year: "",
    topic: "",
    link: "",
  });
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Validate file
      const validation = cloudinaryService.validateFile(selectedFile);
      if (!validation.valid) {
        toast({
          title: "Invalid file",
          description: validation.error,
          variant: "destructive",
        });
        return;
      }
      setFile(selectedFile);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!userProfile) {
      toast({
        title: "Not logged in",
        description: "Please login to upload notes",
        variant: "destructive",
      });
      return;
    }

    if (!formData.title || !formData.subject || !formData.branch || !formData.year) {
      toast({
        title: "Missing fields",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    if (selectedType !== "link" && !file) {
      toast({
        title: "No file selected",
        description: "Please select a file to upload",
        variant: "destructive",
      });
      return;
    }

    if (selectedType === "link" && !formData.link) {
      toast({
        title: "Missing link",
        description: "Please enter a valid URL",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      let fileUrl = formData.link;

      // Upload file to Cloudinary if not a link
      if (selectedType !== "link" && file) {
        const result = await cloudinaryService.uploadFile(file, (progress) => {
          setUploadProgress(progress);
        });
        fileUrl = result.secure_url;
      }

      // Create note in Firestore
      await notesService.create({
        title: formData.title,
        description: formData.description,
        subject: formData.subject,
        branch: formData.branch,
        year: formData.year,
        topic: formData.topic,
        fileType: selectedType as 'pdf' | 'image' | 'video' | 'link',
        fileUrl: fileUrl,
        authorId: userProfile.id,
        authorName: userProfile.name,
        authorUsername: userProfile.username,
        isTrusted: false,
      });

      toast({
        title: "Note uploaded successfully!",
        description: "Your note has been shared with the community.",
      });

      // Reset form
      setFormData({ title: "", description: "", subject: "", branch: "", year: "", topic: "", link: "" });
      setFile(null);
      setUploadProgress(0);
      
      // Navigate to home
      navigate("/");
    } catch (error) {
      console.error("Upload error:", error);
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <MainLayout>
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">Upload Note</h1>
          <p className="text-muted-foreground">Share your study materials with the community</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Upload Type Selection */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-lg">Select File Type</CardTitle>
              <CardDescription>Choose the type of content you want to upload</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {uploadTypes.map((type) => (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => {
                      setSelectedType(type.id);
                      setFile(null);
                    }}
                    className={cn(
                      "flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all",
                      selectedType === type.id
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-primary/50 hover:bg-muted"
                    )}
                  >
                    <type.icon className={cn(
                      "w-6 h-6",
                      selectedType === type.id ? "text-primary" : "text-muted-foreground"
                    )} />
                    <span className={cn(
                      "text-sm font-medium",
                      selectedType === type.id ? "text-primary" : "text-foreground"
                    )}>
                      {type.label}
                    </span>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* File Upload / Link Input */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-lg">
                {selectedType === "link" ? "External Link" : "Upload File"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {selectedType === "link" ? (
                <div className="space-y-2">
                  <Label htmlFor="link">URL</Label>
                  <Input
                    id="link"
                    placeholder="https://drive.google.com/..."
                    value={formData.link}
                    onChange={(e) => handleInputChange("link", e.target.value)}
                    className="bg-background"
                  />
                </div>
              ) : (
                <div className="space-y-4">
                  <label
                    htmlFor="file-upload"
                    className={cn(
                      "flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-xl cursor-pointer transition-colors",
                      file
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50 hover:bg-muted/50"
                    )}
                  >
                    {file ? (
                      <div className="flex items-center gap-3">
                        <CheckCircle className="w-8 h-8 text-primary" />
                        <div>
                          <p className="font-medium text-foreground">{file.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {(file.size / 1024 / 1024).toFixed(2)} MB • Click to change
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2">
                        <UploadIcon className="w-10 h-10 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">
                          Click to upload or drag and drop
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Max size: 50MB for videos, 10MB for others
                        </p>
                      </div>
                    )}
                    <input
                      id="file-upload"
                      type="file"
                      className="hidden"
                      accept={uploadTypes.find((t) => t.id === selectedType)?.accept}
                      onChange={handleFileChange}
                      disabled={isUploading}
                    />
                  </label>
                  
                  {/* Upload Progress */}
                  {isUploading && uploadProgress > 0 && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Uploading...</span>
                        <span className="text-foreground">{uploadProgress}%</span>
                      </div>
                      <Progress value={uploadProgress} className="h-2" />
                    </div>
                  )}

                  {file && !isUploading && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setFile(null)}
                      className="text-muted-foreground"
                    >
                      <X className="w-4 h-4 mr-1" />
                      Remove file
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Metadata Form */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-lg">Note Details</CardTitle>
              <CardDescription>Help others find your note easily</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  placeholder="e.g., Data Structures Complete Notes"
                  value={formData.title}
                  onChange={(e) => handleInputChange("title", e.target.value)}
                  className="bg-background"
                  required
                  disabled={isUploading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe what's included in this note..."
                  value={formData.description}
                  onChange={(e) => handleInputChange("description", e.target.value)}
                  className="bg-background resize-none"
                  rows={3}
                  disabled={isUploading}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Subject *</Label>
                  <SelectWithOther
                    value={formData.subject}
                    onValueChange={(value) => handleInputChange("subject", value)}
                    disabled={isUploading}
                    placeholder="Select subject"
                    inputPlaceholder="Enter subject name..."
                    options={[
                      { value: "DSA", label: "Data Structures" },
                      { value: "OS", label: "Operating Systems" },
                      { value: "DBMS", label: "DBMS" },
                      { value: "CN", label: "Computer Networks" },
                      { value: "ML", label: "Machine Learning" },
                      { value: "DE", label: "Digital Electronics" },
                    ]}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Branch *</Label>
                  <SelectWithOther
                    value={formData.branch}
                    onValueChange={(value) => handleInputChange("branch", value)}
                    disabled={isUploading}
                    placeholder="Select branch"
                    inputPlaceholder="Enter branch name..."
                    options={[
                      { value: "CSE", label: "CSE" },
                      { value: "ECE", label: "ECE" },
                      { value: "EEE", label: "EEE" },
                      { value: "ME", label: "ME" },
                      { value: "CE", label: "CE" },
                    ]}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Year *</Label>
                  <SelectWithOther
                    value={formData.year}
                    onValueChange={(value) => handleInputChange("year", value)}
                    disabled={isUploading}
                    placeholder="Select year"
                    inputPlaceholder="Enter year..."
                    options={[
                      { value: "1st Year", label: "1st Year" },
                      { value: "2nd Year", label: "2nd Year" },
                      { value: "3rd Year", label: "3rd Year" },
                      { value: "4th Year", label: "4th Year" },
                    ]}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="topic">Topic / Unit</Label>
                <Input
                  id="topic"
                  placeholder="e.g., Unit 3 - Trees and Graphs"
                  value={formData.topic}
                  onChange={(e) => handleInputChange("topic", e.target.value)}
                  className="bg-background"
                  disabled={isUploading}
                />
              </div>
            </CardContent>
          </Card>

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground h-12 text-base"
            disabled={isUploading}
          >
            {isUploading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <UploadIcon className="w-5 h-5 mr-2" />
                Upload Note
              </>
            )}
          </Button>
        </form>
      </div>
    </MainLayout>
  );
}
