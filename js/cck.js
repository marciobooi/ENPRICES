/**
 * Cookie Consent Kit (CCK) Management
 * Handles re-rendering of the EU Cookie Consent Banner on language change
 * 
 * Note: CCK auto-initializes via the JSON config in the HTML head
 */

const cckManager = {
  initialized: true, // CCK is auto-initialized via HTML config

  /**
   * Regenerate the CCK when language changes
   * This ensures the banner is updated in the new language
   * Uses $wt.cck.regenerate(params) with language parameter
   */
  regenerate: function(lang) {
    // Ensure language is lowercase
    const langLower = lang ? lang.toLowerCase() : 'en';
    
    // Set the document language
    document.documentElement.lang = langLower;

    // Wait for webtools and CCK to be available
    const tryRegenerate = () => {
      if (typeof $wt === 'undefined' || !$wt.cck || !$wt.cck.regenerate) {
        // Retry after a short delay
        setTimeout(tryRegenerate, 100);
        return;
      }

      try {
        // Regenerate the CCK banner with the new language
        $wt.cck.regenerate({
          lang: langLower
        });
        console.log('[CCK] Cookie Consent Kit regenerated for language:', langLower);
      } catch (error) {
        console.error('[CCK] Error regenerating CCK:', error);
      }
    };

    // Start trying to regenerate
    tryRegenerate();
  },

  /**
   * Get CCK cookie value
   * Returns the cck1 cookie which stores user's cookie preferences
   */
  getCookiePreference: function() {
    if (typeof $wt === 'undefined' || !$wt.cookie || !$wt.cookie.get) {
      console.warn('[CCK] Cannot get cookie - webtools API not available');
      return null;
    }

    try {
      const cookieValue = $wt.cookie.get('cck1');
      console.log('[CCK] Cookie preference:', cookieValue);
      return cookieValue;
    } catch (error) {
      console.error('[CCK] Error getting cookie:', error);
      return null;
    }
  }
};

/**
 * Hook into language change event
 * Override the original ChangeLanguage function to regenerate CCK
 */
const originalChangeCCKLanguageFn = function() {
  if (typeof languageNameSpace !== 'undefined' && languageNameSpace.ChangeLanguage) {
    const originalChangeLanguage = languageNameSpace.ChangeLanguage;
    
    languageNameSpace.ChangeLanguage = function(val) {
      // Call original language change function
      originalChangeLanguage.call(this, val);
      
      // Regenerate CCK with new language
      cckManager.regenerate(val);
    };
  }
};

/**
 * Set up event listeners for CCK banner events
 */
function setupCCKEventListeners() {
  // Banner is displayed
  if (typeof window !== 'undefined') {
    window.addEventListener('cck_banner_displayed', () => {
      console.log('[CCK] Banner displayed to user');
    });

    // All cookies accepted
    window.addEventListener('cck_all_accepted', () => {
      console.log('[CCK] User accepted all cookies');
      // You can add tracking or other logic here
    });

    // Only technical/essential cookies accepted
    window.addEventListener('cck_technical_accepted', () => {
      console.log('[CCK] User accepted only essential cookies');
      // You can disable non-essential tracking here
    });
  }
}

// Try to hook immediately if languageNameSpace is already available
if (typeof languageNameSpace !== 'undefined') {
  originalChangeCCKLanguageFn();
} else {
  // Otherwise, hook when it becomes available
  document.addEventListener('DOMContentLoaded', originalChangeCCKLanguageFn);
}

// Set up CCK event listeners
setupCCKEventListeners();
