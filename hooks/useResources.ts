import { useState, useEffect } from 'react';
import { ResourcePublic } from '../types/resources';

function readPreloadedResources(): ResourcePublic[] | null {
  if (typeof document === 'undefined') return null;
  const el = document.getElementById('__PRELOADED_RESOURCES__');
  if (!el || !el.textContent) return null;
  try {
    const parsed = JSON.parse(el.textContent);
    return Array.isArray(parsed) ? (parsed as ResourcePublic[]) : null;
  } catch {
    return null;
  }
}

export const useResources = () => {
  const [preloaded] = useState<ResourcePublic[] | null>(() => readPreloadedResources());
  const [resources, setResources] = useState<ResourcePublic[]>(() => preloaded ?? []);
  const [loading, setLoading] = useState<boolean>(() => preloaded === null);
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
          setError(null);
        }
      } catch (err: any) {
        if (isMounted && preloaded === null) {
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
  }, [preloaded]);

  return { resources, loading, error };
};
