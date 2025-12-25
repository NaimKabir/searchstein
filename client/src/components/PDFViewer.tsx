import { useState, useEffect } from 'react';
import { Document, Page } from 'react-pdf';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Download, ChevronLeft, ChevronRight } from 'lucide-react';
import { fetchDocumentPages } from '@/lib/api';
import type { SearchResult } from '@/types';

interface PDFViewerProps {
  result: SearchResult | null;
  open: boolean;
  onClose: () => void;
}

export function PDFViewer({ result, open, onClose }: PDFViewerProps) {
  const [pageUrls, setPageUrls] = useState<string[]>([]);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [pageHeight, setPageHeight] = useState<number | null>(null);

  // Fetch all page URLs when viewer opens
  useEffect(() => {
    if (!result || !open) return;

    setLoading(true);
    fetchDocumentPages(result.page_pdf_url)
      .then(urls => {
        setPageUrls(urls);
        // Find the index of the current page in the returned array
        // The result.page_number is 1-indexed, array is 0-indexed
        setCurrentPageIndex(result.page_number - 1);
      })
      .catch(error => {
        console.error('Failed to fetch document pages:', error);
        // Fallback: just use the current page
        setPageUrls([result.page_pdf_url]);
        setCurrentPageIndex(0);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [result, open]);

  // Keyboard navigation
  useEffect(() => {
    if (!open || pageUrls.length === 0) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' && currentPageIndex > 0) {
        setCurrentPageIndex(i => i - 1);
      } else if (e.key === 'ArrowRight' && currentPageIndex < pageUrls.length - 1) {
        setCurrentPageIndex(i => i + 1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, currentPageIndex, pageUrls.length]);

  if (!result) return null;

  const currentPageUrl = pageUrls[currentPageIndex] || result.page_pdf_url;
  const currentPageNumber = currentPageIndex + 1; // Display as 1-indexed
  const pageWidth = Math.min(800, window.innerWidth - 100);

  // Calculate skeleton height based on standard letter size aspect ratio (8.5:11)
  const skeletonHeight = pageHeight || pageWidth * 1.294;

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-sm font-mono flex items-center justify-between pr-8">
            <span className="flex items-center gap-2">
              {result.document_filename}
            </span>
            <a
              href={result.unredacted_pdf_url}
              download
              className="hover:text-primary transition-colors"
              onClick={(e) => e.stopPropagation()}
              title="Download unredacted PDF"
            >
              <Download className="w-4 h-4" />
            </a>
          </DialogTitle>
          <p className="text-xs text-muted-foreground font-mono">
            Page {currentPageNumber} / {pageUrls.length || result.total_pages}
          </p>
        </DialogHeader>

        <div className="relative flex justify-center items-center bg-gray-50 rounded-md p-4">
          {/* Previous page button */}
          {pageUrls.length > 1 && (
            <button
              className="absolute left-2 top-1/2 -translate-y-1/2 z-10 p-2 rounded-md bg-white shadow-md hover:bg-gray-100 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              onClick={() => setCurrentPageIndex(i => i - 1)}
              disabled={currentPageIndex === 0}
              title="Previous page (Left arrow)"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
          )}

          <Document
            key={currentPageUrl}
            file={currentPageUrl}
            loading={
              <div
                className="flex items-center justify-center bg-gray-100 animate-pulse"
                style={{ width: pageWidth, height: skeletonHeight }}
              >
                <span className="text-sm text-muted-foreground font-mono">
                  {loading ? 'Loading document...' : 'Loading page...'}
                </span>
              </div>
            }
            error={
              <div className="flex items-center justify-center p-16">
                <span className="text-sm text-destructive font-mono">Failed to load PDF</span>
              </div>
            }
          >
            <Page
              pageNumber={1}
              width={pageWidth}
              renderTextLayer={true}
              renderAnnotationLayer={true}
              onLoadSuccess={(page) => {
                // Capture the actual rendered height to use for next page skeleton
                const viewport = page.getViewport({ scale: 1 });
                const scale = pageWidth / viewport.width;
                setPageHeight(viewport.height * scale);
              }}
            />
          </Document>

          {/* Next page button */}
          {pageUrls.length > 1 && (
            <button
              className="absolute right-2 top-1/2 -translate-y-1/2 z-10 p-2 rounded-md bg-white shadow-md hover:bg-gray-100 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              onClick={() => setCurrentPageIndex(i => i + 1)}
              disabled={currentPageIndex === pageUrls.length - 1}
              title="Next page (Right arrow)"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          )}
        </div>

        {result.highlight && result.highlight.length > 0 && (
          <div className="mt-4 p-4 bg-muted rounded-md">
            <h4 className="text-xs font-semibold font-mono mb-2">Matching Excerpts:</h4>
            <div
              className="text-xs text-muted-foreground font-mono leading-relaxed break-words [&_mark]:bg-yellow-200 [&_mark]:text-foreground [&_mark]:font-semibold"
              dangerouslySetInnerHTML={{ __html: result.highlight.join(' ... ') }}
            />
          </div>
        )}

        <div className="mt-4 pt-4 border-t text-center">
          <a
            href={result.original_pdf_url}
            download
            className="text-xs font-mono text-muted-foreground hover:text-foreground underline"
            onClick={(e) => e.stopPropagation()}
          >
            original pdf
          </a>
        </div>
      </DialogContent>
    </Dialog>
  );
}
