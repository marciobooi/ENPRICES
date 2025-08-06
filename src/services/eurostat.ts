import axios from 'axios';

const EUROSTAT_API_BASE = 'https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

interface CachedData {
  data: any;
  timestamp: number;
}

class EurostatService {
  private getCacheKey(dataset: string, params?: Record<string, string | string[]>): string {
    let paramString = '';
    if (params) {
      const urlParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          value.forEach(v => urlParams.append(key, v));
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
        console.log(`Cache hit for ${key}`);
        return parsedData.data;
      } else {
        // Remove expired data
        localStorage.removeItem(key);
        console.log(`Cache expired for ${key}`);
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
      console.log(`Data cached for ${key}`);
    } catch (error) {
      console.error('Error saving to cache:', error);
    }
  }

  async fetchData(dataset: string, params?: Record<string, string | string[]>): Promise<any> {
    const cacheKey = this.getCacheKey(dataset, params);
    
    // Try to get from cache first
    const cachedData = this.getFromCache(cacheKey);
    if (cachedData) {
      return cachedData;
    }

    // If not in cache or expired, fetch from API
    try {
      console.log(`Fetching fresh data for ${dataset}`, params);
      
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
      console.log('Final URL:', fullUrl);
      
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
      
      console.log(`Cleared ${eurostatKeys.length} cached items`);
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
}

export const eurostatService = new EurostatService();
