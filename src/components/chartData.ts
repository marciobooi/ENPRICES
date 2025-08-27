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
    data: (number | null | { y: number; customTotal: number })[];
  }>;
  selectedYear: string;
  isDetailed?: boolean;
  countryCodes?: string[]; // Add country codes for color mapping
}

/**
 * Transform Eurostat data to show tax breakdown
 */
const transformToTaxBreakdown = (eurostatData: any, t?: (key: string, defaultValue?: string) => string): ChartDataResult => {
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
      geoIndex: geoIndex,
      geoCode: geoCode
    };
  });
  
  
    // Get the raw tax values from API (X_TAX, X_VAT, I_TAX)
    const rawTaxData = countriesData.map(country => {
      const values: Record<string, number> = {};
      taxLabels.forEach((taxCode, taxIdx) => {
        // Use the correct index calculation (method 2 from debug)
        const sizes = eurostatData.size || [1, 1, 1, 1, 3, 3, 5, 1]; // Updated tax size to 3
        const currencyIndex = 0; // EUR
        const valueIndex = taxIdx * sizes[5] * sizes[6] * sizes[7] + // tax dimension
                          currencyIndex * sizes[6] * sizes[7] + // currency dimension  
                          country.geoIndex * sizes[7] + // geo dimension
                          selectedTimeIndex; // time dimension
        const value = eurostatData.value[valueIndex];
        values[taxCode] = parseFloat(value) || 0;
      });
      return {
        country: country,
        values: values
      };
    });

    // Calculate the 3 tax components using the correct logic
    // Based on tooltip: Price excluding taxes = X_VAT, Rest of taxes = ?, VAT = ?
    const calculatedData = rawTaxData.map(item => {
      const xTax = item.values['X_TAX'] || 0; // Excluding taxes (total)
      const xVat = item.values['X_VAT'] || 0; // Excluding VAT 
      const iTax = item.values['I_TAX'] || 0; // Including all taxes

      const priceExcludingTaxes = xVat;
      const vatAndOtherTaxes = -(iTax - xTax);
      const restOfTaxes = xTax - priceExcludingTaxes - vatAndOtherTaxes;

      console.log("country: ", item.country, "values: ", item.values,"total: ", xTax)

      // Tooltip 'Total' should be xTax
      return {
        country: item.country,
        priceExcludingTaxes: priceExcludingTaxes,
        restOfTaxes: restOfTaxes,
        vatAndOtherTaxes: vatAndOtherTaxes,
        total: xTax // Tooltip 'Total' uses xTax
      };
    });
 
  // Create series for the 3 tax components
  const series = [
    {
      name: t ? t('chart.series.taxBreakdown.X_VAT', 'Price excluding taxes and levies') : 'Price excluding taxes and levies',
      data: calculatedData.map(item => ({ y: item.priceExcludingTaxes, customTotal: item.total }))
    },
    {
      name: t ? t('chart.series.taxBreakdown.REST', 'Rest of taxes and levies') : 'Rest of taxes and levies',
      data: calculatedData.map(item => ({ y: item.restOfTaxes, customTotal: item.total }))
    },
    {
      name: t ? t('chart.series.taxBreakdown.X_VAT_OTHER', 'VAT and other recoverable taxes and levies') : 'VAT and other recoverable taxes and levies',
      data: calculatedData.map(item => ({ y: item.vatAndOtherTaxes, customTotal: item.total }))
    },
  ];

  return {
    categories: countriesData.map(c => c.name),
    series: series,
    selectedYear: selectedYear,
    isDetailed: true,
    countryCodes: countriesData.map(c => c.geoCode)
  };
};

/**
 * Transform Eurostat data to show countries on x-axis for selected year
 */
export const transformToCountryComparison = (eurostatData: any, details: boolean = false, hideAggregates: boolean = false, t?: (key: string, defaultValue?: string) => string): ChartDataResult => {
  if (!eurostatData?.dimension?.time?.category?.index || !eurostatData?.dimension?.geo?.category?.index) {
    return { categories: [], series: [], selectedYear: '', isDetailed: details };
  }

  // If details is true, show tax breakdown
  if (details) {
  return transformToTaxBreakdown(eurostatData, t);
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
