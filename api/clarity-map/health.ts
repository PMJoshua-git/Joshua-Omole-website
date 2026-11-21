import { handleHealthRequest } from '../../server/clarity-map/health.js';

export default async function handler(req: any, res: any) {
  res.setHeader('Cache-Control', 'no-store');

  if (req.method !== 'GET') {
    return res.status(404).json({ error: 'Not found' });
  }

  try {
    return await handleHealthRequest(req, res);
  } catch (err: any) {
    console.error('[ClarityMap /api/clarity-map/health] Error:', {
      message: String(err?.message || err || '').slice(0, 200),
    });
    return res.status(500).json({ error: 'Health check failed' });
  }
}
