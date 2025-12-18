# Where to Place PDFs

Place your Berkshire Hathaway shareholder letter PDFs here!

## Recommended Naming Convention

Name your files with the year for automatic metadata extraction:

- `2023.pdf`
- `2022.pdf`
- `2021.pdf`
- `letter_2020.pdf`
- `berkshire_2019.pdf`

The system will automatically extract the year from the filename.

## Download Letters

You can download Berkshire Hathaway shareholder letters from:
https://www.berkshirehathaway.com/letters/letters.html

## After Adding PDFs

1. Run the ingestion script:
   ```powershell
   npm.cmd run dev
   ```

2. Use the RAG system in your code:
   ```typescript
   import { ingestBerkshireLetters } from './mastra/rag';
   await ingestBerkshireLetters();
   ```

3. Query the letters:
   ```typescript
   import { berkshireVectorStore } from './mastra/rag';
   const results = await berkshireVectorStore.query("your question here");
   ```
