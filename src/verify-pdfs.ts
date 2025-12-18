import { readdir, stat } from 'fs/promises';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Verify PDFs are ready for ingestion
 */
async function verifyPDFs() {
  console.log('🔍 Verifying PDF setup...\n');
  
  const pdfDir = join(__dirname, '../data/pdfs');
  
  try {
    const files = await readdir(pdfDir);
    const pdfFiles = files.filter(f => f.toLowerCase().endsWith('.pdf'));
    
    if (pdfFiles.length === 0) {
      console.log('❌ No PDF files found!\n');
      console.log('Please download PDFs from:');
      console.log('https://drive.google.com/drive/folders/1IdPSENw-efKI6S0QiMrSxk12YqxW3eRU\n');
      console.log(`Place them in: ${pdfDir}\n`);
      return false;
    }
    
    console.log(`✅ Found ${pdfFiles.length} PDF file(s):\n`);
    
    for (const file of pdfFiles) {
      const filePath = join(pdfDir, file);
      const stats = await stat(filePath);
      const sizeKB = (stats.size / 1024).toFixed(2);
      
      // Try to extract year from filename
      const yearMatch = file.match(/(\d{4})/);
      const year = yearMatch ? yearMatch[1] : '❓';
      
      console.log(`  📄 ${file}`);
      console.log(`     Size: ${sizeKB} KB`);
      console.log(`     Year: ${year}`);
      console.log('');
    }
    
    // Check for year extraction
    const filesWithYears = pdfFiles.filter(f => /\d{4}/.test(f));
    if (filesWithYears.length < pdfFiles.length) {
      console.log('⚠️  Some files don\'t have years in filename');
      console.log('   Tip: Rename to include year (e.g., "2023.pdf", "letter_2022.pdf")\n');
    }
    
    console.log('✅ Setup looks good!\n');
    console.log('Next steps:');
    console.log('  1. Ensure OPENAI_API_KEY is set in .env');
    console.log('  2. Run: npm.cmd run ingest');
    console.log('  3. Run: npm.cmd run query\n');
    
    return true;
    
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      console.log('❌ PDF directory not found!\n');
      console.log(`Expected location: ${pdfDir}\n`);
    } else {
      console.error('Error checking PDFs:', error);
    }
    return false;
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  verifyPDFs()
    .then((success) => {
      process.exit(success ? 0 : 1);
    })
    .catch((error) => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

export { verifyPDFs };
