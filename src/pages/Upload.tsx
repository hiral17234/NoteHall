import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Image, Video, Link, Upload as UploadIcon, X, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

const uploadTypes = [
  { id: "pdf", label: "PDF Document", icon: FileText, accept: ".pdf" },
  { id: "image", label: "Image", icon: Image, accept: "image/*" },
  { id: "video", label: "Short Video", icon: Video, accept: "video/*" },
  { id: "link", label: "External Link", icon: Link, accept: "" },
];

export default function Upload() {
  const { toast } = useToast();
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
  const [fileName, setFileName] = useState<string>("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileName(file.name);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Note uploaded successfully!",
      description: "Your note has been submitted for review.",
    });
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
                    onClick={() => setSelectedType(type.id)}
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
                      fileName
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50 hover:bg-muted/50"
                    )}
                  >
                    {fileName ? (
                      <div className="flex items-center gap-3">
                        <CheckCircle className="w-8 h-8 text-primary" />
                        <div>
                          <p className="font-medium text-foreground">{fileName}</p>
                          <p className="text-sm text-muted-foreground">Click to change file</p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2">
                        <UploadIcon className="w-10 h-10 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">
                          Click to upload or drag and drop
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {uploadTypes.find((t) => t.id === selectedType)?.accept || "Any file"}
                        </p>
                      </div>
                    )}
                    <input
                      id="file-upload"
                      type="file"
                      className="hidden"
                      accept={uploadTypes.find((t) => t.id === selectedType)?.accept}
                      onChange={handleFileChange}
                    />
                  </label>
                  {fileName && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setFileName("")}
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
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Subject *</Label>
                  <Select
                    value={formData.subject}
                    onValueChange={(value) => handleInputChange("subject", value)}
                  >
                    <SelectTrigger className="bg-background">
                      <SelectValue placeholder="Select subject" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dsa">Data Structures</SelectItem>
                      <SelectItem value="os">Operating Systems</SelectItem>
                      <SelectItem value="dbms">DBMS</SelectItem>
                      <SelectItem value="cn">Computer Networks</SelectItem>
                      <SelectItem value="ml">Machine Learning</SelectItem>
                      <SelectItem value="de">Digital Electronics</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Branch *</Label>
                  <Select
                    value={formData.branch}
                    onValueChange={(value) => handleInputChange("branch", value)}
                  >
                    <SelectTrigger className="bg-background">
                      <SelectValue placeholder="Select branch" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cse">CSE</SelectItem>
                      <SelectItem value="ece">ECE</SelectItem>
                      <SelectItem value="eee">EEE</SelectItem>
                      <SelectItem value="me">ME</SelectItem>
                      <SelectItem value="ce">CE</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Year *</Label>
                  <Select
                    value={formData.year}
                    onValueChange={(value) => handleInputChange("year", value)}
                  >
                    <SelectTrigger className="bg-background">
                      <SelectValue placeholder="Select year" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1st Year</SelectItem>
                      <SelectItem value="2">2nd Year</SelectItem>
                      <SelectItem value="3">3rd Year</SelectItem>
                      <SelectItem value="4">4th Year</SelectItem>
                    </SelectContent>
                  </Select>
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
                />
              </div>
            </CardContent>
          </Card>

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground h-12 text-base"
          >
            <UploadIcon className="w-5 h-5 mr-2" />
            Upload Note
          </Button>
        </form>
      </div>
    </MainLayout>
  );
}
