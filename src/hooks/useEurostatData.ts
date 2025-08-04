import { useState, useEffect } from 'react';
import { eurostatService } from '../services/eurostat';

interface UseEurostatDataProps {
  dataset: string;
  params?: Record<string, string>;
  autoFetch?: boolean;
}

interface UseEurostatDataReturn {
  data: any;
  loading: boolean;
  error: string | null;
  fetchData: () => Promise<void>;
  clearCache: () => void;
}

export const useEurostatData = ({ 
  dataset, 
  params, 
  autoFetch = true 
}: UseEurostatDataProps): UseEurostatDataReturn => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await eurostatService.fetchData(dataset, params);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error in useEurostatData:', err);
    } finally {
      setLoading(false);
    }
  };

  const clearCache = () => {
    eurostatService.clearCache();
    setData(null);
  };

  useEffect(() => {
    if (autoFetch && dataset) {
      fetchData();
    }
  }, [dataset, JSON.stringify(params), autoFetch]);

  return {
    data,
    loading,
    error,
    fetchData,
    clearCache
  };
};
