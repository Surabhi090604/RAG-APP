import fs from 'fs';
import fsp from 'fs/promises';
import path from 'path';
import pdfParse from 'pdf-parse-fork';
import { BerkshireDocument } from './vector-store.js';

/**
 * Configuration for document chunking
 * For financial documents, we use larger chunks with overlap to maintain context
 */
export const CHUNK_CONFIG = {
  chunkSize: 1000, // Characters per chunk - good for financial documents
  chunkOverlap: 200, // Overlap between chunks to maintain context
  separators: ['\n\n', '\n', '. ', ' ', ''], // Split on paragraphs, sentences, etc.
};

/**
 * Parse a PDF file and extract its text content
 */
export async function parsePDF(filePath: string): Promise<string> {
  try {
    const buffer = fs.readFileSync(filePath);
    const data = await pdfParse(buffer);
    return data.text;
  } catch (error) {
    console.error(`Error parsing PDF ${filePath}:`, error);
    throw error;
  }
}

// Note: Chunking is handled by Mastra RAG during embedding using CHUNK_CONFIG

/**
 * Process a single PDF file into MDocuments
 */
export async function processPDF(
  filePath: string,
  metadata: Record<string, any> = {}
): Promise<BerkshireDocument[]> {
  console.log(`Processing PDF: ${filePath}`);
  
  // Parse the PDF
  const text = await parsePDF(filePath);
  console.log(`Extracted ${text.length} characters from PDF`);
  
  const fileName = path.basename(filePath, '.pdf');
  const documents: BerkshireDocument[] = [
    {
      content: text,
      metadata: {
        source: filePath,
        fileName: fileName,
        type: 'pdf',
        ...metadata,
      },
    },
  ];
  
  return documents;
}

/**
 * Process all PDFs in a directory
 */
export async function processAllPDFs(
  directoryPath: string,
  metadata: Record<string, any> = {}
): Promise<BerkshireDocument[]> {
  console.log(`Processing PDFs from directory: ${directoryPath}`);
  
  // Read all files in directory
  const files = await fsp.readdir(directoryPath);
  const pdfFiles = files.filter(file => file.toLowerCase().endsWith('.pdf'));
  
  console.log(`Found ${pdfFiles.length} PDF files`);
  
  // Process each PDF
  const allDocuments: BerkshireDocument[] = [];
  
  for (const pdfFile of pdfFiles) {
    const filePath = path.join(directoryPath, pdfFile);
    try {
      const documents = await processPDF(filePath, metadata);
      allDocuments.push(...documents);
    } catch (error) {
      console.error(`Failed to process ${pdfFile}:`, error);
      // Continue with other files
    }
  }
  
  console.log(`Total documents created: ${allDocuments.length}`);
  return allDocuments;
}

/**
 * Process Berkshire Hathaway shareholder letters specifically
 * Adds year information from filename if available
 */
export async function processBerkshireLetters(
  directoryPath: string
): Promise<BerkshireDocument[]> {
  console.log('Processing Berkshire Hathaway shareholder letters...');
  
  const files = await fsp.readdir(directoryPath);
  const pdfFiles = files.filter(file => file.toLowerCase().endsWith('.pdf'));
  
  const allDocuments: BerkshireDocument[] = [];
  
  for (const pdfFile of pdfFiles) {
    const filePath = path.join(directoryPath, pdfFile);
    
    // Try to extract year from filename (e.g., "2023.pdf" or "letter_2023.pdf")
    const yearMatch = pdfFile.match(/(\d{4})/);
    const year = yearMatch ? parseInt(yearMatch[1]) : undefined;
    
    try {
      const documents = await processPDF(filePath, {
        company: 'Berkshire Hathaway',
        documentType: 'shareholder_letter',
        year: year,
      });
      
      allDocuments.push(...documents);
      console.log(`✓ Processed ${pdfFile}${year ? ` (${year})` : ''}`);
    } catch (error) {
      console.error(`✗ Failed to process ${pdfFile}:`, error);
    }
  }
  
  return allDocuments;
}
