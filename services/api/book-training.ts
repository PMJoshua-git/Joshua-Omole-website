import express from 'express';
import { z } from 'zod';
import { trainingPipelineTable } from '../airtable';

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

    if (trainingPipelineTable) {
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
      } catch (err) {
        console.error('Airtable Error:', err);
        return res.status(500).json({ success: false, message: 'Database failure' });
      }
    }

    return res.status(200).json({ success: true, message: 'Training booking logged successfully' });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ success: false, message: 'Validation error', errors: err.errors });
    }
    console.error('Training Booking Handler Error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

export default router;
