import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { searchDocuments } from './elasticsearch';
import { signS3Url } from './s3';
import { rateLimit } from './ratelimit';
import type { SearchResult, SearchResponse } from './types';

const app = new Hono();

const port = parseInt(process.env.PORT || '8000', 10);

// Allowed origins for CORS
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'https://searchstein-1.onrender.com',
  'https://searchstein.com',
  'https://www.searchstein.com',
  'http://searchstein.com',
  'http://www.searchstein.com',
];

// CORS configuration
app.use('/*', cors({
  origin: (origin) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return true;
    // Check if origin is in allowed list
    return allowedOrigins.includes(origin);
  },
  credentials: true,
}));

// Health check endpoint
app.get('/health', (c) => {
  return c.json({ status: 'ok' });
});

// Search endpoint with rate limiting
app.get('/api/search',
  rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10), // Default: 1 minute
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '200', 10), // Default: 30 req/min
  }),
  async (c) => {
  const query = c.req.query('q') || '';
  const from = parseInt(c.req.query('from') || '0', 10);
  const size = parseInt(c.req.query('size') || '10', 10);

  if (!query) {
    return c.json({ error: 'Query parameter "q" is required' }, 400);
  }

  try {
    // Query Elasticsearch
    const { hits, total } = await searchDocuments(query, from, size);

    // Transform results and sign S3 URLs
    const results: SearchResult[] = await Promise.all(
      hits.map(async (hit) => {
        const source = hit._source;

        // Sign all S3 URLs
        const [page_pdf_url, unredacted_pdf_url, original_pdf_url] = await Promise.all([
          signS3Url(source.page_pdf_url),
          signS3Url(source.unredacted_pdf_url),
          signS3Url(source.original_pdf_url),
        ]);

        return {
          text: source.text,
          page_number: source.page_number,
          page_pdf_url,
          unredacted_pdf_url,
          original_pdf_url,
          document_filename: source.document_filename,
          source_document: source.source_document,
          total_pages: source.total_pages,
          timestamp: source.timestamp,
          indexed_at: source.indexed_at,
          highlight: hit.highlight?.text,
        };
      })
    );

    const response: SearchResponse = {
      results,
      total,
    };

    return c.json(response);
  } catch (error) {
    console.error('Search error:', error);
    return c.json({ error: 'Search failed' }, 500);
  }
  }
);

const rateLimitWindow = parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10);
const rateLimitMax = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '30', 10);

console.log(`Server starting on port ${port}...`);
console.log(`Rate limiting: ${rateLimitMax} requests per ${rateLimitWindow / 1000}s per IP`);

export default {
  port,
  fetch: app.fetch,
};
