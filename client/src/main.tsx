import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider, createRouter, createRootRoute, createRoute } from '@tanstack/react-router';
import { SearchBar } from '@/components/SearchBar';
import { SearchResults } from '@/components/SearchResults';
import { useSearch } from '@/hooks/useSearch';
import './index.css';

// Define search params schema
type SearchParams = {
  q?: string;
  include?: string[];
  exclude?: string[];
};

// Create root route
const rootRoute = createRootRoute();

// Create index route with search params
const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  validateSearch: (search: Record<string, unknown>): SearchParams => {
    return {
      q: (search.q as string) || undefined,
      include: Array.isArray(search.include)
        ? search.include
        : search.include
        ? [search.include as string]
        : undefined,
      exclude: Array.isArray(search.exclude)
        ? search.exclude
        : search.exclude
        ? [search.exclude as string]
        : undefined,
    };
  },
  component: () => (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <IndexComponent />
      </div>
    </div>
  ),
});

// Index component
function IndexComponent() {
  const {
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
    hasMore,
    loadMore
  } = useSearch();

  return (
    <>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4 text-center">Searchstein</h1>
        <p className="text-sm text-muted-foreground font-mono text-center mb-6 max-w-3xl mx-auto">
          A searchable repository of the Epstein files available from the{' '}
          <a
            href="https://www.justice.gov/epstein"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-foreground"
          >
            Justice Department
          </a>
          {' '}as of Dec 23, 2025.
        </p>
        <SearchBar
          value={query}
          onChange={setQuery}
          includeDocumentNames={includeDocumentNames}
          onAddIncludeDocumentName={addIncludeDocumentName}
          onRemoveIncludeDocumentName={removeIncludeDocumentName}
          excludeDocumentNames={excludeDocumentNames}
          onAddExcludeDocumentName={addExcludeDocumentName}
          onRemoveExcludeDocumentName={removeExcludeDocumentName}
        />
      </div>
      <div className="mb-8 pb-6 border-b text-center">
        <p className="text-xs text-muted-foreground font-mono mb-2">
          Unredaction can cause artifacts: download the original files available{' '}
          on each result to make comparisons.
        </p>
        <p className="text-xs text-muted-foreground font-mono">
          And remember to do your part. Torrent the full files{' '}
          <a
            href="magnet:?xt=urn:btih:0b75e5c1fc59666e1b4acaf277faa376b90b9860&dn=eps_files_with_dataset8.zip"
            className="underline hover:text-foreground"
          >
            here
          </a>
          {' '}and seed them for others.
        </p>
      </div>
      <SearchResults
        results={results}
        loading={loading}
        error={error}
        hasMore={hasMore}
        onLoadMore={loadMore}
      />
    </>
  );
}

// Create the route tree
const routeTree = rootRoute.addChildren([indexRoute]);

// Create a new router instance
const router = createRouter({ routeTree });

// Register the router instance for type safety
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);
