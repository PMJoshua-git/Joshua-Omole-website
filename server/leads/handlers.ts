export const ALLOWED_AIRTABLE_TABLES = new Set(['Leads', 'Training Pipeline']);

export const ALLOWED_AIRTABLE_FIELDS: Record<string, Set<string>> = {
  Leads: new Set([
    'Created Date',
    'Lead Type',
    'First Name',
    'Last Name',
    'Name',
    'Email',
    'Phone Number',
    'Company Name',
    'Business',
    'Position',
    'Country',
    'Company Size',
    'Service Selected',
    'Business Goal',
    'Next Step',
    'Newsletter Opt-In',
    'Booking Time',
    'Lead Source',
    'Landing Page',
    'UTM Source',
    'UTM Medium',
    'UTM Campaign',
    'Referrer',
    'Status',
  ]),
  'Training Pipeline': new Set([
    'Name',
    'Email',
    'Location',
    'Expectations',
    'Session',
    'Booking date',
    'Status',
  ]),
};

function isProductionEnv(): boolean {
  return process.env.VERCEL_ENV === 'production';
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function parseBody(body: unknown): Record<string, any> {
  if (typeof body === 'string') {
    try {
      const parsed = JSON.parse(body);
      return isPlainObject(parsed) ? parsed : {};
    } catch {
      return {};
    }
  }
  return isPlainObject(body) ? body : {};
}

export async function handleSaveContactRequest(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const body = parseBody(req.body);
  if (body.tableName !== undefined && typeof body.tableName !== 'string') {
    return res.status(400).json({ success: false, error: 'Invalid tableName' });
  }

  const tableName =
    typeof body.tableName === 'string' && body.tableName.trim() !== ''
      ? body.tableName.trim()
      : 'Leads';

  if (!ALLOWED_AIRTABLE_TABLES.has(tableName)) {
    return res.status(400).json({
      success: false,
      error: `Unsupported Airtable table: ${tableName}`,
    });
  }

  const allowedFieldSet = ALLOWED_AIRTABLE_FIELDS[tableName];
  let fields: Record<string, unknown>;

  if (body.fields !== undefined) {
    if (!isPlainObject(body.fields)) {
      return res.status(400).json({
        success: false,
        error: 'Fields must be an object',
      });
    }
    const keys = Object.keys(body.fields);
    if (keys.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'At least one field is required',
      });
    }
    const unknownFields = keys.filter((k) => !allowedFieldSet.has(k));
    if (unknownFields.length > 0) {
      return res.status(400).json({
        success: false,
        error: `Unsupported Airtable field: ${unknownFields[0]}`,
      });
    }
    fields = body.fields;
  } else {
    if (tableName !== 'Leads') {
      return res.status(400).json({
        success: false,
        error: `Structured fields are required for table: ${tableName}`,
      });
    }
    const rawName = String(body.name || body.firstName || '').trim();
    const rawEmail = String(body.email || '').trim();
    const rawBusiness = String(body.business || body.company || '').trim();
    const rawNextStep = String(body.nextStep || '').trim();
    const rawSource = String(body.source || 'Workflow fix page').trim();
    const rawService = String(body.userGroup || body.service || 'Workflow Fix').trim();

    if (!rawEmail && !rawName) {
      return res.status(400).json({
        success: false,
        error: 'Contact name or email is required',
      });
    }

    fields = {
      'Created Date': new Date().toISOString(),
      'Lead Type': 'Workflow Fix Inquiry',
      'First Name': rawName,
      Name: rawName,
      Email: rawEmail,
      'Company Name': rawBusiness,
      Business: rawBusiness,
      'Service Selected': rawService,
      'Lead Source': rawSource,
      'Business Goal': rawNextStep ? `Next Step Preference: ${rawNextStep}` : '',
      Status: 'New',
    };
  }

  const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID?.trim();
  const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY?.trim();

  if (!AIRTABLE_BASE_ID || !AIRTABLE_API_KEY) {
    if (isProductionEnv()) {
      console.error('[Airtable] Environment variables missing in production:', { tableName });
      return res.status(503).json({
        success: false,
        error: 'Contact storage is not configured right now. Please try again later.',
      });
    }
    console.warn('[Airtable] Environment variables not configured. Operating in mock mode for preview testing.');
    return res.status(200).json({
      success: true,
      mock: true,
      message: 'Saved successfully in preview mode',
      received: { tableName, fields },
    });
  }

  try {
    const response = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(tableName)}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${AIRTABLE_API_KEY}`,
        },
        body: JSON.stringify({ fields }),
      }
    );

    const data = (await response.json().catch(() => ({}))) as any;

    if (!response.ok) {
      const errorType = data?.error?.type || data?.error || 'AIRTABLE_ERROR';
      console.error('[Airtable] API rejected request:', {
        status: response.status,
        errorType,
        tableName,
      });
      if (isProductionEnv()) {
        return res.status(502).json({
          success: false,
          error: 'Unable to save your details right now. Please try again.',
        });
      }
      return res.status(200).json({
        success: true,
        mock: true,
        warning: 'Airtable rejected, preview fallback active',
        details: data,
      });
    }

    return res.status(200).json({ success: true, data });
  } catch (error: any) {
    console.error('[Airtable] Network error:', {
      tableName,
      name: error?.name || 'Error',
      message: String(error?.message || error || '').slice(0, 200),
    });
    if (isProductionEnv()) {
      return res.status(502).json({
        success: false,
        error: 'Unable to reach contact storage right now. Please try again.',
      });
    }
    return res.status(200).json({
      success: true,
      mock: true,
      warning: 'Network error calling Airtable, preview fallback',
      error: error?.message,
    });
  }
}

export async function handleSubscribeRequest(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const body = parseBody(req.body);
  const email = typeof body.email === 'string' ? body.email.trim() : '';
  const firstName = body.name || body.firstName || '';
  const lastName = body.lastName || '';
  const mailingLists = isPlainObject(body.mailingLists) ? body.mailingLists : {};
  const userGroup = body.userGroup || body.service || 'Workflow fix page';
  const company = body.business || body.company || '';
  const country = body.country || '';
  const companySize = body.companySize || '';
  const source = body.source || 'Workflow fix page';
  const nextStep = body.nextStep || '';

  if (!email) {
    return res.status(400).json({ success: false, error: 'Email is required' });
  }

  const LOOPS_API_KEY = process.env.LOOPS_API_KEY?.trim();
  if (!LOOPS_API_KEY) {
    if (isProductionEnv()) {
      console.error('[Loops] LOOPS_API_KEY missing in production');
      return res.status(503).json({
        success: false,
        error: 'Subscription service is not configured right now. Please try again later.',
      });
    }
    console.warn('[Loops] LOOPS_API_KEY not configured. Operating in mock mode for preview testing.');
    return res.status(200).json({
      success: true,
      mock: true,
      message: 'Subscribed successfully in preview mode',
      data: { email, firstName, company, source, nextStep, userGroup },
    });
  }

  try {
    const response = await fetch('https://app.loops.so/api/v1/contacts/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${LOOPS_API_KEY}`,
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
          Authorization: `Bearer ${LOOPS_API_KEY}`,
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
      const updateData = (await updateResponse.json().catch(() => ({}))) as any;
      if (!updateResponse.ok) {
        console.error('[Loops] Contact update failed:', {
          status: updateResponse.status,
          errorType: updateData?.message || updateData?.error || 'LOOPS_UPDATE_ERROR',
        });
        if (isProductionEnv()) {
          return res.status(502).json({
            success: false,
            error: 'Unable to update subscription right now. Please try again.',
          });
        }
        return res.status(200).json({
          success: true,
          mock: true,
          warning: 'Loops update rejected, preview fallback active',
          details: updateData,
        });
      }
      return res.status(200).json({ success: true, updated: true, data: updateData });
    }

    const data = (await response.json().catch(() => ({}))) as any;

    if (!response.ok) {
      console.error('[Loops] API rejected request:', {
        status: response.status,
        errorType: data?.message || data?.error || 'LOOPS_ERROR',
      });
      if (isProductionEnv()) {
        return res.status(502).json({
          success: false,
          error: 'Unable to complete subscription right now. Please try again.',
        });
      }
      return res.status(200).json({
        success: true,
        mock: true,
        warning: 'Loops API rejected, preview fallback active',
        details: data,
      });
    }

    return res.status(200).json({ success: true, data });
  } catch (error: any) {
    console.error('[Loops] Network error:', {
      name: error?.name || 'Error',
      message: String(error?.message || error || '').slice(0, 200),
    });
    if (isProductionEnv()) {
      return res.status(502).json({
        success: false,
        error: 'Unable to reach subscription service right now. Please try again.',
      });
    }
    return res.status(200).json({
      success: true,
      mock: true,
      warning: 'Network error calling Loops, preview fallback',
      error: error?.message,
    });
  }
}
