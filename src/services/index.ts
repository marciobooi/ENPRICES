// Eurostat service exports
export { eurostatService } from './eurostat';

// Data handler exports
export { handleData, formatParams, extractYearsFromData } from './handleData';

// Chart export service exports
export { exportChart, getChartInstance, isChartExportAvailable, getAvailableExportFormats } from './chartExport';
export type { ChartExportOptions } from './chartExport';

// i18n service exports
export { 
  translate, 
  getChartTitle, 
  getCountryName, 
  getCategoryName, 
  getUnitName, 
  getNavText, 
  getFooterText 
} from './i18n';
export type { Language, TranslationKey } from './i18n';
