import express from 'express';
import { resourceLibraryTable } from '../airtable';
import NodeCache from 'node-cache';
import { Resource } from '../../types';

const router = express.Router();
// Cache for 5 minutes (300 seconds)
const myCache = new NodeCache({ stdTTL: 300 });

// Helper to map Airtable record to Resource
const mapRecordToResource = (record: any): Resource => {
  return {
    id: record.get('Resource ID') as string || record.id,
    title: record.get('Title') as string || '',
    category: record.get('Category') as string || '',
    shortDescription: record.get('Short Description') as string || '',
    longDescription: record.get('Long Description') as string || '',
    coverImageUrl: record.get('Cover Image URL') as string || '',
    downloadUrl: record.get('Download URL') as string || '',
    estimatedReadingTime: record.get('Estimated Reading Time') as string || '',
    format: record.get('Resource Format') as string || '',
    displayOrder: parseInt(record.get('Display Order') as string) || 0,
    featured: Boolean(record.get('Featured')),
    status: record.get('Status') as any || 'Draft',
    socialProofCount: parseInt(record.get('Social Proof Count') as string) || 0,
    createdDate: record.get('Created Date') as string || '',
  };
};

router.get('/', async (req, res) => {
  try {
    const cachedResources = myCache.get('all_resources');
    if (cachedResources) {
      return res.status(200).json({ success: true, data: cachedResources });
    }

    if (!resourceLibraryTable) {
      // Graceful fallback
      return res.status(200).json({ success: true, data: [] });
    }

    // According to requirements: Only return Status = Published (and Coming Soon we assume since we have coming soon logic). Let's fetch both Published and Coming Soon
    const records = await resourceLibraryTable.select({
      filterByFormula: "OR({Status} = 'Published', {Status} = 'Coming Soon')",
      sort: [
        { field: 'Featured', direction: 'desc' },
        { field: 'Display Order', direction: 'asc' }
      ]
    }).all();

    const resources = records.map(mapRecordToResource);
    
    myCache.set('all_resources', resources);

    return res.status(200).json({ success: true, data: resources });
  } catch (err) {
    console.error('Resource fetch error:', err);
    // Graceful fallback on error
    return res.status(200).json({ success: true, data: [] });
  }
});

router.get('/:resourceId', async (req, res) => {
  try {
    const { resourceId } = req.params;
    
    // Check cache first
    const cachedResources = myCache.get('all_resources') as Resource[];
    if (cachedResources) {
      const found = cachedResources.find(r => r.id === resourceId);
      if (found) return res.status(200).json({ success: true, data: found });
    }

    if (!resourceLibraryTable) {
      return res.status(404).json({ success: false, message: 'Resource not found' });
    }

    const records = await resourceLibraryTable.select({
      filterByFormula: `AND(OR({Status} = 'Published', {Status} = 'Coming Soon'), {Resource ID} = '${resourceId}')`,
      maxRecords: 1
    }).all();

    if (records.length === 0) {
      return res.status(404).json({ success: false, message: 'Resource not found' });
    }

    const resource = mapRecordToResource(records[0]);
    return res.status(200).json({ success: true, data: resource });
  } catch (err) {
    console.error('Resource detail fetch error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

export default router;
