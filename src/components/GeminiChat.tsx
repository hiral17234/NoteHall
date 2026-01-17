import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useGemini } from "@/hooks/useGemini";
import { useAuth } from "@/contexts/AuthContext";
import ReactMarkdown from "react-markdown";
import { Send, Loader2, Sparkles, User, Image as ImageIcon, X, AlertCircle, Trash2, FileText, Link as LinkIcon, Video, ChevronLeft, ChevronRight, BookOpen, HelpCircle, ListChecks, Maximize2 } from "lucide-react";
import { cn } from "@/lib/utils";
import * as pdfjsLib from "pdfjs-dist";
import { PdfViewerModal } from "./pdf/PdfViewerModal";

// Set PDF.js worker path
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

interface GeminiChatProps {
  className?: string;
  noteContext?: { title?: string; subject?: string; fileUrl?: string; fileType?: string };
  onClearContext?: () => void;
}

interface PdfPageInfo {
  pageNum: number;
  thumbnail: string;
}

const QUICK_ACTIONS = [
  { id: 'summarize', label: 'Summarize', icon: BookOpen, prompt: 'Please summarize the key points from this note in a clear and concise manner.' },
  { id: 'explain', label: 'Explain', icon: HelpCircle, prompt: 'Please explain the main concepts from this note in simple terms, as if explaining to a beginner.' },
  { id: 'mcqs', label: 'Generate MCQs', icon: ListChecks, prompt: 'Generate 5 multiple choice questions (MCQs) based on the content of this note. Include correct answers and brief explanations.' },
];

