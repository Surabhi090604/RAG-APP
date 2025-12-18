import type { VercelRequest, VercelResponse } from '@vercel/node';
import { berkshireVectorStore } from '../src/mastra/rag/vector-store';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const q = (req.query.q as string) || '';
    if (!q) {
      return res.status(400).json({ error: 'Missing query parameter "q"' });
    }

    console.log(`Query received: ${q}`);
    const results = await berkshireVectorStore.query(q, 5);
    
    return res.status(200).json({ 
      query: q,
      results: results.map(r => ({
        content: r.content.substring(0, 500) + (r.content.length > 500 ? '...' : ''),
        metadata: r.metadata
      }))
    });
  } catch (err: any) {
    console.error('Query error:', err);
    return res.status(500).json({ error: err?.message ?? 'Unknown error' });
  }
}
