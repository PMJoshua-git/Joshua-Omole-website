export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { tableName, fields } = req.body;

  if (!tableName || !fields) {
    return res.status(400).json({ error: 'tableName and fields are required' });
  }

  const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
  const AIRTABLE_TOKEN = process.env.AIRTABLE_TOKEN;

  if (!AIRTABLE_BASE_ID || !AIRTABLE_TOKEN) {
    console.error('Missing Airtable environment variables');
    return res.status(500).json({ error: 'Server configuration error' });
  }

  try {
    const response = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(tableName)}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${AIRTABLE_TOKEN}`,
        },
        body: JSON.stringify({ fields }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error('Airtable API error:', data);
      return res.status(response.status).json({ error: 'Failed to save to Airtable', details: data });
    }

    return res.status(200).json({ success: true, data });
  } catch (error) {
    console.error('Airtable function error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
