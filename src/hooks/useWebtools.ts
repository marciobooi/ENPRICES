import { useEffect } from 'react';

/**
 * Hook to initialize Eurostat Webtools (Cookie Consent Kit and Globan)
 * These tools are loaded via JSON config and load.js in index.html
 */
export const useWebtoolsInit = () => {
  useEffect(() => {
    let retryCount = 0;
    const maxRetries = 5; // Reduced retries for development
    
    // Check if we're in development mode
    const isDevelopment = import.meta.env.DEV || window.location.hostname === 'localhost';
    
    // Check for webtools availability
    const checkWebtools = () => {
      if (typeof window !== 'undefined') {
        try {
          const webtoolsAvailable = !!(window as any).$wt;
          
          if (webtoolsAvailable) {
            console.info('Eurostat Webtools loaded successfully');
            return true;
          } else if (retryCount < maxRetries) {
            // Retry after a short delay
            retryCount++;
            setTimeout(checkWebtools, 1000); // Increased delay
          } else if (isDevelopment) {
            // In development, webtools may not be available - this is expected
            console.warn('Eurostat Webtools not available (development mode - this is normal)');
          }
        } catch (error) {
          if (isDevelopment) {
            console.warn('Webtools initialization error (development mode):', error);
          } else {
            console.error('Webtools initialization error:', error);
          }
        }
      }
      return false;
    };

    // Initial check after a delay to allow scripts to load
    const timer = setTimeout(() => {
      checkWebtools();
    }, 2000); // Increased initial delay
    
    return () => clearTimeout(timer);
  }, []);
};

/**
 * Utility functions for working with Webtools
 */
export const webtools = {
  /**
   * Check if Cookie Consent Kit is available
   */
  isCCKAvailable: (): boolean => {
    return typeof window !== 'undefined' && 
           (typeof window.cck !== 'undefined' || typeof (window as any).CCK !== 'undefined');
  },

  /**
   * Check if Globan is available
   */
  isGlobanAvailable: (): boolean => {
    return typeof window !== 'undefined' && 
           (typeof window.globan !== 'undefined' || typeof (window as any).GLOBAN !== 'undefined');
  },

  /**
   * Check if Webtools $wt object is available
   */
  isWebtoolsReady: (): boolean => {
    return typeof window !== 'undefined' && 
           typeof (window as any).$wt !== 'undefined' &&
           typeof (window as any).$wt === 'object';
  },

  /**
   * Get all available webtools-related globals
   */
  getAvailableWebtools: (): string[] => {
    if (typeof window === 'undefined') return [];
    return Object.keys(window).filter(key => 
      key.toLowerCase().includes('cck') || 
      key.toLowerCase().includes('globan') ||
      key.toLowerCase().includes('webtool')
    );
  }
};
