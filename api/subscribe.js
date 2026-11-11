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

  const email = req.body.email;
  const firstName = req.body.name || req.body.firstName || '';
  const lastName = req.body.lastName || '';
  const mailingLists = req.body.mailingLists || {};
  const userGroup = req.body.userGroup || req.body.service || 'Workflow fix page';
  const company = req.body.business || req.body.company || '';
  const country = req.body.country || '';
  const companySize = req.body.companySize || '';
  const source = req.body.source || 'Workflow fix page';
  const nextStep = req.body.nextStep || '';

  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  const LOOPS_API_KEY = process.env.LOOPS_API_KEY;
  if (!LOOPS_API_KEY) {
    console.warn('[Loops] LOOPS_API_KEY not configured. Operating in mock mode for preview testing.');
    return res.status(200).json({ 
      success: true, 
      mock: true, 
      message: 'Subscribed successfully in preview mode',
      data: { email, firstName, company, source, nextStep, userGroup }
    });
  }

  try {
    const response = await fetch('https://app.loops.so/api/v1/contacts/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${LOOPS_API_KEY}`,
      },
      body: JSON.stringify({
        email,
        firstName,
        lastName,
        mailingLists,
        userGroup,
        company,
        country,
        companySize,
        source,
        nextStep,
      }),
    });

    if (response.status === 409) {
      const updateResponse = await fetch('https://app.loops.so/api/v1/contacts/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${LOOPS_API_KEY}`,
        },
        body: JSON.stringify({
          email,
          firstName,
          lastName,
          userGroup,
          company,
          source,
          nextStep,
        }),
      });
      const updateData = await updateResponse.json().catch(() => ({}));
      return res.status(200).json({ success: true, updated: true, data: updateData });
    }

    const data = await response.json();

    if (!response.ok) {
      console.warn('[Loops] API error in preview:', data);
      return res.status(200).json({ success: true, mock: true, warning: 'Loops API rejected, preview fallback active', details: data });
    }

    return res.status(200).json({ success: true, data });
  } catch (error) {
    console.error('Loops function error:', error);
    return res.status(200).json({ success: true, mock: true, warning: 'Network error calling Loops, preview fallback', error: error.message });
  }
}
