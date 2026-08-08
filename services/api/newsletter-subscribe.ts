import express from 'express';
import { z } from 'zod';

const router = express.Router();

const newsletterSchema = z.object({
  firstName: z.string().optional(),
  email: z.string().email('Invalid email address'),
});

router.post('/', async (req, res) => {
  try {
    const data = newsletterSchema.parse(req.body);

    // Add to Loops.so
    if (process.env.LOOPS_API_KEY) {
      try {
        const loopsPayload = {
          email: data.email,
          firstName: data.firstName || "",
          source: "Newsletter",
          userGroup: "Newsletter Subscriber"
        };

        const response = await fetch('https://app.loops.so/api/v1/contacts/create', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.LOOPS_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(loopsPayload)
        });

        if (!response.ok) {
          const errText = await response.text();
          console.error(`Loops API responded with status ${response.status}: ${errText}`);
        } else {
          console.log(`Successfully added contact ${data.email} to Loops (Source: Newsletter)`);
        }
      } catch (err) {
        console.error('Error adding contact to Loops:', err);
      }
    } else {
      console.warn('LOOPS_API_KEY is not set in environment variables');
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
