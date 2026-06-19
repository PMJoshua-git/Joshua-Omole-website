import { useEffect, useState } from 'react';
import { getAttributionData, captureAttributionData, AttributionData } from '../utils/attribution';

export const useAttribution = (): AttributionData => {
  const [attribution, setAttribution] = useState<AttributionData>(getAttributionData());

  useEffect(() => {
    // Capture data in case App.tsx AttributionTracker hasn't run yet
    captureAttributionData();
    setAttribution(getAttributionData());
  }, []);

  return attribution;
};
