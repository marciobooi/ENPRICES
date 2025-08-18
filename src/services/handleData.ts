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

/**
 * Main data handler function
 * Called whenever data is fetched from API, retrieved from cache, or obtained from pending request
 */
export const handleData = (data: any, options: DataHandlerOptions): any => {
  const { dataset, params, source, requestKey } = options;
  
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
    if (data.dimension) {
      console.log(`🔹 Available Dimensions:`, Object.keys(data.dimension));
    }
    
    if (data.dimension?.time?.category?.index) {
      const timeKeys = Object.keys(data.dimension.time.category.index);
      console.log(`🔹 Available Years: ${timeKeys.length} periods (${timeKeys[timeKeys.length - 1]} - ${timeKeys[0]})`);
    }
    
    if (data.value) {
      const valueCount = Object.keys(data.value).length;
      console.log(`🔹 Data Points: ${valueCount} values`);
    }
    
    if (data.dimension?.geo?.category?.index) {
      const geoKeys = Object.keys(data.dimension.geo.category.index);
      console.log(`🔹 Countries: ${geoKeys.length} (${geoKeys.slice(0, 3).join(', ')}${geoKeys.length > 3 ? '...' : ''})`);
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
