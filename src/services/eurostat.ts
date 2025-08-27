import axios from 'axios';
import { handleData } from './handleData';

const EUROSTAT_API_BASE = 'https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

interface CachedData {
  data: any;
  timestamp: number;
}

class EurostatService {
  private pendingRequests = new Map<string, Promise<any>>();
  private getCacheKey(dataset: string, params?: Record<string, string | string[]>): string {
    let paramString = '';
    if (params) {
      // Sort the parameters by key to ensure consistent cache keys
      const sortedKeys = Object.keys(params).sort();
      const urlParams = new URLSearchParams();
      
      sortedKeys.forEach(key => {
        const value = params[key];
        if (Array.isArray(value)) {
          // Sort array values to ensure consistent ordering
          const sortedValues = [...value].sort();
          sortedValues.forEach(v => urlParams.append(key, v));
        } else {
          urlParams.append(key, value);
        }
      });
      paramString = urlParams.toString();
    }
    return `eurostat_${dataset}_${paramString}`;
  }

  private isDataFresh(timestamp: number): boolean {
    return Date.now() - timestamp < CACHE_DURATION;
  }

  private getFromCache(key: string): any | null {
    try {
      const cached = localStorage.getItem(key);
      if (!cached) return null;

      const parsedData: CachedData = JSON.parse(cached);
      
      if (this.isDataFresh(parsedData.timestamp)) {
        return parsedData.data;
      } else {
        // Remove expired data
        localStorage.removeItem(key);
        return null;
      }
    } catch (error) {
      console.error('Error reading from cache:', error);
      return null;
    }
  }

  private saveToCache(key: string, data: any): void {
    try {
      const cacheData: CachedData = {
        data,
        timestamp: Date.now()
      };
      localStorage.setItem(key, JSON.stringify(cacheData));
    } catch (error) {
      console.error('Error saving to cache:', error);
    }
  }

  async fetchData(dataset: string, params?: Record<string, string | string[]>): Promise<any> {
    const cacheKey = this.getCacheKey(dataset, params);
    
    // Try to get from cache first
    const cachedData = this.getFromCache(cacheKey);
    if (cachedData) {
      // Handle cached data
      handleData(cachedData, { 
        dataset, 
        params, 
        source: 'cache',
        requestKey: cacheKey 
      });
      return cachedData;
    }

    // Check if this request is already pending
    const pendingRequest = this.pendingRequests.get(cacheKey);
    if (pendingRequest) {
      const result = await pendingRequest;
      // Handle data from pending request
      handleData(result, { 
        dataset, 
        params, 
        source: 'pending',
        requestKey: cacheKey 
      });
      return result;
    }

    // If not in cache or expired, fetch from API
    const fetchPromise = this.performFetch(dataset, params, cacheKey);
    
    // Store the pending request
    this.pendingRequests.set(cacheKey, fetchPromise);
    
    try {
      const result = await fetchPromise;
      // Handle fresh API data
      handleData(result, { 
        dataset, 
        params, 
        source: 'api',
        requestKey: cacheKey 
      });
      return result;
    } finally {
      // Remove the pending request when done
      this.pendingRequests.delete(cacheKey);
    }
  }

