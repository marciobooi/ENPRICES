import translationsEn from '../i18n/locales/translationsEn.json';
import translationsFr from '../i18n/locales/translationsFr.json';
import translationsDe from '../i18n/locales/translationsDe.json';

// Type for supported languages
export type Language = 'en' | 'fr' | 'de';

// Available translations
const translations = {
  en: translationsEn,
  fr: translationsFr,
  de: translationsDe
};

export type TranslationKey = string;

/**
 * Get translated text for a given key
 */
export const translate = (key: TranslationKey, language: Language = 'en'): string => {
  const keys = key.split('.');
  let value: any = translations[language];
  
  for (const k of keys) {
    if (value && typeof value === 'object') {
      value = value[k];
    } else {
      return key; // Return the key if translation not found
    }
  }
  
  return typeof value === 'string' ? value : key;
};

/**
 * Get translated chart title
 */
export const getChartTitle = (titleCode: string, language: Language = 'en'): string => {
  return translate(titleCode, language);
};

/**
 * Get translated country name
 */
export const getCountryName = (countryCode: string, language: Language = 'en'): string => {
  return translate(`countries.${countryCode}`, language);
};

/**
 * Get translated category name
 */
export const getCategoryName = (categoryCode: string, language: Language = 'en'): string => {
  return translate(`categories.${categoryCode}`, language);
};

/**
 * Get translated unit name
 */
export const getUnitName = (unitCode: string, language: Language = 'en'): string => {
  return translate(`units.${unitCode}`, language);
};

/**
 * Get translated navigation text
 */
export const getNavText = (navKey: string, language: Language = 'en'): string => {
  return translate(`nav.${navKey}`, language);
};

/**
 * Get translated footer text
 */
export const getFooterText = (footerKey: string, language: Language = 'en'): string => {
  return translate(`footer.${footerKey}`, language);
};
