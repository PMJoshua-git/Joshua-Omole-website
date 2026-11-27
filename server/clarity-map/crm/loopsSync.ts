import type { ClarityMapResult } from '../../../features/clarity-map/types/clarityMap.js';

export class LoopsConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'LoopsConfigurationError';
  }
}

export class LoopsSyncError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'LoopsSyncError';
  }
}

export interface LoopsSyncOutcome {
  synced: true;
  action: 'created' | 'updated';
}

/**
 * Creates or updates a Clarity Map contact in Loops when the user submits
 * their first name and email to get the full PDF report.
 * Mandatory (non-optional): throws if LOOPS_API_KEY is missing or the Loops API rejects.
 * Always assigns userGroup = "Claritymap".
 */
export async function syncClarityMapContactToLoops(opts: {
  email: string;
  firstName: string;
  result: ClarityMapResult;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  referrer?: string;
  landingPage?: string;
  leadSource?: string;
  leadStatus?: string;
  leadType?: string;
}): Promise<LoopsSyncOutcome> {
  const apiKey = process.env.LOOPS_API_KEY;
  if (!apiKey || apiKey.trim() === '') {
    throw new LoopsConfigurationError(
      'CRM contact sync is not configured yet (LOOPS_API_KEY is missing).'
    );
  }

  const payload = {
    email: opts.email,
    firstName: opts.firstName,
    userGroup: 'Claritymap',
    source: 'Clarity Map',
    leadSource: opts.leadSource || 'direct',
    leadType: opts.leadType || 'Clarity Map',
    leadStatus: opts.leadStatus || 'New',
    landingPage: opts.landingPage || '/clarity-map',
    utmSource: opts.utmSource || '',
    utmMedium: opts.utmMedium || '',
    utmCampaign: opts.utmCampaign || '',
    referrer: opts.referrer || '',
    clarityMapIndustry: opts.result.crm_tags.industry || opts.result.meta.industry,
    clarityMapProcessCode: opts.result.crm_tags.process_code || opts.result.meta.process_code,
    clarityMapProcessName: opts.result.meta.process_name,
    clarityMapReadinessBand: opts.result.crm_tags.readiness_band || opts.result.readiness.band,
    clarityMapReadinessScore: opts.result.readiness.score_percent,
    clarityMapTopBottleneck: opts.result.crm_tags.top_bottleneck_bridge_letter,
    clarityMapVolumeBand: opts.result.crm_tags.volume_band,
  };

  let createRes: Response;
  try {
    createRes = await fetch('https://app.loops.so/api/v1/contacts/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
    });
  } catch (err: any) {
    throw new LoopsSyncError(
      `Unable to connect to Loops CRM: ${err?.message || 'network error'}`
    );
  }

  if (createRes.status === 409) {
    let updateRes: Response;
    try {
      updateRes = await fetch('https://app.loops.so/api/v1/contacts/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(payload),
      });
    } catch (err: any) {
      throw new LoopsSyncError(
        `Unable to update contact in Loops CRM: ${err?.message || 'network error'}`
      );
    }

    if (!updateRes.ok) {
      const errText = await updateRes.text().catch(() => '');
      throw new LoopsSyncError(
        `Loops contact update failed (HTTP ${updateRes.status}): ${errText || 'unknown error'}`
      );
    }

    return { synced: true, action: 'updated' };
  }

  if (!createRes.ok) {
    const errText = await createRes.text().catch(() => '');
    throw new LoopsSyncError(
      `Loops contact creation failed (HTTP ${createRes.status}): ${errText || 'unknown error'}`
    );
  }

  return { synced: true, action: 'created' };
}
