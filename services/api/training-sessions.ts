import express from 'express';
import { trainingSessionsTable } from '../airtable';
import NodeCache from 'node-cache';
import { TrainingSession } from '../../types';

const router = express.Router();
const myCache = new NodeCache({ stdTTL: 3600 }); // Cache for 3600 seconds (1 hour)

const mapRecordToSession = (record: any): TrainingSession => {
  const thumbnailAttachments = record.get('thumbnail') as any[];
  const thumbnailUrl = thumbnailAttachments && thumbnailAttachments.length > 0 ? thumbnailAttachments[0].url : '';

  return {
    id: record.id,
    title: record.get('title') as string || '',
    slug: record.get('slug') as string || '',
    shortDescription: record.get('short_description') as string || '',
    fullDescription: record.get('full_description') as string || '',
    thumbnail: thumbnailUrl,
    priceTierA: parseInt(record.get('price_tier_a') as string) || 0,
    priceTierB: parseInt(record.get('price_tier_b') as string) || 0,
    durationHours: parseInt(record.get('duration_hours') as string) || 0,
    whatYouGet: record.get('what_you_get') as string || '',
    monthlyEnrollments: parseInt(record.get('monthly_enrollments') as string) || 0,
    calBookingLink: record.get('cal_booking_link') as string || '',
    isPublished: Boolean(record.get('is_published')),
    displayOrder: parseInt(record.get('display_order') as string) || 0,
  };
};

router.get('/', async (req, res) => {
  try {
    const cachedSessions = myCache.get('training_sessions');
    if (cachedSessions) {
      return res.status(200).json({ success: true, data: cachedSessions });
    }

    if (!trainingSessionsTable) {
      return res.status(200).json({ success: true, data: [] });
    }

    const records = await trainingSessionsTable.select({
      filterByFormula: "{is_published} = TRUE()",
      sort: [
        { field: 'display_order', direction: 'asc' }
      ]
    }).all();

    const sessions = records.map(mapRecordToSession);
    
    myCache.set('training_sessions', sessions);

    return res.status(200).json({ success: true, data: sessions });
  } catch (err) {
    console.error('Training sessions fetch error:', err);
    return res.status(200).json({ success: true, data: [] });
  }
});

export default router;
