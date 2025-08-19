/**
 * Chart configuration utilities
 * Handles Webtools UEC configuration for different chart types
 */

import { barChartColors, detailsBarChartColors } from '../data/energyData';

export interface ChartConfigOptions {
  categories: string[];
  series: Array<{
    name: string;
    data: (number | null)[];
  }>;
  selectedYear?: string;
  chartType?: 'column' | 'line' | 'area' | 'bar';
  height?: number;
  title?: string;
  subtitle?: string;
  xAxisTitle?: string;
  yAxisTitle?: string;
  showDataLabels?: boolean;
  showLegend?: boolean;
  isDetailed?: boolean;
  decimals?: number; // Number of decimal places (0-3)
  order?: 'proto' | 'alfa' | 'asc' | 'desc'; // Chart ordering
  percentage?: boolean; // Show as percentage
  countryCodes?: string[]; // Country codes for color mapping
  t?: any; // i18next translation function
}

/**
 * Generate Webtools UEC configuration for country comparison chart
 */
export const createCountryComparisonConfig = (options: ChartConfigOptions) => {
  const {
    categories,
    series,
    selectedYear = '',
    chartType = 'column',
    height = 500,
    title,
    subtitle,
    xAxisTitle,
    yAxisTitle,
    showDataLabels = false,
    showLegend = false,
    isDetailed = false,
    decimals = 2,
    order = 'proto',
    percentage = false,
    countryCodes = [],
    t
  } = options;

  // Use translations or fallback to defaults
  const finalTitle = title || (isDetailed 
    ? (t ? t('chart.detailedTitle') : 'Energy Prices by Tax Component')
    : (t ? t('chart.title') : 'Energy Prices by Country'));
  
  const finalSubtitle = subtitle || (t 
    ? t('chart.subtitle') + (selectedYear ? ` - ${selectedYear}` : '')
    : `Electricity prices for household consumers${selectedYear ? ` - ${selectedYear}` : ''}`);
  
  const finalXAxisTitle = xAxisTitle || (t ? t('chart.xAxis.title') : 'Countries');
  const finalYAxisTitle = yAxisTitle || (t ? t('chart.yAxis.title') : percentage ? 'Percentage (%)' : 'Price (EUR/kWh)');

  // Apply ordering to categories and data
  const applyOrdering = (cats: string[], ser: Array<{name: string; data: (number | null)[]}>, codes: string[] = []) => {
    if (order === 'proto') return { categories: cats, series: ser, countryCodes: codes }; // Original order
    
    // Create indices for sorting
    const indices = cats.map((_, i) => i);
    
    if (order === 'alfa') {
      // Alphabetical order by category name
      indices.sort((a, b) => cats[a].localeCompare(cats[b]));
    } else if (order === 'asc' || order === 'desc') {
      // Sort by first series values
      const firstSeries = ser[0]?.data || [];
      indices.sort((a, b) => {
        const valA = firstSeries[a] || 0;
        const valB = firstSeries[b] || 0;
        return order === 'asc' ? valA - valB : valB - valA;
      });
    }
    
    // Apply sorting to categories, series data, and country codes
    const sortedCategories = indices.map(i => cats[i]);
    const sortedSeries = ser.map(s => ({
      ...s,
      data: indices.map(i => s.data[i])
    }));
    const sortedCountryCodes = indices.map(i => codes[i] || '');
    
    return { categories: sortedCategories, series: sortedSeries, countryCodes: sortedCountryCodes };
  };

  const { categories: finalCategories, series: finalSeries, countryCodes: finalCountryCodes } = applyOrdering(categories, series, countryCodes);

  // Translate categories (country names) if translation function is available
  const translatedCategories = finalCategories.map((category, index) => {
    const countryCode = finalCountryCodes[index];
    if (t && countryCode) {
      return t(`countries.${countryCode}`, category);
    }
    return category;
  });

  // Format data labels based on decimals and percentage
  const formatDataLabels = percentage 
    ? `{y:.${decimals}f}%`
    : `{y:.${decimals}f}`;

  // Adjust configuration for detailed/stacked view
  const finalChartType = isDetailed ? 'column' : chartType;
  const finalShowLegend = isDetailed ? true : showLegend;
  
  // Generate series with individual colors
  const generateSeriesWithColors = () => {
    if (isDetailed) {
      // For detailed view, use the original series but with detailsBarChartColors
      const detailColors = Object.values(detailsBarChartColors);
      return finalSeries.map((series, index) => ({
        ...series,
        color: detailColors[index] || detailColors[0]
      }));
    } else {
      // For country comparison, create series with individual data point colors
      return finalSeries.map(series => ({
        ...series,
        data: series.data.map((value, index) => {
          const countryCode = finalCountryCodes[index];
          let color = barChartColors.default;
          
          if (countryCode === 'EU27_2020') {
            color = barChartColors.EU27_2020;
          } else if (countryCode === 'EA') {
            color = barChartColors.EA;
          }
          
          return {
            y: value,
            color: color
          };
        })
      }));
    }
  };
  
  const finalSeriesWithColors = generateSeriesWithColors();
  
  // Debug: Log color generation
  console.log('Color generation debug:', {
    isDetailed,
    countryCodes: finalCountryCodes,
    finalSeriesWithColors,
    categories: finalCategories
  });

  // Configure plot options based on percentage and detailed view
  const getPlotOptions = () => {
    const baseOptions: any = {};
    
    if (isDetailed) {
      baseOptions.column = {
        stacking: percentage ? 'percent' : 'normal'
      };
    }
    
    baseOptions.series = {
      dataLabels: {
        enabled: showDataLabels,
        format: formatDataLabels
      }
    };
    
    return baseOptions;
  };

  return {
    "service": "chart",
    "version": "2.0",
    "menu": false,
    "data": {
      "chart": {
        "type": finalChartType,
        "height": height,
        ...(isDetailed && { "plotOptions": { "column": { "stacking": "normal" } } })
      },
      "xAxis": {
        "categories": translatedCategories,
        "title": {
          "text": finalXAxisTitle
        },
        "labels": {
          "rotation": -45,
          "style": {
            "fontSize": "11px"
          }
        }
      },
      "yAxis": {
        "title": {
          "text": finalYAxisTitle
        },
        "labels": {
          "format": percentage ? `{value:.${decimals}f}%` : `{value:.${decimals}f}`
        }
      },
      "title": {
        "text": finalTitle
      },
      "subtitle": {
        "text": finalSubtitle
      },
      "plotOptions": getPlotOptions(),
      "tooltip": {
        "pointFormat": percentage 
          ? `<span style="color:{series.color}">{series.name}</span>: <b>{point.y:.${decimals}f}%</b><br/>`
          : `<span style="color:{series.color}">{series.name}</span>: <b>{point.y:.${decimals}f}</b><br/>`,
        "headerFormat": `<span style="font-size:10px">{point.key}</span><table>`,
        "footerFormat": "</table>",
        "shared": true,
        "useHTML": true
      },
      "legend": {
        "enabled": finalShowLegend
      },
      "credits": {
        "enabled": true,
        "text": "Source: Eurostat",
        "href": "https://ec.europa.eu/eurostat"
      },
      "series": finalSeriesWithColors
    }
  };
};




