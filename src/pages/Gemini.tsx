import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { GeminiChat } from "@/components/GeminiChat";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { geminiService } from "@/services/geminiService";
import { 
  Sparkles, 
  BookOpen, 
  Brain, 
  MessageSquare, 
  Lightbulb,
  FileText,
  HelpCircle,
  Target,
  Zap
} from "lucide-react";

const features = [
  {
    icon: FileText,
    title: "Note Summarization",
    description: "Get concise summaries, bullet points, or exam-focused key takeaways from any study material.",
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
  },
  {
    icon: Brain,
    title: "Concept Explanation",
    description: "Understand complex topics with step-by-step explanations tailored to your level.",
    color: "text-purple-500",
    bgColor: "bg-purple-500/10",
  },
  {
    icon: HelpCircle,
    title: "Doubt Solving",
    description: "Get instant answers to your academic questions with detailed explanations.",
    color: "text-green-500",
    bgColor: "bg-green-500/10",
  },
  {
    icon: Target,
    title: "Practice Questions",
    description: "Generate practice questions and quizzes to test your understanding.",
    color: "text-orange-500",
    bgColor: "bg-orange-500/10",
  },
];

const examplePrompts = [
  "Explain the concept of recursion in simple terms",
  "Summarize the key points about database normalization",
  "What are the differences between TCP and UDP?",
  "Generate 5 practice questions about operating system scheduling",
  "Give me study tips for data structures",
  "Explain Big O notation for beginners",
];

export default function Gemini() {
  const { userProfile } = useAuth();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState("chat");
  const [noteContext, setNoteContext] = useState<{
    title?: string;
    subject?: string;
    fileUrl?: string;
    fileType?: string;
  } | undefined>(undefined);

  // Check for note context from URL params
  useEffect(() => {
    if (!location.state) return;

    const { title, subject, fileUrl, fileType } = location.state as {
      title?: string;
      subject?: string;
      fileUrl?: string;
      fileType?: string;
    };

    setNoteContext({
      title,
      subject,
      fileUrl,
      fileType,
    });
  }, [location.state]);
  

  // Set user context for personalized responses
  useEffect(() => {
    if (userProfile) {
      geminiService.setContext({
        userBranch: userProfile.branch,
        userYear: userProfile.year,
        userInterests: userProfile.interests,
      });
    }
  }, [userProfile]);

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                Gemini
                <Badge className="bg-primary/20 text-primary border-0">AI</Badge>
              </h1>
              <p className="text-muted-foreground">Your personal AI study assistant powered by Google</p>
            </div>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-muted">
            <TabsTrigger value="chat" className="gap-2 data-[state=active]:bg-card">
              <MessageSquare className="w-4 h-4" />
              Chat
            </TabsTrigger>
            <TabsTrigger value="features" className="gap-2 data-[state=active]:bg-card">
              <Zap className="w-4 h-4" />
              Features
            </TabsTrigger>
          </TabsList>

          <TabsContent value="chat" className="mt-0">
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Main Chat */}
              <div className="lg:col-span-2">
                <GeminiChat 
                  className="h-[600px]" 
                  noteContext={noteContext} 
                  onClearContext={() => setNoteContext(undefined)}
                />
              </div>

              {/* Sidebar */}
              <div className="space-y-4">
                {/* Example Prompts */}
                <Card className="bg-card border-border">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Lightbulb className="w-4 h-4 text-primary" />
                      Try asking...
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {examplePrompts.slice(0, 4).map((prompt, i) => (
                      <button
                        key={i}
                        className="w-full text-left text-sm p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                        onClick={() => {
                          setActiveTab("chat");
                        }}
                      >
                        "{prompt}"
                      </button>
                    ))}
                  </CardContent>
                </Card>

                {/* User Context */}
                {userProfile && (
                  <Card className="bg-card border-border">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-primary" />
                        Personalized for you
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {userProfile.branch && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Branch</span>
                          <Badge variant="outline">{userProfile.branch}</Badge>
                        </div>
                      )}
                      {userProfile.year && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Year</span>
                          <Badge variant="outline">{userProfile.year}</Badge>
                        </div>
                      )}
                      {userProfile.interests?.length > 0 && (
                        <div className="pt-2">
                          <span className="text-sm text-muted-foreground">Interests</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {userProfile.interests.slice(0, 3).map((interest: string) => (
                              <Badge key={interest} variant="secondary" className="text-xs">
                                {interest}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="features" className="mt-0">
            <div className="grid md:grid-cols-2 gap-4">
              {features.map((feature) => (
                <Card key={feature.title} className="bg-card border-border hover:border-primary/30 transition-colors">
                  <CardContent className="pt-6">
                    <div className={`w-12 h-12 rounded-xl ${feature.bgColor} flex items-center justify-center mb-4`}>
                      <feature.icon className={`w-6 h-6 ${feature.color}`} />
                    </div>
                    <h3 className="font-semibold text-foreground mb-2">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Tips Section */}
            <Card className="bg-card border-border mt-6">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Lightbulb className="w-5 h-5 text-primary" />
                  Tips for Better Results
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    Be specific about what you want to learn or understand
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    Mention your current knowledge level for better explanations
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    Paste note content for context-aware summaries
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    Ask follow-up questions to dive deeper into topics
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    Request practice questions to test your understanding
                  </li>
                </ul>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
