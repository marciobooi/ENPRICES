import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { subscribeToDataUpdates, getCurrentData } from '../services/handleData';

interface MainChartProps {
  className?: string;
}

const MainChart: React.FC<MainChartProps> = ({ className = '' }) => {
  const { t } = useTranslation();
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

  // Transform Eurostat data to Highcharts series format
  const transformToSeries = (eurostatData: any) => {
    if (!eurostatData?.dimension?.time?.category?.index || !eurostatData?.dimension?.geo?.category?.index) {
      return { categories: [], series: [] };
    }

    const timeCategories = eurostatData.dimension.time.category.index;
    const timeLabels = Object.keys(timeCategories).sort((a, b) => timeCategories[a] - timeCategories[b]);
    
    const geoCategories = eurostatData.dimension.geo.category.index;
    const geoLabels = Object.keys(geoCategories);
    
    const series = geoLabels.slice(0, 5).map(geoCode => {
      const seriesData = timeLabels.map(timeLabel => {
        const timeIndex = timeCategories[timeLabel];
        const geoIndex = geoCategories[geoCode];
        const valueIndex = geoIndex * timeLabels.length + timeIndex;
        const value = eurostatData.value[valueIndex];
        return (value !== undefined && value !== null) ? parseFloat(value) : null;
      });

      return {
        name: eurostatData.dimension.geo.category.label[geoCode] || geoCode,
        data: seriesData
      };
    });

    return { categories: timeLabels, series };
  };

  useEffect(() => {
    if (!chartContainerRef.current || !data) return;

    // Clear container
    chartContainerRef.current.innerHTML = '';

    // Transform data
    const { categories, series } = transformToSeries(data);

    // Create the UEC script element with our data
    const scriptElement = document.createElement('script');
    scriptElement.type = 'application/json';
    scriptElement.textContent = JSON.stringify({
      "service": "charts",
      "version": "2.0",
      "data": {
        "chart": {
          "type": "column",
          "height": 500
        },
        "colors": [
          "#003399", "#0066cc", "#3399ff", "#66b3ff", "#99ccff"
        ],
        "xAxis": {
          "categories": categories,
          "title": {
            "text": "Time Period"
          }
        },
        "yAxis": {
          "title": {
            "text": "Price (EUR/kWh)"
          }
        },
        "title": {
          "text": "Energy Prices Over Time"
        },
        "subtitle": {
          "text": "Electricity prices for household consumers"
        },
        "plotOptions": {
          "series": {
            "dataLabels": {
              "enabled": false
            }
          }
        },
        "legend": {
          "enabled": true
        },
        "series": series
      }
    });

    // Add script to container
    chartContainerRef.current.appendChild(scriptElement);

    // Trigger Webtools processing
    setTimeout(() => {
      if ((window as any).$wt && typeof (window as any).$wt === 'function') {
        console.log('Triggering Webtools scan with real data');
        (window as any).$wt();
      }
    }, 500);

  }, [data]);

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
