# Berkshire Hathaway RAG System

A Retrieval-Augmented Generation (RAG) system for processing and querying Warren Buffett's Berkshire Hathaway shareholder letters.

## Features

- **PDF Ingestion**: Automatically extract text from PDF shareholder letters
- **Smart Chunking**: Break documents into manageable pieces with overlap to maintain context
- **Vector Database**: Store document embeddings for fast semantic search
- **Semantic Search**: Query letters using natural language and get relevant passages
- **Year Filtering**: Search specific years or across all letters

## Setup

### 1. Add Your PDF Files

Place Berkshire Hathaway shareholder letter PDFs in the `data/pdfs/` directory:

```
data/
└── pdfs/
    ├── 2023.pdf
    ├── 2022.pdf
    ├── 2021.pdf
    └── ...
```

**Tip**: Name files with the year (e.g., `2023.pdf`) for automatic year metadata extraction.

### 2. Configure OpenAI API Key

The system uses OpenAI embeddings. Add your API key to `.env`:

```env
OPENAI_API_KEY=your_api_key_here
```

### 3. Install Dependencies

Already installed! The following packages are configured:
- `pdf-parse` - PDF text extraction
- `@mastra/rag` - Vector storage and retrieval
- `langchain` - Document processing utilities

## Usage

### Ingesting Documents

Run the ingestion pipeline to process all PDFs:

```powershell
npm.cmd run dev
```

Then in your code or via the Mastra dev server:

```typescript
import { ingestBerkshireLetters } from './mastra/rag';

await ingestBerkshireLetters();
```

This will:
1. ✅ Read all PDFs from `data/pdfs/`
2. ✅ Extract text and create chunks (1000 chars with 200 char overlap)
3. ✅ Generate embeddings using OpenAI
4. ✅ Store in vector database

### Querying Documents

#### Basic Query

```typescript
import { berkshireVectorStore } from './mastra/rag';

// Get top 5 relevant passages
const results = await berkshireVectorStore.query(
  "What does Warren Buffett say about insurance business?",
  5
);

results.forEach(doc => {
  console.log(`Year: ${doc.metadata.year}`);
  console.log(`Content: ${doc.content}`);
});
```

#### Query Specific Year

```typescript
// Search only 2023 letters
const results = await berkshireVectorStore.queryByYear(
  "What were the key highlights?",
  2023,
  5
);
```

#### Get Context for AI

```typescript
import { query } from './mastra/rag';

// Get formatted context string for AI prompts
const context = await query(
  "What is Buffett's investment philosophy?",
  5
);

// Use with your AI agent
const response = await agent.generate({
  prompt: `Context: ${context}\n\nQuestion: Explain Buffett's investment approach.`
});
```

### Running Examples

```typescript
import { runExampleQueries } from './mastra/rag';

// Run predefined example queries
await runExampleQueries();
```

## Chunking Configuration

The system uses optimized settings for financial documents:

```typescript
{
  chunkSize: 1000,      // Characters per chunk
  chunkOverlap: 200,    // Overlap to maintain context
  separators: ['\n\n', '\n', '. ', ' ', '']  // Split priorities
}
```

To customize chunking:

```typescript
import { chunkText } from './mastra/rag';

const chunks = chunkText(
  text,
  1500,  // Custom chunk size
  300,   // Custom overlap
  ['\n\n', '\n']  // Custom separators
);
```

## Architecture

```
src/mastra/rag/
├── pdf-ingestion.ts    # PDF parsing and chunking
├── vector-store.ts     # Vector database wrapper
├── ingest.ts          # Main ingestion pipeline
├── query-examples.ts  # Example queries and usage
└── index.ts          # Exports
```

### Key Components

1. **PDF Ingestion** (`pdf-ingestion.ts`)
   - Parses PDFs using `pdf-parse`
   - Chunks text with configurable size/overlap
   - Creates `MDocument` objects with metadata

2. **Vector Store** (`vector-store.ts`)
   - Wraps Mastra's RAG functionality
   - Handles embedding generation
   - Provides query interface

3. **Ingestion Pipeline** (`ingest.ts`)
   - Orchestrates the full ingestion process
   - Handles multiple PDFs
   - Provides progress feedback

## Advanced Usage

### Custom Metadata

```typescript
import { processPDF } from './mastra/rag';

const documents = await processPDF('path/to/letter.pdf', {
  year: 2023,
  quarter: 'Q4',
  customField: 'value'
});
```

### Filter Queries

```typescript
const results = await berkshireVectorStore.query(
  "investment strategy",
  5,
  { year: 2023, documentType: 'shareholder_letter' }
);
```

### Access RAG Instance Directly

```typescript
const rag = berkshireVectorStore.getRAG();
// Use advanced RAG features
```

## Troubleshooting

### No PDFs Found
- Ensure PDFs are in `data/pdfs/` directory
- Check file extensions are `.pdf`

### Embedding Errors
- Verify `OPENAI_API_KEY` is set in `.env`
- Check API key has sufficient credits

### Chunk Size Issues
- For longer passages, increase `chunkSize`
- For more context overlap, increase `chunkOverlap`

## Next Steps

1. **Add an Agent**: Create a Mastra agent that uses the vector store
2. **Build a UI**: Create a chat interface for querying letters
3. **Add More Sources**: Extend to annual reports, 10-Ks, etc.
4. **Production Vector DB**: Switch to Pinecone/Qdrant for persistence

## Resources

- [Mastra RAG Documentation](https://docs.mastra.ai)
- [Berkshire Hathaway Letters](https://www.berkshirehathaway.com/letters/letters.html)
- [RAG Best Practices](https://docs.mastra.ai/rag/best-practices)
