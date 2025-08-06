import { useEffect } from 'react';
import { eurostatService } from '../services/eurostat';
import { useQuery } from '../context/QueryContext';
import { getDatasetByProductAndConsumer } from '../data/energyData';

export const useDynamicYears = () => {
  const { state, dispatch } = useQuery();

  // Extract the current query parameters
  const { product, consumer, unit, consoms, currency, availableYears, isLoadingYears } = state;

  // Function to fetch years based on current state
  const fetchYearsForCurrentState = async () => {
    try {
      dispatch({ type: 'SET_LOADING_YEARS', payload: true });

      // Get the appropriate dataset for the current product/consumer combination
      // Pass the component flag to determine if we need _c suffix datasets
      const dataset = getDatasetByProductAndConsumer(product, consumer, state.component);
      if (!dataset) {
        throw new Error(`No dataset found for product: ${product}, consumer: ${consumer}, component: ${state.component}`);
      }

      // Build the parameters for the API call exactly as Eurostat expects
      // The API expects multiple tax parameters like: tax=I_TAX&tax=X_TAX&tax=X_VAT
      const params: Record<string, string | string[]> = {
        unit,
        product,
        nrg_cons: consoms,
        currency
      };
      
      // Add tax parameters as an array so axios handles it correctly
      if (state.taxs.length > 0) {
        params.tax = state.taxs;
      }

      console.log('Fetching years for:', { dataset, params });

      // Fetch available years from Eurostat
      const years = await eurostatService.fetchAvailableYears(dataset, params);
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
    }
  };

  // Effect to fetch years when key parameters change
  useEffect(() => {
    fetchYearsForCurrentState();
  }, [product, consumer, unit, consoms, currency, state.component]); // Re-fetch when these change

  return {
    availableYears,
    isLoading: isLoadingYears,
    refetch: fetchYearsForCurrentState
  };
};
