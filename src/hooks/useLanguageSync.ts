import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

/**
 * Hook to synchronize i18next language with Webtools and document language
 */
export const useLanguageSync = () => {
  const { i18n } = useTranslation();

  useEffect(() => {
    const handleLanguageChange = (lng: string) => {
      // Update document language attribute
      document.documentElement.lang = lng;
      
      // Update HTML title based on language
      const titles = {
        en: 'Enprices - Eurostat',
        fr: 'Enprices - Eurostat',
        de: 'Enprices - Eurostat'
      };
      document.title = titles[lng as keyof typeof titles] || titles.en;
      
      // Update document and page elements with new language
      try {
        
        // Update existing JSON configurations
        const jsonScripts = document.querySelectorAll('script[type="application/json"]');
        let configUpdated = false;
        
        jsonScripts.forEach(script => {
          try {
            const config = JSON.parse(script.textContent || '{}');
            if (config.utility === 'cck') {
              if (config.lang !== lng) {
                config.lang = lng;
                // Ensure cookie notice URL is properly configured for the language
                if (!config.url || typeof config.url === 'string') {
                  config.url = {
                    "en": "https://ec.europa.eu/info/privacy-policy/cookies_en",
                    "fr": "https://ec.europa.eu/info/privacy-policy/cookies_fr", 
                    "de": "https://ec.europa.eu/info/privacy-policy/cookies_de"
                  };
                }
                script.textContent = JSON.stringify(config, null, 2);
                configUpdated = true;
              }
            } else if (config.utility === 'globan') {
              if (config.lang !== lng) {
                config.lang = lng;
                script.textContent = JSON.stringify(config, null, 2);
                configUpdated = true;
              }
            }
          } catch (e) {
            console.warn('Could not update script config:', e);
          }
        });
        
        // Use Webtools API to regenerate Globan with new language
        const isDevelopment = import.meta.env.DEV || window.location.hostname === 'localhost';
        
        if (typeof window !== 'undefined' && (window as any).$wt) {
          try {
            // Regenerate Globan with new language
            if ((window as any).$wt.globan && typeof (window as any).$wt.globan.regenerate === 'function') {
              try {
                (window as any).$wt.globan.regenerate({
                  lang: lng
                });
              } catch (globanError) {
                if (isDevelopment) {
                  console.warn('Globan regeneration failed (development mode):', globanError);
                } else {
                  console.error('Globan regeneration failed:', globanError);
                }
              }
            } else {
              // Try again after a delay in case Webtools is still loading
              setTimeout(() => {
                if ((window as any).$wt?.globan?.regenerate) {
                  try {
                    (window as any).$wt.globan.regenerate({
                      lang: lng
                    });
                  } catch (globanError) {
                    if (isDevelopment) {
                      console.warn('Delayed Globan regeneration failed (development mode):', globanError);
                    } else {
                      console.error('Delayed Globan regeneration failed:', globanError);
                    }
                  }
                }
              }, 1000);
            }
            
            // Also regenerate CCK if available
            if ((window as any).$wt.cck && typeof (window as any).$wt.cck.regenerate === 'function') {
              try {
                (window as any).$wt.cck.regenerate({
                  lang: lng,
                  url: {
                    "en": "https://ec.europa.eu/info/privacy-policy/cookies_en",
                    "fr": "https://ec.europa.eu/info/privacy-policy/cookies_fr", 
                    "de": "https://ec.europa.eu/info/privacy-policy/cookies_de"
                  }
                });
              } catch (cckError) {
                if (isDevelopment) {
                  console.warn('CCK regeneration failed (development mode):', cckError);
                } else {
                  console.error('CCK regeneration failed:', cckError);
                }
              }
            }
            
          } catch (webtoolsError) {
            if (isDevelopment) {
              console.warn('Could not use Webtools API for language change (development mode):', webtoolsError);
            } else {
              console.error('Could not use Webtools API for language change:', webtoolsError);
            }
            // Fallback: suggest page refresh for Webtools language change
            if (configUpdated) {
              // Webtools configurations updated, manual refresh may be needed for complete language change
            }
          }
        } else if (!isDevelopment && configUpdated) {
          // Only show webtools unavailable warning in production when config was updated
          console.warn('Webtools not available for language synchronization');
        }
        
        // Webtools not available yet, try again after a delay for any config updates
        if (configUpdated && !isDevelopment) {
          if (configUpdated) {
            setTimeout(() => {
              if (typeof window !== 'undefined' && (window as any).$wt) {
                try {
                  // Retry Globan regeneration
                  if ((window as any).$wt.globan?.regenerate) {
                    (window as any).$wt.globan.regenerate({ lang: lng });
                  }
                  // Retry CCK regeneration
                  if ((window as any).$wt.cck?.regenerate) {
                    (window as any).$wt.cck.regenerate({
                      lang: lng,
                      url: {
                        "en": "https://ec.europa.eu/info/privacy-policy/cookies_en",
                        "fr": "https://ec.europa.eu/info/privacy-policy/cookies_fr", 
                        "de": "https://ec.europa.eu/info/privacy-policy/cookies_de"
                      }
                    });
                  }
                } catch (retryError) {
                  console.warn('Webtools retry failed:', retryError);
                }
              }
            }, 2000); // Wait 2 seconds for Webtools to load
          }
        }
        
      } catch (error) {
        console.warn('Could not update Webtools language:', error);
      }
    };

    // Listen for language changes
    i18n.on('languageChanged', handleLanguageChange);
    
    // Set initial language
    handleLanguageChange(i18n.language);

    // Cleanup
    return () => {
      i18n.off('languageChanged', handleLanguageChange);
    };
  }, [i18n]);
};

