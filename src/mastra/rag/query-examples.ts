import { berkshireVectorStore } from './vector-store.js';

/**
 * Example queries for Berkshire Hathaway shareholder letters
 * This demonstrates how to use the RAG system
 */

async function runExampleQueries() {
  console.log('🔍 Berkshire Hathaway Letter Query Examples\n');
  console.log('=' .repeat(60) + '\n');

  // Example 1: General business question
  await queryAndDisplay(
    "What does Warren Buffett say about insurance business?",
    "Insurance Business Insights"
  );

  // Example 2: Investment philosophy
  await queryAndDisplay(
    "What is Buffett's investment philosophy and approach to value investing?",
    "Investment Philosophy"
  );

  // Example 3: Company performance
  await queryAndDisplay(
    "How has Berkshire Hathaway performed financially?",
    "Financial Performance"
  );

  // Example 4: Specific year query
  console.log('\n📅 Querying specific year (if available):\n');
  try {
    const results = await berkshireVectorStore.queryByYear(
      "What were the key highlights?",
      2023,
      3
    );
    
    if (results.length > 0) {
      console.log('2023 Letter Highlights:');
      results.forEach((doc, i) => {
        console.log(`\n${i + 1}. ${doc.content?.substring(0, 300)}...`);
      });
    } else {
      console.log('No documents found for 2023 (make sure to ingest 2023 letter)');
    }
  } catch (error) {
    console.error('Error querying by year:', error);
  }
}

async function queryAndDisplay(query: string, title: string) {
  console.log(`\n📌 ${title}`);
  console.log('-'.repeat(60));
  console.log(`Query: "${query}"\n`);
  
  try {
    const results = await berkshireVectorStore.query(query, 3);
    
    if (results.length === 0) {
      console.log('⚠️  No results found. Make sure to run ingestion first!');
      return;
    }
    
    console.log(`Found ${results.length} relevant passages:\n`);
    
    results.forEach((doc, index) => {
      const year = doc.metadata?.year || 'Unknown year';
      const fileName = doc.metadata?.fileName || 'Unknown file';
      const chunkIndex = doc.metadata?.chunkIndex ?? '?';
      
      console.log(`${index + 1}. Source: ${fileName} (${year}) - Chunk ${chunkIndex}`);
      console.log(`   ${doc.content?.substring(0, 250)}...`);
      console.log();
    });
  } catch (error) {
    console.error(`Error querying: ${error}`);
  }
}

/**
 * Interactive query function
 * Use this to query the vector store programmatically
 */
export async function query(
  question: string,
  topK: number = 5
): Promise<string> {
  const results = await berkshireVectorStore.query(question, topK);
  
  // Combine results into a context string
  const context = results
    .map((doc, i) => {
      const year = doc.metadata?.year || 'Unknown';
      return `[Source ${i + 1} - ${year}]:\n${doc.content}\n`;
    })
    .join('\n---\n\n');
  
  return context;
}

// Run examples if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runExampleQueries()
    .then(() => {
      console.log('\n✨ Query examples complete!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Error running queries:', error);
      process.exit(1);
    });
}

export { runExampleQueries, queryAndDisplay };
