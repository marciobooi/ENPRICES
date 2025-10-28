import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translation files
import enTranslations from './locales/translationsEn.json';
import frTranslations from './locales/translationsfr.json';
import deTranslations from './locales/translationsDe.json';


const resources = {
  en: {
    translation: enTranslations,
  },
  fr: {
    translation: frTranslations,
  },
  de: {
    translation: deTranslations,
  },
};

i18n
  // Detect user language
  .use(LanguageDetector)
  // Pass the i18n instance to react-i18next
  .use(initReactI18next)
  // Initialize i18next
  .init({
    resources,
    
    // Default language
    fallbackLng: 'en',
    
    // Debug mode (set to false in production)
    debug: false,
    
    // Language detection options
    detection: {
      // Order and from where user language should be detected
      order: ['querystring', 'cookie', 'localStorage', 'sessionStorage', 'navigator', 'htmlTag'],
      
      // Keys or params to lookup language from
      lookupQuerystring: 'lng',
      lookupCookie: 'i18next',
      lookupLocalStorage: 'i18nextLng',
      lookupSessionStorage: 'i18nextLng',
      
      // Cache user language
      caches: ['localStorage', 'cookie'],
    },
    
    // Interpolation options
    interpolation: {
      // React already does escaping
      escapeValue: false,
    },
    
    // Namespace options
    ns: ['translation'],
    defaultNS: 'translation',
    
    // React options
    react: {
      // Use React.Suspense for async loading
      useSuspense: false,
    },
  });

export default i18n;
