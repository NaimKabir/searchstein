import type { SearchResponse } from '@/types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export async function searchDocuments(
  query: string,
  from: number = 0,
  size: number = 10
): Promise<SearchResponse> {
  if (!query.trim()) {
    return { results: [], total: 0 };
  }

  try {
    const url = `${API_URL}/api/search?q=${encodeURIComponent(query)}&from=${from}&size=${size}`;
    const response = await fetch(url);

    if (response.status === 429) {
      const retryAfter = response.headers.get('Retry-After');
      const retryMessage = retryAfter
        ? `Please wait ${retryAfter} seconds and try again.`
        : 'Please wait and try again later.';
      throw new Error(`You are doing that too much. ${retryMessage}`);
    }

    if (!response.ok) {
      throw new Error(`Search failed: ${response.statusText}`);
    }

    const data: SearchResponse = await response.json();
    return data;
  } catch (error) {
    console.error('API search error:', error);
    throw error;
  }
}
