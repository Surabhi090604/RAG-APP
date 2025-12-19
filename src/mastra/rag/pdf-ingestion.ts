import fs from 'fs';
import fsp from 'fs/promises';
import path from 'path';
import pdfParse from 'pdf-parse-fork';
import { MDocument } from '@mastra/rag';
import { BerkshireDocument } from './vector-store.js';

/**
 * Configuration for document chunking
 * For financial documents, we use larger chunks with overlap to maintain context
 */
export const CHUNK_CONFIG = {
  chunkSize: 1000,
  chunkOverlap: 200,
  separators: ['\n\n', '\n', '. ', ' ', ''],
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

/**
 * Process a single PDF file into MDocuments
 */
export async function processPDF(
  filePath: string,
  metadata: Record<string, any> = {}
): Promise<BerkshireDocument[]> {
  console.log(`Processing PDF with MDocument: ${filePath}`);

  // 1. Extract text using pdf-parse-fork
  const text = await parsePDF(filePath);
  console.log(`Extracted ${text.length} characters from PDF`);

  // 2. Create MDocument from the text
  const doc = await MDocument.fromText(text);

  // 3. Chunk the document using Mastra's chunking
  const chunks = await doc.chunk({
    strategy: 'recursive',
    size: CHUNK_CONFIG.chunkSize,
    overlap: CHUNK_CONFIG.chunkOverlap,
    separators: CHUNK_CONFIG.separators,
  });

  const fileName = path.basename(filePath, '.pdf');

  // 4. Convert chunks back to BerkshireDocuments to match our vector store interface
  return chunks.map((chunk, index) => ({
    content: chunk.text,
    metadata: {
      source: filePath,
      fileName: fileName,
      type: 'pdf',
      chunkIndex: index,
      ...metadata,
    },
  }));
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

  console.log(`Total chunked documents created: ${allDocuments.length}`);
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
      console.log(`✓ Processed ${pdfFile}${year ? ` (${year})` : ''} -> ${documents.length} chunks`);
    } catch (error) {
      console.error(`✗ Failed to process ${pdfFile}:`, error);
    }
  }

  return allDocuments;
}
