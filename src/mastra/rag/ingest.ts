import path from 'path';
import { fileURLToPath } from 'url';
import { processBerkshireLetters } from './pdf-ingestion.js';
import { berkshireVectorStore } from './vector-store.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Main ingestion pipeline for Berkshire Hathaway letters
 * 
 * This script:
 * 1. Reads PDF files from the data/pdfs directory
 * 2. Extracts text and chunks them appropriately
 * 3. Creates embeddings using OpenAI
 * 4. Stores them in a vector database for retrieval
 */
async function ingestBerkshireLetters() {
  console.log('🚀 Starting Berkshire Hathaway letter ingestion...\n');
  
  try {
    // Path to PDF directory
    const pdfDirectory = path.join(__dirname, '../../../data/pdfs');
    console.log(`📁 PDF Directory: ${pdfDirectory}\n`);
    
    // Step 1: Process PDFs and create documents
    console.log('📄 Step 1: Processing PDF files...');
    const documents = await processBerkshireLetters(pdfDirectory);
    
    if (documents.length === 0) {
      console.warn('\n⚠️  No documents were created!');
      console.log('\nMake sure to:');
      console.log('1. Place Berkshire Hathaway shareholder letter PDFs in: data/pdfs/');
      console.log('2. Name them with years (e.g., 2023.pdf, letter_2022.pdf)');
      return;
    }
    
    console.log(`\n✓ Prepared ${documents.length} PDF document(s) for embedding\n`);
    
    // Step 2: Add documents to vector store
    console.log('🔮 Step 2: Creating embeddings and storing in vector database...');
    await berkshireVectorStore.addDocuments(documents);
    
    console.log('\n✅ Ingestion complete!');
    console.log(`\n📊 Summary:`);
    console.log(`   - Documents processed: ${documents.length}`);
    console.log(`   - Vector store: Ready for queries`);
    console.log(`\n💡 You can now query the letters using the berkshireVectorStore.query() method`);
    
  } catch (error) {
    console.error('\n❌ Ingestion failed:', error);
    throw error;
  }
}

/**
 * Example: Query the ingested documents
 */
async function exampleQuery() {
  console.log('\n🔍 Example Query:\n');
  
  const query = "What does Warren Buffett say about insurance business?";
  console.log(`Query: "${query}"\n`);
  
  const results = await berkshireVectorStore.query(query, 3);
  
  console.log('Top 3 relevant passages:\n');
  results.forEach((doc, index) => {
    console.log(`${index + 1}. [${doc.metadata?.fileName || 'Unknown'}, Chunk ${doc.metadata?.chunkIndex || '?'}]`);
    console.log(`   ${doc.content?.substring(0, 200)}...`);
    console.log();
  });
}

// Run ingestion if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  ingestBerkshireLetters()
    .then(() => {
      console.log('\n✨ All done!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

export { ingestBerkshireLetters, exampleQuery };
