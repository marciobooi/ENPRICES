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
    data: (number | null | { y: number; customTotal: number } | { name: string; y: number })[];
  }>;
  selectedYear: string;
  isDetailed?: boolean;
  countryCodes?: string[]; // Add country codes for color mapping
}

/**
 * Transform Eurostat data to show tax breakdown
 */
const transformToTaxBreakdown = (eurostatData: any, t?: (key: string, defaultValue?: string) => string, selectedCountries?: string[]): ChartDataResult => {
  if (!eurostatData?.dimension?.tax?.category?.index) {
    // Fallback to regular display if no tax dimension
    return transformToCountryComparison(eurostatData, false, false, false, t, selectedCountries);
  }

  const timeCategories = eurostatData.dimension.time.category.index;
  const timeLabels = Object.keys(timeCategories).sort((a, b) => timeCategories[a] - timeCategories[b]);
  const selectedYear = timeLabels[timeLabels.length - 1];
  const selectedTimeIndex = timeCategories[selectedYear];
  
  const geoCategories = eurostatData.dimension.geo.category.index;
  let geoLabels = Object.keys(geoCategories);
  
  // Filter by selected countries if provided
  if (selectedCountries && selectedCountries.length > 0) {
    geoLabels = geoLabels.filter(geoCode => selectedCountries.includes(geoCode));
  }
  
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
 * Transform Eurostat data to show price components breakdown
 */
const transformToComponentBreakdown = (eurostatData: any, hideAggregates: boolean = false, t?: (key: string, defaultValue?: string) => string, selectedCountries?: string[]): ChartDataResult => {
  if (!eurostatData?.dimension?.nrg_prc?.category?.index) {
    // Fallback to regular display if no nrg_prc dimension
    return transformToCountryComparison(eurostatData, false, hideAggregates, false, t, selectedCountries);
  }

  const timeCategories = eurostatData.dimension.time.category.index;
  const timeLabels = Object.keys(timeCategories).sort((a, b) => timeCategories[a] - timeCategories[b]);
  const selectedYear = timeLabels[timeLabels.length - 1];
  const selectedTimeIndex = timeCategories[selectedYear];

  const geoCategories = eurostatData.dimension.geo.category.index;
  let geoLabels = Object.keys(geoCategories);

  // Filter out aggregates (EU entities) if hideAggregates is true
  if (hideAggregates) {
    const aggregateCodes = ['EU27_2020', 'EA']; // EU27 and Euro Area
    geoLabels = geoLabels.filter(geoCode => !aggregateCodes.includes(geoCode));
  }

  // Filter by selected countries if provided
  if (selectedCountries && selectedCountries.length > 0) {
    geoLabels = geoLabels.filter(geoCode => selectedCountries.includes(geoCode));
  }
  if (hideAggregates) {
    const aggregateCodes = ['EU27_2020', 'EA']; // EU27 and Euro Area
    geoLabels = geoLabels.filter(geoCode => !aggregateCodes.includes(geoCode));
  }

  const nrgPrcCategories = eurostatData.dimension.nrg_prc.category.index;
  const nrgPrcLabels = Object.keys(nrgPrcCategories);

  // Create countries data
  const countriesData = geoLabels.map(geoCode => {
    return {
      name: eurostatData.dimension.geo.category.label[geoCode] || geoCode,
      geoCode: geoCode,
      geoIndex: geoCategories[geoCode]
    };
  });

  // Extract real component data from Eurostat API
  const series = nrgPrcLabels.map((componentCode) => {
    const componentLabel = eurostatData.dimension.nrg_prc.category.label[componentCode] || componentCode;

    return {
      name: t ? t(`chart.series.components.${componentCode}`, componentLabel) : componentLabel,
      data: countriesData.map((country) => {
        // Calculate the correct index for the 6D array [freq, nrg_cons, nrg_prc, currency, geo, time]
        // Since freq=0, nrg_cons=0, currency=0, the formula simplifies to:
        // index = nrg_prc_index * (geo_size * time_size) + geo_index * time_size + time_index
        const nrgPrcIndex = nrgPrcCategories[componentCode];
        const geoSize = Object.keys(geoCategories).length; // 43
        const timeSize = Object.keys(timeCategories).length; // 8

        const valueIndex = nrgPrcIndex * (geoSize * timeSize) +
                          country.geoIndex * timeSize +
                          selectedTimeIndex;

        const value = eurostatData.value[valueIndex];
        const numericValue = (value !== undefined && value !== null) ? parseFloat(value) : 0;

        // Calculate total for this country (sum of all components)
        let totalValue = 0;
        nrgPrcLabels.forEach((otherComponentCode) => {
          const otherNrgPrcIndex = nrgPrcCategories[otherComponentCode];
          const otherValueIndex = otherNrgPrcIndex * (geoSize * timeSize) +
                                 country.geoIndex * timeSize +
                                 selectedTimeIndex;
          const otherValue = eurostatData.value[otherValueIndex];
          const otherNumericValue = (otherValue !== undefined && otherValue !== null) ? parseFloat(otherValue) : 0;
          totalValue += otherNumericValue;
        });

        return {
          y: Math.round(numericValue * 10000) / 10000, // Round to 4 decimal places
          customTotal: Math.round(totalValue * 10000) / 10000
        };
      })
    };
  });

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
export const transformToCountryComparison = (eurostatData: any, isDetailedView: boolean = false, hideAggregates: boolean = false, isComponentView: boolean = false, t?: (key: string, defaultValue?: string) => string, selectedCountries?: string[]): ChartDataResult => {
  if (!eurostatData?.dimension?.time?.category?.index || !eurostatData?.dimension?.geo?.category?.index) {
    return { categories: [], series: [], selectedYear: '', isDetailed: isDetailedView };
  }

  // If detailed view is requested, show breakdown based on isComponentView flag
  if (isDetailedView) {
    if (isComponentView && eurostatData?.dimension?.nrg_prc?.category?.index) {
      return transformToComponentBreakdown(eurostatData, hideAggregates, t, selectedCountries);
    } else if (eurostatData?.dimension?.tax?.category?.index) {
      return transformToTaxBreakdown(eurostatData, t, selectedCountries);
    }
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

  // Filter by selected countries if provided
  if (selectedCountries && selectedCountries.length > 0) {
    // console.log('[transformToCountryComparison] Selected countries for filtering:', selectedCountries);
    // console.log('[transformToCountryComparison] Available geo labels before filtering:', geoLabels);
    geoLabels = geoLabels.filter(geoCode => selectedCountries.includes(geoCode));
    // console.log('[transformToCountryComparison] Filtered geo labels:', geoLabels);
  } else {
    console.log('[transformToCountryComparison] No country filtering applied, showing all countries');
  }
  
  // Create array of countries with their values for the selected year
  const countriesData: CountryData[] = geoLabels.map(geoCode => {
    const geoIndex = geoCategories[geoCode];
    
    // Check if this is component data (has nrg_prc dimension)
    if (eurostatData.dimension.nrg_prc?.category?.index) {
      // For component data in total view, sum all components for each country
      const nrgPrcCategories = eurostatData.dimension.nrg_prc.category.index;
      const nrgPrcLabels = Object.keys(nrgPrcCategories);
      
      let totalValue = 0;
      nrgPrcLabels.forEach((componentCode) => {
        const nrgPrcIndex = nrgPrcCategories[componentCode];
        const geoSize = Object.keys(geoCategories).length;
        const timeSize = Object.keys(timeCategories).length;
        
        const valueIndex = nrgPrcIndex * (geoSize * timeSize) +
                          geoIndex * timeSize +
                          selectedTimeIndex;
        
        const componentValue = eurostatData.value[valueIndex];
        const numericValue = (componentValue !== undefined && componentValue !== null) ? parseFloat(componentValue) : 0;
        totalValue += numericValue;
      });
      
      return {
        name: eurostatData.dimension.geo.category.label[geoCode] || geoCode,
        value: Math.round(totalValue * 10000) / 10000, // Round to 4 decimal places
        geoIndex: geoIndex,
        geoCode: geoCode
      };
    } else {
      // Regular data - use the standard index calculation
      const valueIndex = geoIndex * timeLabels.length + selectedTimeIndex;
      const value = eurostatData.value[valueIndex];
      
      return {
        name: eurostatData.dimension.geo.category.label[geoCode] || geoCode,
        value: (value !== undefined && value !== null) ? parseFloat(value) : null,
        geoIndex: geoIndex,
        geoCode: geoCode
      };
    }
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

/**
 * Transform Eurostat data to show consumption bands for a specific country
 * Used for drill-down functionality when clicking on a country bar
 */
export const transformToCountryBands = (eurostatData: any, countryCode: string, isDetailed: boolean = false, isComponent: boolean = false, t?: (key: string, defaultValue?: string) => string): ChartDataResult => {
  if (!eurostatData?.dimension?.time?.category?.index ||
      !eurostatData?.dimension?.geo?.category?.index) {
    return { categories: [], series: [], selectedYear: '', isDetailed: false };
  }

  // Eurostat uses nrg_cons for consumption bands; some legacy code used consom
  const bandDim = eurostatData.dimension.nrg_cons || eurostatData.dimension.consom;
  if (!bandDim?.category?.index) {
    return { categories: [], series: [], selectedYear: '', isDetailed: false };
  }

  const timeCategories = eurostatData.dimension.time.category.index;
  const timeLabels = Object.keys(timeCategories).sort((a, b) => timeCategories[a] - timeCategories[b]);
  const selectedYear = timeLabels[timeLabels.length - 1];
  const selectedTimeIndex = timeCategories[selectedYear];

  const consomCategories = bandDim.category.index;
  const consomLabels = Object.keys(consomCategories);

  const geoCategories = eurostatData.dimension.geo.category.index;
  const countryIndex = geoCategories[countryCode];

  if (countryIndex === undefined) {
    return { categories: [], series: [], selectedYear: '', isDetailed: false };
  }

  // Get country name for the title
  const countryName = eurostatData.dimension.geo.category.label[countryCode] || countryCode;

  // Determine if we have tax or nrg_prc dimensions (detailed views)
  const taxDim = eurostatData.dimension.tax?.category?.index ? eurostatData.dimension.tax.category.index : null;
  const prcDim = eurostatData.dimension.nrg_prc?.category?.index ? eurostatData.dimension.nrg_prc.category.index : null;

  // Helpers to compute flattened index robustly using JSON-stat id/size
  const dimIds: string[] = eurostatData.id || Object.keys(eurostatData.dimension);
  const sizes: number[] = eurostatData.size || dimIds.map((k: string) => {
    const idx = eurostatData.dimension[k]?.category?.index;
    return idx ? Object.keys(idx).length : 1;
  });

  const getDimIndex = (dim: string, code?: string): number => {
    const catIdx = eurostatData.dimension[dim]?.category?.index;
    if (!catIdx) return 0;
    if (code && catIdx[code] !== undefined) return catIdx[code];
    // pick the first by numeric order of indices
    const entries = Object.entries(catIdx) as Array<[string, number]>;
    entries.sort((a, b) => a[1] - b[1]);
    return entries.length ? entries[0][1] : 0;
  };

  const computeIndex = (coords: Record<string, number>): number => {
    let idxAcc = 0;
    for (let i = 0; i < dimIds.length; i++) {
      const dim = dimIds[i];
      const coord = coords.hasOwnProperty(dim) ? coords[dim] : getDimIndex(dim);
      let stride = 1;
      for (let j = i + 1; j < sizes.length; j++) stride *= sizes[j];
      idxAcc += coord * stride;
    }
    return idxAcc;
  };

  // Create consumption band data for this country
  const bandData = consomLabels.map(consomCode => {
    const consomIndex = consomCategories[consomCode];
    const consomLabel = bandDim.category.label[consomCode] || consomCode;

    let numericValue: number | null = null;

    if (!taxDim && !prcDim) {
      // Use generic index computation
      const valueIndex = computeIndex({
        time: selectedTimeIndex,
        geo: countryIndex,
        nrg_cons: consomIndex,
        consom: consomIndex // fallback if API used legacy name
      });
      const value = eurostatData.value[valueIndex];
      numericValue = (value !== undefined && value !== null) ? parseFloat(value) : null;
    } else if (taxDim) {
      // Prefer X_TAX if present, else I_TAX, else X_VAT
      const taxPreference = ['X_TAX', 'I_TAX', 'X_VAT'];
      const availableTax = Object.keys(taxDim);
      const chosenTax = taxPreference.find(c => availableTax.includes(c)) || availableTax[0];
      const valueIndex = computeIndex({
        time: selectedTimeIndex,
        geo: countryIndex,
        nrg_cons: consomIndex,
        consom: consomIndex,
        tax: getDimIndex('tax', chosenTax),
        currency: getDimIndex('currency', 'EUR')
      });
      const value = eurostatData.value[valueIndex];
      numericValue = (value !== undefined && value !== null) ? parseFloat(value) : null;
    } else if (prcDim) {
      // Sum all components for total per band
      const prcKeys = Object.keys(prcDim);
      let sum = 0;
      prcKeys.forEach((code) => {
        const valueIndex = computeIndex({
          time: selectedTimeIndex,
          geo: countryIndex,
          nrg_cons: consomIndex,
          consom: consomIndex,
          nrg_prc: getDimIndex('nrg_prc', code),
          currency: getDimIndex('currency', 'EUR')
        });
        const value = eurostatData.value[valueIndex];
        sum += (value !== undefined && value !== null) ? parseFloat(value) : 0;
      });
      numericValue = sum;
    }

    return {
      name: t ? t(`consumptionBands.${consomCode}`, consomLabel) : consomLabel,
      value: numericValue !== null ? Math.round(numericValue * 10000) / 10000 : null,
      consomCode
    };
  }).filter(item => item.value !== null);

  // Extract categories (consumption band names) and values
  const categories = bandData.map(item => item.name);
  
  // Handle detailed vs total view
  if (isDetailed && isComponent && prcDim) {
    // For detailed view with component breakdown, create component series for each band
    const prcLabels = Object.keys(prcDim);
    
    // Create series for each component across all consumption bands
    const series = prcLabels.map((componentCode) => {
      const componentLabel = eurostatData.dimension.nrg_prc.category.label[componentCode] || componentCode;
      
      const componentData = bandData.map(band => {
        const consomIndex = consomCategories[band.consomCode];
        const valueIndex = computeIndex({
          time: selectedTimeIndex,
          geo: countryIndex,
          nrg_cons: consomIndex,
          consom: consomIndex, // fallback if API used legacy name
          nrg_prc: getDimIndex('nrg_prc', componentCode),
          currency: getDimIndex('currency', 'EUR')
        });
        const value = eurostatData.value[valueIndex];
        return (value !== undefined && value !== null) ? parseFloat(value) : 0;
      });

      return {
        name: t ? t(`chart.series.components.${componentCode}`, componentLabel) : componentLabel,
        data: componentData
      };
    });

    return { 
      categories, 
      series, 
      selectedYear,
      isDetailed: true 
    };
  } else if (isDetailed && taxDim) {
    // For detailed view with tax breakdown, create tax component series for each band
    const taxLabels = Object.keys(taxDim);
    
    // Calculate tax breakdown for each band (same logic as country tax breakdown)
    const bandsWithTaxData = bandData.map(band => {
      const consomIndex = consomCategories[band.consomCode];
      const values: Record<string, number> = {};
      
      taxLabels.forEach((taxCode) => {
        const valueIndex = computeIndex({
          time: selectedTimeIndex,
          geo: countryIndex,
          nrg_cons: consomIndex,
          tax: getDimIndex('tax', taxCode),
          currency: getDimIndex('currency', 'EUR')
        });
        const value = eurostatData.value[valueIndex];
        values[taxCode] = parseFloat(value) || 0;
      });
      
      // Calculate the 3 tax components using the same logic as transformToTaxBreakdown
      const xTax = values['X_TAX'] || 0; // Excluding taxes (total)
      const xVat = values['X_VAT'] || 0; // Excluding VAT 
      const iTax = values['I_TAX'] || 0; // Including all taxes

      const priceExcludingTaxes = xVat;
      const vatAndOtherTaxes = -(iTax - xTax);
      const restOfTaxes = xTax - priceExcludingTaxes - vatAndOtherTaxes;
      
      return {
        band: band,
        priceExcludingTaxes: priceExcludingTaxes,
        restOfTaxes: restOfTaxes,
        vatAndOtherTaxes: vatAndOtherTaxes,
        total: xTax
      };
    });
    
    // Create series for the 3 tax components across all bands
    const series = [
      {
        name: t ? t('chart.series.taxBreakdown.X_VAT', 'Price excluding taxes and levies') : 'Price excluding taxes and levies',
        data: bandsWithTaxData.map(item => ({ y: item.priceExcludingTaxes, customTotal: item.total }))
      },
      {
        name: t ? t('chart.series.taxBreakdown.REST', 'Rest of taxes and levies') : 'Rest of taxes and levies',
        data: bandsWithTaxData.map(item => ({ y: item.restOfTaxes, customTotal: item.total }))
      },
      {
        name: t ? t('chart.series.taxBreakdown.X_VAT_OTHER', 'VAT and other recoverable taxes and levies') : 'VAT and other recoverable taxes and levies',
        data: bandsWithTaxData.map(item => ({ y: item.vatAndOtherTaxes, customTotal: item.total }))
      },
    ];

    return { 
      categories, 
      series, 
      selectedYear,
      isDetailed: true 
    };
  } else {
    // Total view - single series with total values
    const values = bandData.map(item => item.value);

    // Create single series for the selected country and year
    const series = [{
      name: `${countryName} - ${selectedYear}`,
      data: values
    }];

    return { 
      categories, 
      series, 
      selectedYear,
      isDetailed: false 
    };
  }
};

/**
 * Transform bands data to pie chart format for a specific band
 */
export const transformToBandsPieChart = (
  eurostatData: any, 
  selectedCountry: string, 
  selectedBand: string, 
  isDetailed: boolean = false, 
  isComponent: boolean = false, 
  t?: (key: string, defaultValue?: string) => string
): ChartDataResult => {
  console.log('[transformToBandsPieChart] Starting transformation with:', {
    eurostatData: !!eurostatData,
    selectedCountry,
    selectedBand,
    isDetailed,
    isComponent,
    hasValue: !!eurostatData?.value
  });

  // Get band data directly from eurostat structure instead of transformed data
  if (!eurostatData?.dimension?.geo?.category?.index ||
      !eurostatData?.dimension?.nrg_cons?.category?.index) {
    console.log('[transformToBandsPieChart] Missing required dimensions');
    return { categories: [], series: [], selectedYear: '', isDetailed: false };
  }

  const geoCategories = eurostatData.dimension.geo.category.index;
  const geoIndex = geoCategories[selectedCountry];
  
  if (geoIndex === undefined) {
    console.log('[transformToBandsPieChart] Country not found:', selectedCountry);
    return { categories: [], series: [], selectedYear: '', isDetailed: false };
  }

  const bandCategories = eurostatData.dimension.nrg_cons.category.index;
  const bandIndex = bandCategories[selectedBand];
  
  if (bandIndex === undefined) {
    console.log('[transformToBandsPieChart] Band not found:', {
      selectedBand,
      availableBands: Object.keys(bandCategories)
    });
    return { categories: [], series: [], selectedYear: '', isDetailed: false };
  }

  console.log('[transformToBandsPieChart] Found band at index:', {
    selectedBand,
    bandIndex,
    geoIndex
  });

  // Get time information
  const timeCategories = eurostatData.dimension.time.category.index;
  const timeLabels = Object.keys(timeCategories).sort((a, b) => timeCategories[a] - timeCategories[b]);
  const selectedYear = timeLabels[timeLabels.length - 1];
  const timeIndex = timeCategories[selectedYear];

  // For pie chart, we need breakdown data (always detailed)
  if (isDetailed || true) { // Force detailed for pie charts
    // Check what type of breakdown we have
    const nrgPrcCategories = eurostatData.dimension.nrg_prc?.category?.index; // Components
    const taxCategories = eurostatData.dimension.tax?.category?.index; // Taxes
    
    console.log('[transformToBandsPieChart] Available breakdowns:', {
      hasComponents: !!nrgPrcCategories,
      hasTaxes: !!taxCategories,
      isComponent,
      componentCodes: nrgPrcCategories ? Object.keys(nrgPrcCategories) : null,
      taxCodes: taxCategories ? Object.keys(taxCategories) : null
    });

    let pieData: { name: string; y: number }[] = [];

    if (isComponent && nrgPrcCategories) {
      // Component breakdown
      Object.keys(nrgPrcCategories).forEach(componentCode => {
        const componentIndex = nrgPrcCategories[componentCode];
        
        // Calculate the index in the flat value array
        const dimensions = eurostatData.dimension;
        const valueIndex = 
          timeIndex * Object.keys(dimensions.geo.category.index).length * 
          Object.keys(dimensions.nrg_cons.category.index).length * 
          Object.keys(dimensions.nrg_prc.category.index).length +
          geoIndex * Object.keys(dimensions.nrg_cons.category.index).length * 
          Object.keys(dimensions.nrg_prc.category.index).length +
          bandIndex * Object.keys(dimensions.nrg_prc.category.index).length +
          componentIndex;

        const value = eurostatData.value[valueIndex];
        
        if (value !== null && value > 0) {
          // Get component name from translations or use code
          const componentName = t ? t(`component.${componentCode}`, componentCode) : componentCode;
          pieData.push({
            name: componentName,
            y: value
          });
        }
      });
    } else if (!isComponent && taxCategories) {
      // Tax breakdown
      console.log('[transformToBandsPieChart] Processing tax breakdown:', {
        taxCategories,
        taxCodes: Object.keys(taxCategories),
        timeIndex,
        geoIndex,
        bandIndex
      });

      Object.keys(taxCategories).forEach(taxCode => {
        const taxIndex = taxCategories[taxCode];
        
        // Calculate the index in the flat value array
        const dimensions = eurostatData.dimension;
        const valueIndex = 
          timeIndex * Object.keys(dimensions.geo.category.index).length * 
          Object.keys(dimensions.nrg_cons.category.index).length * 
          Object.keys(dimensions.tax.category.index).length +
          geoIndex * Object.keys(dimensions.nrg_cons.category.index).length * 
          Object.keys(dimensions.tax.category.index).length +
          bandIndex * Object.keys(dimensions.tax.category.index).length +
          taxIndex;

        const value = eurostatData.value[valueIndex];
        
        console.log('[transformToBandsPieChart] Tax processing:', {
          taxCode,
          taxIndex,
          valueIndex,
          value,
          dimensionSizes: {
            time: Object.keys(dimensions.time.category.index).length,
            geo: Object.keys(dimensions.geo.category.index).length,
            nrg_cons: Object.keys(dimensions.nrg_cons.category.index).length,
            tax: Object.keys(dimensions.tax.category.index).length
          }
        });
        
        if (value !== null && value !== 0) { // Include negative values for tax breakdown
          // Get tax name from translations or use code
          const taxName = t ? t(`tax.${taxCode}`, taxCode) : taxCode;
          pieData.push({
            name: taxName,
            y: Math.abs(value) // Use absolute value for pie chart display
          });
        }
      });
    }

    if (pieData.length === 0) {
      console.log('[transformToBandsPieChart] No breakdown data available for pie chart');
      return { categories: [], series: [], selectedYear, isDetailed: false };
    }

    console.log('[transformToBandsPieChart] Created pie data:', pieData);

    return {
      categories: pieData.map(item => item.name),
      series: [{
        name: selectedBand,
        data: pieData
      }],
      selectedYear,
      isDetailed: true
    };
  } else {
    // Simple view - just the total value
    const dimensions = eurostatData.dimension;
    const valueIndex = 
      timeIndex * Object.keys(dimensions.geo.category.index).length * 
      Object.keys(dimensions.nrg_cons.category.index).length +
      geoIndex * Object.keys(dimensions.nrg_cons.category.index).length +
      bandIndex;

    const value = eurostatData.value[valueIndex] || 0;

    return {
      categories: [selectedBand],
      series: [{
        name: selectedBand,
        data: [{ name: selectedBand, y: value }]
      }],
      selectedYear,
      isDetailed: false
    };
  }
};

/**
 * Create HTML table for country comparison data
 */
export const createCountryComparisonTable = (
  eurostatData: any,
  isDetailed: boolean = false,
  hideAggregates: boolean = false,
  isComponent: boolean = false,
  selectedCountries?: string[],
  t?: (key: string, defaultValue?: string) => string
): string => {
  const comparisonData = transformToCountryComparison(eurostatData, isDetailed, hideAggregates, isComponent, t, selectedCountries);
  
  const tableTitle = isComponent 
    ? (t ? t('table.title.components', 'Electricity Price Components by Country') : 'Electricity Price Components by Country')
    : isDetailed 
    ? (t ? t('table.title.detailed', 'Energy Prices by Tax Component') : 'Energy Prices by Tax Component')
    : (t ? t('table.title.main', 'Energy Prices by Country') : 'Energy Prices by Country');

  let tableHtml = `
    <div style="padding: 1rem;">
      <h3>${tableTitle} (${comparisonData.selectedYear})</h3>
      <table style="width: 100%; border-collapse: collapse; margin-top: 1rem;">
        <thead>
          <tr style="background-color: #f5f5f5;">
            <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Country</th>
  `;

  // Add column headers for each series
  comparisonData.series.forEach((series: any) => {
    tableHtml += `<th style="border: 1px solid #ddd; padding: 8px; text-align: right;">${series.name}</th>`;
  });

  tableHtml += `
          </tr>
        </thead>
        <tbody>
  `;

  // Add data rows
  comparisonData.categories.forEach((country: string, countryIndex: number) => {
    tableHtml += `<tr style="background-color: ${countryIndex % 2 === 0 ? '#fff' : '#f9f9f9'};">`;
    tableHtml += `<td style="border: 1px solid #ddd; padding: 8px; font-weight: bold;">${country}</td>`;
    
    comparisonData.series.forEach((series: any) => {
      const value = series.data[countryIndex];
      const displayValue = value !== null && value !== undefined 
        ? typeof value === 'object' && value.y !== undefined 
          ? parseFloat(value.y).toFixed(4)
          : parseFloat(value).toFixed(4)
        : 'N/A';
      
      tableHtml += `<td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${displayValue}</td>`;
    });
    
    tableHtml += `</tr>`;
  });

  tableHtml += `
        </tbody>
      </table>
      <p style="margin-top: 1rem; font-size: 12px; color: #666;">
        <strong>Source:</strong> Eurostat<br>
        <strong>Unit:</strong> EUR per kWh<br>
        <strong>Note:</strong> Values are displayed with 4 decimal places. N/A indicates no data available.
      </p>
    </div>
  `;

  return tableHtml;
};

/**
 * Create HTML table for bands data
 */
export const createBandsTable = (
  eurostatData: any, 
  selectedCountry: string, 
  isDetailed: boolean = false, 
  isComponent: boolean = false, 
  t?: (key: string, defaultValue?: string) => string
): string => {
  const bandsData = transformToCountryBands(eurostatData, selectedCountry, isDetailed, isComponent, t);
  
  let tableHtml = `
    <div style="padding: 1rem;">
      <h3>Consumption Bands - ${selectedCountry} (${bandsData.selectedYear})</h3>
      <table style="width: 100%; border-collapse: collapse; margin-top: 1rem;">
        <thead>
          <tr style="background-color: #f5f5f5;">
            <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Band</th>
  `;

  // Add column headers for each series
  bandsData.series.forEach(series => {
    tableHtml += `<th style="border: 1px solid #ddd; padding: 8px; text-align: right;">${series.name}</th>`;
  });
  
  if (isDetailed && bandsData.series.length > 1) {
    tableHtml += `<th style="border: 1px solid #ddd; padding: 8px; text-align: right;">Total</th>`;
  }
  
  tableHtml += `
          </tr>
        </thead>
        <tbody>
  `;

  // Add data rows
  bandsData.categories.forEach((category, index) => {
    tableHtml += `<tr>`;
    tableHtml += `<td style="border: 1px solid #ddd; padding: 8px;">${category}</td>`;
    
    let total = 0;
    bandsData.series.forEach(series => {
      const value = series.data[index];
      const numericValue = typeof value === 'object' ? (value as any)?.y || 0 : value || 0;
      total += numericValue;
      tableHtml += `<td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${numericValue.toFixed(4)}</td>`;
    });
    
    if (isDetailed && bandsData.series.length > 1) {
      tableHtml += `<td style="border: 1px solid #ddd; padding: 8px; text-align: right; font-weight: bold;">${total.toFixed(4)}</td>`;
    }
    
    tableHtml += `</tr>`;
  });

  tableHtml += `
        </tbody>
      </table>
    </div>
  `;

  return tableHtml;
};

/**
 * Transform Eurostat data to show timeline for a specific band
 * Used when chart type is 'timeline' in bands view
 */
export const transformToBandsTimeline = (
  eurostatData: any, 
  countryCode: string, 
  selectedBand: string,
  isDetailed: boolean = false, 
  isComponent: boolean = false, 
  t?: (key: string, defaultValue?: string) => string
): ChartDataResult => {
  console.log('[transformToBandsTimeline] Starting transformation with:', {
    eurostatData: !!eurostatData,
    countryCode,
    selectedBand,
    isDetailed,
    isComponent,
    hasTimeData: !!eurostatData?.dimension?.time?.category?.index
  });

  if (!eurostatData?.dimension?.time?.category?.index ||
      !eurostatData?.dimension?.geo?.category?.index) {
    console.log('[transformToBandsTimeline] Missing required dimensions');
    return { categories: [], series: [], selectedYear: '', isDetailed: false };
  }

  const timeCategories = eurostatData.dimension.time.category.index;
  const timeLabels = Object.keys(timeCategories).sort((a, b) => timeCategories[a] - timeCategories[b]);
  const selectedYear = timeLabels[timeLabels.length - 1];

  console.log('[transformToBandsTimeline] Time data:', {
    timeLabels,
    selectedYear,
    timeLabelCount: timeLabels.length
  });

  const geoCategories = eurostatData.dimension.geo.category.index;
  const geoIndex = geoCategories[countryCode];
  
  if (geoIndex === undefined) {
    console.log('[transformToBandsTimeline] Country not found:', countryCode);
    return { categories: [], series: [], selectedYear, isDetailed: false };
  }

  const bandDim = eurostatData.dimension.nrg_cons || eurostatData.dimension.consom;
  const consomCategories = bandDim?.category?.index || {};
  const consomLabels = bandDim?.category?.label || {};
  
  // Categories are time periods
  const categories = timeLabels.map(timeLabel => {
    // Format time labels for display (e.g., "2023-S2" -> "2023 H2")
    if (timeLabel.includes('-S')) {
      const [year, semester] = timeLabel.split('-S');
      return `${year} H${semester}`;
    }
    return timeLabel;
  });

  let series: any[] = [];

  if (isDetailed) {
    // Details view: Show breakdown (tax/components) of the selected band over time
    const bandIndex = consomCategories[selectedBand];
    
    if (bandIndex === undefined) {
      console.log('[transformToBandsTimeline] Band not found for detailed view:', {
        selectedBand,
        availableBands: Object.keys(consomCategories)
      });
      return { categories, series: [], selectedYear, isDetailed: false };
    }

    console.log('[transformToBandsTimeline] Found band at index for detailed view:', {
      selectedBand,
      bandIndex,
      geoIndex
    });

    if (isComponent && eurostatData.dimension.nrg_prc) {
      // Component breakdown over time for selected band
      const nrgPrcCategories = eurostatData.dimension.nrg_prc?.category?.index || {};
      const nrgPrcLabels = Object.keys(nrgPrcCategories);
      
      series = nrgPrcLabels.map(nrgCode => {
        const nrgIndex = nrgPrcCategories[nrgCode];
        const label = eurostatData.dimension.nrg_prc.category.label[nrgCode];
        const translatedLabel = t ? t(`energy.nrgPrc.${nrgCode}`, label) : label;
        
        const data = timeLabels.map(timeLabel => {
          const timeIndex = timeCategories[timeLabel];
          const valueIndex = geoIndex * Object.keys(consomCategories).length * nrgPrcLabels.length * timeLabels.length +
                            bandIndex * nrgPrcLabels.length * timeLabels.length +
                            nrgIndex * timeLabels.length +
                            timeIndex;
          const value = eurostatData.value[valueIndex];
          return (value !== undefined && value !== null) ? parseFloat(value) : null;
        });

        return {
          name: translatedLabel,
          data: data
        };
      });
    } else if (eurostatData.dimension.tax) {
      // Tax breakdown over time for selected band
      const taxCategories = eurostatData.dimension.tax.category.index;
      const taxLabels = Object.keys(taxCategories);
      
      series = taxLabels.map(taxCode => {
        const taxIndex = taxCategories[taxCode];
        const label = eurostatData.dimension.tax.category.label[taxCode];
        const translatedLabel = t ? t(`energy.tax.${taxCode}`, label) : label;
        
        const data = timeLabels.map(timeLabel => {
          const timeIndex = timeCategories[timeLabel];
          const valueIndex = geoIndex * Object.keys(consomCategories).length * taxLabels.length * timeLabels.length +
                            bandIndex * taxLabels.length * timeLabels.length +
                            taxIndex * timeLabels.length +
                            timeIndex;
          const value = eurostatData.value[valueIndex];
          return (value !== undefined && value !== null) ? parseFloat(value) : null;
        });

        return {
          name: translatedLabel,
          data: data
        };
      });
    }
  } else {
    // Totals view: Show all bands over time (like band bar chart shows all bands for one year)
    const allBands = Object.keys(consomCategories);
    
    series = allBands.map(bandCode => {
      const bandIndex = consomCategories[bandCode];
      const bandLabel = consomLabels[bandCode] || bandCode;
      const translatedBandLabel = t ? t(`energy.bands.${bandCode}`, bandLabel) : bandLabel;
      
      const data = timeLabels.map(timeLabel => {
        const timeIndex = timeCategories[timeLabel];
        // For totals, we need to get the total value for this band at this time
        // This might require summing across tax dimensions or getting the total tax value
        let valueIndex: number;
        
        if (eurostatData.dimension.tax) {
          // If we have tax dimension, sum all tax values for this band and time
          const taxCategories = eurostatData.dimension.tax.category.index;
          const taxLabels = Object.keys(taxCategories);
          let totalValue = 0;
          let hasValues = false;
          
          for (const taxCode of taxLabels) {
            const taxIndex = taxCategories[taxCode];
            valueIndex = geoIndex * Object.keys(consomCategories).length * taxLabels.length * timeLabels.length +
                        bandIndex * taxLabels.length * timeLabels.length +
                        taxIndex * timeLabels.length +
                        timeIndex;
            const value = eurostatData.value[valueIndex];
            if (value !== undefined && value !== null) {
              totalValue += parseFloat(value);
              hasValues = true;
            }
          }
          
          return hasValues ? totalValue : null;
        } else {
          // Simple case without tax breakdown
          valueIndex = geoIndex * Object.keys(consomCategories).length * timeLabels.length +
                      bandIndex * timeLabels.length +
                      timeIndex;
          const value = eurostatData.value[valueIndex];
          return (value !== undefined && value !== null) ? parseFloat(value) : null;
        }
      });

      return {
        name: translatedBandLabel,
        data: data
      };
    });
  }

  return {
    categories,
    series,
    selectedYear,
    isDetailed
  };
};
