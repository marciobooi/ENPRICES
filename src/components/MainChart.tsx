import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { subscribeToDataUpdates, getCurrentData } from '../services/handleData';
import { transformToCountryComparison, transformToCountryBands, transformToBandsPieChart, createBandsTable, createCountryComparisonTable, createPieChartTable, createTimelineChartTable, transformToBandsTimeline } from './chartData';
import { createCountryComparisonConfig, createPieChartConfig, createTimelineChartConfig } from './chartConfig';
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

  // Helper function to format time period for chart subtitle
  const formatTimeForChart = (time: string): string => {
    if (time.includes('-S')) {
      const [year, semester] = time.split('-S');
      return `${year} S${semester}`;
    }
    return time;
  };

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
      
      // Clear the lastFetchKey so that future drill-downs work correctly
      console.log('[MainChart] Returning from bands view - clearing lastFetchKey');
      setLastFetchKey('');
      
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
    
    // Check if we need timeline data (all years) but currently have only single year data
    const needsTimelineData = state.chartType === 'timeline' && state.drillDownCountry && 
                              data?.dimension?.time?.category?.index && 
                              Object.keys(data.dimension.time.category.index).length <= 1;

    console.log('[MainChart] Fetch conditions check:', {
      needsBandsFetch,
      needsTimelineData,
      chartType: state.chartType,
      drillDownCountry: state.drillDownCountry,
      hasMultipleBands,
      currentTimeLabels: data?.dimension?.time?.category?.index ? Object.keys(data.dimension.time.category.index).length : 0,
      willFetch: (needsBandsFetch && state.drillDownCountry) || needsTimelineData
    });
    
    if ((needsBandsFetch && state.drillDownCountry) || needsTimelineData) {
      // Build params based on dataset/component flags to determine fetch key
      const isComponentDataset = state.dataset.endsWith('_c') || state.component;
      
      // Create a unique key for this fetch that includes the mode and relevant parameters
      let fetchKeyParams;
      if (!isComponentDataset) {
        // Non-component: includes product, unit, and taxes
        fetchKeyParams = [state.currency, state.product, state.unit, state.taxs, 'mode:tax'];
      } else {
        // Component: just mark as component mode - let the fetch service handle the nrg_prc details
        fetchKeyParams = [state.currency, 'mode:component'];
      }
      
      const timeParam = state.chartType === 'timeline' ? 'ALL_YEARS' : state.time;
      const fetchKey = `${state.dataset}-${state.drillDownCountry}-${timeParam}-${JSON.stringify(fetchKeyParams)}`;
      
      console.log('[MainChart] Drill-down fetch check:', {
        fetchKey,
        lastFetchKey,
        willFetch: lastFetchKey !== fetchKey,
        isComponentDataset,
        fetchKeyParams,
        chartType: state.chartType,
        timeParam
      });
      
      if (lastFetchKey === fetchKey) {
        // Already fetched this exact same data, skip
        console.log('[MainChart] Skipping fetch - already fetched this data');
        return;
      }
      
      // Store current data as original before fetching bands
      if (data && !hasMultipleBands) {
        setOriginalData(data);
      }
      
      // For component mode, determine the correct dataset to use
      let fetchDataset = state.dataset;
      if (isComponentDataset && !state.dataset.endsWith('_c')) {
        fetchDataset = `${state.dataset}_c`;
      }
      
      // Get configuration for the dataset we'll actually fetch from
      const dsConfig = getDatasetConfig(fetchDataset);
      console.log('[MainChart] Using dataset config for:', fetchDataset, dsConfig);
      
      // Fetch band data for the selected country
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
        // Component datasets: include all nrg_prc from the component dataset config
        console.log('[MainChart] Component mode - checking component dsConfig:', {
          componentDataset: fetchDataset,
          dsConfig: dsConfig,
          nrg_prc: dsConfig?.nrg_prc,
          hasNrgPrc: dsConfig?.nrg_prc && dsConfig.nrg_prc.length > 0
        });
        
        if (dsConfig?.nrg_prc && dsConfig.nrg_prc.length > 0) {
          extraParams.nrg_prc = dsConfig.nrg_prc;
          console.log('[MainChart] Added nrg_prc to extraParams:', dsConfig.nrg_prc);
        } else {
          console.warn('[MainChart] No nrg_prc found in component dsConfig, this should not happen');
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

      console.log('[MainChart] Fetching bands data with params:', {
        dataset: fetchDataset,
        country: state.drillDownCountry,
        time: state.time,
        extraParams: JSON.stringify(extraParams, null, 2),
        isComponentDataset,
        stateComponent: state.component,
        datasetEndsWithC: state.dataset.endsWith('_c')
      });

      // For component mode, use the _c version of the dataset if available
      if (isComponentDataset && !fetchDataset.endsWith('_c')) {
        console.log('[MainChart] Already using component dataset:', fetchDataset);
      }

      console.log('[MainChart] Fetching bands data with params:', {
        dataset: fetchDataset,
        country: state.drillDownCountry,
        time: state.chartType === 'timeline' ? 'ALL_YEARS' : state.time,
        chartType: state.chartType,
        extraParams: JSON.stringify(extraParams, null, 2),
        isComponentDataset,
        willFetchAllYears: state.chartType === 'timeline'
      });

      eurostatService
        .fetchCountryBands(
          fetchDataset,
          state.drillDownCountry!, // Non-null assertion since we already check above
          state.chartType === 'timeline' ? undefined : state.time, // Don't restrict time for timeline charts
          extraParams
        )
      .then(bandData => {
        console.log('[MainChart] Bands data received for dataset:', fetchDataset, bandData);
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
        if (state.chartType === 'table') {
          // For table view, create appropriate table based on previous chart type
          if (chartContainerRef.current) {
            chartContainerRef.current.innerHTML = '';
            let tableHtml = '';
            
            // Use the previous chart type to determine what table to show
            if (state.previousChartType === 'pie') {
              tableHtml = createPieChartTable(data, state.drillDownCountry, state.selectedBand, state.details, state.component, (key, defaultValue) => t(key, defaultValue || key));
            } else if (state.previousChartType === 'timeline') {
              tableHtml = createTimelineChartTable(data, state.drillDownCountry, state.selectedBand, state.details, state.component, (key, defaultValue) => t(key, defaultValue || key));
            } else {
              // Default to bands table for bar chart
              tableHtml = createBandsTable(data, state.drillDownCountry, state.details, state.component, (key, defaultValue) => t(key, defaultValue || key));
            }
            
            chartContainerRef.current.innerHTML = tableHtml;
          }
          return;
        } else if (state.chartType === 'pie') {
          // For pie chart, show only the selected band with component breakdown
          if (state.drillDownCountry) {
            transformedData = transformToBandsPieChart(data, state.drillDownCountry, state.selectedBand, state.details, state.component, (key, defaultValue) => t(key, defaultValue || key));
          }
        } else if (state.chartType === 'timeline') {
          // For timeline chart, use the same data as pie chart but transform it for timeline view
          if (state.drillDownCountry) {
            transformedData = transformToBandsTimeline(data, state.drillDownCountry, state.selectedBand, state.details, state.component, (key, defaultValue) => t(key, defaultValue || key));
          }
        } else {
          // Default bar chart for bands
          if (state.drillDownCountry) {
            transformedData = transformToCountryBands(data, state.drillDownCountry, state.details, state.component, (key, defaultValue) => t(key, defaultValue || key));
          }
        }
        
        // Only process chart configuration if we have transformed data
        if (!transformedData) {
          console.warn('[MainChart] No transformed data available for bands view');
          return;
        }
        
        // Create chart configuration based on chart type
        const { categories, series, isDetailed } = transformedData;
        const formattedTime = formatTimeForChart(state.time);
        
        if (state.chartType === 'pie') {
          console.log('[MainChart] Creating pie chart config with data:', {
            categories,
            series,
            selectedYear: formattedTime,
            seriesData: series[0]?.data
          });
          chartConfig = createPieChartConfig({
            categories,
            series: series as any, // Type assertion for pie chart data
            selectedYear: formattedTime,
            title: `${t ? t(`energy.bands.${state.selectedBand}`, state.selectedBand) : state.selectedBand} ${t ? t('chart.pieTitle', 'Components') : 'Components'} - ${t ? t(`countries.${state.drillDownCountry}`, state.drillDownCountry) : state.drillDownCountry} (${formattedTime})`,
            subtitle: t ? t('chart.pieSubtitle', 'Component breakdown') : 'Component breakdown',
            isDetailed: isDetailed || false,
            isComponent: state.component && isDetailed,
            decimals: state.decimals,
            t
          });
          console.log('[MainChart] Pie chart config created:', chartConfig);
        } else if (state.chartType === 'timeline') {
          console.log('[MainChart] Creating timeline chart config with data:', {
            categories,
            series,
            selectedYear: formattedTime,
            seriesCount: series.length,
            categoriesCount: categories.length,
            seriesData: series.map((s: any) => ({ name: s.name, dataLength: s.data?.length }))
          });
          chartConfig = createTimelineChartConfig({
            categories,
            series: series as any, // Type assertion for timeline chart data
            selectedYear: formattedTime,
            title: `${t ? t(`energy.bands.${state.selectedBand}`, state.selectedBand) : state.selectedBand} ${t ? t('chart.timelineTitle', 'Timeline') : 'Timeline'} - ${t ? t(`countries.${state.drillDownCountry}`, state.drillDownCountry) : state.drillDownCountry}${state.details ? ` (${t ? t('floatingMenu.details.detailed', 'Detailed') : 'Detailed'})` : ''}`,
            isDetailed: isDetailed || false,
            isComponent: state.component && isDetailed,
            decimals: state.decimals,
            t
          });
          console.log('[MainChart] Timeline chart config created:', chartConfig);
        } else {
          // Bar chart configuration
          chartConfig = createCountryComparisonConfig({
            categories,
            series: series as any, // Type assertion for bar chart data
            selectedYear: formattedTime,
            height: 600, // Increased height for band bar chart
            isDetailed: isDetailed || false,
            isComponent: state.component && isDetailed,
            order: state.order,
            percentage: false,
            countryCodes: [],
            decimals: state.decimals,
            t
          });
          
          // Add back button to the title
          if (chartConfig.data && chartConfig.data.title) {
            chartConfig.data.title.text = `${t ? t('chart.bandsTitle', 'Consumption Bands') : 'Consumption Bands'} - ${t ? t(`countries.${state.drillDownCountry}`, state.drillDownCountry) : state.drillDownCountry} (${formattedTime})`;
          }
        }
      } else {
        // Regular country comparison view
        // console.log('[MainChart] Selected countries from state.appliedGeos:', state.appliedGeos);
        
        // Handle table view for main chart
        if (state.chartType === 'table') {
          if (chartContainerRef.current) {
            chartContainerRef.current.innerHTML = '';
            const tableHtml = createCountryComparisonTable(
              data, 
              state.details, 
              state.hideAggregates, 
              state.component, 
              state.appliedGeos, 
              (key, defaultValue) => t(key, defaultValue || key)
            );
            chartContainerRef.current.innerHTML = tableHtml;
          }
          return;
        }
        
        transformedData = transformToCountryComparison(data, state.details, state.hideAggregates, state.component, undefined, state.appliedGeos);
        const { categories, series, countryCodes } = transformedData;
        const formattedTime = formatTimeForChart(state.time);

        // Create chart configuration using the external function
        chartConfig = createCountryComparisonConfig({
          categories,
          series: series as any, // Type assertion for country comparison data
          selectedYear: formattedTime,
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
      
      // Get the correct config properties based on chart type
      const chartOptions = (chartConfig as any).data?.plotOptions || (chartConfig as any).options?.plotOptions;
      const chartSeries = (chartConfig as any).data?.series || (chartConfig as any).options?.series;
      
      if (chartOptions) {
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
          
          const existingClickHandler = chartOptions.series?.point?.events?.click;
          
          if ((chartConfig as any).data) {
            (chartConfig as any).data.plotOptions.series = {
              ...(chartConfig as any).data.plotOptions.series,
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
          } else if ((chartConfig as any).options) {
            (chartConfig as any).options.plotOptions.series = {
              ...(chartConfig as any).options.plotOptions.series,
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
      }

      // Modify the series data to include country codes (only for regular country view)
      if (chartSeries && countryCodes.length > 0) {
        const modifiedSeries = chartSeries.map((series: any) => ({
          ...series,
          data: series.data.map((point: any, index: number) => ({
            ...point,
            countryCode: countryCodes[index] || null
          }))
        }));
        
        if ((chartConfig as any).data) {
          (chartConfig as any).data.series = modifiedSeries;
        } else if ((chartConfig as any).options) {
          (chartConfig as any).options.series = modifiedSeries;
        }
      }

      // Create the UEC script element with our data
      console.log('[MainChart] Creating script element for chart type:', state.chartType, {
        hasConfig: !!chartConfig,
        configKeys: chartConfig ? Object.keys(chartConfig) : null,
        chartData: (chartConfig as any)?.data,
        container: chartContainerRef.current
      });

      const scriptElement = document.createElement('script');
      scriptElement.type = 'application/json';
      scriptElement.textContent = JSON.stringify(chartConfig);

      // Add script to container
      chartContainerRef.current.appendChild(scriptElement);
      
      console.log('[MainChart] Script element added, container now has:', {
        childElementCount: chartContainerRef.current.childElementCount,
        innerHTML: chartContainerRef.current.innerHTML.substring(0, 100) + '...'
      });

      // Try to trigger UEC processing manually if available
      if (typeof (window as any).UEC !== 'undefined') {
        console.log('[MainChart] UEC found, attempting to process charts');
        try {
          (window as any).UEC.charts();
        } catch (error) {
          console.warn('[MainChart] Error calling UEC.charts():', error);
        }
      } else {
        console.warn('[MainChart] UEC not found on window object - chart may not render');
        
        // Check if ecl-eu.js is loaded
        const eclScripts = document.querySelectorAll('script[src*="ecl-eu"]');
        console.log('[MainChart] ECL scripts found:', eclScripts.length);
        
        // If no UEC, try to create a basic Highcharts chart as fallback
        if (typeof (window as any).Highcharts !== 'undefined') {
          console.log('[MainChart] Attempting Highcharts fallback');
          try {
            // Extract the chart data from the config structure
            const chartData = (chartConfig as any).data;
            console.log('[MainChart] Chart data for fallback:', chartData);
            (window as any).Highcharts.chart(chartContainerRef.current, chartData);
          } catch (error) {
            console.warn('[MainChart] Highcharts fallback failed:', error);
          }
        }
      }

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
  }, [data, state.details, state.order, state.percentage, state.hideAggregates, state.component, state.drillDownCountry, state.decimals, state.dataset, state.unit, state.currency, state.taxs, state.product, state.time, state.appliedGeos, state.chartType, state.selectedBand, i18n.language, t]);

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
