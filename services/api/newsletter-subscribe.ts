import express from 'express';
import { z } from 'zod';

const router = express.Router();

const newsletterSchema = z.object({
  firstName: z.string().optional(),
  email: z.string().email('Invalid email address'),
  source: z.string().optional().default('Newsletter'),
  leadSource: z.string().optional().default(''),
  utmSource: z.string().optional().default(''),
  utmMedium: z.string().optional().default(''),
  utmCampaign: z.string().optional().default(''),
  referrer: z.string().optional().default(''),
  landingPage: z.string().optional().default('/newsletter'),
  leadStatus: z.string().optional().default('New'),
  leadType: z.string().optional().default('Newsletter Subscriber'),
});

router.post('/', async (req, res) => {
  try {
    const data = newsletterSchema.parse(req.body);

    const isProd = process.env.VERCEL_ENV === 'production';
    const loopsApiKey = process.env.LOOPS_API_KEY?.trim();

    // Add to Loops.so
    if (!loopsApiKey) {
      if (isProd) {
        return res.status(503).json({
          success: false,
          error: 'Newsletter service is not configured right now.',
        });
      }
      console.warn('LOOPS_API_KEY is not set in environment variables');
    } else {
      try {
        const loopsPayload = {
          email: data.email,
          firstName: data.firstName || '',
          source: data.source || 'Newsletter',
          leadSource: data.leadSource || 'direct',
          userGroup: 'Newsletter Subscriber',
          leadType: data.leadType || 'Newsletter Subscriber',
          leadStatus: data.leadStatus || 'New',
          landingPage: data.landingPage || '/newsletter',
          utmSource: data.utmSource || '',
          utmMedium: data.utmMedium || '',
          utmCampaign: data.utmCampaign || '',
          referrer: data.referrer || '',
        };

        const response = await fetch('https://app.loops.so/api/v1/contacts/create', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${loopsApiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(loopsPayload)
        });

        if (response.status === 409) {
          const updateRes = await fetch('https://app.loops.so/api/v1/contacts/update', {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${loopsApiKey}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(loopsPayload)
          });
          if (!updateRes.ok) {
            console.error('[Loops] newsletter-subscribe update failed:', { status: updateRes.status });
            if (isProd) {
              return res.status(502).json({ success: false, error: 'Unable to update subscription right now.' });
            }
          }
        } else if (!response.ok) {
          console.error('[Loops] newsletter-subscribe create failed:', { status: response.status });
          if (isProd) {
            return res.status(502).json({ success: false, error: 'Unable to subscribe right now.' });
          }
        }
      } catch (err: any) {
        console.error('[Loops] newsletter-subscribe network error:', {
          name: err?.name || 'Error',
          message: String(err?.message || '').slice(0, 200),
        });
        if (isProd) {
          return res.status(502).json({ success: false, error: 'Unable to reach subscription service right now.' });
        }
      }
    }

    return res.status(200).json({ success: true, message: 'Subscribed successfully' });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ success: false, message: 'Validation error', errors: (err as any).issues || (err as any).errors });
    }
    console.error('Newsletter Subscribe Handler Error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

export default router;
