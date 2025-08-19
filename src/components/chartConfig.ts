/**
 * Chart configuration utilities
 * Handles Webtools UEC configuration for different chart types
 */

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
  colors?: string[];
  isDetailed?: boolean;
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
    colors = ['#003399'],
    isDetailed = false,
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
  const finalYAxisTitle = yAxisTitle || (t ? t('chart.yAxis.title') : 'Price (EUR/kWh)');

  // Adjust configuration for detailed/stacked view
  const finalChartType = isDetailed ? 'column' : chartType;
  const finalShowLegend = isDetailed ? true : showLegend;
  const finalColors = isDetailed ? ['#FF6B6B', '#4ECDC4', '#45B7D1'] : colors;

  return {
    "service": "chart",
    "version": "2.0",
    "data": {
      "chart": {
        "type": finalChartType,
        "height": height,
        ...(isDetailed && { "plotOptions": { "column": { "stacking": "normal" } } })
      },
      "colors": finalColors,
      "xAxis": {
        "categories": categories,
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
        }
      },
      "title": {
        "text": finalTitle
      },
      "subtitle": {
        "text": finalSubtitle
      },
      "plotOptions": {
        ...(isDetailed && { "column": { "stacking": "normal" } }),
        "series": {
          "dataLabels": {
            "enabled": showDataLabels,
            "format": "{y:.3f}"
          }
        }
      },
      "legend": {
        "enabled": finalShowLegend
      },
      "exporting": {
        "enabled": true,
        "buttons": {
          "contextButton": {
            "menuItems": [
              "viewFullscreen",
              "separator",
              "downloadPNG",
              "downloadJPEG",
              "downloadPDF",
              "downloadSVG",
              "separator",
              "downloadCSV",
              "downloadXLS"
            ]
          }
        },
        "filename": `energy-prices-${selectedYear || 'data'}`,
        "chartOptions": {
          "title": {
            "style": {
              "fontSize": "16px"
            }
          }
        }
      },
      "credits": {
        "enabled": true,
        "text": "Source: Eurostat",
        "href": "https://ec.europa.eu/eurostat"
      },
      "series": series
    }
  };
};




