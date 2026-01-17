import { useState, useEffect, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Loader2, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import * as pdfjsLib from "pdfjs-dist";

interface PdfViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  pdfUrl: string;
  title?: string;
  selectedPages: number[];
  onPagesSelect: (pages: number[]) => void;
  totalPages: number;
}

interface PageData {
  pageNum: number;
  imageUrl: string;
}

export function PdfViewerModal({
  isOpen,
  onClose,
  pdfUrl,
  title,
  selectedPages,
  onPagesSelect,
  totalPages,
}: PdfViewerModalProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageImage, setPageImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [localSelectedPages, setLocalSelectedPages] = useState<number[]>(selectedPages);
  const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null);

  // Load PDF document once
  useEffect(() => {
    if (!isOpen || !pdfUrl) return;
    
    const loadPdf = async () => {
      try {
        const loadingTask = pdfjsLib.getDocument(pdfUrl);
        const pdf = await loadingTask.promise;
        setPdfDoc(pdf);
      } catch (err) {
        console.error("Error loading PDF:", err);
      }
    };
    
    loadPdf();
    
    return () => {
      setPdfDoc(null);
    };
  }, [isOpen, pdfUrl]);

  // Render current page
  const renderPage = useCallback(async (pageNum: number) => {
    if (!pdfDoc) return;
    
    setLoading(true);
    try {
      const page = await pdfDoc.getPage(pageNum);
      const scale = 1.5;
      const viewport = page.getViewport({ scale });
      
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");
      canvas.height = viewport.height;
      canvas.width = viewport.width;
      
      await page.render({ canvasContext: context!, viewport }).promise;
      
      setPageImage(canvas.toDataURL("image/png"));
    } catch (err) {
      console.error("Error rendering page:", err);
    } finally {
      setLoading(false);
    }
  }, [pdfDoc]);

  useEffect(() => {
    if (pdfDoc && isOpen) {
      renderPage(currentPage);
    }
  }, [pdfDoc, currentPage, isOpen, renderPage]);

  // Sync local selection with prop
  useEffect(() => {
    setLocalSelectedPages(selectedPages);
  }, [selectedPages]);

  const handlePageToggle = (pageNum: number) => {
    setLocalSelectedPages((prev) =>
      prev.includes(pageNum)
        ? prev.filter((p) => p !== pageNum)
        : [...prev, pageNum].sort((a, b) => a - b)
    );
  };

  const handleConfirm = () => {
    onPagesSelect(localSelectedPages);
    onClose();
  };

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.25, 0.5));

  const selectAll = () => {
    setLocalSelectedPages(Array.from({ length: totalPages }, (_, i) => i + 1));
  };

  const deselectAll = () => {
    setLocalSelectedPages([]);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl h-[85vh] flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-3 shrink-0 border-b border-border">
          <DialogTitle className="text-lg">{title || "PDF Viewer"}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-1 overflow-hidden">
          {/* Page Thumbnails Sidebar */}
          <div className="w-48 border-r border-border bg-muted/30 flex flex-col">
            <div className="p-3 border-b border-border">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-muted-foreground">
                  Pages ({localSelectedPages.length}/{totalPages})
                </span>
              </div>
              <div className="flex gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 h-7 text-xs"
                  onClick={selectAll}
                >
                  All
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex-1 h-7 text-xs"
                  onClick={deselectAll}
                >
                  None
                </Button>
              </div>
            </div>
            <ScrollArea className="flex-1">
              <div className="p-2 space-y-2">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                  <button
                    key={pageNum}
                    onClick={() => goToPage(pageNum)}
                    className={cn(
                      "w-full p-2 rounded-lg border transition-all text-left",
                      currentPage === pageNum
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-primary/50 bg-background"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={localSelectedPages.includes(pageNum)}
                        onCheckedChange={() => handlePageToggle(pageNum)}
                        onClick={(e) => e.stopPropagation()}
                        className="shrink-0"
                      />
                      <span className="text-sm font-medium">Page {pageNum}</span>
                      {localSelectedPages.includes(pageNum) && (
                        <Check className="w-3 h-3 text-primary ml-auto" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Main Viewer */}
          <div className="flex-1 flex flex-col">
            {/* Toolbar */}
            <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-muted/20">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage <= 1}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="text-sm min-w-[80px] text-center">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage >= totalPages}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={handleZoomOut}
                  disabled={zoom <= 0.5}
                >
                  <ZoomOut className="w-4 h-4" />
                </Button>
                <span className="text-sm min-w-[50px] text-center">{Math.round(zoom * 100)}%</span>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={handleZoomIn}
                  disabled={zoom >= 3}
                >
                  <ZoomIn className="w-4 h-4" />
                </Button>
              </div>

              <div className="flex items-center gap-2">
                <Checkbox
                  id="include-current"
                  checked={localSelectedPages.includes(currentPage)}
                  onCheckedChange={() => handlePageToggle(currentPage)}
                />
                <label htmlFor="include-current" className="text-sm cursor-pointer">
                  Include this page
                </label>
              </div>
            </div>

            {/* Page Display */}
            <ScrollArea className="flex-1 bg-muted/10">
              <div className="flex items-center justify-center min-h-full p-4">
                {loading ? (
                  <div className="flex flex-col items-center gap-3">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    <span className="text-sm text-muted-foreground">Loading page...</span>
                  </div>
                ) : pageImage ? (
                  <img
                    src={pageImage}
                    alt={`Page ${currentPage}`}
                    className="shadow-lg rounded-sm border border-border"
                    style={{
                      transform: `scale(${zoom})`,
                      transformOrigin: "center",
                      transition: "transform 0.2s ease",
                    }}
                  />
                ) : (
                  <div className="text-muted-foreground">No page to display</div>
                )}
              </div>
            </ScrollArea>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border bg-muted/20 flex items-center justify-between shrink-0">
          <p className="text-sm text-muted-foreground">
            {localSelectedPages.length === 0
              ? "No pages selected"
              : localSelectedPages.length === totalPages
              ? "All pages selected"
              : `${localSelectedPages.length} page${localSelectedPages.length !== 1 ? "s" : ""} selected: ${localSelectedPages.slice(0, 5).join(", ")}${localSelectedPages.length > 5 ? "..." : ""}`}
          </p>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleConfirm}>
              Confirm Selection
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
