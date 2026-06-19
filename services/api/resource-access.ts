import express from 'express';
import { z } from 'zod';
import { resourcesTable } from '../airtable';
import { resend } from '../resend';
import { getResourceEmailTemplate } from '../emails/templates';

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

    // 2. Send Resource Email
    if (resend) {
      try {
        // Construct a generic resource link. Realistically this should map to Google Drive or local file
        // For demonstration, we simply link back to the site.
        const siteUrl = process.env.SITE_URL || 'https://joshuaomole.com';
        const resourceLink = `${siteUrl}/downloads/${data.resource_id}`;
        
        const { html, text } = getResourceEmailTemplate(data.firstName, data.resource_title || "Resource", resourceLink);
        await resend.emails.send({
          from: 'Joshua Omole <hello@joshuaomole.com>', // MUST BE verified domain
          to: data.email,
          subject: 'Your Requested Resource Is Ready',
          html,
          text
        });
      } catch (err) {
        console.error('Resend Resource Email Error:', err);
      }

      // Admin Notification Email
      const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL;
      if (adminEmail) {
        try {
          await resend.emails.send({
            from: 'System <notifications@joshuaomole.com>',
            to: adminEmail,
            subject: 'New Resource Request - Joshua Omole',
            html: `
              <h3>Resource Requested</h3>
              <p>Name: ${data.firstName} ${data.lastName}</p>
              <p>Email: ${data.email}</p>
              <p>Resource: ${data.resource_title} (${data.resource_id})</p>
              <p>Source: ${data.lead_source}</p>
            `,
          });
        } catch (err) {
           console.error('Resend Admin Notification Error:', err);
        }
      }
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
