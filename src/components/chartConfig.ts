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
    showDataLabels = true,
    showLegend = false,
    colors = ['#003399']
  } = options;

  return {
    "service": "charts",
    "version": "2.0",
    "data": {
      "chart": {
        "type": chartType,
        "height": height
      },
      "colors": colors,
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
        "text": title
      },
      "subtitle": {
        "text": subtitle
      },
      "plotOptions": {
        "series": {
          "dataLabels": {
            "enabled": showDataLabels,
            "format": "{y:.3f}"
          }
        }
      },
      "legend": {
        "enabled": showLegend
      },
      "series": series
    }
  };
};

/**
 * Generate Webtools UEC configuration for time series chart
 */
export const createTimeSeriesConfig = (options: ChartConfigOptions) => {
  const {
    categories,
    series,
    chartType = 'line',
    height = 500,
    title = 'Energy Prices Over Time',
    subtitle = 'Electricity prices for household consumers',
    xAxisTitle = 'Time Period',
    yAxisTitle = 'Price (EUR/kWh)',
    showDataLabels = false,
    showLegend = true,
    colors = ['#003399', '#0066cc', '#3399ff', '#66b3ff', '#99ccff']
  } = options;

  return {
    "service": "charts",
    "version": "2.0",
    "data": {
      "chart": {
        "type": chartType,
        "height": height
      },
      "colors": colors,
      "xAxis": {
        "categories": categories,
        "title": {
          "text": xAxisTitle
        }
      },
      "yAxis": {
        "title": {
          "text": yAxisTitle
        }
      },
      "title": {
        "text": title
      },
      "subtitle": {
        "text": subtitle
      },
      "plotOptions": {
        "series": {
          "dataLabels": {
            "enabled": showDataLabels
          }
        }
      },
      "legend": {
        "enabled": showLegend
      },
      "series": series
    }
  };
};

/**
 * Generate generic Webtools UEC configuration
 */
export const createGenericConfig = (options: ChartConfigOptions) => {
  const {
    categories,
    series,
    chartType = 'column',
    height = 500,
    title = 'Chart Title',
    subtitle = 'Chart Subtitle',
    xAxisTitle = 'X Axis',
    yAxisTitle = 'Y Axis',
    showDataLabels = false,
    showLegend = true,
    colors = ['#003399', '#0066cc', '#3399ff', '#66b3ff', '#99ccff']
  } = options;

  return {
    "service": "charts",
    "version": "2.0",
    "data": {
      "chart": {
        "type": chartType,
        "height": height
      },
      "colors": colors,
      "xAxis": {
        "categories": categories,
        "title": {
          "text": xAxisTitle
        }
      },
      "yAxis": {
        "title": {
          "text": yAxisTitle
        }
      },
      "title": {
        "text": title
      },
      "subtitle": {
        "text": subtitle
      },
      "plotOptions": {
        "series": {
          "dataLabels": {
            "enabled": showDataLabels
          }
        }
      },
      "legend": {
        "enabled": showLegend
      },
      "series": series
    }
  };
};
