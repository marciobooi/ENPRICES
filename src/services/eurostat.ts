import axios from 'axios';

const EUROSTAT_API_BASE = 'https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

interface CachedData {
  data: any;
  timestamp: number;
}

class EurostatService {
  private getCacheKey(dataset: string, params?: Record<string, string>): string {
    const paramString = params ? new URLSearchParams(params).toString() : '';
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

  async fetchData(dataset: string, params?: Record<string, string>): Promise<any> {
    const cacheKey = this.getCacheKey(dataset, params);
    
    // Try to get from cache first
    const cachedData = this.getFromCache(cacheKey);
    if (cachedData) {
      return cachedData;
    }

    // If not in cache or expired, fetch from API
    try {
      console.log(`Fetching fresh data for ${dataset}`);
      
      const url = `${EUROSTAT_API_BASE}/${dataset}`;
      const response = await axios.get(url, {
        params: {
          format: 'JSON',
          lang: 'EN',
          ...params
        },
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
