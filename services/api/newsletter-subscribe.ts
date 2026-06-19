import express from 'express';
import { z } from 'zod';
import { addContactToSysteme } from '../systeme';

const router = express.Router();

const newsletterSchema = z.object({
  firstName: z.string().optional(),
  email: z.string().email('Invalid email address'),
});

router.post('/', async (req, res) => {
  try {
    const data = newsletterSchema.parse(req.body);

    if (process.env.SYSTEME_API_KEY) {
      const tagId = process.env.SYSTEME_NEWSLETTER_TAG_ID;
      await addContactToSysteme(data.email, data.firstName, tagId);
    } else {
        console.warn('SYSTEME_API_KEY is not set');
    }

    return res.status(200).json({ success: true, message: 'Subscribed successfully' });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ success: false, message: 'Validation error', errors: err.errors });
    }
    console.error('Newsletter Subscribe Handler Error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

export default router;
