import type { ElasticsearchHit } from './types';

const esNode = process.env.ES_NODE || '';
const esApiKey = process.env.ES_API_KEY || '';
const esIndex = process.env.ES_INDEX || 'epstein-documents';

// Test connection on startup (using root endpoint for serverless compatibility)
async function testConnection() {
  try {
    const response = await fetch(`${esNode}/`, {
      headers: {
        'Authorization': `ApiKey ${esApiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      console.log('✓ Elasticsearch connected (serverless)');
    } else {
      console.error('✗ Elasticsearch connection failed:', response.status, response.statusText);
    }
  } catch (err) {
    console.error('✗ Elasticsearch connection failed:', err instanceof Error ? err.message : err);
  }
}

testConnection();

export async function searchDocuments(
  query: string,
  from: number = 0,
  size: number = 10
): Promise<{ hits: ElasticsearchHit[]; total: number }> {
  try {
    console.log(`Searching for: "${query}" (from: ${from}, size: ${size})`);

    const searchBody = {
      retriever: {
        rrf: {
          retrievers: [
            {
              // Semantic search on text_semantic field
              standard: {
                query: {
                  semantic: {
                    field: 'text_semantic',
                    query,
                  },
                },
              },
            },
            {
              // Traditional text search on text field
              standard: {
                query: {
                  multi_match: {
                    query,
                    fields: ['text'],
                  },
                },
              },
            },
          ],
          rank_window_size: 100,
          rank_constant: 60,
        },
      },
      from,
      size,
      highlight: {
        fields: {
          text: {
            fragment_size: 150,
            number_of_fragments: 3,
          },
        },
        pre_tags: ['<mark>'],
        post_tags: ['</mark>'],
      },
    };

    const response = await fetch(`${esNode}/${esIndex}/_search`, {
      method: 'POST',
      headers: {
        'Authorization': `ApiKey ${esApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(searchBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Elasticsearch error response:', errorText);
      throw new Error(`Elasticsearch query failed: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    console.log(`Found ${result.hits?.hits?.length || 0} results`);

    const hits = (result.hits?.hits || []) as ElasticsearchHit[];
    const total = typeof result.hits?.total === 'number'
      ? result.hits.total
      : result.hits?.total?.value || 0;

    return { hits, total };
  } catch (error) {
    console.error('Elasticsearch query error:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    throw error;
  }
}
