/**
 * Chart export utilities
 * Provides functions to export charts using Highcharts API
 */

export interface ChartExportOptions {
  format: 'png' | 'jpeg' | 'pdf' | 'svg' | 'csv' | 'xls';
  filename?: string;
  width?: number;
  height?: number;
}

/**
 * Get the Highcharts instance from the chart container
 */
export const getChartInstance = (containerSelector: string = '.chart-container'): any => {
  try {
    const container = document.querySelector(containerSelector);
    if (!container) {
      console.warn('Chart container not found');
      return null;
    }

    // Webtools UEC creates Highcharts instances, try to find it
    const chartElement = container.querySelector('.highcharts-container');
    if (!chartElement) {
      console.warn('Highcharts container not found');
      return null;
    }

    // Access the Highcharts instance through the global Highcharts object
    if (typeof window !== 'undefined' && (window as any).Highcharts) {
      const charts = (window as any).Highcharts.charts;
      if (charts && charts.length > 0) {
        // Return the last chart (most recently created)
        return charts[charts.length - 1];
      }
    }

    return null;
  } catch (error) {
    console.error('Error getting chart instance:', error);
    return null;
  }
};

/**
 * Export chart in specified format
 */
export const exportChart = (options: ChartExportOptions): void => {
  const chart = getChartInstance();
  
  if (!chart) {
    console.error('No chart instance found for export');
    return;
  }

  const { format, filename, width, height } = options;
  const defaultFilename = filename || `energy-prices-chart-${new Date().toISOString().split('T')[0]}`;

  try {
    switch (format) {
      case 'png':
        chart.exportChart({
          type: 'image/png',
          filename: defaultFilename,
          width: width || 800,
          height: height || 600
        });
        break;
      
      case 'jpeg':
        chart.exportChart({
          type: 'image/jpeg',
          filename: defaultFilename,
          width: width || 800,
          height: height || 600
        });
        break;
      
      case 'pdf':
        chart.exportChart({
          type: 'application/pdf',
          filename: defaultFilename,
          width: width || 800,
          height: height || 600
        });
        break;
      
      case 'svg':
        chart.exportChart({
          type: 'image/svg+xml',
          filename: defaultFilename
        });
        break;
      
      case 'csv':
        if (chart.getCSV) {
          chart.getCSV();
        } else {
          console.warn('CSV export not available');
        }
        break;
      
      case 'xls':
        if (chart.getTable) {
          chart.getTable();
        } else {
          console.warn('Excel export not available');
        }
        break;
      
      default:
        console.error('Unsupported export format:', format);
    }
  } catch (error) {
    console.error('Error exporting chart:', error);
  }
};

/**
 * Check if chart export is available
 */
export const isChartExportAvailable = (): boolean => {
  return getChartInstance() !== null;
};

/**
 * Get available export formats
 */
export const getAvailableExportFormats = (): string[] => {
  const chart = getChartInstance();
  if (!chart) return [];
  
  const formats = ['png', 'jpeg', 'pdf', 'svg'];
  
  // Add data export formats if available
  if (chart.getCSV) formats.push('csv');
  if (chart.getTable) formats.push('xls');
  
  return formats;
};
