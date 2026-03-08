import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { geminiService } from "@/services/geminiService";
import ReactMarkdown from "react-markdown";
import { Send, Loader2, Sparkles, User, Image as ImageIcon, X, AlertCircle, Trash2, FileText, Link as LinkIcon, Video, ChevronLeft, ChevronRight, BookOpen, HelpCircle, ListChecks, Maximize2, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import * as pdfjsLib from "pdfjs-dist";
import { PdfViewerModal } from "./pdf/PdfViewerModal";

// Fix PDF.js worker - use .mjs for Vite compatibility
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

interface GeminiChatProps {
  className?: string;
  noteContext?: { title?: string; subject?: string; fileUrl?: string; fileType?: string };
  onClearContext?: () => void;
}

interface PdfPageInfo {
  pageNum: number;
  thumbnail: string;
}

interface DisplayMessage {
  role: "user" | "assistant";
  content: string;
  attachments?: { type: string; url: string; title?: string }[];
  images?: string[]; // preview URLs for uploaded images
}

const STORAGE_KEY = "notehall_gemini_messages";
const CONTEXT_KEY = "notehall_gemini_context";
const ATTACHMENT_IMAGES_KEY = "notehall_gemini_attachment_images";

const QUICK_ACTIONS = [
  { id: 'summarize', label: 'Summarize', icon: BookOpen, prompt: 'Please summarize the key points from this note in a clear and concise manner.' },
  { id: 'explain', label: 'Explain', icon: HelpCircle, prompt: 'Please explain the main concepts from this note in simple terms, as if explaining to a beginner.' },
  { id: 'mcqs', label: 'Generate MCQs', icon: ListChecks, prompt: 'Generate 5 multiple choice questions (MCQs) based on the content of this note. Include correct answers and brief explanations.' },
];

function loadMessages(): DisplayMessage[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch { return []; }
}

function saveMessages(messages: DisplayMessage[]) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(messages)); } catch {}
}

function loadContext(): GeminiChatProps["noteContext"] | null {
  try {
    const data = localStorage.getItem(CONTEXT_KEY);
    return data ? JSON.parse(data) : null;
  } catch { return null; }
}

function saveContext(ctx: GeminiChatProps["noteContext"] | null) {
  try {
    if (ctx) localStorage.setItem(CONTEXT_KEY, JSON.stringify(ctx));
    else localStorage.removeItem(CONTEXT_KEY);
  } catch {}
}

function loadAttachmentImages(): { base64: string; mimeType: string }[] {
  try {
    const data = localStorage.getItem(ATTACHMENT_IMAGES_KEY);
    return data ? JSON.parse(data) : [];
  } catch { return []; }
}

function saveAttachmentImages(images: { base64: string; mimeType: string }[]) {
  try {
    if (images.length > 0) {
      localStorage.setItem(ATTACHMENT_IMAGES_KEY, JSON.stringify(images));
    } else {
      localStorage.removeItem(ATTACHMENT_IMAGES_KEY);
    }
  } catch {}
}

