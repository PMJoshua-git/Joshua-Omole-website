import { handleReportRequest } from '../../server/clarity-map/handlers.js';

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
    return await handleReportRequest(req, res);
  } catch (err: any) {
    console.error('[ClarityMap /api/clarity-map/report] Unhandled handler error:', {
      name: err?.name,
      message: err?.message || String(err),
    });
    if (!res.headersSent) {
      return res.status(500).json({
        error: 'Unable to send your full PDF report right now. Please try again.',
        emailSent: false,
      });
    }
  }
}
