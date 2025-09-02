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
  isDetailed?: boolean;
  isComponent?: boolean;
  order?: 'proto' | 'alfa' | 'asc' | 'desc'; // Chart ordering
  percentage?: boolean; // Show as percentage
  countryCodes?: string[]; // Country codes for color mapping
  decimals?: number; // Number of decimal places for formatting
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
    yAxisTitle,
    showDataLabels = false,
    isDetailed = false,
    isComponent = false,
    order = 'proto',
    percentage = false,
    countryCodes = [],
    decimals = 2, // Default to 2 decimal places if not provided
    t
  } = options;

  // Use translations or fallback to defaults
  const finalTitle = title || (isComponent 
    ? `Electricity components for prices for household consumers - annual data (from 2007 onwards) (€/kWh) ${selectedYear}`
    : isDetailed 
    ? (t ? t('chart.detailedTitle') : 'Energy Prices by Tax Component')
    : (t ? t('chart.title') : 'Energy Prices by Country'));
  
  const finalSubtitle = subtitle || (isComponent
    ? `All bands: Consumption of kWh - ${selectedYear}`
    : (t 
      ? t('chart.subtitle') + (selectedYear ? ` - ${selectedYear}` : '')
      : `Electricity prices for household consumers${selectedYear ? ` - ${selectedYear}` : ''}`));
  
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

  const { categories: finalCategories, series: finalSeries, countryCodes: finalCountryCodes } = applyOrdering(categories, series, countryCodes, isDetailed || isComponent);

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
  const finalShowLegend = isDetailed;
  
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
          
          if (isComponent) {
            // For component view, the series.name is already translated in chartData.ts
            // No need to translate again, just use the series.name directly
            translatedName = series.name;
          } else {
            // For tax view, use tax translation keys
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
          
          // In non-detailed view, only keep the y value and color, remove any customTotal or other properties
          const yValue = (value !== null && typeof value === 'object' && value.y !== undefined) 
            ? value.y 
            : (value !== null && value !== undefined ? Number(value) : null);
          
          return {
            y: yValue,
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
        "style": {
          "fontFamily": "Arial, sans-serif"
        },
        ...((isDetailed) && { "plotOptions": { "column": { "stacking": "normal" } } })
      },
      "xAxis": {
        "categories": translatedCategories,
        "labels": {
          "rotation": -45,
          "style": {
            "fontSize": "14px"
          }
        }
      },
      "yAxis": {
        "title": {
          "text": finalYAxisTitle
        },
        "labels": {
          "format": percentage ? `{value:.0f}%` : `{value:.2f}`,
          "style": {
            "fontSize": "14px"
          }
        }
      },
      "title": {
        "text": finalTitle,
        "style": {
          "fontSize": "16px"
        }
      },
      "subtitle": {
        "text": finalSubtitle,
        "style": {
          "fontSize": "14px"
        }
      },
      "plotOptions": getPlotOptions(),
      "tooltip": {
        "headerFormat": `<span style="font-size:16px; font-weight: bold">{point.key}</span><br/>`,
        "pointFormat": percentage 
          ? `<span style="color:{series.color}">●</span> {series.name}: <b>{point.y:.${decimals}f}%</b><br/>`
          : `<span style="color:{series.color}">●</span> {series.name}: <b>{point.y:.${decimals}f}</b><br/>`,
        "footerFormat": (isDetailed && !percentage) 
          ? `<span style="font-weight: bold">Total: <b>{point.customTotal:.${decimals}f}</b></span>`
          : "",
        "shared": true,
        "useHTML": true,
        "style": {
          "zIndex": 9999
        }
        
      },
      "legend": {
        "enabled": finalShowLegend,
        "floating": false,
        "align": "center",
        "verticalAlign": "bottom",
        "layout": "horizontal",
        "itemStyle": {
          "fontSize": "14px"
        }
      },
      "credits": {
        "enabled": true,
        "text": "Source: Eurostat",
        "href": "https://ec.europa.eu/eurostat",
        "style": {
          "color": "#004494",
          "fontSize": "14px",
          "fontWeight": "normal",
          "textDecoration": "underline",
          "cursor": "pointer"
        },
        "itemStyle": {
          "color": "#004494",
          "fontSize": "14px",
          "fontWeight": "normal",
          "textDecoration": "underline"
        },
        "itemHoverStyle": {
          "color": "#ffd617",
          "textDecoration": "underline"
        }
      },
      "series": finalSeriesWithColors
    }
  };
};