  private async performFetch(dataset: string, params: Record<string, string | string[]> | undefined, cacheKey: string): Promise<any> {
    try {
      const url = `${EUROSTAT_API_BASE}/${dataset}`;
      
      // Build query string manually to handle array parameters correctly
      const queryParams = new URLSearchParams();
      queryParams.append('format', 'JSON');
      queryParams.append('lang', 'EN');
      
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (Array.isArray(value)) {
            // Add each array value as a separate parameter
            value.forEach(v => queryParams.append(key, v));
          } else {
            queryParams.append(key, value);
          }
        });
      }
      
      const fullUrl = `${url}?${queryParams.toString()}`;
      
      const response = await axios.get(fullUrl, {
        timeout: 30000 // 30 seconds timeout
      });

      const data = response.data;
      
      // Save to cache
      this.saveToCache(cacheKey, data);
      
      return data;
    } catch (error) {
      console.error('Error fetching Eurostat data:', error);
      throw new Error(`Failed to fetch data for dataset: ${dataset}`);
    }
  }

  async fetchAvailableYears(dataset: string, params: Record<string, string | string[]>): Promise<string[]> {
    try {
      const data = await this.fetchData(dataset, params);
      
      // Extract time dimension from Eurostat response
      if (data && data.dimension && data.dimension.time && data.dimension.time.category && data.dimension.time.category.index) {
        const timeCategories = Object.keys(data.dimension.time.category.index);
        // Sort years in descending order (most recent first)
        return timeCategories.sort((a, b) => b.localeCompare(a));
      }
      
      return [];
    } catch (error) {
      console.error('Error fetching available years:', error);
      return [];
    }
  }

  clearCache(): void {
    try {
      const keys = Object.keys(localStorage);
      const eurostatKeys = keys.filter(key => key.startsWith('eurostat_'));
      
      eurostatKeys.forEach(key => {
        localStorage.removeItem(key);
      });
      
      // Also clear pending requests
      this.pendingRequests.clear();
      
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  }

  getCacheInfo(): { key: string; size: string; age: string }[] {
    try {
      const keys = Object.keys(localStorage);
      const eurostatKeys = keys.filter(key => key.startsWith('eurostat_'));
      
      return eurostatKeys.map(key => {
        const value = localStorage.getItem(key);
        const size = value ? `${(value.length / 1024).toFixed(2)} KB` : '0 KB';
        
        try {
          const parsed: CachedData = JSON.parse(value || '{}');
          const ageMs = Date.now() - parsed.timestamp;
          const ageHours = Math.floor(ageMs / (1000 * 60 * 60));
          const age = `${ageHours}h ago`;
          
          return { key, size, age };
        } catch {
          return { key, size, age: 'unknown' };
        }
      });
    } catch (error) {
      console.error('Error getting cache info:', error);
      return [];
    }
  }

  /**
   * Fetch all consumption bands for a specific country and time period
   * Used for drill-down functionality when clicking on a country bar
   */
  async fetchCountryBands(dataset: string, countryCode: string, timePeriod: string, params?: Record<string, string | string[]>): Promise<any> {
    try {
      // Get dataset configuration to know available consumption bands
      const { getDatasetConfig } = await import('../data/energyData');
      const config = getDatasetConfig(dataset);
      
      if (!config || !config.consoms || config.consoms.length === 0) {
        throw new Error(`No consumption bands available for dataset ${dataset}`);
      }

      // Create parameters for fetching all bands for this country
      const bandParams: Record<string, string | string[]> = {
        geo: countryCode,
        time: timePeriod,
        consom: config.consoms, // Fetch all available consumption bands
        ...params
      };

      // Remove any existing consom parameter to avoid conflicts
      delete bandParams.consom;

      const cacheKey = this.getCacheKey(dataset, bandParams);
      
      // Try to get from cache first
      const cachedData = this.getFromCache(cacheKey);
      if (cachedData) {
        handleData(cachedData, { 
          dataset, 
          params: bandParams, 
          source: 'cache',
          requestKey: cacheKey 
        });
        return cachedData;
      }

      // Check if this request is already pending
      const pendingRequest = this.pendingRequests.get(cacheKey);
      if (pendingRequest) {
        const result = await pendingRequest;
        handleData(result, { 
          dataset, 
          params: bandParams, 
          source: 'pending',
          requestKey: cacheKey 
        });
        return result;
      }

      // Fetch from API
      const fetchPromise = this.performFetch(dataset, bandParams, cacheKey);
      
      this.pendingRequests.set(cacheKey, fetchPromise);
      
      try {
        const result = await fetchPromise;
        handleData(result, { 
          dataset, 
          params: bandParams, 
          source: 'api',
          requestKey: cacheKey 
        });
        return result;
      } finally {
        this.pendingRequests.delete(cacheKey);
      }
    } catch (error) {
      console.error('Error fetching country bands:', error);
      throw new Error(`Failed to fetch bands for country ${countryCode}: ${error}`);
    }
  }
}

export const eurostatService = new EurostatService();
