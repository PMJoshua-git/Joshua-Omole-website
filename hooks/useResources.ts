import { useState, useEffect } from 'react';
import { Resource } from '../types';

export const useResources = () => {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchResources = async () => {
      try {
        const response = await fetch('/api/resources');
        const result = await response.json();
        
        if (result.success) {
          setResources(result.data);
        } else {
          setError(result.message || 'Failed to fetch resources');
        }
      } catch (err) {
        setError('Error fetching resources');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchResources();
  }, []);

  return { resources, loading, error };
};
