export interface AttributionData {
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_content: string | null;
  landing_page: string | null;
  referrer: string | null;
  lead_source: string;
}

const STORAGE_KEY = 'joshua_attribution_data';

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

  // Capture UTM parameters (only overwrite if they exist in current URL to persist first touch)
  const utm_source = urlParams.get('utm_source') || currentData.utm_source || null;
  const utm_medium = urlParams.get('utm_medium') || currentData.utm_medium || null;
  const utm_campaign = urlParams.get('utm_campaign') || currentData.utm_campaign || null;
  const utm_content = urlParams.get('utm_content') || currentData.utm_content || null;

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
  let lead_source = 'direct';
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
