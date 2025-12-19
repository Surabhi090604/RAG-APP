#!/usr/bin/env node

/**
 * Quick Start Script for Berkshire RAG System
 * 
 * Usage:
 *   npm.cmd run ingest     - Ingest all PDFs from data/pdfs/
 *   npm.cmd run query      - Run example queries
 */

import 'dotenv/config';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readdir } from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function checkPDFs() {
  const pdfDir = join(__dirname, '../data/pdfs');
  try {
    const files = await readdir(pdfDir);
    const pdfs = files.filter(f => f.toLowerCase().endsWith('.pdf'));
    return pdfs.length;
  } catch {
    return 0;
  }
}

async function main() {
  const command = process.argv[2] || 'help';
  
  console.log('🚀 Berkshire Hathaway RAG System\n');
  
  const pdfCount = await checkPDFs();
  
  if (pdfCount === 0) {
    console.log('⚠️  No PDF files found in data/pdfs/\n');
    console.log('Please add Berkshire Hathaway shareholder letters to data/pdfs/');
    console.log('Download from: https://www.berkshirehathaway.com/letters/letters.html\n');
  } else {
    console.log(`✓ Found ${pdfCount} PDF file(s) in data/pdfs/\n`);
  }
  
  switch (command) {
    case 'ingest':
      console.log('Starting ingestion...\n');
      const { ingestBerkshireLetters } = await import('./mastra/rag/ingest.js');
      await ingestBerkshireLetters();
      break;
      
    case 'query':
      console.log('Running example queries...\n');
      const { runExampleQueries } = await import('./mastra/rag/query-examples.js');
      await runExampleQueries();
      break;
      
    case 'help':
    default:
      console.log('Available commands:\n');
      console.log('  npm.cmd run ingest   - Process and ingest all PDFs');
      console.log('  npm.cmd run query    - Run example queries\n');
      console.log('First time setup:');
      console.log('  1. Add PDFs to data/pdfs/');
      console.log('  2. Set OPENAI_API_KEY in .env');
      console.log('  3. Run: npm.cmd run ingest');
      console.log('  4. Run: npm.cmd run query\n');
      break;
  }
}

main().catch(console.error);
