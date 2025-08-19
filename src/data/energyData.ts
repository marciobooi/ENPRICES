/**
 * Energy data constants and configurations for Eurostat energy prices
 * Includes countries, products, consumers, units, taxes, currencies, and dataset configurations
 */




// All available countries for energy data
export const allCountries = [
  "EU27_2020", "EA", "BE", "BG", "CZ", "DK", "DE", "EE", "IE", "EL", "ES", "FR", 
  "HR", "IT", "CY", "LV", "LT", "LU", "HU", "MT", "NL", "AT", "PL", "PT", "RO", 
  "SI", "SK", "FI", "SE", "IS", "LI", "NO", "ME", "MK", "AL", "RS", "TR", "BA", 
  "XK", "MD", "UA", "GE"
];

// Country groupings for organized display and filtering
export const AGGREGATES_COUNTRY_CODES = ["EU27_2020", "EA"];

export const EU_COUNTRY_CODES = [
  "BE", "BG", "CZ", "DK", "DE", "EE", "IE", "EL", "ES", "FR", "HR", "IT", 
  "CY", "LV", "LT", "LU", "HU", "MT", "NL", "AT", "PL", "PT", "RO", "SI", 
  "SK", "FI", "SE"
];

export const EFTA_COUNTRY_CODES = ["IS", "LI", "NO"];

export const ENLARGEMENT_COUNTRY_CODES = [
  "BA", "ME", "MD", "MK", "GE", "AL", "RS", "TR", "UA", "XK"
];

// Energy products mapping
export const energyProducts = {
  "4100": "Natural gas", // Natural gas
  "6000": "Electricity", // Electricity
};

// Helper function to get energy product options
export const getEnergyProductOptions = () => {
  return Object.entries(energyProducts).map(([value, label]) => ({
    value,
    label
  }));
};

// Helper function to get energy consumer options
export const getEnergyConsumerOptions = () => {
  return Object.entries(energyConsumers).map(([value, label]) => ({
    value,
    label
  }));
};

// Helper function to get energy year options
export const getEnergyYearOptions = () => {
  return Object.entries(energyYears).map(([value, label]) => ({
    value,
    label
  })).reverse(); // Most recent years first
};

// Helper function to get consumption band options from dataset config
export const getConsumptionBandOptions = (datasetCode: string = "nrg_pc_204") => {
  const config = getDatasetConfig(datasetCode);
  if (!config) return [];
  
  return config.consoms.map(value => ({
    value,
    label: value // Using the dataset codes as labels for now
  }));
};

// Helper function to get unit options from dataset config
export const getUnitOptions = (datasetCode: string = "nrg_pc_204") => {
  const config = getDatasetConfig(datasetCode);
  if (!config) return [];
  
  return config.unit.map(value => ({
    value,
    label: value // Using the dataset codes as labels for now
  }));
};

// Helper function to get default consumption band from dataset config
export const getDefaultConsumptionBand = (datasetCode: string = "nrg_pc_204") => {
  const config = getDatasetConfig(datasetCode);
  return config?.defaultConsom || "";
};

// Helper function to get default unit from dataset config
export const getDefaultUnit = (datasetCode: string = "nrg_pc_204") => {
  const config = getDatasetConfig(datasetCode);
  return config?.defaultUnit || "";
};

// Helper function to get default currency from dataset config
export const getDefaultCurrency = (datasetCode: string = "nrg_pc_204") => {
  const config = getDatasetConfig(datasetCode);
  return config?.defaultCurrency || "EUR";
};

// Consumer types
export const energyConsumers = {
  "HOUSEHOLD": "Household consumers",
  "N_HOUSEHOLD": "Non-household consumers"
};

// Available years for energy price data
export const energyYears = (() => {
  const currentYear = new Date().getFullYear();
  const startYear = 2007; // Eurostat energy price data typically starts from 2007
  const years: Record<string, string> = {};
  
  for (let year = startYear; year <= currentYear; year++) {
    years[year.toString()] = year.toString();
  }
  
  return years;
})();

// Energy units
export const energyUnits = {
  "GJ_GCV": "Gigajoule (gross calorific value)",
  "KWH": "Kilowatt-hour",
  "MWH": "Megawatt-hour",
};

