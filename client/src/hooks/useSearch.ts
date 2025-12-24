import { useState, useEffect, useCallback } from 'react';
import { searchDocuments } from '@/lib/api';
import { useDebounce } from './useDebounce';
import type { SearchResult } from '@/types';

export function useSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);

  const debouncedQuery = useDebounce(query, 300);

  const pageSize = 10;
  const hasMore = results.length < total;

  // Search function
  const performSearch = useCallback(async (searchQuery: string, from: number) => {
    if (!searchQuery.trim()) {
      setResults([]);
      setTotal(0);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await searchDocuments(searchQuery, from, pageSize);

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
  }, []);

  // Effect for new search (debounced query changes)
  useEffect(() => {
    setPage(0);
    performSearch(debouncedQuery, 0);
  }, [debouncedQuery, performSearch]);

  // Load more function for infinite scroll
  const loadMore = useCallback(() => {
    if (!loading && hasMore && debouncedQuery) {
      const nextPage = page + 1;
      setPage(nextPage);
      performSearch(debouncedQuery, nextPage * pageSize);
    }
  }, [loading, hasMore, debouncedQuery, page, performSearch]);

  return {
    query,
    setQuery,
    results,
    loading,
    error,
    total,
    hasMore,
    loadMore,
  };
}
