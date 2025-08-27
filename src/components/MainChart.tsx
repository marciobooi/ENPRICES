import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { subscribeToDataUpdates, getCurrentData } from '../services/handleData';
import { transformToCountryComparison } from './chartData';
import { createCountryComparisonConfig } from './chartConfig';
import { useQuery } from '../context/QueryContext';

interface MainChartProps {
  className?: string;
}

const MainChart: React.FC<MainChartProps> = ({ className = '' }) => {
  const { t, i18n } = useTranslation();
  const { state } = useQuery();
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

  useEffect(() => {
    if (!chartContainerRef.current || !data) return;

    // Clear container
    chartContainerRef.current.innerHTML = '';

    // Transform data using the external function
    const transformedData = transformToCountryComparison(data, state.details, state.hideAggregates, state.component);
    const { categories, series, selectedYear, countryCodes } = transformedData;

    // Debug: Log the transformed data
    // console.log('Chart data:', { categories, series, selectedYear, countryCodes });
    // console.log('Country codes for colors:', countryCodes);

    // Create chart configuration using the external function
    const chartConfig = createCountryComparisonConfig({
      categories,
      series,
      selectedYear,
      isDetailed: state.details, // Use state.details to control detailed view
      isComponent: state.component, // Use state.component to control component vs tax breakdown
      decimals: state.decimals,
      order: state.order,
      percentage: state.percentage,
      countryCodes: countryCodes || [],
      t
    });

    // Debug: Log the chart config
    // console.log('Chart config:', chartConfig);

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

  }, [data, state.details, state.decimals, state.order, state.percentage, state.hideAggregates, state.component, i18n.language, t]);

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
