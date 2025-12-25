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
  size: number = 10,
  includeDocumentNames?: string[],
  excludeDocumentNames?: string[]
): Promise<{ hits: ElasticsearchHit[]; total: number }> {
  try {
    console.log(`Searching for: "${query}" (from: ${from}, size: ${size})`);
    if (includeDocumentNames && includeDocumentNames.length > 0) {
      console.log(`Including document names: ${includeDocumentNames.join(', ')}`);
    }
    if (excludeDocumentNames && excludeDocumentNames.length > 0) {
      console.log(`Excluding document names: ${excludeDocumentNames.join(', ')}`);
    }

    const searchBody: any = query.trim()
      ? {
          // Query search with RRF
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
        }
      : {
          // No query - return all documents
          query: {
            match_all: {},
          },
          from,
          size,
        };

    // Add post_filter for document names if provided
    const hasIncludeFilters = includeDocumentNames && includeDocumentNames.length > 0;
    const hasExcludeFilters = excludeDocumentNames && excludeDocumentNames.length > 0;

    if (hasIncludeFilters || hasExcludeFilters) {
      const boolFilter: any = { bool: {} };

      // Add include filters (must match at least one)
      if (hasIncludeFilters) {
        if (includeDocumentNames.length === 1) {
          // Single include filter
          boolFilter.bool.must = {
            wildcard: {
              document_filename_wildcard: {
                value: `*${includeDocumentNames[0]}*`,
                case_insensitive: true,
              },
            },
          };
        } else {
          // Multiple include filters - must match at least one (OR logic)
          boolFilter.bool.must = {
            bool: {
              should: includeDocumentNames.map(filter => ({
                wildcard: {
                  document_filename_wildcard: {
                    value: `*${filter}*`,
                    case_insensitive: true,
                  },
                },
              })),
              minimum_should_match: 1,
            },
          };
        }
      }

      // Add exclude filters (must not match any)
      if (hasExcludeFilters) {
        boolFilter.bool.must_not = excludeDocumentNames.map(filter => ({
          wildcard: {
            document_filename_wildcard: {
              value: `*${filter}*`,
              case_insensitive: true,
            },
          },
        }));
      }

      searchBody.post_filter = boolFilter;
    }

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
