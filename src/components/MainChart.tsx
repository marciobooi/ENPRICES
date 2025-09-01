import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { subscribeToDataUpdates, getCurrentData } from '../services/handleData';
import { transformToCountryComparison, transformToCountryBands } from './chartData';
import { createCountryComparisonConfig } from './chartConfig';
import { useQuery } from '../context/QueryContext';
import { eurostatService } from '../services/eurostat';
import { allCountries, getDatasetConfig } from '../data/energyData';

interface MainChartProps {
  className?: string;
}

const MainChart: React.FC<MainChartProps> = ({ className = '' }) => {
  const { t, i18n } = useTranslation();
  const { state, dispatch } = useQuery();
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const [data, setData] = useState<any>(null);
  const [originalData, setOriginalData] = useState<any>(null); // Store original country data
  const [lastFetchKey, setLastFetchKey] = useState<string>('');

  // Subscribe to data updates from handleData
  useEffect(() => {
    const currentData = getCurrentData();
    if (currentData.data && currentData.data.value) {
      setData(currentData.data);
    }

    const unsubscribe = subscribeToDataUpdates((newData) => {
      if (newData && newData.value) {
        setData(newData);
        // If this is country comparison data (not bands data), store it as original
        // Check if it has multiple countries (more than 5 geo entities suggests country comparison)
        const geoCount = newData?.dimension?.geo?.category?.index ? 
          Object.keys(newData.dimension.geo.category.index).length : 0;
        const isBandsData = newData?.dimension?.nrg_cons?.category?.index && 
                           Object.keys(newData.dimension.nrg_cons.category.index).length > 1;
        
        // Store as original if it's country comparison data (multiple countries, not bands)
        if (geoCount > 5 && !isBandsData) {
          setOriginalData(newData);
        }
      }
    });

    return unsubscribe;
  }, []);

  // Add event listener for back button from drill-down view
  useEffect(() => {
    const handleBackFromDrillDown = () => {
      dispatch({ type: 'SET_DRILL_DOWN_COUNTRY', payload: null });
    };

    window.addEventListener('backFromDrillDown', handleBackFromDrillDown);
    
    return () => {
      window.removeEventListener('backFromDrillDown', handleBackFromDrillDown);
    };
  }, [dispatch]);

  useEffect(() => {
    if (!chartContainerRef.current || !data) return;

    // Clear container
    chartContainerRef.current.innerHTML = '';

    let transformedData;
    let chartConfig;
    let removeClickHandler: (() => void) | null = null;

    // Check if we have a drill-down country selected and need to fetch bands data
    // We need to fetch if:
    // 1. We have a drill-down country selected, AND
    // 2. Either we don't have nrg_cons dimension, OR we only have one consumption band (not the full bands data)
    const hasMultipleBands = data?.dimension?.nrg_cons?.category?.index && Object.keys(data.dimension.nrg_cons.category.index).length > 1;
    const needsBandsFetch = state.drillDownCountry && !hasMultipleBands;
    
    // Check if we have bands data but no drill-down country (returning from bands view)
    const isBandsDataWithoutDrillDown = !state.drillDownCountry && hasMultipleBands;
    
    if (isBandsDataWithoutDrillDown) {
      // We're returning from bands view but still have bands data
      // We need to get fresh country comparison data since bands data only has one country
      
      // Use the stored original country data if available
      if (originalData && originalData !== data) {
        setData(originalData);
        return; // Re-render with original country data
      }
      
      // If no original data available, we need to trigger a refresh
      // Clear the current data to force a refresh from the data service
      const currentServiceData = getCurrentData();
      if (currentServiceData.data && currentServiceData.data !== data) {
        setData(currentServiceData.data);
        return; // Re-render with fresh data
      }
      
      // If we still have bands data and no way to get country data,
      // dispatch an action to force data refresh (this will trigger a new API call)
      console.warn('[MainChart] No country data available, forcing refresh');
      // Force refresh by temporarily changing a query parameter
      const currentTime = Date.now();
      setLastFetchKey(`refresh-${currentTime}`);
      // This will be handled by the parent component's data fetching logic
      return;
    }
    
    if (needsBandsFetch && state.drillDownCountry) {
      // Create a unique key for this fetch to prevent infinite loops
      const fetchKey = `${state.dataset}-${state.drillDownCountry}-${state.time}-${JSON.stringify([state.currency, state.product, state.unit, state.taxs, state.component])}`;
      
      if (lastFetchKey === fetchKey) {
        // Already fetched this exact same data, skip
        return;
      }
      
      // Store current data as original before fetching bands
      if (data && !hasMultipleBands) {
        setOriginalData(data);
      }
      
      // Fetch band data for the selected country
      // Build params based on dataset/component flags
      const dsConfig = getDatasetConfig(state.dataset);
      const isComponentDataset = state.dataset.endsWith('_c') || state.component;
      const extraParams: Record<string, string | string[]> = {
        currency: state.currency,
      };

      // For non-component datasets, include product and unit
      if (!isComponentDataset) {
  extraParams.product = state.product;
  // Eurostat expects KWH even when showing MWH; match legacy behavior if needed
  extraParams.unit = state.unit === 'MWH' ? 'KWH' : state.unit;
        // Include tax codes when not component
        if (state.taxs && state.taxs.length > 0) {
          extraParams.tax = state.taxs;
        }
      } else {
        // Component datasets: include all nrg_prc if available
        if (dsConfig?.nrg_prc && dsConfig.nrg_prc.length > 0) {
          extraParams.nrg_prc = dsConfig.nrg_prc;
        }
      }

      // Show a simple loading placeholder while fetching bands
      if (chartContainerRef.current) {
        const loading = document.createElement('div');
        loading.setAttribute('role', 'status');
        loading.textContent = t('loading', 'Loading…');
        loading.style.padding = '1rem';
        chartContainerRef.current.appendChild(loading);
      }

      // Set the fetch key to prevent re-fetching
      setLastFetchKey(fetchKey);

      eurostatService
        .fetchCountryBands(
          state.dataset,
          state.drillDownCountry,
          state.time,
          extraParams
        )
      .then(bandData => {
        // Set the bands data as the main data and let the regular rendering handle it
        setData(bandData);
      }).catch(error => {
        console.error('[MainChart] Error fetching band data:', error);
        // Fallback to regular view if band data fetch fails
        dispatch({ type: 'SET_DRILL_DOWN_COUNTRY', payload: null });
      });
      
      // Return early to avoid rendering until we have bands data
      return;
    } else {
      // Regular country comparison view OR bands view (if drillDownCountry is set)
      if (state.drillDownCountry && data?.dimension?.nrg_cons) {
        // This is bands data - transform it to show consumption bands
        transformedData = transformToCountryBands(data, state.drillDownCountry, state.details, (key, defaultValue) => t(key, defaultValue || key));
        
        // Modify the chart title to show it's a bands view
        const { categories, series, selectedYear, isDetailed } = transformedData;
        chartConfig = createCountryComparisonConfig({
          categories,
          series,
          selectedYear,
          isDetailed: isDetailed || false, // Use the isDetailed flag from transformedData
          isComponent: false,
          order: state.order,
          percentage: false,
          countryCodes: [],
          decimals: state.decimals,
          t
        });
        
        // Add back button to the title
        if (chartConfig.data && chartConfig.data.title) {
          chartConfig.data.title.text = `← Back to Countries | Consumption Bands - ${state.drillDownCountry} (${selectedYear})`;
        }
      } else {
        // Regular country comparison view
        transformedData = transformToCountryComparison(data, state.details, state.hideAggregates, state.component, undefined);
        const { categories, series, selectedYear, countryCodes } = transformedData;

        // Create chart configuration using the external function
        chartConfig = createCountryComparisonConfig({
          categories,
          series,
          selectedYear,
          isDetailed: state.details, // Use state.details to control detailed view
          isComponent: state.component, // Use state.component to control component vs tax breakdown
          order: state.order,
          percentage: state.percentage,
          countryCodes: countryCodes || [],
          decimals: state.decimals,
          t
        });
      }

      // Add click handler for drill-down functionality
      let categories: string[] = [];
      let countryCodes: string[] = [];
      
      if (chartConfig.data && chartConfig.data.plotOptions) {
        // Extract categories and countryCodes from the transformed data
        if (state.drillDownCountry && data?.dimension?.nrg_cons) {
          // For bands view, we don't want click handlers since we're already drilled down
          categories = transformedData.categories || [];
          countryCodes = [];
        } else {
          // For regular country view, set up click handlers
          const regularData = transformedData as { categories: string[], countryCodes?: string[] };
          categories = regularData.categories || [];
          countryCodes = regularData.countryCodes || [];
          
          const existingClickHandler = chartConfig.data.plotOptions.series?.point?.events?.click;
          
          chartConfig.data.plotOptions.series = {
            ...chartConfig.data.plotOptions.series,
            point: {
              events: {
                click: function(this: any) {
                  const countryCode = this.countryCode;
                  if (countryCode) {
                    dispatch({ type: 'SET_DRILL_DOWN_COUNTRY', payload: countryCode });
                  }
                  
                  // Call any existing click handler if present
                  if (existingClickHandler) {
                    existingClickHandler.call(this);
                  }
                }
              }
            }
          };
        }
      }

      // Modify the series data to include country codes (only for regular country view)
      if (chartConfig.data && chartConfig.data.series && countryCodes.length > 0) {
        chartConfig.data.series = chartConfig.data.series.map((series: any) => ({
          ...series,
          data: series.data.map((point: any, index: number) => ({
            ...point,
            countryCode: countryCodes[index] || null
          }))
        }));
      }

      // Create the UEC script element with our data
      const scriptElement = document.createElement('script');
      scriptElement.type = 'application/json';
      scriptElement.textContent = JSON.stringify(chartConfig);

      // Add script to container
      chartContainerRef.current.appendChild(scriptElement);

      // Extract click handler logic into a separate function
      const handleChartClick = (e: Event) => {
        // Only handle clicks for regular country view, not for bands view
        if (state.drillDownCountry && data?.dimension?.nrg_cons) {
          return; // Don't handle clicks in bands view
        }
        
        const targetEl = (e.target as Element) || null;
        const pointEl = targetEl ? targetEl.closest('.highcharts-point') as SVGElement | null : null;

        if (pointEl) {
          const ariaLabel = pointEl.getAttribute('aria-label');
          if (ariaLabel) {
            const countryName = ariaLabel.split(',')[0].trim();
            let countryCode = null;

            // Create reverse mapping from translated names to country codes
            if (t) {
              const countryMappings = allCountries.map(code => ({
                code,
                translation: t(`countries.${code}`)
              }));

              const matchingCountry = countryMappings.find(mapping => mapping.translation === countryName);
              if (matchingCountry) {
                countryCode = matchingCountry.code;
              }
            }

            // Fallback: use categories and countryCodes arrays
            if (!countryCode) {
              const countryIndex = categories.indexOf(countryName);
              countryCode = countryCodes && countryCodes[countryIndex];
            }

            if (countryCode) {
              // Trigger drill-down so bands are fetched for the selected year
              dispatch({ type: 'SET_DRILL_DOWN_COUNTRY', payload: countryCode });
            }
          }
        }
      };

      // Attach click handler immediately (delegated) so we don't miss early clicks
      const chartContainer = chartContainerRef.current;
      if (chartContainer) {
        chartContainer.addEventListener('click', handleChartClick);
        removeClickHandler = () => {
          chartContainer.removeEventListener('click', handleChartClick);
        };
      }

      // Function to initialize chart rendering and events
      const initializeChart = () => {
        if (!(window as any).$wt || typeof (window as any).$wt !== 'function') return;

        (window as any).$wt();

        // Force layout recalculation
        requestAnimationFrame(() => {
          window.dispatchEvent(new Event('resize'));
          window.dispatchEvent(new Event('scroll'));

          // Add click event listener after chart renders
          setTimeout(() => {
            // Additional listener registration is not needed since we already attached one above
          }, 1000);
        });
      };

      // Initialize chart rendering and events
      setTimeout(initializeChart, 50);
    }
    // Cleanup DOM click handler on re-render/unmount
    return () => {
      if (removeClickHandler) removeClickHandler();
    };
  }, [data, state.details, state.order, state.percentage, state.hideAggregates, state.component, state.drillDownCountry, state.decimals, state.dataset, state.unit, state.currency, state.taxs, state.product, state.time, i18n.language, t]);

  return (
    <div className={`main-chart ${className}`}>
      <div 
        ref={chartContainerRef}
        className="chart-container"
        role="img"
        aria-label={t('chart.aria.label', 'Energy prices chart')}
      />
    </div>
  );
};

export default MainChart;
