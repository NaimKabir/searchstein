import { useEffect, useRef, useState } from 'react';
import { PDFPreviewCard } from './PDFPreviewCard';
import { PDFViewer } from './PDFViewer';
import { Skeleton } from '@/components/ui/skeleton';
import type { SearchResult } from '@/types';

interface SearchResultsProps {
  results: SearchResult[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  onLoadMore: () => void;
}

export function SearchResults({
  results,
  loading,
  error,
  hasMore,
  onLoadMore,
}: SearchResultsProps) {
  const observerTarget = useRef<HTMLDivElement>(null);
  const [selectedResult, setSelectedResult] = useState<SearchResult | null>(null);

  // Infinite scroll with Intersection Observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          onLoadMore();
        }
      },
      { threshold: 0.1 }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [hasMore, loading, onLoadMore]);

  // Error state
  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-destructive font-mono">{error}</p>
      </div>
    );
  }

  // Empty state (no results and not loading)
  if (results.length === 0 && !loading) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground font-mono">No results found</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {/* Results grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {results.map((result, index) => (
            <PDFPreviewCard
              key={`${result.source_document}-${result.page_number}-${index}`}
              result={result}
              onClick={() => setSelectedResult(result)}
            />
          ))}
        </div>

        {/* Loading skeletons */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="h-[200px] w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-full" />
              </div>
            ))}
          </div>
        )}

        {/* Intersection observer target */}
        <div ref={observerTarget} className="h-4" />

        {/* Load more indicator */}
        {hasMore && !loading && (
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground font-mono">Scroll for more results</p>
          </div>
        )}
      </div>

      {/* PDF Viewer Modal */}
      <PDFViewer
        result={selectedResult}
        open={selectedResult !== null}
        onClose={() => setSelectedResult(null)}
      />
    </>
  );
}
