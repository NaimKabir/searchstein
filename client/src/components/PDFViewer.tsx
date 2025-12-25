import { Document, Page } from 'react-pdf';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Download } from 'lucide-react';
import type { SearchResult } from '@/types';

interface PDFViewerProps {
  result: SearchResult | null;
  open: boolean;
  onClose: () => void;
}

export function PDFViewer({ result, open, onClose }: PDFViewerProps) {
  if (!result) return null;

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
            Page {result.page_number} / {result.total_pages}
          </p>
        </DialogHeader>

        <div className="flex justify-center items-center bg-gray-50 rounded-md p-4">
          <Document
            file={result.page_pdf_url}
            loading={
              <div className="flex items-center justify-center p-16">
                <span className="text-sm text-muted-foreground font-mono">Loading PDF...</span>
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
              width={Math.min(800, window.innerWidth - 100)}
              renderTextLayer={true}
              renderAnnotationLayer={true}
            />
          </Document>
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
