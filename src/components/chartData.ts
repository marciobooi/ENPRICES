/**
 * Chart data transformation utilities
 * Handles conversion from Eurostat JSON-stat format to chart-ready data
 */

export interface CountryData {
  name: string;
  value: number | null;
  geoIndex?: number; // Original API index for protocol ordering
  geoCode?: string; // Country code for color mapping
}

export interface ChartDataResult {
  categories: string[];
  series: Array<{
    name: string;
    data: (number | null)[];
  }>;
  selectedYear: string;
  isDetailed?: boolean;
  countryCodes?: string[]; // Add country codes for color mapping
}

/**
 * Transform Eurostat data to show tax breakdown
 */
const transformToTaxBreakdown = (eurostatData: any): ChartDataResult => {
  if (!eurostatData?.dimension?.tax?.category?.index) {
    // Fallback to regular display if no tax dimension
    return transformToCountryComparison(eurostatData, false);
  }

  const timeCategories = eurostatData.dimension.time.category.index;
  const timeLabels = Object.keys(timeCategories).sort((a, b) => timeCategories[a] - timeCategories[b]);
  const selectedYear = timeLabels[timeLabels.length - 1];
  const selectedTimeIndex = timeCategories[selectedYear];
  
  const geoCategories = eurostatData.dimension.geo.category.index;
  const geoLabels = Object.keys(geoCategories);
  
  const taxCategories = eurostatData.dimension.tax.category.index;
  const taxLabels = Object.keys(taxCategories);
  
  // Create countries data
  const countriesData = geoLabels.map(geoCode => {
    const geoIndex = geoCategories[geoCode];
    return {
      name: eurostatData.dimension.geo.category.label[geoCode] || geoCode,
      geoIndex: geoIndex
    };
  });
  
  // Use actual tax breakdown values from the API
  const series = taxLabels.map((taxCode, taxIdx) => {
    const data = countriesData.map(country => {
      // Calculate the correct index for this specific country, tax, and time combination
      const valueIndex = country.geoIndex * timeLabels.length * taxLabels.length + 
                        taxIdx * timeLabels.length + 
                        selectedTimeIndex;
      const value = eurostatData.value[valueIndex];
      
      if (value === undefined || value === null) return null;
      return parseFloat(value);
    });
    
    return {
      name: eurostatData.dimension.tax.category.label[taxCode] || taxCode,
      data: data
    };
  });
  
  return {
    categories: countriesData.map(c => c.name),
    series: series,
    selectedYear: selectedYear,
    isDetailed: true
  };
};

/**
 * Transform Eurostat data to show countries on x-axis for selected year
 */
export const transformToCountryComparison = (eurostatData: any, details: boolean = false, hideAggregates: boolean = false): ChartDataResult => {
  if (!eurostatData?.dimension?.time?.category?.index || !eurostatData?.dimension?.geo?.category?.index) {
    return { categories: [], series: [], selectedYear: '', isDetailed: details };
  }

  // If details is true, show tax breakdown
  if (details) {
    return transformToTaxBreakdown(eurostatData);
  }

  // Original working logic - unchanged
  const timeCategories = eurostatData.dimension.time.category.index;
  const timeLabels = Object.keys(timeCategories).sort((a, b) => timeCategories[a] - timeCategories[b]);
  
  // Get the most recent year (last in sorted array)
  const selectedYear = timeLabels[timeLabels.length - 1];
  const selectedTimeIndex = timeCategories[selectedYear];
  
  const geoCategories = eurostatData.dimension.geo.category.index;
  let geoLabels = Object.keys(geoCategories);
  
  // Filter out aggregates (EU entities) if hideAggregates is true
  if (hideAggregates) {
    const aggregateCodes = ['EU27_2020', 'EA']; // EU27 and Euro Area
    geoLabels = geoLabels.filter(geoCode => !aggregateCodes.includes(geoCode));
  }
  
  // Create array of countries with their values for the selected year
  const countriesData: CountryData[] = geoLabels.map(geoCode => {
    const geoIndex = geoCategories[geoCode];
    const valueIndex = geoIndex * timeLabels.length + selectedTimeIndex;
    const value = eurostatData.value[valueIndex];
    
    return {
      name: eurostatData.dimension.geo.category.label[geoCode] || geoCode,
      value: (value !== undefined && value !== null) ? parseFloat(value) : null,
      geoIndex: geoIndex, // Keep original index for protocol ordering
      geoCode: geoCode // Keep the country code for color mapping
    };
  }).filter(item => item.value !== null) // Remove null values
    .sort((a, b) => a.geoIndex - b.geoIndex); // Sort by original API index (protocol order)

  // Extract categories (country names), data values, and country codes
  const categories = countriesData.map(item => item.name);
  const values = countriesData.map(item => item.value);
  const countryCodes = countriesData.map(item => item.geoCode).filter((code): code is string => code !== undefined);

  // Create single series for the selected year
  const series = [{
    name: `Energy Prices ${selectedYear}`,
    data: values
  }];

  return { 
    categories, 
    series, 
    selectedYear,
    isDetailed: false,
    countryCodes
  };
};

/**
 * Transform Eurostat data to show time series (multiple countries over time)
 */
export const transformToTimeSeries = (eurostatData: any, maxCountries: number = 5): ChartDataResult => {
  if (!eurostatData?.dimension?.time?.category?.index || !eurostatData?.dimension?.geo?.category?.index) {
    return { categories: [], series: [], selectedYear: '', isDetailed: false };
  }

  const timeCategories = eurostatData.dimension.time.category.index;
  const timeLabels = Object.keys(timeCategories).sort((a, b) => timeCategories[a] - timeCategories[b]);
  
  const geoCategories = eurostatData.dimension.geo.category.index;
  const geoLabels = Object.keys(geoCategories).slice(0, maxCountries); // Limit countries for readability
  
  // Categories are time periods
  const categories = timeLabels;
  
  // Create series for each country
  const series = geoLabels.map(geoCode => {
    const geoIndex = geoCategories[geoCode];
    const countryName = eurostatData.dimension.geo.category.label[geoCode] || geoCode;
    
    const data = timeLabels.map(timeLabel => {
      const timeIndex = timeCategories[timeLabel];
      const valueIndex = geoIndex * timeLabels.length + timeIndex;
      const value = eurostatData.value[valueIndex];
      return (value !== undefined && value !== null) ? parseFloat(value) : null;
    });
    
    return {
      name: countryName,
      data: data
    };
  });

  const selectedYear = timeLabels[timeLabels.length - 1];
  
  return { 
    categories, 
    series, 
    selectedYear,
    isDetailed: false 
  };
};
