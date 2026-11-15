export interface AttributionData {
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_content: string | null;
  landing_page: string | null;
  referrer: string | null;
  lead_source: string;
}

export interface UtmClickParams {
  utm_source: string;
  utm_medium: string;
  utm_campaign: string;
  utm_content?: string;
}

const STORAGE_KEY = 'joshua_attribution_data';

/**
 * Appends click-level UTM query parameters to an internal path
 * without modifying stored first-touch attribution in localStorage.
 */
export const appendUtmParams = (path: string, params: UtmClickParams): string => {
  const [basePath, existingQuery = ''] = path.split('?');
  const search = new URLSearchParams(existingQuery);
  search.set('utm_source', params.utm_source);
  search.set('utm_medium', params.utm_medium);
  search.set('utm_campaign', params.utm_campaign);
  if (params.utm_content) {
    search.set('utm_content', params.utm_content);
  }
  const qs = search.toString();
  return qs ? `${basePath}?${qs}` : basePath;
};

export const captureAttributionData = (searchString?: string) => {
  if (typeof window === 'undefined') return;

  // Use passed search string (e.g. from react-router useLocation) or fallback to window.location.search
  const queryString = searchString !== undefined ? searchString : window.location.search;
  const urlParams = new URLSearchParams(queryString);
  
  const currentDataStr = localStorage.getItem(STORAGE_KEY);
  let currentData: Partial<AttributionData> = {};
  if (currentDataStr) {
    try {
      currentData = JSON.parse(currentDataStr);
    } catch (e) {
      console.error('Error parsing attribution data', e);
    }
  }

  // First-touch preservation: keep stored attribution if already captured;
  // internal click UTMs (e.g. from Clarity Map pop-up) never overwrite existing first-touch data.
  const hasStoredFirstTouch = Boolean(
    currentData.utm_source || currentData.utm_medium || currentData.utm_campaign
  );
  const incomingSource = urlParams.get('utm_source');
  const incomingMedium = urlParams.get('utm_medium');
  const incomingCampaign = urlParams.get('utm_campaign');
  const incomingContent = urlParams.get('utm_content');

  const isInternalPopupClick =
    incomingSource === 'site' &&
    incomingMedium === 'popup' &&
    incomingCampaign === 'clarity_map_popup';

  const utm_source =
    hasStoredFirstTouch || isInternalPopupClick
      ? currentData.utm_source || (hasStoredFirstTouch ? null : incomingSource)
      : incomingSource || currentData.utm_source || null;
  const utm_medium =
    hasStoredFirstTouch || isInternalPopupClick
      ? currentData.utm_medium || (hasStoredFirstTouch ? null : incomingMedium)
      : incomingMedium || currentData.utm_medium || null;
  const utm_campaign =
    hasStoredFirstTouch || isInternalPopupClick
      ? currentData.utm_campaign || (hasStoredFirstTouch ? null : incomingCampaign)
      : incomingCampaign || currentData.utm_campaign || null;
  const utm_content =
    hasStoredFirstTouch || isInternalPopupClick
      ? currentData.utm_content || (hasStoredFirstTouch ? null : incomingContent)
      : incomingContent || currentData.utm_content || null;

  // Capture landing page (only first touch)
  const landing_page = currentData.landing_page || window.location.pathname;

  // Capture referrer (only first touch)
  let referrer = currentData.referrer;
  if (!referrer && document.referrer) {
    try {
      const referrerUrl = new URL(document.referrer);
      // Skip if it's the same origin
      if (referrerUrl.hostname !== window.location.hostname) {
        referrer = referrerUrl.hostname;
      }
    } catch (e) {
      referrer = document.referrer;
    }
  }

  // Priority Logic for Lead Source
  let lead_source = currentData.lead_source || 'direct';
  if (utm_source) {
    lead_source = utm_source;
  } else if (referrer) {
    lead_source = referrer;
  } else if (landing_page) {
    lead_source = landing_page;
  }

  const newData: AttributionData = {
    utm_source,
    utm_medium,
    utm_campaign,
    utm_content,
    landing_page,
    referrer: referrer || null,
    lead_source
  };

  localStorage.setItem(STORAGE_KEY, JSON.stringify(newData));
};

export const getAttributionData = (): AttributionData => {
  if (typeof window === 'undefined') {
    return {
      utm_source: null,
      utm_medium: null,
      utm_campaign: null,
      utm_content: null,
      landing_page: null,
      referrer: null,
      lead_source: 'direct'
    };
  }

  const dataStr = localStorage.getItem(STORAGE_KEY);
  if (dataStr) {
    try {
      return JSON.parse(dataStr);
    } catch (e) {}
  }
  
  return {
    utm_source: null,
    utm_medium: null,
    utm_campaign: null,
    utm_content: null,
    landing_page: null,
    referrer: null,
    lead_source: 'direct'
  };
};
