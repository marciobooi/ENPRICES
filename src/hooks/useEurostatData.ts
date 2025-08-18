import { useState, useEffect, useMemo } from 'react';
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

  // Create stable params dependency using useMemo
  const stableParams = useMemo(() => {
    if (!params) return null;
    // Sort keys to ensure consistent ordering
    const sortedKeys = Object.keys(params).sort();
    const sortedParams: Record<string, string> = {};
    sortedKeys.forEach(key => {
      sortedParams[key] = params[key];
    });
    return sortedParams;
  }, [params]);

  // Create stable string representation for dependency array
  const paramsDep = useMemo(() => {
    return stableParams ? JSON.stringify(stableParams) : null;
  }, [stableParams]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await eurostatService.fetchData(dataset, stableParams || undefined);
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
  }, [dataset, paramsDep, autoFetch]);

  return {
    data,
    loading,
    error,
    fetchData,
    clearCache
  };
};
