import { useEffect, useMemo, useCallback, useRef } from 'react';
import { eurostatService } from '../services/eurostat';
import { useQuery } from '../context/QueryContext';
import { getDatasetByProductAndConsumer, getDatasetConfig } from '../data/energyData';

// Global map to track ongoing requests across all hook instances
const globalPendingRequests = new Map<string, Promise<string[]>>();

export const useDynamicYears = () => {
  const { state, dispatch } = useQuery();
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const lastRequestKeyRef = useRef<string | null>(null);

  // Extract the current query parameters
  const { product, consumer, unit, consoms, currency, availableYears, isLoadingYears } = state;

  // Memoize the parameters to avoid unnecessary recreations
  const memoizedParams = useMemo(() => {
    // Get the appropriate dataset for the current product/consumer combination
    const dataset = getDatasetByProductAndConsumer(product, consumer, state.component);
    if (!dataset) {
      return null;
    }

    // Get dataset configuration to determine correct parameters
    const datasetConfig = getDatasetConfig(dataset);
    if (!datasetConfig) {
      return null;
    }

    // Build the parameters for the API call exactly as Eurostat expects
    const params: Record<string, string | string[]> = {
      nrg_cons: consoms,
      currency
    };
    
    // Add the correct price component parameter based on whether we're using components or not
    if (state.component) {
      // For datasets with _c suffix, use nrg_prc parameter with values from dataset config
      // Do NOT include unit or product parameters for component datasets
      if (datasetConfig.nrg_prc && datasetConfig.nrg_prc.length > 0) {
        params.nrg_prc = datasetConfig.nrg_prc;
      }
    } else {
      // For datasets without _c suffix, include unit and product, and use tax parameter with default tax values
      params.unit = unit;
      params.product = product;
      if (state.taxs.length > 0) {
        params.tax = state.taxs;
      }
    }

    return { dataset, params };
  }, [product, consumer, unit, consoms, currency, state.component, state.taxs]);

  // Create a unique key for this request
  const requestKey = useMemo(() => {
    if (!memoizedParams) return null;
    const { dataset, params } = memoizedParams;
    const sortedKeys = Object.keys(params).sort();
    const paramString = sortedKeys.map(key => {
      const value = params[key];
      if (Array.isArray(value)) {
        return `${key}=${value.sort().join(',')}`;
      }
      return `${key}=${value}`;
    }).join('&');
    return `${dataset}_${paramString}`;
  }, [memoizedParams]);

  // Function to fetch years based on current state
  const fetchYearsForCurrentState = useCallback(async () => {
    if (!memoizedParams || !requestKey) {
      console.error('Unable to determine dataset or parameters for fetching years');
      dispatch({ type: 'SET_AVAILABLE_YEARS', payload: [] });
      return;
    }

    // Skip if this is the same request as the last one
    if (lastRequestKeyRef.current === requestKey) {
      return;
    }

    // Check if this request is already in progress globally
    const existingRequest = globalPendingRequests.get(requestKey);
    if (existingRequest) {
      try {
        const years = await existingRequest;
        dispatch({ type: 'SET_AVAILABLE_YEARS', payload: years });
        
        // If no year is currently selected or the selected year is not available,
        // select the most recent available year
        if (!state.time || !years.includes(state.time)) {
          if (years.length > 0) {
            dispatch({ type: 'SET_YEAR', payload: years[0] });
          }
        }
      } catch (error) {
        console.error('Error waiting for global request:', error);
        dispatch({ type: 'SET_AVAILABLE_YEARS', payload: [] });
      }
      return;
    }

    try {
      dispatch({ type: 'SET_LOADING_YEARS', payload: true });
      lastRequestKeyRef.current = requestKey;

      const { dataset, params } = memoizedParams;

      // Create the promise and store it globally
      const fetchPromise = eurostatService.fetchAvailableYears(dataset, params);
      globalPendingRequests.set(requestKey, fetchPromise);

      // Fetch available years from Eurostat
      const years = await fetchPromise;
      dispatch({ type: 'SET_AVAILABLE_YEARS', payload: years });

      // If no year is currently selected or the selected year is not available,
      // select the most recent available year
      if (!state.time || !years.includes(state.time)) {
        if (years.length > 0) {
          dispatch({ type: 'SET_YEAR', payload: years[0] });
        }
      }

    } catch (err) {
      console.error('Error fetching available years:', err);
      dispatch({ type: 'SET_AVAILABLE_YEARS', payload: [] });
    } finally {
      dispatch({ type: 'SET_LOADING_YEARS', payload: false });
      // Clean up the global request
      if (requestKey) {
        globalPendingRequests.delete(requestKey);
      }
    }
  }, [memoizedParams, requestKey, dispatch, state.time]);

  // Debounced version of the fetch function
  const debouncedFetch = useCallback(() => {
    // Clear any existing timeout
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // Set a new timeout
    debounceRef.current = setTimeout(() => {
      fetchYearsForCurrentState();
    }, 200); // Reduced to 200ms for better responsiveness
  }, [fetchYearsForCurrentState]);

  // Effect to fetch years when key parameters change
  useEffect(() => {
    debouncedFetch();

    // Cleanup function to clear timeout on unmount
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [debouncedFetch]); // Now properly depends on the memoized callback

  return {
    availableYears,
    isLoading: isLoadingYears,
    refetch: fetchYearsForCurrentState
  };
};
