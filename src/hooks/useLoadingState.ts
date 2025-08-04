import { useState, useEffect } from 'react';

/**
 * Hook to simulate loading state for demonstration purposes
 * @param delay - Delay in milliseconds before loading completes
 * @returns loading state boolean
 */
export const useLoadingState = (delay: number = 2000): boolean => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, delay);

    return () => clearTimeout(timer);
  }, [delay]);

  return loading;
};
