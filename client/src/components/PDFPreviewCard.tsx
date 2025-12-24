import { Document, Page, pdfjs } from 'react-pdf';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, FileText } from 'lucide-react';
import type { SearchResult } from '@/types';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PDFPreviewCardProps {
  result: SearchResult;
  onClick?: () => void;
}

export function PDFPreviewCard({ result, onClick }: PDFPreviewCardProps) {
  const pageWidth = 300;

  // Use highlighted text if available, otherwise fall back to truncated text
  const displayText = result.highlight && result.highlight.length > 0
    ? result.highlight.join(' ... ')
    : result.text.length > 200
      ? result.text.substring(0, 200) + '...'
      : result.text;

  return (
    <Card
      className="hover:shadow-lg transition-shadow cursor-pointer"
      onClick={onClick}
    >
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-mono flex items-center justify-between">
          <span className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
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
        </CardTitle>
        <p className="text-xs text-muted-foreground font-mono">
          Page {result.page_number} / {result.total_pages}
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="border rounded-md overflow-hidden bg-gray-50 flex justify-center items-center min-h-[200px]">
          <Document
            file={result.page_pdf_url}
            loading={
              <div className="flex items-center justify-center p-8">
                <span className="text-sm text-muted-foreground font-mono">Loading PDF...</span>
              </div>
            }
            error={
              <div className="flex items-center justify-center p-8">
                <span className="text-sm text-destructive font-mono">Failed to load PDF</span>
              </div>
            }
          >
            <Page
              pageNumber={1}
              width={pageWidth}
              renderTextLayer={false}
              renderAnnotationLayer={false}
            />
          </Document>
        </div>
        <div
          className="text-xs text-muted-foreground font-mono leading-relaxed [&_mark]:bg-yellow-200 [&_mark]:text-foreground [&_mark]:font-semibold"
          dangerouslySetInnerHTML={{ __html: displayText }}
        />
        <div className="pt-2 border-t">
          <a
            href={result.original_pdf_url}
            download
            className="text-xs font-mono text-muted-foreground hover:text-foreground underline"
            onClick={(e) => e.stopPropagation()}
          >
            original pdf
          </a>
        </div>
      </CardContent>
    </Card>
  );
}
