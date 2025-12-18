/**
 * RAG System for Berkshire Hathaway Shareholder Letters
 * 
 * This module provides document ingestion, vector storage, and querying
 * capabilities for processing and searching through shareholder letters.
 */

export { processPDF, processAllPDFs, processBerkshireLetters, CHUNK_CONFIG } from './pdf-ingestion.js';
export { BerkshireVectorStore, berkshireVectorStore } from './vector-store.js';
export { ingestBerkshireLetters, exampleQuery } from './ingest.js';
export { query, runExampleQueries, queryAndDisplay } from './query-examples.js';
