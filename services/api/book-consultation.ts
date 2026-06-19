import express from 'express';
import { z } from 'zod';
import { leadsTable } from '../airtable';
import { resend } from '../resend';
import { addContactToSysteme } from '../systeme';
import { getConsultationConfirmationTemplate } from '../emails/templates';

const router = express.Router();

const consultationSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  company: z.string().optional(),
  position: z.string().optional(),
  service: z.string().min(1, 'Service selection is required'),
  businessGoal: z.string().optional(),
  newsletterConsent: z.boolean().optional().default(false),
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
    let airtableRecordId: string | undefined;
    if (leadsTable) {
      try {
        const record = await leadsTable.create([
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
              "Service Selected": data.service,
              "Business Goal": data.businessGoal || "",
              "Newsletter Opt-In": data.newsletterConsent,
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
        airtableRecordId = record[0].getId();
      } catch (err) {
        console.error('Airtable Error:', err);
        return res.status(500).json({ success: false, message: 'Database failure' });
      }
    }

    // 2. Send emails
    if (resend) {
      // Confirmation Email
      try {
        const { html, text } = getConsultationConfirmationTemplate(data.firstName, data.service);
        await resend.emails.send({
          from: 'Joshua Omole <hello@joshuaomole.com>', // MUST BE verified domain
          to: data.email,
          subject: 'Consultation Request Received',
          html,
          text
        });
      } catch (err) {
        console.error('Resend Client Confirmation Error:', err);
      }

      // Admin Notification Email
      const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL;
      if (adminEmail) {
        try {
          await resend.emails.send({
            from: 'System <notifications@joshuaomole.com>',
            to: adminEmail,
            subject: 'New Service Inquiry - Joshua Omole',
            html: `
              <h3>New Lead Details</h3>
              <p>Name: ${data.firstName} ${data.lastName}</p>
              <p>Email: ${data.email}</p>
              <p>Service: ${data.service}</p>
              <p>Source: ${data.lead_source}</p>
            `,
          });
        } catch (err) {
           console.error('Resend Admin Notification Error:', err);
        }
      }
    }

    // 3. Add to Systeme.io if opted in
    if (data.newsletterConsent && process.env.SYSTEME_API_KEY) {
      const tagId = process.env.SYSTEME_NEWSLETTER_TAG_ID;
      await addContactToSysteme(data.email, data.firstName, tagId);
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
