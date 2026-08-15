export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, firstName, lastName, mailingLists, userGroup, company, country, companySize } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  try {
    const response = await fetch('https://app.loops.so/api/v1/contacts/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.LOOPS_API_KEY}`,
      },
      body: JSON.stringify({
        email,
        firstName: firstName || '',
        lastName: lastName || '',
        mailingLists: mailingLists || {},
        userGroup: userGroup || '',
        company: company || '',
        country: country || '',
        companySize: companySize || '',
        source: 'joshuaomole.com',
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Loops API error:', data);
      return res.status(response.status).json({ error: 'Failed to add contact to Loops', details: data });
    }

    return res.status(200).json({ success: true, data });
  } catch (error) {
    console.error('Loops function error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
