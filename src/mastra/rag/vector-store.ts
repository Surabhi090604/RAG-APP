import { MemoryVectorStore } from 'langchain/vectorstores/memory';
import { OpenAIEmbeddings } from '@langchain/openai';
import { Document } from '@langchain/core/documents';
import { CHUNK_CONFIG } from './pdf-ingestion.js';

export type BerkshireDocument = {
  content: string;
  metadata?: Record<string, any>;
};

/**
 * Vector store for Berkshire Hathaway letters
 * Uses LangChain's MemoryVectorStore with OpenAI embeddings
 */
export class BerkshireVectorStore {
  private store: MemoryVectorStore;
  private embeddings: OpenAIEmbeddings;

  constructor() {
    this.embeddings = new OpenAIEmbeddings({
      model: 'text-embedding-3-small',
    });
    this.store = new MemoryVectorStore(this.embeddings);
  }

  /**
   * Add documents to the vector store (embedding + indexing)
   * Documents are chunked automatically by character count
   */
  async addDocuments(documents: BerkshireDocument[]): Promise<void> {
    console.log(`Adding ${documents.length} documents to vector store...`);
    try {
      // Chunk each document
      const allChunks: Document[] = [];
      
      for (const doc of documents) {
        const chunks = this.chunkText(doc.content, CHUNK_CONFIG.chunkSize, CHUNK_CONFIG.chunkOverlap);
        chunks.forEach((chunk, idx) => {
          allChunks.push(
            new Document({
              pageContent: chunk,
              metadata: {
                ...doc.metadata,
                chunkIndex: idx,
                totalChunks: chunks.length,
              },
            })
          );
        });
      }

      await this.store.addDocuments(allChunks);
      console.log(`✓ Successfully added ${allChunks.length} chunks from ${documents.length} documents`);
    } catch (error) {
      console.error('Error adding documents to vector store:', error);
      throw error;
    }
  }

  /**
   * Simple text chunking with overlap
   */
  private chunkText(text: string, chunkSize: number, overlap: number): string[] {
    const chunks: string[] = [];
    let start = 0;
    
    while (start < text.length) {
      const end = Math.min(start + chunkSize, text.length);
      chunks.push(text.slice(start, end));
      start += chunkSize - overlap;
    }
    
    return chunks.filter(c => c.trim().length > 0);
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
    this.store = new MemoryVectorStore(this.embeddings);
    console.log('✓ Vector store cleared');
  }
}

export const berkshireVectorStore = new BerkshireVectorStore();
