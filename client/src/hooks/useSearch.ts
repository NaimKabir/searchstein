import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useSearch as useRouterSearch } from '@tanstack/react-router';
import { searchDocuments } from '@/lib/api';
import { useDebounce } from './useDebounce';
import type { SearchResult } from '@/types';

export function useSearch() {
  // Read search params from router
  const searchParams = useRouterSearch({ from: '/' });
  const navigate = useNavigate({ from: '/' });

  const query = searchParams.q || '';

  // Memoize arrays to prevent infinite re-renders from new array references
  const includeDocumentNames = useMemo(
    () => searchParams.include || [],
    [searchParams.include]
  );
  const excludeDocumentNames = useMemo(
    () => searchParams.exclude || [],
    [searchParams.exclude]
  );

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

  // Setters navigate to new URL with updated params
  const setQuery = useCallback(
    (newQuery: string) => {
      navigate({
        search: {
          q: newQuery || undefined,
          include: includeDocumentNames.length > 0 ? includeDocumentNames : undefined,
          exclude: excludeDocumentNames.length > 0 ? excludeDocumentNames : undefined,
        },
        replace: true,
      });
    },
    [navigate, includeDocumentNames, excludeDocumentNames]
  );

  const addIncludeDocumentName = useCallback(
    (name: string) => {
      const trimmed = name.trim();
      if (trimmed && !includeDocumentNames.includes(trimmed)) {
        navigate({
          search: {
            q: query || undefined,
            include: [...includeDocumentNames, trimmed],
            exclude: excludeDocumentNames.length > 0 ? excludeDocumentNames : undefined,
          },
          replace: true,
        });
      }
    },
    [navigate, query, includeDocumentNames, excludeDocumentNames]
  );

  const removeIncludeDocumentName = useCallback(
    (name: string) => {
      const newInclude = includeDocumentNames.filter((n) => n !== name);
      navigate({
        search: {
          q: query || undefined,
          include: newInclude.length > 0 ? newInclude : undefined,
          exclude: excludeDocumentNames.length > 0 ? excludeDocumentNames : undefined,
        },
        replace: true,
      });
    },
    [navigate, query, includeDocumentNames, excludeDocumentNames]
  );

  const addExcludeDocumentName = useCallback(
    (name: string) => {
      const trimmed = name.trim();
      if (trimmed && !excludeDocumentNames.includes(trimmed)) {
        navigate({
          search: {
            q: query || undefined,
            include: includeDocumentNames.length > 0 ? includeDocumentNames : undefined,
            exclude: [...excludeDocumentNames, trimmed],
          },
          replace: true,
        });
      }
    },
    [navigate, query, includeDocumentNames, excludeDocumentNames]
  );

  const removeExcludeDocumentName = useCallback(
    (name: string) => {
      const newExclude = excludeDocumentNames.filter((n) => n !== name);
      navigate({
        search: {
          q: query || undefined,
          include: includeDocumentNames.length > 0 ? includeDocumentNames : undefined,
          exclude: newExclude.length > 0 ? newExclude : undefined,
        },
        replace: true,
      });
    },
    [navigate, query, includeDocumentNames, excludeDocumentNames]
  );

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