/**
 * Generate Webtools UEC configuration for pie chart
 */
export const createPieChartConfig = (options: ChartConfigOptions) => {
  const { 
    categories,
    series,
    selectedYear = '',
    title,
    subtitle,
    decimals = 2,
    t
  } = options;  // Use translations or fallback to defaults
  const finalTitle = title || (t ? t('chart.pieTitle') : 'Price Components');
  const finalSubtitle = subtitle || (t ? t('chart.pieSubtitle') : `Component breakdown${selectedYear ? ` - ${selectedYear}` : ''}`);

  // Convert series data to pie chart format
  const pieData = series[0]?.data.map((point: any, index: number) => {
    const value = typeof point === 'object' ? point.y : point;
    return {
      name: categories[index] || `Category ${index + 1}`,
      y: value || 0
    };
  }) || [];

  return {
    "data": {
      "chart": {
        "type": "pie",
        "height": 500,
        "backgroundColor": "transparent"
      },
      "title": {
        "text": finalTitle,
        "style": {
          "fontSize": "18px",
          "fontWeight": "bold",
          "color": "#004494"
        }
      },
      "subtitle": {
        "text": finalSubtitle,
        "style": {
          "fontSize": "14px",
          "color": "#666666"
        }
      },
      "tooltip": {
        "pointFormat": `{series.name}: <b>{point.percentage:.${decimals}f}%</b><br/>Value: <b>{point.y:.${decimals}f}</b>`
      },
      "plotOptions": {
        "pie": {
          "allowPointSelect": true,
          "cursor": "pointer",
          "dataLabels": {
            "enabled": true,
            "format": "<b>{point.name}</b>: {point.percentage:.1f} %"
          },
          "showInLegend": true
        }
      },
      "credits": {
        "text": "Source: Eurostat",
        "href": "https://ec.europa.eu/eurostat",
        "style": {
          "color": "#004494",
          "fontSize": "14px",
          "fontWeight": "normal",
          "textDecoration": "underline",
          "cursor": "pointer"
        }
      },
      "series": [{
        "name": "Share",
        "colorByPoint": true,
        "data": pieData
      }]
    }
  };
};

/**
 * Create timeline chart configuration for bands over time
 */
export const createTimelineChartConfig = (options: ChartConfigOptions) => {
  const { categories, series, title, decimals = 4, t } = options;

  return {
    "selector": `[data-uec-chart-id]`,
    "options": {
      "chart": {
        "type": "line",
        "animation": {
          "duration": 800,
          "easing": "easeOutQuart"
        }
      },
      "title": {
        "text": title || (t ? t('chart.timeline.title', 'Timeline Chart') : 'Timeline Chart'),
        "style": {
          "fontSize": "16px",
          "fontWeight": "600"
        }
      },
      "xAxis": {
        "categories": categories,
        "title": {
          "text": t ? t('chart.timeline.xAxis', 'Time Period') : 'Time Period'
        }
      },
      "yAxis": {
        "title": {
          "text": t ? t('chart.timeline.yAxis', 'Price (EUR)') : 'Price (EUR)'
        },
        "labels": {
          "formatter": `function() { return this.value.toFixed(${decimals}); }`
        }
      },
      "tooltip": {
        "formatter": `function() { 
          return '<b>' + this.series.name + '</b><br/>' + 
                 this.x + ': ' + this.y.toFixed(${decimals}) + ' EUR'; 
        }`
      },
      "legend": {
        "enabled": true,
        "align": "center",
        "verticalAlign": "bottom"
      },
      "plotOptions": {
        "line": {
          "marker": {
            "enabled": true,
            "radius": 4
          },
          "lineWidth": 2
        }
      },
      "series": series.map(s => ({
        ...s,
        "type": "line"
      }))
    }
  };
};




