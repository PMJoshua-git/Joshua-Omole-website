export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const tableName = req.body.tableName || 'Leads';
  let fields = req.body.fields;

  if (!fields) {
    const rawName = req.body.name || req.body.firstName || '';
    const rawEmail = req.body.email || '';
    const rawBusiness = req.body.business || req.body.company || '';
    const rawNextStep = req.body.nextStep || '';
    const rawSource = req.body.source || 'Workflow fix page';
    const rawService = req.body.userGroup || req.body.service || 'Workflow Fix';

    if (!rawEmail && !rawName) {
      return res.status(400).json({ error: 'Contact name or email is required' });
    }

    fields = {
      'Created Date': new Date().toISOString(),
      'Lead Type': 'Workflow Fix Inquiry',
      'First Name': rawName,
      'Name': rawName,
      'Email': rawEmail,
      'Company Name': rawBusiness,
      'Business': rawBusiness,
      'Service Selected': rawService,
      'Lead Source': rawSource,
      'Business Goal': rawNextStep ? `Next Step Preference: ${rawNextStep}` : '',
      'Status': 'New'
    };
  }

  const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
  const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;

  if (!AIRTABLE_BASE_ID || !AIRTABLE_API_KEY) {
    console.warn('[Airtable] Environment variables not configured. Operating in mock mode for preview testing.');
    return res.status(200).json({ 
      success: true, 
      mock: true, 
      message: 'Saved successfully in preview mode',
      received: { tableName, fields }
    });
  }

  try {
    const response = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(tableName)}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
        },
        body: JSON.stringify({ fields }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.warn('[Airtable] API error in preview:', data);
      return res.status(200).json({ success: true, mock: true, warning: 'Airtable rejected, preview fallback active', details: data });
    }

    return res.status(200).json({ success: true, data });
  } catch (error) {
    console.error('Airtable function error:', error);
    return res.status(200).json({ success: true, mock: true, warning: 'Network error calling Airtable, preview fallback', error: error.message });
  }
}