export function GeminiChat({ className, noteContext, onClearContext }: GeminiChatProps) {
  const { userProfile } = useAuth();
  const { messages, isLoading, error, sendMessage, clearChat, setContext, isConfigured } = useGemini();
  const [input, setInput] = useState("");
  const [images, setImages] = useState<{ base64: string; mimeType: string; preview: string }[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [attachedContext, setAttachedContext] = useState<typeof noteContext>(null);
  
  // PDF page selection state
  const [pdfPages, setPdfPages] = useState<PdfPageInfo[]>([]);
  const [selectedPages, setSelectedPages] = useState<number[]>([]);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [currentPdfPage, setCurrentPdfPage] = useState(0);
  const [totalPdfPages, setTotalPdfPages] = useState(0);
  const [pdfViewerOpen, setPdfViewerOpen] = useState(false);

  // Load PDF pages when a PDF is attached
  const loadPdfPages = useCallback(async (url: string) => {
    setPdfLoading(true);
    try {
      const loadingTask = pdfjsLib.getDocument(url);
      const pdf = await loadingTask.promise;
      const pages: PdfPageInfo[] = [];
      
      setTotalPdfPages(pdf.numPages);
      
      // Load first 10 pages max for thumbnails
      const maxPages = Math.min(pdf.numPages, 10);
      
      for (let i = 1; i <= maxPages; i++) {
        const page = await pdf.getPage(i);
        const scale = 0.3;
        const viewport = page.getViewport({ scale });
        
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        
        await page.render({ canvasContext: context!, viewport }).promise;
        
        pages.push({
          pageNum: i,
          thumbnail: canvas.toDataURL('image/jpeg', 0.6),
        });
      }
      
      setPdfPages(pages);
      setSelectedPages([1]); // Select first page by default
    } catch (err) {
      console.error('Error loading PDF:', err);
      setPdfPages([]);
      setTotalPdfPages(0);
    } finally {
      setPdfLoading(false);
    }
  }, []);

  // Set attached context from noteContext prop (don't auto-send)
  useEffect(() => {
    if (noteContext?.fileUrl) {
      setAttachedContext(noteContext);
      
      // Load PDF pages if it's a PDF
      if (noteContext.fileType === 'pdf') {
        loadPdfPages(noteContext.fileUrl);
      } else {
        setPdfPages([]);
        setSelectedPages([]);
      }
    }
  }, [noteContext, loadPdfPages]);

  useEffect(() => {
    if (noteContext) setContext({ noteTitle: noteContext.title, selectedSubject: noteContext.subject });
  }, [noteContext, setContext]);

  useEffect(() => {
    if (userProfile) setContext({ userBranch: userProfile.branch, userYear: userProfile.year });
  }, [userProfile, setContext]);

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
      const pagesText = selectedPages.length === totalPdfPages 
        ? 'all pages' 
        : `pages ${selectedPages.join(', ')}`;
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!input.trim() && images.length === 0) || isLoading) return;
    
    // Include attached context in the message
    let fullMessage = input;
    if (attachedContext?.fileUrl) {
      const contextInfo = getContextDescription() + '\n\n';
      fullMessage = contextInfo + input;
    }
    
    const imageData = images.map(img => ({ base64: img.base64, mimeType: img.mimeType }));
    await sendMessage(fullMessage, imageData.length > 0 ? imageData : undefined);
    setInput("");
    setImages([]);
    setAttachedContext(null); // Clear after sending
    setPdfPages([]);
    setSelectedPages([]);
    setTotalPdfPages(0);
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
      case 'pdf': return <FileText className="w-6 h-6 text-destructive" />;
      case 'image': return <ImageIcon className="w-6 h-6 text-primary" />;
      case 'video': return <Video className="w-6 h-6 text-purple-500" />;
      case 'link': return <LinkIcon className="w-6 h-6 text-blue-500" />;
      default: return <FileText className="w-6 h-6 text-muted-foreground" />;
    }
  };

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
          <CardTitle className="text-lg flex items-center gap-2"><Sparkles className="w-5 h-5 text-primary" />Gemini Chat</CardTitle>
          {messages.length > 0 && <Button variant="ghost" size="sm" onClick={clearChat}><Trash2 className="w-4 h-4 mr-1" />Clear</Button>}
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col overflow-hidden p-0">
        <ScrollArea className="flex-1 px-4" ref={scrollRef}>
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-12 text-center">
              <Sparkles className="w-12 h-12 text-primary/50 mb-4" />
              <p className="text-muted-foreground">Ask me anything about your studies</p>
              {attachedContext && (
                <p className="text-sm text-muted-foreground mt-2">
                  Note attached below - type your question and send!
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-4 py-4">
              {messages.map((msg, i) => (
                <div key={i} className={cn("flex gap-3", msg.role === "user" ? "justify-end" : "justify-start")}>
                  {msg.role === "assistant" && <Avatar className="w-8 h-8"><AvatarFallback className="bg-primary/20"><Sparkles className="w-4 h-4 text-primary" /></AvatarFallback></Avatar>}
                  <div className={cn("max-w-[80%] rounded-2xl px-4 py-3", msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted")}>
                    {msg.role === "assistant" ? <div className="prose prose-sm dark:prose-invert max-w-none"><ReactMarkdown>{msg.content}</ReactMarkdown></div> : <p className="text-sm whitespace-pre-wrap">{msg.content}</p>}
                  </div>
                  {msg.role === "user" && <Avatar className="w-8 h-8"><AvatarFallback className="bg-secondary"><User className="w-4 h-4" /></AvatarFallback></Avatar>}
                </div>
              ))}
              {isLoading && <div className="flex gap-3"><Avatar className="w-8 h-8"><AvatarFallback className="bg-primary/20"><Sparkles className="w-4 h-4 text-primary" /></AvatarFallback></Avatar><div className="bg-muted rounded-2xl px-4 py-3"><Loader2 className="w-4 h-4 animate-spin" /></div></div>}
            </div>
          )}
        </ScrollArea>
        {error && <div className="mx-4 mb-2 p-3 bg-destructive/10 text-destructive text-sm rounded-lg flex items-center gap-2"><AlertCircle className="w-4 h-4" />{error}</div>}
        
        {/* Attached Note Context Preview */}
        {attachedContext && (
          <div className="mx-4 mb-2 space-y-2">
            <div className="flex items-center gap-3 p-3 bg-muted/50 border border-border rounded-lg">
              {/* Thumbnail/Icon */}
              <div className="shrink-0">
                {attachedContext.fileType === 'image' && attachedContext.fileUrl ? (
                  <img 
                    src={attachedContext.fileUrl} 
                    alt={attachedContext.title || 'Image'} 
                    className="w-12 h-12 object-cover rounded-lg border border-border"
                  />
                ) : attachedContext.fileType === 'pdf' && pdfPages.length > 0 ? (
                  <img 
                    src={pdfPages[0].thumbnail} 
                    alt="PDF preview" 
                    className="w-12 h-12 object-cover rounded-lg border border-border"
                  />
                ) : (
                  <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center border border-border">
                    {getFileIcon(attachedContext.fileType)}
                  </div>
                )}
              </div>
              
              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{attachedContext.title || 'Attached File'}</p>
                <p className="text-xs text-muted-foreground capitalize">
                  {attachedContext.fileType || 'File'}
                  {attachedContext.subject ? ` • ${attachedContext.subject}` : ''}
                  {attachedContext.fileType === 'pdf' && totalPdfPages > 0 && (
                    <span> • {totalPdfPages} pages</span>
                  )}
                  {selectedPages.length > 0 && attachedContext.fileType === 'pdf' && (
                    <span className="text-primary"> • {selectedPages.length} selected</span>
                  )}
                </p>
              </div>
              
              {/* View Full PDF Button */}
              {attachedContext.fileType === 'pdf' && totalPdfPages > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="shrink-0 h-8 gap-1.5"
                  onClick={() => setPdfViewerOpen(true)}
                >
                  <Maximize2 className="w-4 h-4" />
                  View
                </Button>
              )}
              
              {/* Remove Button */}
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
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-6 text-xs px-2"
                        onClick={selectAllPages}
                      >
                        Select All
                      </Button>
                    </div>
                    <div className="relative">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="shrink-0 h-8 w-8"
                          onClick={() => setCurrentPdfPage(Math.max(0, currentPdfPage - 4))}
                          disabled={currentPdfPage === 0}
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </Button>
                        <div className="flex-1 overflow-hidden">
                          <div 
                            className="flex gap-2 transition-transform duration-200"
                            style={{ transform: `translateX(-${currentPdfPage * 68}px)` }}
                          >
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
                                <img 
                                  src={page.thumbnail} 
                                  alt={`Page ${page.pageNum}`}
                                  className="w-full h-20 object-cover"
                                />
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
                          variant="ghost"
                          size="icon"
                          className="shrink-0 h-8 w-8"
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
                <Button
                  key={action.id}
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs gap-1.5"
                  onClick={() => handleQuickAction(action.prompt)}
                >
                  <action.icon className="w-3.5 h-3.5" />
                  {action.label}
                </Button>
              ))}
            </div>
          </div>
        )}
        
        {images.length > 0 && <div className="px-4 pb-2 flex gap-2">{images.map((img, i) => <div key={i} className="relative"><img src={img.preview} className="w-16 h-16 object-cover rounded-lg" /><button onClick={() => removeImage(i)} className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center"><X className="w-3 h-3" /></button></div>)}</div>}
        <form onSubmit={handleSubmit} className="p-4 pt-2 shrink-0">
          <div className="flex gap-2">
            <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleImageUpload} />
            <Button type="button" variant="outline" size="icon" onClick={() => fileInputRef.current?.click()} disabled={isLoading}><ImageIcon className="w-4 h-4" /></Button>
            <Textarea value={input} onChange={(e) => setInput(e.target.value)} placeholder={attachedContext ? `Ask about "${attachedContext.title}"...` : "Ask me anything..."} className="flex-1 min-h-[44px] max-h-[120px] resize-none bg-background" disabled={isLoading} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSubmit(e); } }} />
            <Button type="submit" disabled={isLoading || (!input.trim() && images.length === 0)}>{isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}</Button>
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
