import type { VercelRequest, VercelResponse } from '@vercel/node';
import { berkshireAgent } from '../src/mastra/agents/berkshire-agent';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const q = (req.query.q as string) || '';
    const threadId = (req.query.threadId as string) || 'default-thread';

    if (!q) {
      return res.status(400).json({ error: 'Missing query parameter "q"' });
    }

    console.log(`Agent Query received: "${q}" (Thread: ${threadId})`);

    // Use the agent to generate a response with memory and RAG
    const result = await berkshireAgent.generate(q, { threadId });

    return res.status(200).json({
      query: q,
      answer: result.text,
      // We could try to extract sources if the agent included them in the text
      // but for now, the answer is the primary value.
    });
  } catch (err: any) {
    console.error('Agent error:', err);
    return res.status(500).json({ error: err?.message ?? 'Unknown error' });
  }
}
