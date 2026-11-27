import express from 'express';
import { z } from 'zod';

const router = express.Router();

const bookingSchema = z.object({
  // ── Required: the 5 collected fields ──
  firstName:    z.string().min(1, 'First name is required'),
  email:        z.string().email('Invalid email address'),
  company:      z.string().min(1, 'Company name is required'),
  companySize:  z.string().min(1, 'Company size is required'),
  businessGoal: z.string().min(10, 'Business goal must be at least 10 characters'),

  // ── Auto-set fields (sent by client, validated loosely) ──
  leadType:    z.string().optional().default('Service Inquiry'),
  serviceType: z.string().optional().default('Systems Clarity Audit'),

  // ── Optional / empty-string fields ──
  lastName:    z.string().optional().default(''),
  phone:       z.string().optional().default(''),
  position:    z.string().optional().default(''),
  country:     z.string().optional().default(''),

  // ── Consent and attribution ──
  newsletterOptIn: z.boolean().optional().default(false),
  leadSource:      z.string().optional().default(''),
  landingPage:     z.string().optional().default(''),
  utmParameters:   z.string().optional().default(''),
  utmSource:       z.string().optional().default(''),
  utmMedium:       z.string().optional().default(''),
  utmCampaign:     z.string().optional().default(''),
  referrer:        z.string().optional().default(''),
  leadStatus:      z.string().optional().default('New'),
});

router.post('/', async (req, res) => {
  try {
    const data = bookingSchema.parse(req.body);
    const isProd = process.env.VERCEL_ENV === 'production';
    const loopsApiKey = process.env.LOOPS_API_KEY?.trim();

    if (!loopsApiKey) {
      if (isProd) {
        return res.status(503).json({
          success: false,
          error: 'Lead storage is not configured right now. Please try again later.',
        });
      }
      console.warn('[Loops] LOOPS_API_KEY is not set (non-production mode).');
      return res.status(200).json({
        success: true,
        mock: true,
        message: 'Consultation request received successfully',
      });
    }

    const loopsPayload: Record<string, any> = {
      email: data.email,
      firstName: data.firstName,
      lastName: data.lastName,
      country: data.country,
      companySize: data.companySize,
      company: data.company,
      source: 'Audit page',
      userGroup: 'Audit Booking',
      subscribed: Boolean(data.newsletterOptIn),
      leadType: data.leadType || 'Service Inquiry',
      leadStatus: data.leadStatus || 'New',
      landingPage: data.landingPage || '/audit',
      utmSource: data.utmSource || data.utmParameters || '',
      utmMedium: data.utmMedium || '',
      utmCampaign: data.utmCampaign || '',
      referrer: data.referrer || '',
      leadSource: data.leadSource || 'direct',
      businessGoal: data.businessGoal,
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
        if (!updateRes.ok) {
          const errText = await updateRes.text();
          console.error(`Loops update responded with status ${updateRes.status}: ${errText}`);
          if (isProd) {
            return res.status(502).json({
              success: false,
              error: 'Unable to save consultation request right now. Please try again.',
            });
          }
        }
      } else if (!response.ok) {
        const errText = await response.text();
        console.error(`Loops API responded with status ${response.status}: ${errText}`);
        if (isProd) {
          return res.status(502).json({
            success: false,
            error: 'Unable to save consultation request right now. Please try again.',
          });
        }
      }
    } catch (err) {
      console.error('Error adding contact to Loops:', err);
      if (isProd) {
        return res.status(502).json({
          success: false,
          error: 'Unable to reach contact service right now. Please try again.',
        });
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Consultation request received successfully',
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: (err as any).issues || (err as any).errors,
      });
    }
    console.error('Book Consultation Handler Error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Confirm calendar booking endpoint
router.post('/confirm-booking', async (req, res) => {
  try {
    const { email, bookingTime } = req.body || {};
    const resolvedBookingTime = bookingTime || new Date().toISOString();
    const loopsApiKey = process.env.LOOPS_API_KEY?.trim();

    if (loopsApiKey && typeof email === 'string' && email.trim() !== '') {
      await fetch('https://app.loops.so/api/v1/contacts/update', {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${loopsApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          leadStatus: 'Booked',
          bookingTime: resolvedBookingTime,
        }),
      }).catch((err) => console.error('[Loops] confirm-booking update error:', err));
    }

    return res.status(200).json({ success: true, message: 'Booking confirmed' });
  } catch (err) {
    console.error('confirm-booking error:', err);
    return res.status(200).json({ success: false, error: 'Could not update status' });
  }
});

export default router;

