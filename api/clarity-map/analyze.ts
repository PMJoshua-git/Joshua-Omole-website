import { handleAnalyzeRequest } from '../../server/clarity-map/handlers.js';

export const config = {
  maxDuration: 60,
};

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    return await handleAnalyzeRequest(req, res, { trustProxy: true });
  } catch (err: any) {
    console.error('[ClarityMap /api/clarity-map/analyze] Unhandled handler error:', {
      name: err?.name,
      message: err?.message || String(err),
      stack: err?.stack,
    });
    if (!res.headersSent) {
      return res.status(500).json({
        error: 'An unexpected error occurred while analyzing your workflow. Please try again.',
      });
    }
  }
}
