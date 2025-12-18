/**
 * Test ingestion script - works within Mastra dev environment
 * Run this through the Mastra dev server or build system
 */

import { processBerkshireLetters } from './mastra/rag/pdf-ingestion';
import { berkshireVectorStore } from './mastra/rag/vector-store';

export async function testIngestion() {
  console.log('🧪 Testing PDF Ingestion and Chunking\n');
  
  const pdfDirectory = './data/pdfs';
  
  try {
    // Step 1: Process PDFs with chunking
    console.log('📄 Step 1: Processing PDFs and creating MDocument chunks...\n');
    const documents = await processBerkshireLetters(pdfDirectory);
    
    console.log('\n✅ Processing Complete!');
    console.log(`\n📊 Results:`);
    console.log(`   Total document chunks: ${documents.length}`);
    
    // Show sample chunks
    if (documents.length > 0) {
      console.log(`\n📝 Sample chunks from first document:\n`);
      
      const firstDoc = documents[0];
      console.log(`   Year: ${firstDoc.metadata?.year}`);
      console.log(`   Source: ${firstDoc.metadata?.fileName}`);
      console.log(`   Chunk ${firstDoc.metadata?.chunkIndex + 1} of ${firstDoc.metadata?.totalChunks}`);
      console.log(`   Content preview: ${firstDoc.content?.substring(0, 200)}...\n`);
      
      // Show chunking stats
      const avgChunkSize = documents.reduce((sum, doc) => sum + (doc.content?.length || 0), 0) / documents.length;
      console.log(`   Average chunk size: ${Math.round(avgChunkSize)} characters`);
      
      // Count by year
      const yearCounts = documents.reduce((acc, doc) => {
        const year = doc.metadata?.year || 'Unknown';
        acc[year] = (acc[year] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      console.log(`\n   Documents by year:`);
      Object.entries(yearCounts)
        .sort(([a], [b]) => String(a).localeCompare(String(b)))
        .slice(0, 5)
        .forEach(([year, count]) => {
          console.log(`     ${year}: ${count} chunks`);
        });
      console.log(`     ... and ${Object.keys(yearCounts).length - 5} more years`);
    }
    
    // Step 2: Add to vector store
    console.log('\n\n🔮 Step 2: Creating embeddings and storing in vector database...');
    console.log('   (This will take a few minutes for 48 years of letters)\n');
    
    await berkshireVectorStore.addDocuments(documents);
    
    console.log('\n✅ Ingestion Complete!\n');
    console.log('🎉 The RAG system is ready to use!');
    console.log('\nTry querying with:');
    console.log('  npm.cmd run query\n');
    
    return { success: true, documentCount: documents.length };
    
  } catch (error) {
    console.error('\n❌ Error during ingestion:', error);
    return { success: false, error };
  }
}

// Export for use in dev environment
export default testIngestion;
