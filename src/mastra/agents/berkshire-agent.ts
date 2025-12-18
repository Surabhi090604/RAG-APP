import { Agent } from '@mastra/core/agent';
import { z } from 'zod';
import { berkshireVectorStore } from '../rag';

/**
 * Berkshire Hathaway Investment Advisor Agent
 * 
 * This agent uses RAG to answer questions about Warren Buffett's
 * investment philosophy based on shareholder letters.
 */
export const berkshireAgent = new Agent({
  name: 'Berkshire Advisor',
  instructions: `You are an expert on Warren Buffett's investment philosophy and Berkshire Hathaway. 
  
Your role is to provide accurate, insightful answers based on Warren Buffett's shareholder letters.

When answering questions:
1. Use the provided context from shareholder letters
2. Quote specific passages when relevant
3. Cite the year of the letter when possible
4. Provide clear, educational explanations
5. Be honest if information is not in the provided context

Remember: You're helping people understand Buffett's wisdom, not giving personal financial advice.`,

  // Use Mastra's model shorthand to resolve the provider
  model: 'openai/gpt-4o-mini',

  // Before generating a response, retrieve relevant context
  beforeGenerate: async ({ prompt }) => {
    console.log(`🔍 Searching shareholder letters for: "${prompt}"`);
    
    try {
      // Query the vector store for relevant passages
      const results = await berkshireVectorStore.query(prompt, 5);
      
      if (results.length === 0) {
        return {
          context: 'No relevant information found in shareholder letters. The database may not be initialized yet.'
        };
      }
      
      // Format the results as context
      const context = results
        .map((doc, i) => {
          const year = doc.metadata?.year || 'Unknown year';
          const content = doc.content || '';
          return `[${year} Letter, Passage ${i + 1}]:\n${content}`;
        })
        .join('\n\n---\n\n');
      
      console.log(`✓ Found ${results.length} relevant passages`);
      
      return {
        context: `Here are relevant passages from Berkshire Hathaway shareholder letters:\n\n${context}\n\nPlease answer the question based on this context.`
      };
    } catch (error) {
      console.error('Error retrieving context:', error);
      return {
        context: 'Error retrieving information from shareholder letters.'
      };
    }
  },
});

/**
 * Tool for querying Berkshire letters
 */
export const queryLettersTool = {
  name: 'query_berkshire_letters',
  description: 'Search through Warren Buffett\'s shareholder letters for specific information',
  
  parameters: z.object({
    query: z.string().describe('The question or topic to search for in the letters'),
    topK: z.number().optional().default(5).describe('Number of relevant passages to retrieve'),
  }),
  
  execute: async ({ query, topK = 5 }: { query: string; topK?: number }) => {
    console.log(`Searching letters: "${query}"`);
    
    const results = await berkshireVectorStore.query(query, topK);
    
    return {
      found: results.length,
      passages: results.map(doc => ({
        year: doc.metadata?.year,
        content: doc.content,
        fileName: doc.metadata?.fileName,
      })),
    };
  },
};

/**
 * Tool for querying specific year
 */
export const queryByYearTool = {
  name: 'query_by_year',
  description: 'Search a specific year\'s shareholder letter',
  
  parameters: z.object({
    query: z.string().describe('The question or topic to search for'),
    year: z.number().describe('The year of the letter to search'),
    topK: z.number().optional().default(5).describe('Number of passages to retrieve'),
  }),
  
  execute: async ({ query, year, topK = 5 }: { query: string; year: number; topK?: number }) => {
    console.log(`Searching ${year} letter: "${query}"`);
    
    const results = await berkshireVectorStore.queryByYear(query, year, topK);
    
    return {
      year,
      found: results.length,
      passages: results.map(doc => ({
        content: doc.content,
        chunkIndex: doc.metadata?.chunkIndex,
      })),
    };
  },
};
