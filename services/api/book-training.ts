import express from 'express';
import { z } from 'zod';
import { trainingPipelineTable } from '../airtable/index.js';

const router = express.Router();

const trainingBookingSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  location: z.string().min(1, 'Location is required'),
  expectations: z.string().optional(),
  sessionTitle: z.string().optional(),
});

router.post('/', async (req, res) => {
  try {
    const data = trainingBookingSchema.parse(req.body);

    if (!trainingPipelineTable) {
      if (process.env.VERCEL_ENV === 'production') {
        return res.status(503).json({
          success: false,
          error: 'Training booking storage is not configured right now.',
        });
      }
      console.warn('[Airtable] trainingPipelineTable not configured (non-production mode).');
    } else {
      try {
        await trainingPipelineTable.create([
          {
            fields: {
              "Name": data.name,
              "Email": data.email,
              "Location": data.location,
              "Expectations": data.expectations || "",
              "Session": data.sessionTitle || "",
              "Booking date": new Date().toISOString(),
              "Status": "Pending"
            }
          }
        ]);
      } catch (err: any) {
        console.error('[Airtable] book-training error:', {
          status: err?.statusCode ?? null,
          errorType: err?.error || err?.name || 'AIRTABLE_ERROR',
        });
        return res.status(502).json({ success: false, error: 'Database failure' });
      }
    }

    return res.status(200).json({ success: true, message: 'Training booking logged successfully' });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ success: false, message: 'Validation error', errors: (err as any).issues || (err as any).errors });
    }
    console.error('Training Booking Handler Error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

export default router;
