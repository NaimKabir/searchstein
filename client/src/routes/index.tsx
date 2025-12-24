import { createFileRoute } from '@tanstack/react-router';
import { SearchBar } from '@/components/SearchBar';
import { SearchResults } from '@/components/SearchResults';
import { useSearch } from '@/hooks/useSearch';

export const Route = createFileRoute('/')({
  component: Index,
});

function Index() {
  const { query, setQuery, results, loading, error, hasMore, loadMore } = useSearch();

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-6 text-center">Searchstein</h1>
        <SearchBar value={query} onChange={setQuery} />
      </div>
      <SearchResults
        results={results}
        loading={loading}
        error={error}
        hasMore={hasMore}
        onLoadMore={loadMore}
      />
    </div>
  );
}
