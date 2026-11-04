import { useState, useEffect } from 'react';
import { ResourcePublic } from '../types/resources';

export const useResources = () => {
  const [resources, setResources] = useState<ResourcePublic[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchResources = async () => {
      try {
        const response = await fetch('/api/resources');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const result = await response.json();
        
        if (isMounted) {
          if (Array.isArray(result)) {
            setResources(result);
          } else if (result && Array.isArray(result.data)) {
            setResources(result.data);
          } else {
            setResources([]);
          }
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err.message || 'Error fetching resources');
          console.error('[useResources] Failed to load resources:', err);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchResources();

    return () => {
      isMounted = false;
    };
  }, []);

  return { resources, loading, error };
};
