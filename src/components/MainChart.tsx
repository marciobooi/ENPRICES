import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { subscribeToDataUpdates, getCurrentData } from '../services/handleData';
import { transformToCountryComparison, transformToCountryBands } from './chartData';
import { createCountryComparisonConfig } from './chartConfig';
import { useQuery } from '../context/QueryContext';
import { eurostatService } from '../services/eurostat';

interface MainChartProps {
  className?: string;
}

const MainChart: React.FC<MainChartProps> = ({ className = '' }) => {
  const { t, i18n } = useTranslation();
  const { state, dispatch } = useQuery();
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const [data, setData] = useState<any>(null);

  // Subscribe to data updates from handleData
  useEffect(() => {
    const currentData = getCurrentData();
    if (currentData.data && currentData.data.value) {
      setData(currentData.data);
    }

    const unsubscribe = subscribeToDataUpdates((newData) => {
      if (newData && newData.value) {
        setData(newData);
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

    // Check if we have a drill-down country selected
    if (state.drillDownCountry) {
      // Fetch band data for the selected country
      eurostatService.fetchCountryBands(
        state.dataset,
        state.drillDownCountry,
        state.time,
        {
          unit: state.unit,
          currency: state.currency,
          nrg_cons: state.consumer,
          product: state.product
        }
      ).then(bandData => {
        // Transform band data for display
        transformedData = transformToCountryBands(bandData, state.drillDownCountry!, undefined);
        const { categories, series, selectedYear } = transformedData;

        // Create chart configuration for bands view
        chartConfig = createCountryComparisonConfig({
          categories,
          series,
          selectedYear,
          isDetailed: false,
          isComponent: false,
          order: state.order,
          percentage: false,
          countryCodes: [],
          t
        });

        // Add back button to the title
        if (chartConfig.data && chartConfig.data.title) {
          chartConfig.data.title.text = `← Back to Countries | Consumption Bands - ${state.drillDownCountry} (${selectedYear})`;
        }

        // Create the UEC script element with our data
        const scriptElement = document.createElement('script');
        scriptElement.type = 'application/json';
        scriptElement.textContent = JSON.stringify(chartConfig);

        // Add script to container
        chartContainerRef.current!.appendChild(scriptElement);

        // Force immediate rescan with layout recalculation
        setTimeout(() => {
          if ((window as any).$wt && typeof (window as any).$wt === 'function') {
            (window as any).$wt();
            
            // Force layout recalculation to ensure proper rendering
            requestAnimationFrame(() => {
              // Trigger resize event to force chart libraries to recalculate dimensions
              window.dispatchEvent(new Event('resize'));
              
              // Also force a scroll event (since that's what makes it work)
              window.dispatchEvent(new Event('scroll'));
            });
          }
        }, 50);
      }).catch(error => {
        console.error('Error fetching band data:', error);
        // Fallback to regular view if band data fetch fails
        dispatch({ type: 'SET_DRILL_DOWN_COUNTRY', payload: null });
      });
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
        t
      });

      // Add click handler for drill-down functionality
      if (chartConfig.data && chartConfig.data.plotOptions) {
        chartConfig.data.plotOptions.series = {
          ...chartConfig.data.plotOptions.series,
          point: {
            events: {
              click: function() {
                // Access the country code from the point's custom property
                const countryCode = (this as any).countryCode;
                if (countryCode) {
                  dispatch({ type: 'SET_DRILL_DOWN_COUNTRY', payload: countryCode });
                }
              }
            }
          }
        };
      }

      // Modify the series data to include country codes
      if (chartConfig.data && chartConfig.data.series && countryCodes) {
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

      // Force immediate rescan with layout recalculation
      setTimeout(() => {
        if ((window as any).$wt && typeof (window as any).$wt === 'function') {
          (window as any).$wt();
          
          // Force layout recalculation to ensure proper rendering
          requestAnimationFrame(() => {
            // Trigger resize event to force chart libraries to recalculate dimensions
            window.dispatchEvent(new Event('resize'));
            
            // Also force a scroll event (since that's what makes it work)
            window.dispatchEvent(new Event('scroll'));
          });
        }
      }, 50);
    }
  }, [data, state.details, state.order, state.percentage, state.hideAggregates, state.component, state.drillDownCountry, i18n.language, t]);

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