// Tax components
export const energyTaxs = {
  "X_TAX": "",
  "X_VAT": "",
  "I_TAX": "",
  "NRG_SUP": "",
  "NETC": "",
  "TAX_FEE_LEV_CHRG": "",
  "VAT": "",
  "TAX_RNW": "",
  "TAX_CAP": "",
  "TAX_ENV": "",
  "OTH": "",
  "TAX_NUC": "",
  "TAX_LEV_X_VAT": ""
};

// Currency types
export const energyCurrencies = {
  "EUR": "",
  "NAT": "",
  "PPS": ""
};

// Breakdown types
export const energyBreakdowns = {
  "DP_ES": "",
  "DP_NC": "",
  "DP_TL": ""
};


export const barChartColors = {
  "EU27_2020": "#cca300ff",
  "EA": "#208486ff",
  "default": "#0e47cbff"
};


export const detailsBarChartColors = {
  "TOTAL":'#0e47cbff',
	"NETC":'#06D7FF',
	"TAX_LEV_X_VAT":'#19FF99',
	"VAT":'#4C99FF',
	"TAX_RNW":'#FFD900',
	"TAX_CAP":'#C88000',
	"TAX_ENV":'#33D129',
	"TAX_NUC":'#FFB800',	
	"OTH":'#E67500',
	"NRG_SUP":'#05A0FF',
  "X_TAX": "#cca300ff",
  "X_VAT": "#208486ff",
  "I_TAX": "#0e47cbff"
}




// Dataset configurations interface
export interface DatasetConfig {
  product: string;
  consumer: string;
  consoms: string[];
  unit: string[];
  currency: string[];
  nrg_prc?: string[];
  defaultConsom: string;
  defaultUnit: string;
  defaultCurrency: string;
}

// Dataset configurations for different energy price datasets
export const codesDataset: Record<string, DatasetConfig> = {
  "nrg_pc_202_c": {
    "product": "4100",
    "consumer": "HOUSEHOLD",
    "consoms": ["TOT_GJ", "GJ_LT20", "GJ20-199", "GJ_GE200"],
    "unit": ["GJ_GCV", "KWH"],
    "currency": ["EUR", "PPS"],
    "nrg_prc": ["NETC", "NRG_SUP", "OTH", "TAX_CAP", "TAX_ENV", "TAX_RNW", "VAT"],
    "defaultConsom": "TOT_GJ",
    "defaultUnit": "KWH",
    "defaultCurrency": "EUR"
  },
  "nrg_pc_202": {
    "product": "4100",
    "consumer": "HOUSEHOLD",
    "consoms": ["TOT_GJ", "GJ_LT20", "GJ20-199", "GJ_GE200"],
    "unit": ["GJ_GCV", "KWH", "MWH"],
    "currency": ["EUR", "PPS"],
    "defaultConsom": "GJ20-199",
    "defaultUnit": "KWH",
    "defaultCurrency": "EUR"
  },
  "nrg_pc_203_c": {
    "product": "4100",
    "consumer": "N_HOUSEHOLD",
    "consoms": ["TOT_GJ", "GJ_LT1000", "GJ1000-9999", "GJ10000-99999", "GJ100000-999999", "GJ1000000-3999999", "GJ_GE4000000"],
    "unit": ["GJ_GCV", "KWH"],
    "currency": ["EUR", "PPS"],
    "nrg_prc": ["NETC", "NRG_SUP", "OTH", "TAX_CAP", "TAX_ENV", "TAX_RNW", "VAT"],
    "defaultConsom": "TOT_GJ",
    "defaultUnit": "KWH",
    "defaultCurrency": "EUR"
  },
  "nrg_pc_203": {
    "product": "4100",
    "consumer": "N_HOUSEHOLD",
    "consoms": ["TOT_GJ", "GJ_LT1000", "GJ1000-9999", "GJ10000-99999", "GJ100000-999999", "GJ1000000-3999999", "GJ_GE4000000"],
    "unit": ["GJ_GCV", "KWH", "MWH"],
    "currency": ["EUR", "PPS"],
    "defaultConsom": "GJ1000-9999",
    "defaultUnit": "KWH",
    "defaultCurrency": "EUR"
  },
  "nrg_pc_204_c": {
    "product": "6000",
    "consumer": "HOUSEHOLD",
    "consoms": ["TOT_KWH", "KWH_LT1000", "KWH1000-2499", "KWH2500-4999", "KWH5000-14999", "KWH_LE15000"],
    "unit": ["KWH", "MWH"],
    "currency": ["EUR", "PPS"],
    "nrg_prc": ["NETC", "NRG_SUP", "OTH", "TAX_CAP", "TAX_ENV", "TAX_NUC", "TAX_RNW", "VAT"],
    "defaultConsom": "TOT_KWH",
    "defaultUnit": "KWH",
    "defaultCurrency": "EUR"
  },
  "nrg_pc_204": {
    "product": "6000",
    "consumer": "HOUSEHOLD",
    "consoms": ["KWH_LT1000", "KWH_GE15000", "KWH5000-14999", "KWH2500-4999", "KWH1000-2499"],
    "unit": ["KWH", "MWH"],
    "currency": ["EUR", "PPS"],
    "defaultConsom": "KWH_LT1000",
    "defaultUnit": "KWH",
    "defaultCurrency": "EUR"
  },
  "nrg_pc_205_c": {
    "product": "6000",
    "consumer": "N_HOUSEHOLD",
    "consoms": ["TOT_MWH", "MWH_LT20", "MWH20-499", "MWH500-1999", "MWH2000-19999", "MWH20000-69999", "MWH70000-149999", "MWH_GE150000"],
    "unit": ["KWH", "MWH"],
    "currency": ["EUR", "PPS"],
    "nrg_prc": ["NRG_SUP", "NETC", "TAX_LEV_X_VAT", "VAT", "TAX_RNW", "TAX_CAP", "TAX_ENV", "TAX_NUC", "OTH"],
    "defaultConsom": "TOT_MWH",
    "defaultUnit": "KWH",
    "defaultCurrency": "EUR"
  },
  "nrg_pc_205": {
    "product": "6000",
    "consumer": "N_HOUSEHOLD",
    "consoms": ["TOT_KWH", "MWH_LT20", "MWH20-499", "MWH500-1999", "MWH2000-19999", "MWH20000-69999", "MWH70000-149999", "MWH_GE150000"],
    "unit": ["KWH", "MWH"],
    "currency": ["EUR", "PPS"],
    "defaultConsom": "MWH20-499",
    "defaultUnit": "KWH",
    "defaultCurrency": "EUR"
  },
};

