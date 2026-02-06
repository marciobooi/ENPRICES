/**
 * GLOBAN Widget Management
 * Handles initialization and re-rendering of the Eurostat Global Banner
 */

const globanManager = {
  initialized: false,

  /**
   * Initialize the GLOBAN widget with the current language
   * This function should be called AFTER REF.language is set
   */
  init: function() {
    // Check if REF and language are available
    if (typeof REF === 'undefined' || !REF.language) {
      console.warn('[GLOBAN] REF or language not yet available, retrying...');
      setTimeout(() => this.init(), 100);
      return;
    }

    // Wait for webtools to be available
    if (typeof $wt === 'undefined' || !$wt.render) {
      console.warn('[GLOBAN] Webtools not yet available, retrying...');
      setTimeout(() => this.init(), 100);
      return;
    }

    this.render(REF.language);
  },

  /**
   * Render the GLOBAN widget with the specified language
   * @param {string} lang - Language code (e.g., 'EN', 'FR', 'DE')
   */
  render: function(lang = 'EN') {
    if (typeof $wt === 'undefined' || !$wt.render) {
      console.warn('[GLOBAN] Webtools not available');
      return;
    }

    const globanContainer = document.getElementById('euGlobanContainer');
    if (!globanContainer) {
      console.warn('[GLOBAN] Container element not found');
      return;
    }

    try {
      $wt.render(globanContainer, {
        service: 'globan',
        theme: 'dark',
        logo: true,
        link: true,
        lang: lang.toLowerCase(),
        mode: false,
        zindex: 40
      });
      console.log('[GLOBAN] Widget rendered successfully in language:', lang);
      this.initialized = true;
    } catch (error) {
      console.error('[GLOBAN] Error rendering widget:', error);
    }
  },

  /**
   * Regenerate the GLOBAN widget when language changes
   * This ensures the banner is updated in the new language
   */
  regenerate: function(lang) {
    if (typeof $wt === 'undefined' || !$wt.globan || !$wt.globan.regenerate) {
      console.warn('[GLOBAN] Cannot regenerate - globan API not available');
      return;
    }

    try {
      const params = lang ? { lang: lang.toLowerCase() } : {};
      $wt.globan.regenerate(params);
      console.log('[GLOBAN] Widget regenerated for language:', lang || 'auto-detect');
    } catch (error) {
      console.error('[GLOBAN] Error regenerating widget:', error);
    }
  }
};

/**
 * Hook into language change event
 * Override the original ChangeLanguage function to regenerate GLOBAN
 */
const originalChangeLanguageFn = function() {
  if (typeof languageNameSpace !== 'undefined' && languageNameSpace.ChangeLanguage) {
    const originalChangeLanguage = languageNameSpace.ChangeLanguage;
    
    languageNameSpace.ChangeLanguage = function(val) {
      // Call original language change function
      originalChangeLanguage.call(this, val);
      
      // Regenerate GLOBAN with new language
      globanManager.regenerate(val);
    };
  }
};

// Try to hook immediately if languageNameSpace is already available
if (typeof languageNameSpace !== 'undefined') {
  originalChangeLanguageFn();
} else {
  // Otherwise, hook when it becomes available
  document.addEventListener('DOMContentLoaded', originalChangeLanguageFn);
}
