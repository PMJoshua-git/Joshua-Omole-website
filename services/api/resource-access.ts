import express from 'express';
import { z } from 'zod';
import { resourcesTable } from '../airtable';

const router = express.Router();

const resourceAccessSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  resource_id: z.string().min(1, 'Resource ID is required'),
  resource_title: z.string().optional(),
  resource_category: z.string().optional(),
  // Attribution data
  lead_source: z.string().optional(),
  landing_page: z.string().optional(),
  utm_source: z.string().optional().nullable(),
  utm_medium: z.string().optional().nullable(),
  utm_campaign: z.string().optional().nullable(),
  referrer: z.string().optional().nullable(),
});

router.post('/', async (req, res) => {
  try {
    const data = resourceAccessSchema.parse(req.body);

    // 1. Save to Airtable Resource Downloads
    if (resourcesTable) {
      try {
        await resourcesTable.create([
          {
            fields: {
              "Created Date": new Date().toISOString(),
              "First Name": data.firstName,
              "Last Name": data.lastName,
              "Email": data.email,
              "Resource ID": data.resource_id,
              "Resource Title": data.resource_title || "",
              "Resource Category": data.resource_category || "",
              "Lead Source": data.lead_source || "direct",
              "Landing Page": data.landing_page || "",
              "UTM Source": data.utm_source || "",
              "UTM Medium": data.utm_medium || "",
              "UTM Campaign": data.utm_campaign || "",
              "Referrer": data.referrer || "",
              "Status": "Requested"
            }
          }
        ]);
      } catch (err) {
        console.error('Airtable Resource Error:', err);
        return res.status(500).json({ success: false, message: 'Database failure' });
      }
    }

    // 2. Add contact to Loops.so
    if (process.env.LOOPS_API_KEY) {
      try {
        const loopsPayload = {
          email: data.email,
          firstName: data.firstName,
          lastName: data.lastName,
          source: "Knowledge Hub page",
          userGroup: data.resource_title || "Unknown Resource"
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
          console.log(`Successfully added contact ${data.email} to Loops (Resource: ${data.resource_title})`);
        }
      } catch (err) {
        console.error('Error adding contact to Loops:', err);
      }
    } else {
      console.warn('LOOPS_API_KEY is not set in environment variables');
    }

    return res.status(200).json({ success: true, message: 'Resource access request received.' });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ success: false, message: 'Validation error', errors: err.errors });
    }
    console.error('Resource Access Handler Error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

export default router;
