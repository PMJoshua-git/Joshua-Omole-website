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
  const firstName = String(body.name || body.firstName || '').trim();
  const lastName = String(body.lastName || '').trim();
  const mailingLists = isPlainObject(body.mailingLists) ? body.mailingLists : {};
  const userGroup = String(body.userGroup || body.service || 'Website Lead').trim();
  const company = String(body.business || body.company || '').trim();
  const country = String(body.country || '').trim();
  const companySize = String(body.companySize || '').trim();
  const source = String(body.source || 'Website').trim();
  const leadSource = String(body.leadSource ?? body.lead_source ?? '').trim();
  const utmSource = String(body.utmSource ?? body.utm_source ?? '').trim();
  const utmMedium = String(body.utmMedium ?? body.utm_medium ?? '').trim();
  const utmCampaign = String(body.utmCampaign ?? body.utm_campaign ?? '').trim();
  const referrer = String(body.referrer ?? '').trim();
  const leadStatus = String(body.leadStatus ?? body.status ?? '').trim();
  const landingPage = String(body.landingPage ?? body.landing_page ?? '').trim();
  const leadType = String(body.leadType ?? '').trim();

  if (!email) {
    return res.status(400).json({ success: false, error: 'Email is required' });
  }

  const contactPayload: Record<string, unknown> = {
    email,
    firstName,
    lastName,
    userGroup,
    company,
    country,
    companySize,
    source,
    leadSource,
    utmSource,
    utmMedium,
    utmCampaign,
    referrer,
    leadStatus,
    landingPage,
    ...(leadType ? { leadType } : {}),
  };

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
      data: contactPayload,
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
        ...contactPayload,
        mailingLists,
      }),
    });

    if (response.status === 409) {
      const updateResponse = await fetch('https://app.loops.so/api/v1/contacts/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${LOOPS_API_KEY}`,
        },
        body: JSON.stringify(contactPayload),
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
