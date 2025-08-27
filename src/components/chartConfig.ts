/**
 * Chart configuration utilities
 * Handles Webtools UEC configuration for different chart types
 */

import { barChartColors, detailsBarChartColors } from '../data/energyData';

export interface ChartConfigOptions {
  categories: string[];
  series: Array<{
    name: string;
    data: (number | null | { y: number; customTotal: number })[];
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
  decimals?: number; // Number of decimal places (1-4)
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
    decimals = 4,
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
  const applyOrdering = (cats: string[], ser: Array<{name: string; data: (number | null | { y: number; customTotal: number })[]}>, codes: string[] = [], isDetailedFlag: boolean = false) => {
    if (order === 'proto') return { categories: cats, series: ser, countryCodes: codes }; // Original order
    
    // Create indices for sorting
    const indices = cats.map((_, i) => i);
    
    if (order === 'alfa') {
      // Alphabetical order by category name
      indices.sort((a, b) => cats[a].localeCompare(cats[b]));
    } else if (order === 'asc' || order === 'desc') {
      // Sort by first series values (or customTotal for detailed view)
      const firstSeries = ser[0]?.data || [];
      indices.sort((a, b) => {
        const rawA = firstSeries[a] || 0;
        const rawB = firstSeries[b] || 0;
        
        let valA: number, valB: number;
        if (isDetailedFlag && rawA !== null && typeof rawA === 'object' && (rawA as any).customTotal !== undefined) {
          valA = (rawA as any).customTotal;
          valB = (rawB !== null && typeof rawB === 'object') ? (rawB as any).customTotal : 0;
        } else {
          valA = (rawA !== null && typeof rawA === 'object') ? (rawA as any).y : (rawA as number);
          valB = (rawB !== null && typeof rawB === 'object') ? (rawB as any).y : (rawB as number);
        }
        
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

  const { categories: finalCategories, series: finalSeries, countryCodes: finalCountryCodes } = applyOrdering(categories, series, countryCodes, isDetailed);

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
      // For detailed view, use the original series but with detailsBarChartColors and translated names
      // Also compute per-category totals and attach them to each data point so footerFormat {point.total} works
      const detailColors = Object.values(detailsBarChartColors);

      // Compute totals per category (index) across all series.
      // Support both numeric arrays and arrays of point objects ({ y, ... }).
      const totals: number[] = [];
      if (finalSeries.length > 0) {
        const len = finalSeries[0].data.length;
        for (let i = 0; i < len; i++) {
          let sum = 0;
          for (const s of finalSeries) {
            const raw = s.data[i];
            const val = (raw !== null && raw !== undefined)
              ? (typeof raw === 'object' ? Number((raw as any).y) : Number(raw))
              : 0;
            sum += isFinite(val) ? val : 0;
          }
          totals.push(sum);
        }
      }

      return finalSeries.map((series, index) => {
        // Translate series name if it's a tax breakdown key and translation function is available
        let translatedName = series.name;
        if (t) {
          // Map API series names to translation keys
          let translationKey = null;
          
          // Check if it's a direct tax code
          if (['X_TAX', 'X_VAT', 'I_TAX'].includes(series.name)) {
            translationKey = `chart.series.taxBreakdown.${series.name}`;
          } else {
            // Map common API descriptions to our translation keys
            const seriesNameLower = series.name.toLowerCase();
            if (seriesNameLower.includes('excluding taxes') || seriesNameLower.includes('ohne steuern') || seriesNameLower.includes('hors taxes')) {
              translationKey = 'chart.series.taxBreakdown.X_TAX';
            } else if (seriesNameLower.includes('vat') || seriesNameLower.includes('mehrwertsteuer') || seriesNameLower.includes('tva')) {
              translationKey = 'chart.series.taxBreakdown.X_VAT';
            } else if (seriesNameLower.includes('all taxes') || seriesNameLower.includes('alle steuern') || seriesNameLower.includes('toutes taxes') || 
                      seriesNameLower.includes('rest of taxes') || seriesNameLower.includes('taxes and levies included')) {
              translationKey = 'chart.series.taxBreakdown.I_TAX';
            }
          }
          
          if (translationKey) {
            const translation = t(translationKey, null);
            if (translation !== null) {
              translatedName = translation;
            }
          }
        }
        
        // Map data to point objects that include y and total.
        // Preserve existing point properties when present.
        const dataWithTotals = series.data.map((rawPoint: any, idx: number) => {
          if (rawPoint !== null && typeof rawPoint === 'object') {
            // Preserve existing object (may already include y or color)
            const rp = rawPoint as any;
            return {
              ...(rp as any),
              y: rp.y !== undefined ? rp.y : (rp.value !== undefined ? rp.value : 0),
              customTotal: totals[idx] || 0
            };
          }

          // Numeric value
          return {
            y: rawPoint,
            customTotal: totals[idx] || 0
          };
        });

        return {
          ...series,
          name: translatedName,
          color: detailColors[index] || detailColors[0],
          data: dataWithTotals
        };
      });
    } else {
      // For country comparison, create series with individual data point colors
      return finalSeries.map(series => ({
        ...series,
        data: series.data.map((value: any, index: number) => {
          const countryCode = finalCountryCodes[index];
          let color = barChartColors.default;
          
          if (countryCode === 'EU27_2020') {
            color = barChartColors.EU27_2020;
          } else if (countryCode === 'EA') {
            color = barChartColors.EA;
          }
          
          if (value !== null && typeof value === 'object') {
            return {
              ...value,
              color: color
            };
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
  // console.log('Color generation debug:', {
  //   isDetailed,
  //   countryCodes: finalCountryCodes,
  //   finalSeriesWithColors,
  //   categories: finalCategories
  // });

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
        "headerFormat": `<span style="font-size:12px; font-weight: bold">{point.key}</span><br/>`,
        "pointFormat": percentage 
          ? `<span style="color:{series.color}">●</span> {series.name}: <b>{point.y:.${decimals}f}%</b><br/>`
          : `<span style="color:{series.color}">●</span> {series.name}: <b>{point.y:.${decimals}f}</b><br/>`,
        "footerFormat": isDetailed && !percentage 
          ? `<span style="font-weight: bold">Total: <b>{point.customTotal:.${decimals}f}</b></span>`
          : "",
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




