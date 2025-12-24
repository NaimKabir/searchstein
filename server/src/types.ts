export interface SearchResult {
  text: string;
  page_number: number;
  page_pdf_url: string;
  unredacted_pdf_url: string;
  original_pdf_url: string;
  document_filename: string;
  source_document: string;
  total_pages: number;
  timestamp: string;
  indexed_at: string;
  highlight?: string[]; // Highlighted text snippets
}

export interface SearchResponse {
  results: SearchResult[];
  total: number;
}

export interface ElasticsearchHit {
  _source: {
    text: string;
    page_number: number;
    page_pdf_url: string;
    unredacted_pdf_url: string;
    original_pdf_url: string;
    document_filename: string;
    source_document: string;
    total_pages: number;
    timestamp: string;
    indexed_at: string;
  };
  highlight?: {
    text?: string[];
  };
}