export function GeminiChat({ className, noteContext, onClearContext }: GeminiChatProps) {
  const { userProfile } = useAuth();
  const [messages, setMessages] = useState<DisplayMessage[]>(() => loadMessages());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [images, setImages] = useState<{ base64: string; mimeType: string; preview: string }[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [attachedContext, setAttachedContext] = useState<typeof noteContext>(() => loadContext());
  
  // PDF page selection state
  const [pdfPages, setPdfPages] = useState<PdfPageInfo[]>([]);
  const [selectedPages, setSelectedPages] = useState<number[]>([]);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [currentPdfPage, setCurrentPdfPage] = useState(0);
  const [totalPdfPages, setTotalPdfPages] = useState(0);
  const [pdfViewerOpen, setPdfViewerOpen] = useState(false);

  // Persist messages
  useEffect(() => { saveMessages(messages); }, [messages]);
  
  // Persist context
  useEffect(() => { saveContext(attachedContext || null); }, [attachedContext]);

  // Sync geminiService history with persisted messages on mount
  useEffect(() => {
    geminiService.clearHistory();
    messages.forEach(msg => {
      if (msg.role === 'user' || msg.role === 'assistant') {
        // Re-populate service history for continuity
        (geminiService as any).conversationHistory.push({ role: msg.role, content: msg.content });
      }
    });
  }, []); // Only on mount

  // Load PDF pages when a PDF is attached
  const loadPdfPages = useCallback(async (url: string) => {
    setPdfLoading(true);
    try {
      const loadingTask = pdfjsLib.getDocument(url);
      const pdf = await loadingTask.promise;
      const pages: PdfPageInfo[] = [];
      setTotalPdfPages(pdf.numPages);
      const maxPages = Math.min(pdf.numPages, 20); // Load up to 20 pages
      
      for (let i = 1; i <= maxPages; i++) {
        const page = await pdf.getPage(i);
        const scale = 0.3;
        const viewport = page.getViewport({ scale });
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        await page.render({ canvasContext: context!, viewport }).promise;
        pages.push({ pageNum: i, thumbnail: canvas.toDataURL('image/jpeg', 0.6) });
      }
      
      setPdfPages(pages);
      setSelectedPages([1]);
    } catch (err) {
      console.error('Error loading PDF:', err);
      setPdfPages([]);
      setTotalPdfPages(0);
    } finally {
      setPdfLoading(false);
    }
  }, []);

  // Set attached context from noteContext prop
  useEffect(() => {
    if (noteContext?.fileUrl) {
      setAttachedContext(noteContext);
      if (noteContext.fileType === 'pdf') {
        loadPdfPages(noteContext.fileUrl);
      } else {
        setPdfPages([]);
        setSelectedPages([]);
      }
    }
  }, [noteContext, loadPdfPages]);

  useEffect(() => {
    if (noteContext) geminiService.setContext({ noteTitle: noteContext.title, selectedSubject: noteContext.subject });
  }, [noteContext]);

  useEffect(() => {
    if (userProfile) geminiService.setContext({ userBranch: userProfile.branch, userYear: userProfile.year });
  }, [userProfile]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const handleRemoveContext = () => {
    setAttachedContext(null);
    setPdfPages([]);
    setSelectedPages([]);
    setTotalPdfPages(0);
    onClearContext?.();
  };

  const togglePageSelection = (pageNum: number) => {
    setSelectedPages(prev => 
      prev.includes(pageNum) 
        ? prev.filter(p => p !== pageNum)
        : [...prev, pageNum].sort((a, b) => a - b)
    );
  };

  const selectAllPages = () => {
    setSelectedPages(pdfPages.map(p => p.pageNum));
  };

  const getContextDescription = () => {
    if (!attachedContext) return '';
    const type = attachedContext.fileType || 'file';
    const title = attachedContext.title || 'File';
    
    if (type === 'pdf' && selectedPages.length > 0) {
      const pagesText = selectedPages.length === totalPdfPages ? 'all pages' : `pages ${selectedPages.join(', ')}`;
      return `[Attached PDF: ${title} - ${pagesText}]\nURL: ${attachedContext.fileUrl}`;
    }
    if (type === 'video') {
      return `[Attached Video Note: ${title}]\nSubject: ${attachedContext.subject || 'N/A'}\nVideo URL: ${attachedContext.fileUrl}\n\nNote: This is a video file. Please help with questions about the topic, but I cannot directly view the video content.`;
    }
    if (type === 'link') {
      return `[Attached Link: ${title}]\nSubject: ${attachedContext.subject || 'N/A'}\nURL: ${attachedContext.fileUrl}`;
    }
    if (type === 'image') {
      return `[Attached Image: ${title}]\nSubject: ${attachedContext.subject || 'N/A'}\nImage URL: ${attachedContext.fileUrl}`;
    }
    return `[Attached ${type}: ${title}]\nURL: ${attachedContext.fileUrl}`;
  };

  const handleQuickAction = (prompt: string) => {
    setInput(prompt);
  };

  const handleNewChat = () => {
    setMessages([]);
    setError(null);
    setInput("");
    setImages([]);
    setAttachedContext(null);
    setPdfPages([]);
    setSelectedPages([]);
    setTotalPdfPages(0);
    geminiService.clearHistory();
    saveMessages([]);
    saveContext(null);
    onClearContext?.();
  };

  // Helper: convert PDF selected pages to base64 images at higher quality
  const getPdfPagesAsBase64 = useCallback(async (): Promise<{ base64: string; mimeType: string }[]> => {
    if (!attachedContext?.fileUrl || attachedContext.fileType !== 'pdf' || selectedPages.length === 0) return [];
    try {
      const loadingTask = pdfjsLib.getDocument(attachedContext.fileUrl);
      const pdf = await loadingTask.promise;
      const results: { base64: string; mimeType: string }[] = [];
      for (const pageNum of selectedPages) {
        const page = await pdf.getPage(pageNum);
        const scale = 1.5; // Higher quality for AI reading
        const viewport = page.getViewport({ scale });
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        await page.render({ canvasContext: context!, viewport }).promise;
        const dataUrl = canvas.toDataURL('image/png');
        results.push({ base64: dataUrl.split(',')[1], mimeType: 'image/png' });
      }
      return results;
    } catch (err) {
      console.error('Error converting PDF pages to base64:', err);
      return [];
    }
  }, [attachedContext, selectedPages]);

  // Helper: fetch an image URL and convert to base64
  const fetchImageAsBase64 = useCallback(async (url: string): Promise<{ base64: string; mimeType: string } | null> => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => {
          const dataUrl = reader.result as string;
          resolve({ base64: dataUrl.split(',')[1], mimeType: blob.type || 'image/png' });
        };
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(blob);
      });
    } catch {
      return null;
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!input.trim() && images.length === 0 && !attachedContext) || isLoading) return;
    
    setError(null);
    setIsLoading(true);

    // Build user display message with attachment metadata
    const userDisplayMsg: DisplayMessage = {
      role: 'user',
      content: input.trim() || 'Sent file for analysis',
      attachments: attachedContext ? [{ type: attachedContext.fileType || 'file', url: attachedContext.fileUrl || '', title: attachedContext.title }] : undefined,
      images: images.length > 0 ? images.map(img => img.preview) : undefined,
    };
    setMessages(prev => [...prev, userDisplayMsg]);

    // Build text prompt with context info (but NOT the URL for AI to fetch)
    let fullMessage = input.trim();
    if (attachedContext) {
      const title = attachedContext.title || 'File';
      const subject = attachedContext.subject || '';
      const contextPrefix = `[Note: ${title}${subject ? ` | Subject: ${subject}` : ''}]`;
      fullMessage = contextPrefix + (fullMessage ? '\n\n' + fullMessage : '\n\nPlease analyze the attached content.');
    }
    
    // Collect all images to send as base64 (user-uploaded + PDF pages + image attachments)
    const allImageData: { base64: string; mimeType: string }[] = [
      ...images.map(img => ({ base64: img.base64, mimeType: img.mimeType })),
    ];

    // Convert PDF pages to base64 images
    if (attachedContext?.fileType === 'pdf') {
      const pdfImages = await getPdfPagesAsBase64();
      allImageData.push(...pdfImages);
    }
    
    // Convert image attachment to base64
    if (attachedContext?.fileType === 'image' && attachedContext.fileUrl) {
      const imgData = await fetchImageAsBase64(attachedContext.fileUrl);
      if (imgData) allImageData.push(imgData);
    }

    try {
      const response = await geminiService.sendMessage(fullMessage, allImageData.length > 0 ? allImageData : undefined);
      const assistantMsg: DisplayMessage = { role: 'assistant', content: response };
      setMessages(prev => [...prev, assistantMsg]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get response');
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setIsLoading(false);
    }

    setInput("");
    setImages([]);
    // Keep attachedContext, pdfPages, selectedPages so subsequent messages
    // can still reference the same PDF/image throughout the conversation
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach((file) => {
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = () => {
          const base64 = (reader.result as string).split(",")[1];
          setImages((prev) => [...prev, { base64, mimeType: file.type, preview: URL.createObjectURL(file) }]);
        };
        reader.readAsDataURL(file);
      }
    });
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeImage = (index: number) => {
    setImages((prev) => { URL.revokeObjectURL(prev[index].preview); return prev.filter((_, i) => i !== index); });
  };

  const getFileIcon = (fileType?: string) => {
    switch (fileType) {
      case 'pdf': return <FileText className="w-5 h-5 text-destructive" />;
      case 'image': return <ImageIcon className="w-5 h-5 text-primary" />;
      case 'video': return <Video className="w-5 h-5 text-purple-500" />;
      case 'link': return <LinkIcon className="w-5 h-5 text-blue-500" />;
      default: return <FileText className="w-5 h-5 text-muted-foreground" />;
    }
  };

  // Render attachment preview inside a message bubble
  const renderMessageAttachments = (msg: DisplayMessage) => {
    return (
      <>
        {msg.attachments && msg.attachments.length > 0 && (
          <div className="mb-2 space-y-1.5">
            {msg.attachments.map((att, i) => (
              <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-background/50 border border-border/50">
                {att.type === 'image' && att.url ? (
                  <img src={att.url} alt={att.title || 'Image'} className="w-16 h-16 object-cover rounded-md" />
                ) : att.type === 'pdf' ? (
                  <div className="w-10 h-10 bg-destructive/10 rounded-md flex items-center justify-center">
                    <FileText className="w-5 h-5 text-destructive" />
                  </div>
                ) : (
                  <div className="w-10 h-10 bg-muted rounded-md flex items-center justify-center">
                    {getFileIcon(att.type)}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">{att.title || 'Attachment'}</p>
                  <p className="text-[10px] text-muted-foreground capitalize">{att.type}</p>
                </div>
              </div>
            ))}
          </div>
        )}
        {msg.images && msg.images.length > 0 && (
          <div className="mb-2 flex gap-1.5 flex-wrap">
            {msg.images.map((imgUrl, i) => (
              <img key={i} src={imgUrl} alt="Uploaded" className="w-20 h-20 object-cover rounded-lg border border-border/50" />
            ))}
          </div>
        )}
      </>
    );
  };

  const isConfigured = geminiService.isConfigured();

  if (!isConfigured) {
    return (
      <Card className={cn("bg-card border-border", className)}>
        <CardContent className="flex flex-col items-center justify-center h-full py-12">
          <AlertCircle className="w-12 h-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">AI assistant unavailable</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("bg-card border-border flex flex-col", className)}>
      <CardHeader className="pb-3 shrink-0">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Gemini Chat
          </CardTitle>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="sm" onClick={handleNewChat} className="gap-1.5 h-8">
              <Plus className="w-3.5 h-3.5" />
              New Chat
            </Button>
            {messages.length > 0 && (
              <Button variant="ghost" size="sm" onClick={handleNewChat} className="gap-1.5 h-8 text-destructive hover:text-destructive">
                <Trash2 className="w-3.5 h-3.5" />
                Clear
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col overflow-hidden p-0">
        <ScrollArea className="flex-1 px-4" ref={scrollRef}>
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-12 text-center">
              <Sparkles className="w-12 h-12 text-primary/50 mb-4" />
              <p className="text-muted-foreground font-medium">Ask me anything about your studies</p>
              {attachedContext && (
                <p className="text-sm text-muted-foreground mt-2">
                  Note attached below — type your question and send!
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-4 py-4">
              {messages.map((msg, i) => (
                <div key={i} className={cn("flex gap-3", msg.role === "user" ? "justify-end" : "justify-start")}>
                  {msg.role === "assistant" && (
                    <Avatar className="w-8 h-8 shrink-0">
                      <AvatarFallback className="bg-primary/20">
                        <Sparkles className="w-4 h-4 text-primary" />
                      </AvatarFallback>
                    </Avatar>
                  )}
                  <div className={cn(
                    "max-w-[80%] rounded-2xl px-4 py-3",
                    msg.role === "user" 
                      ? "bg-primary text-primary-foreground" 
                      : "bg-muted"
                  )}>
                    {msg.role === "user" && renderMessageAttachments(msg)}
                    {msg.role === "assistant" ? (
                      <div className="prose prose-sm dark:prose-invert max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 [&_ul]:space-y-1 [&_ol]:space-y-1 [&_li]:leading-relaxed [&_p]:leading-relaxed [&_p+p]:mt-3 [&_h1]:text-lg [&_h2]:text-base [&_h3]:text-sm [&_h1]:font-bold [&_h2]:font-semibold [&_h3]:font-medium [&_code]:bg-background/50 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-xs [&_pre]:bg-background/50 [&_pre]:rounded-lg [&_pre]:p-3 [&_blockquote]:border-l-primary [&_blockquote]:bg-primary/5 [&_blockquote]:py-1 [&_blockquote]:px-3 [&_hr]:border-border">
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      </div>
                    ) : (
                      <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                    )}
                  </div>
                  {msg.role === "user" && (
                    <Avatar className="w-8 h-8 shrink-0">
                      <AvatarFallback className="bg-secondary">
                        <User className="w-4 h-4" />
                      </AvatarFallback>
                    </Avatar>
                  )}
                </div>
              ))}
              {isLoading && (
                <div className="flex gap-3">
                  <Avatar className="w-8 h-8 shrink-0">
                    <AvatarFallback className="bg-primary/20">
                      <Sparkles className="w-4 h-4 text-primary" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="bg-muted rounded-2xl px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="text-sm text-muted-foreground">Thinking...</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </ScrollArea>
        
        {error && (
          <div className="mx-4 mb-2 p-3 bg-destructive/10 text-destructive text-sm rounded-lg flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}
        
        {/* Attached Note Context Preview */}
        {attachedContext && (
          <div className="mx-4 mb-2 space-y-2">
            <div className="flex items-center gap-3 p-3 bg-muted/50 border border-border rounded-lg">
              <div className="shrink-0">
                {attachedContext.fileType === 'image' && attachedContext.fileUrl ? (
                  <img src={attachedContext.fileUrl} alt={attachedContext.title || 'Image'} className="w-12 h-12 object-cover rounded-lg border border-border" />
                ) : attachedContext.fileType === 'pdf' && pdfPages.length > 0 ? (
                  <img src={pdfPages[0].thumbnail} alt="PDF preview" className="w-12 h-12 object-cover rounded-lg border border-border" />
                ) : (
                  <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center border border-border">
                    {getFileIcon(attachedContext.fileType)}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{attachedContext.title || 'Attached File'}</p>
                <p className="text-xs text-muted-foreground capitalize">
                  {attachedContext.fileType || 'File'}
                  {attachedContext.subject ? ` • ${attachedContext.subject}` : ''}
                  {attachedContext.fileType === 'pdf' && totalPdfPages > 0 && <span> • {totalPdfPages} pages</span>}
                  {selectedPages.length > 0 && attachedContext.fileType === 'pdf' && (
                    <span className="text-primary"> • {selectedPages.length} selected</span>
                  )}
                </p>
              </div>
              {attachedContext.fileType === 'pdf' && totalPdfPages > 0 && (
                <Button variant="ghost" size="sm" className="shrink-0 h-8 gap-1.5" onClick={() => setPdfViewerOpen(true)}>
                  <Maximize2 className="w-4 h-4" />
                  View
                </Button>
              )}
              <button 
                onClick={handleRemoveContext}
                className="shrink-0 w-6 h-6 bg-muted hover:bg-destructive/20 text-muted-foreground hover:text-destructive rounded-full flex items-center justify-center transition-colors"
                aria-label="Remove attachment"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            {/* PDF Page Selector */}
            {attachedContext.fileType === 'pdf' && (
              <div className="bg-muted/30 border border-border rounded-lg p-3">
                {pdfLoading ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="w-5 h-5 animate-spin text-primary mr-2" />
                    <span className="text-sm text-muted-foreground">Loading PDF pages...</span>
                  </div>
                ) : pdfPages.length > 0 ? (
                  <>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-muted-foreground">Select pages to include</span>
                      <Button variant="ghost" size="sm" className="h-6 text-xs px-2" onClick={selectAllPages}>
                        Select All
                      </Button>
                    </div>
                    <div className="relative">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost" size="icon" className="shrink-0 h-8 w-8"
                          onClick={() => setCurrentPdfPage(Math.max(0, currentPdfPage - 4))}
                          disabled={currentPdfPage === 0}
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </Button>
                        <div className="flex-1 overflow-hidden">
                          <div className="flex gap-2 transition-transform duration-200" style={{ transform: `translateX(-${currentPdfPage * 68}px)` }}>
                            {pdfPages.map((page) => (
                              <button
                                key={page.pageNum}
                                onClick={() => togglePageSelection(page.pageNum)}
                                className={cn(
                                  "shrink-0 w-14 relative rounded-md overflow-hidden border-2 transition-all",
                                  selectedPages.includes(page.pageNum) 
                                    ? "border-primary ring-2 ring-primary/20" 
                                    : "border-border hover:border-primary/50"
                                )}
                              >
                                <img src={page.thumbnail} alt={`Page ${page.pageNum}`} className="w-full h-20 object-cover" />
                                <div className={cn(
                                  "absolute bottom-0 inset-x-0 text-[10px] font-medium py-0.5 text-center",
                                  selectedPages.includes(page.pageNum) 
                                    ? "bg-primary text-primary-foreground" 
                                    : "bg-background/80 text-foreground"
                                )}>
                                  {page.pageNum}
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                        <Button
                          variant="ghost" size="icon" className="shrink-0 h-8 w-8"
                          onClick={() => setCurrentPdfPage(Math.min(pdfPages.length - 4, currentPdfPage + 4))}
                          disabled={currentPdfPage >= pdfPages.length - 4}
                        >
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </>
                ) : (
                  <p className="text-xs text-muted-foreground text-center py-2">
                    Could not load PDF preview
                  </p>
                )}
              </div>
            )}
            
            {/* Quick Action Buttons */}
            <div className="flex gap-2 flex-wrap">
              {QUICK_ACTIONS.map((action) => (
                <Button key={action.id} variant="outline" size="sm" className="h-7 text-xs gap-1.5" onClick={() => handleQuickAction(action.prompt)}>
                  <action.icon className="w-3.5 h-3.5" />
                  {action.label}
                </Button>
              ))}
            </div>
          </div>
        )}
        
        {images.length > 0 && (
          <div className="px-4 pb-2 flex gap-2 flex-wrap">
            {images.map((img, i) => (
              <div key={i} className="relative">
                <img src={img.preview} className="w-16 h-16 object-cover rounded-lg" />
                <button onClick={() => removeImage(i)} className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center">
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="p-4 pt-2 shrink-0">
          <div className="flex gap-2">
            <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleImageUpload} />
            <Button type="button" variant="outline" size="icon" onClick={() => fileInputRef.current?.click()} disabled={isLoading}>
              <ImageIcon className="w-4 h-4" />
            </Button>
            <Textarea 
              value={input} 
              onChange={(e) => setInput(e.target.value)} 
              placeholder={attachedContext ? `Ask about "${attachedContext.title}"...` : "Ask me anything..."} 
              className="flex-1 min-h-[44px] max-h-[120px] resize-none bg-background" 
              disabled={isLoading} 
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSubmit(e); } }} 
            />
            <Button type="submit" disabled={isLoading || (!input.trim() && images.length === 0)}>
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </Button>
          </div>
        </form>
      </CardContent>
      
      {/* PDF Viewer Modal */}
      {attachedContext?.fileType === 'pdf' && attachedContext.fileUrl && (
        <PdfViewerModal
          isOpen={pdfViewerOpen}
          onClose={() => setPdfViewerOpen(false)}
          pdfUrl={attachedContext.fileUrl}
          title={attachedContext.title}
          selectedPages={selectedPages}
          onPagesSelect={setSelectedPages}
          totalPages={totalPdfPages}
        />
      )}
    </Card>
  );
}

export default GeminiChat;
