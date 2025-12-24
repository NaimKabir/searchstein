import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider, createRouter, createRootRoute } from '@tanstack/react-router';
import { SearchBar } from '@/components/SearchBar';
import { SearchResults } from '@/components/SearchResults';
import { useSearch } from '@/hooks/useSearch';
import './index.css';

// Create root route
const rootRoute = createRootRoute({
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
  const { query, setQuery, results, loading, error, hasMore, loadMore } = useSearch();

  return (
    <>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4 text-center">Searchstein</h1>
        <p className="text-sm text-muted-foreground font-mono text-center mb-6 max-w-3xl mx-auto">
          A searchable repository of unredacted Epstein files available from the{' '}
          <a
            href="https://www.justice.gov/epstein"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-foreground"
          >
            Justice Department's Epstein Files
          </a>
          {' '}as of Dec 23, 2025.
        </p>
        <SearchBar value={query} onChange={setQuery} />
      </div>
      <div className="mb-8 pb-6 border-b text-center">
        <p className="text-xs text-muted-foreground font-mono">
          Problems with search? Send feedback to{' '}
          <a
            href="https://x.com/KabirCreates"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-foreground"
          >
            @kabircreates
          </a>
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
const routeTree = rootRoute;

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
