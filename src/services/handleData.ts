/**
 * Centralized data handler for Eurostat API responses
 * This file handles all data processing and logging after data is fetched or retrieved from cache
 */

interface DataHandlerOptions {
  dataset: string;
  params?: Record<string, string | string[]>;
  source: 'api' | 'cache' | 'pending';
  requestKey?: string;
}

// Global data storage for chart consumption
interface GlobalDataStore {
  data: any;
  dataset: string;
  params?: Record<string, string | string[]>;
  lastUpdated: number;
  listeners: Array<(data: any) => void>;
}

const globalDataStore: GlobalDataStore = {
  data: null,
  dataset: '',
  params: undefined,
  lastUpdated: 0,
  listeners: []
};

/**
 * Subscribe to data updates
 */
export const subscribeToDataUpdates = (callback: (data: any) => void): (() => void) => {
  globalDataStore.listeners.push(callback);
  
  // Return unsubscribe function
  return () => {
    const index = globalDataStore.listeners.indexOf(callback);
    if (index > -1) {
      globalDataStore.listeners.splice(index, 1);
    }
  };
};

/**
 * Get current data
 */
export const getCurrentData = () => {
  return {
    data: globalDataStore.data,
    dataset: globalDataStore.dataset,
    params: globalDataStore.params,
    lastUpdated: globalDataStore.lastUpdated
  };
};

/**
 * Notify all listeners of data update
 */
const notifyListeners = (data: any) => {
  globalDataStore.listeners.forEach(callback => {
    try {
      callback(data);
    } catch (error) {
      console.error('Error in data update listener:', error);
    }
  });
};

/**
 * Main data handler function
 * Called whenever data is fetched from API, retrieved from cache, or obtained from pending request
 */
export const handleData = (data: any, options: DataHandlerOptions): any => {
  const { dataset, params, source, requestKey } = options;
  
  // Update global data store
  globalDataStore.data = data;
  globalDataStore.dataset = dataset;
  globalDataStore.params = params;
  globalDataStore.lastUpdated = Date.now();
  
  // Notify all listeners
  notifyListeners(data);
  
  // Log the data object with context
  console.group(`📊 Data Handler - ${dataset}`);
  console.log(`🔹 Source: ${source}`);
  console.log(`🔹 Dataset: ${dataset}`);
  
  if (params) {
    console.log(`🔹 Parameters:`, params);
  }
  
  if (requestKey) {
    console.log(`🔹 Request Key: ${requestKey}`);
  }
  
  console.log(`🔹 Data Object:`, data);
  
  // Log data structure info
  if (data) {
    // if (data.dimension) {
    //   console.log(`🔹 Available Dimensions:`, Object.keys(data.dimension));
    // }
    
    // if (data.dimension?.time?.category?.index) {
    //   const timeKeys = Object.keys(data.dimension.time.category.index);
    //   console.log(`🔹 Available Years: ${timeKeys.length} periods (${timeKeys[timeKeys.length - 1]} - ${timeKeys[0]})`);
    // }
    
    // if (data.value) {
    //   const valueCount = Object.keys(data.value).length;
    //   console.log(`🔹 Data Points: ${valueCount} values`);
    // }
    
    if (data.dimension?.geo?.category?.index) {
      const geoKeys = Object.keys(data.dimension.geo.category.index);
      console.log(`🔹 Countries: ${geoKeys.length} (${geoKeys.slice(0, 3).join(', ')}${geoKeys.length > 3 ? '...' : ''})`);
      
      // Debug: Show country data with tax breakdown values
      if (data.dimension?.tax?.category?.index) {
        console.log(`🔹 Tax Breakdown Debug:`);
        const timeKeys = Object.keys(data.dimension.time.category.index);
        const latestTime = timeKeys[timeKeys.length - 1];
        const latestTimeIndex = data.dimension.time.category.index[latestTime];
        const taxKeys = Object.keys(data.dimension.tax.category.index);
        
        geoKeys.slice(0, 5).forEach(geoCode => { // Show first 5 countries
          const geoIndex = data.dimension.geo.category.index[geoCode];
          const countryName = data.dimension.geo.category.label[geoCode] || geoCode;
          const taxValues: string[] = [];
          
          taxKeys.forEach((taxCode, taxIndex) => {
            const taxName = data.dimension.tax.category.label[taxCode] || taxCode;
            // Calculate the index for this specific combination
            const valueIndex = geoIndex * timeKeys.length * taxKeys.length + 
                              taxIndex * timeKeys.length + 
                              latestTimeIndex;
            const value = data.value[valueIndex];
            taxValues.push(`${taxName}: ${value !== null && value !== undefined ? parseFloat(value).toFixed(4) : 'null'}`);
          });
          
          console.log(`   ${countryName}: [${taxValues.join(', ')}]`);
        });
      }
    }
  }
  
  console.groupEnd();
  
  // Return the data unchanged for further processing
  return data;
};

/**
 * Helper function to format parameters for display
 */
export const formatParams = (params: Record<string, string | string[]>): string => {
  return Object.entries(params)
    .map(([key, value]) => {
      if (Array.isArray(value)) {
        return `${key}=[${value.join(',')}]`;
      }
      return `${key}=${value}`;
    })
    .join(' & ');
};

/**
 * Helper function to extract years from Eurostat data
 */
export const extractYearsFromData = (data: any): string[] => {
  if (data?.dimension?.time?.category?.index) {
    const timeCategories = Object.keys(data.dimension.time.category.index);
    return timeCategories.sort((a, b) => b.localeCompare(a));
  }
  return [];
};