/**
 * Available languages configuration
 */
export const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇬🇧' },
  { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷' },
  { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪' },
] as const;

export type SupportedLanguage = typeof SUPPORTED_LANGUAGES[number]['code'];

/**
 * Utility function to refresh Webtools with current language
 * Uses the official Webtools API for regeneration
 */
export const refreshWebtoolsLanguage = () => {
  if (typeof window !== 'undefined') {
    // Get current language from i18next
    const currentLang = window.localStorage.getItem('i18nextLng') || 'en';
    
    // Try to use Webtools API first
    if ((window as any).$wt) {
      try {
        // Regenerate Globan with current language
        if ((window as any).$wt.globan?.regenerate) {
          (window as any).$wt.globan.regenerate({
            lang: currentLang
          });
        }
        
        // Regenerate CCK with current language
        if ((window as any).$wt.cck?.regenerate) {
          (window as any).$wt.cck.regenerate({
            lang: currentLang,
            url: {
              "en": "https://ec.europa.eu/info/privacy-policy/cookies_en",
              "fr": "https://ec.europa.eu/info/privacy-policy/cookies_fr", 
              "de": "https://ec.europa.eu/info/privacy-policy/cookies_de"
            }
          });
        }
        
        return true; // Successfully regenerated
      } catch (error) {
        console.warn('Could not regenerate Webtools:', error);
      }
    }
    
    // Fallback: Reload the page if API is not available
    if (confirm(`To apply the language change to all components including EU banners, the page needs to be refreshed. Refresh now?`)) {
      window.location.reload();
      return true;
    }
    
    return false;
  }
  return false;
};

/**
 * Check if Webtools language differs from app language
 */
export const checkWebtoolsLanguageSync = (): boolean => {
  if (typeof window === 'undefined') return true;
  
  try {
    const appLang = window.localStorage.getItem('i18nextLng') || 'en';
    const jsonScripts = document.querySelectorAll('script[type="application/json"]');
    
    for (const script of jsonScripts) {
      const config = JSON.parse(script.textContent || '{}');
      if (config.utility === 'globan' || config.utility === 'cck') {
        if (config.lang !== appLang) {
          return false; // Languages are out of sync
        }
      }
    }
    return true; // Languages are in sync
  } catch (error) {
    console.warn('Could not check Webtools language sync:', error);
    return true; // Assume sync to avoid unnecessary warnings
  }
};
