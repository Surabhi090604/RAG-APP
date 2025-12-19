import { OpenAIEmbeddings } from '@langchain/openai';
import { Document } from '@langchain/core/documents';

export type BerkshireDocument = {
  content: string;
  metadata?: Record<string, any>;
};

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

    const texts = documents.map(d => d.pageContent);
    // Batch embedding might hit limits, but for this scale it's likely fine.
    // If needed, we could chunk this.
    const embeddings = await this.embeddings.embedDocuments(texts);

    for (let i = 0; i < documents.length; i++) {
      this.docs.push({ doc: documents[i], embedding: embeddings[i] });
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
    console.log('✓ Vector store cleared');
  }
}

export const berkshireVectorStore = new BerkshireVectorStore();
