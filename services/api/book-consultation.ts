import express from 'express';
import { z } from 'zod';
import { leadsTable } from '../airtable';

const router = express.Router();

const consultationSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  company: z.string().optional(),
  position: z.string().optional(),
  country: z.string().optional(),
  companySize: z.string().optional(),
  service: z.string().min(1, 'Service selection is required'),
  businessGoal: z.string().optional(),
  newsletterConsent: z.boolean().optional().default(false),
  bookingTime: z.string().optional(),
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
    const data = consultationSchema.parse(req.body);

    // 1. Save lead to Airtable
    if (leadsTable) {
      try {
        await leadsTable.create([
          {
            fields: {
              "Created Date": new Date().toISOString(),
              "Lead Type": "Service Inquiry",
              "First Name": data.firstName,
              "Last Name": data.lastName,
              "Email": data.email,
              "Phone Number": data.phone || "",
              "Company Name": data.company || "",
              "Position": data.position || "",
              "Country": data.country || "",
              "Company Size": data.companySize || "",
              "Service Selected": data.service,
              "Business Goal": data.businessGoal || "",
              "Newsletter Opt-In": data.newsletterConsent,
              "Booking Time": data.bookingTime || "",
              "Lead Source": data.lead_source || "direct",
              "Landing Page": data.landing_page || "",
              "UTM Source": data.utm_source || "",
              "UTM Medium": data.utm_medium || "",
              "UTM Campaign": data.utm_campaign || "",
              "Referrer": data.referrer || "",
              "Status": "New"
            }
          }
        ]);
      } catch (err) {
        console.error('Airtable Error:', err);
        return res.status(500).json({ success: false, message: 'Database failure' });
      }
    }

    // 2. Add to Loops.so
    if (process.env.LOOPS_API_KEY) {
      try {
        // Extract the single primary service chosen
        const serviceChosen = data.service.split(',')[0].trim();

        const loopsPayload = {
          email: data.email,
          firstName: data.firstName,
          lastName: data.lastName,
          country: data.country || "",
          companySize: data.companySize || "",
          company: data.company || "",
          source: "Contact page",
          userGroup: serviceChosen
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
          console.log(`Successfully added contact ${data.email} to Loops`);
        }
      } catch (err) {
        console.error('Error adding contact to Loops:', err);
      }
    } else {
      console.warn('LOOPS_API_KEY is not set in environment variables');
    }

    return res.status(200).json({ success: true, message: 'Consultation request received successfully' });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ success: false, message: 'Validation error', errors: err.errors });
    }
    console.error('Book Consultation Handler Error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

export default router;
