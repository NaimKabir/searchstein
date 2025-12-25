import { useState, useEffect, useCallback } from 'react';
import { searchDocuments } from '@/lib/api';
import { useDebounce } from './useDebounce';
import type { SearchResult } from '@/types';

export function useSearch() {
  const [query, setQuery] = useState('');
  const [includeDocumentNames, setIncludeDocumentNames] = useState<string[]>([]);
  const [excludeDocumentNames, setExcludeDocumentNames] = useState<string[]>([]);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);

  const debouncedQuery = useDebounce(query, 300);

  const pageSize = 10;
  const hasMore = results.length < total;

  // Search function
  const performSearch = useCallback(
    async (searchQuery: string, includeNames: string[], excludeNames: string[], from: number) => {
      setLoading(true);
      setError(null);

      try {
        const data = await searchDocuments(
          searchQuery,
          from,
          pageSize,
          includeNames.length > 0 ? includeNames : undefined,
          excludeNames.length > 0 ? excludeNames : undefined
        );

        if (from === 0) {
          // New search, replace results
          setResults(data.results);
        } else {
          // Load more, append results
          setResults((prev) => [...prev, ...data.results]);
        }

        setTotal(data.total);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Search failed');
        if (from === 0) {
          setResults([]);
          setTotal(0);
        }
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Effect for new search (debounced query or filters changes)
  useEffect(() => {
    setPage(0);
    performSearch(debouncedQuery, includeDocumentNames, excludeDocumentNames, 0);
  }, [debouncedQuery, includeDocumentNames, excludeDocumentNames, performSearch]);

  // Load more function for infinite scroll
  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      performSearch(debouncedQuery, includeDocumentNames, excludeDocumentNames, nextPage * pageSize);
    }
  }, [loading, hasMore, debouncedQuery, includeDocumentNames, excludeDocumentNames, page, performSearch]);

  const addIncludeDocumentName = useCallback(
    (name: string) => {
      const trimmed = name.trim();
      if (trimmed && !includeDocumentNames.includes(trimmed)) {
        setIncludeDocumentNames((prev) => [...prev, trimmed]);
      }
    },
    [includeDocumentNames]
  );

  const removeIncludeDocumentName = useCallback((name: string) => {
    setIncludeDocumentNames((prev) => prev.filter((n) => n !== name));
  }, []);

  const addExcludeDocumentName = useCallback(
    (name: string) => {
      const trimmed = name.trim();
      if (trimmed && !excludeDocumentNames.includes(trimmed)) {
        setExcludeDocumentNames((prev) => [...prev, trimmed]);
      }
    },
    [excludeDocumentNames]
  );

  const removeExcludeDocumentName = useCallback((name: string) => {
    setExcludeDocumentNames((prev) => prev.filter((n) => n !== name));
  }, []);

  return {
    query,
    setQuery,
    includeDocumentNames,
    addIncludeDocumentName,
    removeIncludeDocumentName,
    excludeDocumentNames,
    addExcludeDocumentName,
    removeExcludeDocumentName,
    results,
    loading,
    error,
    total,
    hasMore,
    loadMore,
  };
}
