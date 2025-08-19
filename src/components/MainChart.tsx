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
  const { t } = useTranslation();
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
    const { categories, series, selectedYear, isDetailed } = transformToCountryComparison(data, state.details);

    // Create chart configuration using the external function
    const chartConfig = createCountryComparisonConfig({
      categories,
      series,
      selectedYear,
      isDetailed
    });

    // Create the UEC script element with our data
    const scriptElement = document.createElement('script');
    scriptElement.type = 'application/json';
    scriptElement.textContent = JSON.stringify(chartConfig);

    // Add script to container
    chartContainerRef.current.appendChild(scriptElement);

    // Improved Webtools processing with retry logic using the utility function


  }, [data, state.details]);

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
