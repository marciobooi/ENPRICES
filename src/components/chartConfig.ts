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
    title = 'Energy Prices by Country',
    subtitle = `Electricity prices for household consumers - ${selectedYear}`,
    xAxisTitle = 'Countries',
    yAxisTitle = 'Price (EUR/kWh)',
    showLegend = false,
    colors = ['#003399'],
    isDetailed = false
  } = options;

  // Adjust configuration for detailed/stacked view
  const finalChartType = isDetailed ? 'column' : chartType;
  const finalShowLegend = isDetailed ? true : showLegend;
  const finalColors = isDetailed ? ['#FF6B6B', '#4ECDC4', '#45B7D1'] : colors;
  const finalTitle = isDetailed ? 'Energy Prices by Tax Component' : title;

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
          "text": xAxisTitle
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
          "text": yAxisTitle
        }
      },
      "title": {
        "text": finalTitle
      },
      "subtitle": {
        "text": subtitle
      },
      "plotOptions": {
        ...(isDetailed && { "column": { "stacking": "normal" } }),
     
      },
      "legend": {
        "enabled": finalShowLegend
      },
      "series": series
    }
  };
};




