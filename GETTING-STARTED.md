# Getting Started with Berkshire Hathaway RAG System

This guide will walk you through setting up and using the RAG (Retrieval-Augmented Generation) system for Warren Buffett's shareholder letters.

## Prerequisites

- ✅ Node.js (v22.13.0 or higher) - Already installed
- ✅ npm - Already installed
- ✅ OpenAI API key (for embeddings)

## Step 1: Set Up Your Environment

### Add OpenAI API Key

Create or edit the `.env` file in the project root:

```env
OPENAI_API_KEY=sk-your-api-key-here
```

💡 **Get an API key**: https://platform.openai.com/api-keys

## Step 2: Add PDF Documents

1. Download Berkshire Hathaway shareholder letters from:
   - https://www.berkshirehathaway.com/letters/letters.html

2. Save them to `data/pdfs/` with year in filename:
   ```
   data/pdfs/
   ├── 2023.pdf
   ├── 2022.pdf
   ├── 2021.pdf
   └── ...
   ```

💡 **Tip**: The year in the filename helps organize results by year

## Step 3: Ingest Documents

Process the PDFs and create embeddings:

```powershell
# Using the safe npm.cmd method (no policy change needed)
npm.cmd run ingest
```

This will:
- 📄 Read and parse all PDFs
- ✂️ Chunk them into ~1000 character pieces with 200 char overlap
- 🧠 Create embeddings using OpenAI
- 💾 Store in vector database

**Expected output:**
```
🚀 Starting Berkshire Hathaway letter ingestion...
📄 Step 1: Processing PDF files...
✓ Processed 2023.pdf (2023)
✓ Processed 2022.pdf (2022)
✓ Created 245 document chunks from PDFs

🔮 Step 2: Creating embeddings and storing in vector database...
✓ Successfully added 245 documents

✅ Ingestion complete!
```

## Step 4: Query the Letters

### Option A: Run Example Queries

```powershell
npm.cmd run query
```

This runs predefined queries demonstrating the system.

### Option B: Use Programmatically

```typescript
import { berkshireVectorStore } from './mastra/rag';

// Basic query
const results = await berkshireVectorStore.query(
  "What does Warren Buffett say about insurance business?",
  5  // top 5 results
);

results.forEach(doc => {
  console.log(`Year: ${doc.metadata.year}`);
  console.log(doc.content);
});
```

### Option C: Use the Berkshire Agent

The agent automatically retrieves relevant context and provides answers:

```typescript
import { mastra } from './mastra';

const agent = mastra.getAgent('berkshireAgent');

const response = await agent.generate({
  prompt: "What is Warren Buffett's investment philosophy?",
});

console.log(response.text);
```

## Step 5: Start the Dev Server

```powershell
npm.cmd run dev
```

Then open the Mastra UI in your browser to:
- Chat with the Berkshire Agent
- Test queries interactively
- View observability data

## Quick Command Reference

```powershell
# Ingestion & Queries
npm.cmd run ingest          # Process all PDFs
npm.cmd run query           # Run example queries
npm.cmd run rag             # Show RAG system help

# Development
npm.cmd run dev             # Start Mastra dev server
npm.cmd run build           # Build for production
npm.cmd run start           # Start production server
```

## Example Use Cases

### 1. Research Investment Philosophy

```typescript
const context = await query(
  "What is Buffett's approach to value investing?",
  5
);
// Use context with AI to generate detailed explanation
```

### 2. Find Yearly Insights

```typescript
const results = await berkshireVectorStore.queryByYear(
  "What were the key challenges?",
  2023,
  3
);
```

### 3. Build a Chat Interface

```typescript
import { berkshireAgent } from './mastra/agents/berkshire-agent';

const conversation = [
  { role: 'user', content: 'Tell me about Berkshire\'s insurance operations' },
];

const response = await berkshireAgent.generate({
  messages: conversation,
});
```

## Configuration Options

### Adjust Chunk Size

Edit `src/mastra/rag/pdf-ingestion.ts`:

```typescript
export const CHUNK_CONFIG = {
  chunkSize: 1500,      // Increase for longer passages
  chunkOverlap: 300,    // More overlap = more context
  separators: ['\n\n', '\n', '. ', ' '],
};
```

### Change Embedding Model

Edit `src/mastra/rag/vector-store.ts`:

```typescript
this.rag = new RAG({
  provider: openai.embedding('text-embedding-3-large'),  // More accurate, costs more
});
```

### Add Persistent Storage

Replace in-memory vector store with a persistent one:

```typescript
import { PineconeVectorStore } from '@mastra/rag';

// Configure Pinecone, Qdrant, or other vector DBs
```

## Troubleshooting

### "No documents found"
- Check PDFs are in `data/pdfs/`
- Verify filenames end with `.pdf`

### "OpenAI API Error"
- Ensure `OPENAI_API_KEY` is set in `.env`
- Check API key is valid and has credits

### "Cannot load scripts"
- Use `npm.cmd` instead of `npm` on Windows
- Or set execution policy (see main README)

### Empty query results
- Make sure you ran ingestion first
- Check if PDFs were parsed correctly
- Try increasing `topK` parameter

## What's Next?

1. **Add More Documents**: Annual reports, 10-Ks, analyst transcripts
2. **Build a UI**: Create a web chat interface
3. **Advanced Queries**: Implement filters, date ranges
4. **Export Context**: Generate study guides or summaries
5. **Multi-Agent System**: Combine with other financial data sources

## Architecture Overview

```
User Query
    ↓
Berkshire Agent (optional)
    ↓
Vector Store Query
    ↓
Embedding Creation (OpenAI)
    ↓
Similarity Search
    ↓
Return Top K Chunks
    ↓
Agent Generates Response (with context)
    ↓
Final Answer
```

## Resources

- 📖 [RAG Guide](./RAG-GUIDE.md) - Detailed technical docs
- 🌐 [Mastra Docs](https://docs.mastra.ai)
- 📚 [Berkshire Letters](https://www.berkshirehathaway.com/letters/letters.html)

## Support

Having issues? Check:
1. Node version: `node -v` (should be ≥22.13.0)
2. Dependencies installed: `npm.cmd install`
3. PDFs in correct location: `data/pdfs/`
4. API key set: Check `.env` file

Happy querying! 🚀
