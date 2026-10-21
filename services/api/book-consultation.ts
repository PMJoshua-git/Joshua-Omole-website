import express from 'express';
import { z } from 'zod';
import { leadsTable } from '../airtable';

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

  // ── Optional / empty-string fields (Airtable schema compat) ──
  lastName:    z.string().optional().default(''),
  phone:       z.string().optional().default(''),
  position:    z.string().optional().default(''),
  country:     z.string().optional().default(''),

  // ── Consent and attribution ──
  newsletterOptIn: z.boolean().optional().default(false),
  leadSource:      z.string().optional().default(''),
  landingPage:     z.string().optional().default(''),
  utmParameters:   z.string().optional().default(''),
});

router.post('/', async (req, res) => {
  try {
    const data = bookingSchema.parse(req.body);

    let leadId: string | undefined = undefined;

    // 1. Save lead to Airtable
    if (leadsTable) {
      try {
        const created = await leadsTable.create([
          {
            fields: {
              "Created Date": new Date().toISOString(),
              "Lead Type": data.leadType,
              "First Name": data.firstName,
              "Last Name": data.lastName,
              "Email": data.email,
              "Phone Number": data.phone,
              "Company Name": data.company,
              "Position": data.position,
              "Country": data.country,
              "Company Size": data.companySize,
              "Service Selected": data.serviceType,
              "Business Goal": data.businessGoal,
              "Newsletter Opt-In": data.newsletterOptIn,
              "Booking Time": "",
              "Lead Source": data.leadSource || "direct",
              "Landing Page": data.landingPage || "",
              "UTM Source": data.utmParameters || "",
              "UTM Medium": "",
              "UTM Campaign": "",
              "Referrer": "",
              "Status": "New"
            }
          }
        ]);
        leadId = created?.[0]?.id;
      } catch (err) {
        console.error('Airtable Error (non-blocking):', err);
      }
    }

    // 2. Add to Loops.so (unconditionally for all audit submissions)
    if (process.env.LOOPS_API_KEY) {
      try {
        const loopsPayload: Record<string, any> = {
          email: data.email,
          firstName: data.firstName,
          lastName: data.lastName,
          country: data.country,
          companySize: data.companySize,
          company: data.company,
          source: "Audit page",
          userGroup: "Audit Booking",
          subscribed: Boolean(data.newsletterOptIn)
        };

        const response = await fetch('https://app.loops.so/api/v1/contacts/create', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.LOOPS_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(loopsPayload)
        });

        if (response.status === 409) {
          // Contact already exists in Loops — update their company and group
          const updateRes = await fetch('https://app.loops.so/api/v1/contacts/update', {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${process.env.LOOPS_API_KEY}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(loopsPayload)
          });
          if (!updateRes.ok) {
            const errText = await updateRes.text();
            console.error(`Loops update responded with status ${updateRes.status}: ${errText}`);
          } else {
            console.log(`Successfully updated existing contact ${data.email} in Loops`);
          }
        } else if (!response.ok) {
          const errText = await response.text();
          console.error(`Loops API responded with status ${response.status}: ${errText}`);
        } else {
          console.log(`Successfully added contact ${data.email} to Loops (subscribed: ${Boolean(data.newsletterOptIn)})`);
        }
      } catch (err) {
        console.error('Error adding contact to Loops:', err);
      }
    } else {
      console.warn('LOOPS_API_KEY is not set in environment variables');
    }

    return res.status(200).json({
      success: true,
      message: 'Consultation request received successfully',
      leadId
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ success: false, message: 'Validation error', errors: err.errors });
    }
    console.error('Book Consultation Handler Error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// 3. Confirm calendar booking endpoint
router.post('/confirm-booking', async (req, res) => {
  try {
    const { leadId, email, bookingTime } = req.body;
    const resolvedBookingTime = bookingTime || new Date().toISOString();

    if (leadsTable) {
      if (leadId) {
        await leadsTable.update([
          {
            id: leadId,
            fields: {
              "Status": "Booked",
              "Booking Time": resolvedBookingTime
            }
          }
        ]);
        console.log(`Successfully updated Airtable lead ${leadId} status to Booked`);
      } else if (email) {
        const matching = await leadsTable.select({
          filterByFormula: `{Email} = '${email}'`,
          maxRecords: 1
        }).firstPage();
        if (matching && matching.length > 0) {
          await leadsTable.update([
            {
              id: matching[0].id,
              fields: {
                "Status": "Booked",
                "Booking Time": resolvedBookingTime
              }
            }
          ]);
          console.log(`Successfully updated Airtable lead by email ${email} status to Booked`);
        }
      }
    }

    return res.status(200).json({ success: true, message: 'Booking confirmed' });
  } catch (err) {
    console.error('Confirm Booking Error (non-blocking):', err);
    return res.status(200).json({ success: false, error: 'Could not update status' });
  }
});

export default router;
