# Searchstein

A minimal, developer-focused search application for querying Elasticsearch and viewing PDF documents with signed S3 URLs.

## Features

- **Real-time Search**: Debounced search as you type
- **PDF Preview**: View PDF page previews directly in the search results
- **Infinite Scroll**: Load more results automatically as you scroll
- **Signed URLs**: Secure 30-minute S3 signed URLs for document access
- **Monospace Aesthetic**: Developer-focused UI with JetBrains Mono font
- **Full TypeScript**: Both client and server written in TypeScript

## Tech Stack

### Client
- **React** with TypeScript
- **Vite** for development and bundling
- **Bun** as runtime and package manager
- **TanStack Router** for routing
- **ShadCN UI** with Tailwind CSS for components
- **react-pdf** for PDF rendering

### Server
- **Bun** runtime
- **Hono** web framework
- **Elasticsearch** client
- **AWS SDK** for S3 signed URLs

## Project Structure

```
searchstein/
├── client/                 # React frontend
│   ├── src/
│   │   ├── routes/        # TanStack Router routes
│   │   ├── components/    # React components
│   │   ├── hooks/         # Custom hooks
│   │   ├── lib/           # Utilities
│   │   └── types/         # TypeScript types
│   └── package.json
├── server/                # TypeScript backend
│   ├── src/
│   │   ├── index.ts       # Main server
│   │   ├── elasticsearch.ts
│   │   ├── s3.ts
│   │   └── types.ts
│   └── package.json
└── README.md
```

## Setup

### Prerequisites
- [Bun](https://bun.sh/) installed
- Elasticsearch instance with data indexed
- AWS S3 bucket with PDF files

### Installation

1. **Clone the repository**
   ```bash
   git clone <repo-url>
   cd searchstein
   ```

2. **Install client dependencies**
   ```bash
   cd client
   bun install
   ```

3. **Install server dependencies**
   ```bash
   cd ../server
   bun install
   ```

### Configuration

1. **Client Environment** (`client/.env`)
   ```bash
   cp client/.env.example client/.env
   ```
   Edit `client/.env`:
   ```
   VITE_API_URL=http://localhost:8000
   ```

2. **Server Environment** (`server/.env`)
   ```bash
   cp server/.env.example server/.env
   ```
   Edit `server/.env` with your credentials:
   ```
   PORT=8000
   FRONTEND_URL=http://localhost:5173

   ES_NODE=https://your-es-cluster.cloud:443
   ES_API_KEY=your-elasticsearch-api-key
   ES_INDEX=your-index-name

   AWS_ACCESS_KEY_ID=your-aws-access-key
   AWS_SECRET_ACCESS_KEY=your-aws-secret-key
   AWS_REGION=us-west-1
   S3_BUCKET=your-bucket-name
   S3_URL_EXPIRY=1800
   ```

## Running Locally

### Option 1: Start Both (Recommended)
From the root directory:
```bash
bun run dev
```
This starts both server (http://localhost:8000) and client (http://localhost:5173)

### Option 2: Start Individually

**Start the Backend**
```bash
cd server
bun run dev
```
Server runs on http://localhost:8000

**Start the Frontend** (in new terminal)
```bash
cd client
bun run dev
```
Frontend runs on http://localhost:5173

## API Endpoints

### `GET /health`
Health check endpoint

### `GET /api/search`
Search documents in Elasticsearch

**Query Parameters:**
- `q` (required): Search query
- `from` (optional): Offset for pagination (default: 0)
- `size` (optional): Number of results (default: 10)

**Response:**
```json
{
  "results": [...],
  "total": 123
}
```

## Development

### Client Scripts
- `bun run dev` - Start development server
- `bun run build` - Build for production
- `bun run preview` - Preview production build

### Server Scripts
- `bun run dev` - Start with hot reload
- `bun run start` - Start production server

## Document Schema

The Elasticsearch index should contain documents with this schema:
```typescript
{
  text: string
  page_number: number
  page_pdf_url: string          // S3 URL to single page PDF
  unredacted_pdf_url: string    // S3 URL to full unredacted PDF
  original_pdf_url: string      // S3 URL to original PDF
  document_filename: string
  source_document: string
  total_pages: number
  timestamp: string
  indexed_at: string
}
```

## License

MIT
