import type { SearchResponse } from '@/types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export async function searchDocuments(
  query: string,
  from: number = 0,
  size: number = 10,
  includeDocumentNames?: string[],
  excludeDocumentNames?: string[]
): Promise<SearchResponse> {
  try {
    let url = `${API_URL}/api/search?q=${encodeURIComponent(query)}&from=${from}&size=${size}`;
    if (includeDocumentNames && includeDocumentNames.length > 0) {
      includeDocumentNames.forEach(name => {
        url += `&include_document=${encodeURIComponent(name)}`;
      });
    }
    if (excludeDocumentNames && excludeDocumentNames.length > 0) {
      excludeDocumentNames.forEach(name => {
        url += `&exclude_document=${encodeURIComponent(name)}`;
      });
    }
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

export async function fetchDocumentPages(pageUrl: string): Promise<string[]> {
  try {
    const url = `${API_URL}/api/document-pages?page_url=${encodeURIComponent(pageUrl)}`;
    const response = await fetch(url);

    if (response.status === 429) {
      const retryAfter = response.headers.get('Retry-After');
      const retryMessage = retryAfter
        ? `Please wait ${retryAfter} seconds and try again.`
        : 'Please wait and try again later.';
      throw new Error(`You are doing that too much. ${retryMessage}`);
    }

    if (!response.ok) {
      throw new Error(`Failed to fetch document pages: ${response.statusText}`);
    }

    const data = await response.json();
    return data.urls;
  } catch (error) {
    console.error('API document pages error:', error);
    throw error;
  }
}