// Helper function to get dataset configuration
export const getDatasetConfig = (datasetCode: string): DatasetConfig | undefined => {
  return codesDataset[datasetCode];
};

// Helper function to find dataset by product and consumer combination
export const getDatasetByProductAndConsumer = (product: string, consumer: string, component: boolean = false): string | undefined => {
  for (const [datasetCode, config] of Object.entries(codesDataset)) {
    if (config.product === product && config.consumer === consumer) {
      // If component is true, we want datasets with _c suffix
      // If component is false, we want datasets without _c suffix
      const hasComponentSuffix = datasetCode.endsWith('_c');
      if (component === hasComponentSuffix) {
        return datasetCode;
      }
    }
  }
  return undefined;
};

// Helper function to get consumption band options based on product and consumer
export const getConsumptionBandOptionsByContext = (product: string, consumer: string, component: boolean = false) => {
  const datasetCode = getDatasetByProductAndConsumer(product, consumer, component);
  if (!datasetCode) return [];
  
  return getConsumptionBandOptions(datasetCode);
};

// Helper function to get unit options based on product and consumer
export const getUnitOptionsByContext = (product: string, consumer: string, component: boolean = false) => {
  const datasetCode = getDatasetByProductAndConsumer(product, consumer, component);
  if (!datasetCode) return [];
  
  return getUnitOptions(datasetCode);
};

// Helper function to get default consumption band based on product and consumer
export const getDefaultConsumptionBandByContext = (product: string, consumer: string, component: boolean = false) => {
  const datasetCode = getDatasetByProductAndConsumer(product, consumer, component);
  if (!datasetCode) return "";
  
  return getDefaultConsumptionBand(datasetCode);
};

// Helper function to get default unit based on product and consumer
export const getDefaultUnitByContext = (product: string, consumer: string, component: boolean = false) => {
  const datasetCode = getDatasetByProductAndConsumer(product, consumer, component);
  if (!datasetCode) return "";
  
  return getDefaultUnit(datasetCode);
};

// Helper function to get available datasets
export const getAvailableDatasets = (): string[] => {
  return Object.keys(codesDataset);
};

