import { OpenAIEmbeddings } from '@langchain/openai';
import { Document } from '@langchain/core/documents';
import * as fs from 'fs';
import * as path from 'path';

export type BerkshireDocument = {
  content: string;
  metadata?: Record<string, any>;
};

// Define path for persistence
const DATA_DIR = path.join(process.cwd(), 'data');
export const VECTORS_FILE = path.join(DATA_DIR, 'vectors.json');

/**
 * Simple in-memory vector store implementation
 * Replaces langchain/vectorstores/memory to avoid build/bundling issues
 */
class SimpleMemoryVectorStore {
  private docs: { doc: Document; embedding: number[] }[] = [];
  private embeddings: OpenAIEmbeddings;

  constructor(embeddings: OpenAIEmbeddings) {
    this.embeddings = embeddings;
  }

  async addDocuments(documents: Document[]): Promise<void> {
    if (documents.length === 0) return;

    // Batch processing to avoid token limits
    const BATCH_SIZE = 50;

    for (let i = 0; i < documents.length; i += BATCH_SIZE) {
      const batch = documents.slice(i, i + BATCH_SIZE);
      const texts = batch.map(d => d.pageContent);

      try {
        const embeddings = await this.embeddings.embedDocuments(texts);

        for (let j = 0; j < batch.length; j++) {
          this.docs.push({ doc: batch[j], embedding: embeddings[j] });
        }
        console.log(`Embedded and stored documents ${i + 1} to ${Math.min(i + BATCH_SIZE, documents.length)}`);
      } catch (err) {
        console.error(`Failed to embed batch ${i / BATCH_SIZE + 1}:`, err);
        // Decide whether to throw or continue. Throwing is safer for data integrity.
        throw err;
      }
    }
  }

  async similaritySearch(
    query: string,
    k: number = 4,
    filter?: Record<string, any>
  ): Promise<Document[]> {
    const queryEmbedding = await this.embeddings.embedQuery(query);

    // Calculate similarities
    const results = this.docs
      .map(item => {
        // Filter check
        if (filter) {
          const match = Object.entries(filter).every(([key, val]) => item.doc.metadata[key] === val);
          if (!match) return null;
        }

        return {
          doc: item.doc,
          score: this.cosineSimilarity(queryEmbedding, item.embedding)
        };
      })
      .filter((item): item is { doc: Document; score: number } => item !== null)
      .sort((a, b) => b.score - a.score)
      .slice(0, k);

    return results.map(r => r.doc);
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    let dot = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < a.length; i++) {
      dot += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    // OpenAI embeddings are normalized, so norms should be ~1
    // But to be safe:
    return dot / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  // Persistence methods
  saveToFile(filePath: string) {
    if (!fs.existsSync(path.dirname(filePath))) {
      fs.mkdirSync(path.dirname(filePath), { recursive: true });
    }
    const data = JSON.stringify(this.docs);
    fs.writeFileSync(filePath, data, 'utf-8');
    console.log(`Saved ${this.docs.length} vectors to ${filePath}`);
  }

  loadFromFile(filePath: string) {
    if (fs.existsSync(filePath)) {
      try {
        const data = fs.readFileSync(filePath, 'utf-8');
        this.docs = JSON.parse(data);
        console.log(`Loaded ${this.docs.length} vectors from ${filePath}`);
        return true;
      } catch (err) {
        console.error('Failed to load vectors:', err);
      }
    }
    return false;
  }
}

/**
 * Vector store for Berkshire Hathaway letters
 */
export class BerkshireVectorStore {
  private store: SimpleMemoryVectorStore;
  private embeddings: OpenAIEmbeddings;

  constructor() {
    this.embeddings = new OpenAIEmbeddings({
      model: 'text-embedding-3-small',
    });
    this.store = new SimpleMemoryVectorStore(this.embeddings);

    // Try to auto-load on init
    this.store.loadFromFile(VECTORS_FILE);
  }

  /**
   * Add documents to the vector store (embedding + indexing)
   * Documents are chunked automatically by character count
   */
  async addDocuments(documents: BerkshireDocument[]): Promise<void> {
    console.log(`Adding ${documents.length} documents to vector store...`);
    try {
      const allChunks: Document[] = [];

      for (const [idx, doc] of documents.entries()) {
        allChunks.push(
          new Document({
            pageContent: doc.content,
            metadata: {
              ...doc.metadata,
              // If not already set by ingest, provide sensible defaults
              chunkIndex: doc.metadata?.chunkIndex ?? idx,
            },
          })
        );
      }

      await this.store.addDocuments(allChunks);
      console.log(`✓ Successfully added ${allChunks.length} chunks from ${documents.length} documents`);

      // Auto-save after adding
      this.store.saveToFile(VECTORS_FILE);

    } catch (error) {
      console.error('Error adding documents to vector store:', error);
      throw error;
    }
  }

  /**
   * Query the vector store for relevant documents
   */
  async query(
    query: string,
    topK: number = 5,
    filter?: Record<string, any>
  ): Promise<BerkshireDocument[]> {
    console.log(`Querying vector store: "${query}"`);
    try {
      const results = await this.store.similaritySearch(query, topK, filter);
      console.log(`Found ${results.length} relevant documents`);
      return results.map((doc) => ({
        content: doc.pageContent,
        metadata: doc.metadata,
      }));
    } catch (error) {
      console.error('Error querying vector store:', error);
      throw error;
    }
  }

  /**
   * Query with specific year filter
   */
  async queryByYear(
    query: string,
    year: number,
    topK: number = 5
  ): Promise<BerkshireDocument[]> {
    return this.query(query, topK, { year });
  }

  /**
   * Clear the index (dev-only)
   */
  async clearIndex(): Promise<void> {
    console.log('Clearing vector store...');
    this.store = new SimpleMemoryVectorStore(this.embeddings);
    // Clear file too
    if (fs.existsSync(VECTORS_FILE)) {
      fs.unlinkSync(VECTORS_FILE);
    }
    console.log('✓ Vector store cleared');
  }
}

export const berkshireVectorStore = new BerkshireVectorStore();
