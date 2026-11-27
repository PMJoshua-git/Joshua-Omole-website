import express from 'express';
import { z } from 'zod';

const router = express.Router();

const trainingBookingSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  location: z.string().min(1, 'Location is required'),
  expectations: z.string().optional(),
  sessionTitle: z.string().optional(),
  utmSource: z.string().optional().default(''),
  utmMedium: z.string().optional().default(''),
  utmCampaign: z.string().optional().default(''),
  referrer: z.string().optional().default(''),
  landingPage: z.string().optional().default(''),
  source: z.string().optional().default('Training page'),
  leadSource: z.string().optional().default(''),
  leadStatus: z.string().optional().default('Pending'),
  leadType: z.string().optional().default('Training Booking'),
});

router.post('/', async (req, res) => {
  try {
    const data = trainingBookingSchema.parse(req.body);
    const isProd = process.env.VERCEL_ENV === 'production';
    const loopsApiKey = process.env.LOOPS_API_KEY?.trim();

    if (!loopsApiKey) {
      if (isProd) {
        return res.status(503).json({
          success: false,
          error: 'Training booking service is not configured right now.',
        });
      }
      console.warn('[Loops] LOOPS_API_KEY not configured (non-production mode).');
      return res.status(200).json({
        success: true,
        mock: true,
        message: 'Training booking logged successfully',
      });
    }

    const loopsPayload = {
      email: data.email.trim().toLowerCase(),
      firstName: data.name.trim(),
      source: data.source || 'Training page',
      leadSource: data.leadSource || 'direct',
      userGroup: 'Training Booking',
      leadType: data.leadType || 'Training Booking',
      leadStatus: data.leadStatus || 'Pending',
      landingPage: data.landingPage || '/training',
      utmSource: data.utmSource || '',
      utmMedium: data.utmMedium || '',
      utmCampaign: data.utmCampaign || '',
      referrer: data.referrer || '',
      location: data.location.trim(),
      sessionTitle: data.sessionTitle || '',
      expectations: data.expectations || '',
    };

    try {
      const response = await fetch('https://app.loops.so/api/v1/contacts/create', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${loopsApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(loopsPayload),
      });

      if (response.status === 409) {
        const updateRes = await fetch('https://app.loops.so/api/v1/contacts/update', {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${loopsApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(loopsPayload),
        });
        if (!updateRes.ok && isProd) {
          return res.status(502).json({ success: false, error: 'Unable to update training booking right now.' });
        }
      } else if (!response.ok && isProd) {
        return res.status(502).json({ success: false, error: 'Unable to log training booking right now.' });
      }
    } catch (err) {
      console.error('[Loops] book-training error:', err);
      if (isProd) {
        return res.status(502).json({ success: false, error: 'Unable to reach booking service right now.' });
      }
    }

    return res.status(200).json({ success: true, message: 'Training booking logged successfully' });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: (err as any).issues || (err as any).errors,
      });
    }
    console.error('Training Booking Handler Error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

export default router;

