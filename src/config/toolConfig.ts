/**
 * Tool configuration: every lookup table of the tool lives here (colours, code mappings, dataset
 * definitions, countries, units, images). Components import from this file and never hard-code codes.
 *
 * The ENPRICES lookup tables. Labels that must be translated belong in src/locales.
 */

/* ------------------------------------------------------------------ */
/* PAGE IDENTITY (title, social preview, languages, contact, links)     */
/* ------------------------------------------------------------------ */

/**
 * Page identity of THIS tool: title, description, social preview card, languages, contact e-mail and links.
 *
 * A Vite plugin (plugins/siteMeta.ts) writes the identity into the static HTML at build time (<title>, description,
 * Open Graph, Twitter Card, canonical, page language), because social crawlers read the HTML and do not run
 * JavaScript. That is why this whole file is pure data: it is also read by Node during the build.
 *
 * Social metadata mirrors the legacy ENPRICES page.
 */
export const site = {
  /** Page title and `og:title`. */
  title: 'Energy prices - Eurostat',
  socialTitle: 'Energy Prices Visualisation Tool - Eurostat',
  description: 'This visualisation tool, created by Eurostat, displays electricity and natural gas prices in the EU and other European countries with a great level of detail. Users can interact with the data and customise the display in many different ways.',
  keywords: 'Prices, energy, data, statistics, gas price, electricity price, price of gas, price of electricity, electricity taxes, energy taxes, gas taxes, taxes on energy, taxes on gas, taxes on electricity, electricity levies, energy levies, gas levies, levies on energy, levies on gas, levies on electricity',
  author: 'Eurostat',
  siteName: 'Enprices',

  /** Absolute https address of the deployed page: what people share and the canonical address. */
  url: 'https://ec.europa.eu/eurostat/cache/energy/prices/enprices.html',

  /** Preview image shown in the post. The file lives in public/; its address is derived from `url`. */
  image: {
    /** Path inside the deployed folder (the file is public/images/share-preview.png). PNG or JPEG, never SVG. */
    file: 'images/enprices-share.jpg',
    type: 'image/jpeg',
    width: 1200,
    height: 600,
    alt: 'Energy prices visualisation tool - Eurostat',
  },

  /**
   * Languages of the tool, in the order the language selector shows them. `code` is the file name of the
   * translations (src/locales/<code>.json) and the value of `?language=`. To add a language: a new locale file and an
   * entry here.
   */
  languages: [
    { code: 'en', name: 'English' },
    { code: 'de', name: 'Deutsch' },
    { code: 'fr', name: 'Français' },
  ],
  defaultLanguage: 'en',

  /** Mailbox that receives the contact e-mail of the share menu. */
  contactEmail: 'ESTAT-ENERGY@ec.europa.eu',

  links: {
    /** Eurostat home page (the logo in the banner). */
    home: 'https://ec.europa.eu/eurostat/',
    /** Footer links; `{lang}` is replaced by the language code. */
    footer: {
      privacy: 'https://ec.europa.eu/info/privacy-policy_{lang}',
      legal: 'https://ec.europa.eu/info/legal-notice_{lang}',
      cookies: 'https://ec.europa.eu/info/cookies_{lang}',
    },
  },

  /** `og:locale`, with the other languages of the tool as alternates. The preview itself is one language. */
  locale: 'en_GB',
  localeAlternates: ['fr_FR', 'de_DE'],

  /** Large image above the text in X; `summary` would show a small square. */
  twitterCard: 'summary_large_image',
  robots: 'index, follow',

  /** Browser UI colour on mobile (ECL primary-180). */
  themeColor: '#082b7a',
} as const

export type LanguageCode = (typeof site.languages)[number]['code']

/** A link address with `{lang}` replaced by the language code. */
export function localizedLink(template: string, language: string): string {
  return template.replace('{lang}', language)
}

/** Address of the preview image: the folder of `url` plus `image.file`. */
export function shareImageUrl(pageUrl: string = site.url): string {
  return pageUrl.slice(0, pageUrl.lastIndexOf('/') + 1) + site.image.file
}

/* ------------------------------------------------------------------ */
/* COLOURS                                                             */
/* ------------------------------------------------------------------ */

/** Colour families; each family has 4 shades [base, light, vivid, dark]. Names follow rapidtables.com/web/color. */
export const euColors = {
  cornflower: ['#388AE2', '#A5DAF9', '#3CBEFE', '#096698'],
  cobalt: ['#2644A7', '#9CC1FA', '#2F8DFF', '#0F4998'],
  darkOrchid: ['#672DC4', '#CAADF9', '#9D61FC', '#441797'],
  berry: ['#AF155C', '#E6A7DC', '#D055C1', '#782A78'],
  fuchia: ['#B656BD', '#F5AFCC', '#F065A2', '#8B3363'],
  sunsetRed: ['#E04040', '#FFA3A3', '#FF4F4F', '#982630'],
  sienna: ['#AA5F18', '#DFB18B', '#C66914', '#734221'],
  darkGold: ['#B39421', '#EFD18C', '#E8AE00', '#866110'],
  forestGreen: ['#33A033', '#A2DDB2', '#26C56D', '#007243'],
  teal: ['#208486', '#92C1C0', '#008D8B', '#00525C'],
} as const

/** One colour per category code. Exposed as CSS variables `--color-<code>` (see applyColorCssVariables). */
export const categoryColors: Record<string, string> = {
  TOTAL: '#0E47CB',
  X_TAX: '#388AE2',
  ENERGY: '#06D7FF',
  VAT: '#19FF99',
  OTHER: '#4C99FF',
}

/** Neutral colour for everything that is not highlighted. */
export const backgroundColor = '#DCDCDC'

/** Extra named colours, also exposed as CSS variables. */
export const namedColors: Record<string, string> = {
  highlight: euColors.teal[2],
}

/** Generic series palette (pie charts, time series). */
export const seriesColors = [
  '#1F497D', '#faa519', '#32AFAF', '#F06423', '#C84B96', '#5FB441', '#286EB4',
  '#802F09', '#D73C41', '#5E620F', '#00A5E6', '#0F243E', '#B9C31E', '#1A5757',
] as const

/** Colour of each price component (the original ENPRICES palette); codes not listed take `componentFallbackColors`. */
export const componentColors: Record<string, string> = {
  TOTAL: '#388AE2',
  NETC: '#06D7FF',
  TAX_LEV_X_VAT: '#19FF99',
  VAT: '#4C99FF',
  TAX_RNW: '#FFD900',
  TAX_CAP: '#C88000',
  TAX_ENV: '#33D129',
  TAX_NUC: '#FFB800',
  OTH: '#E67500',
  NRG_SUP: '#05A0FF',
}

/**
 * The original tool paints the components by their position in the alphabetical list (its legend reads
 * Capacity taxes, Energy and supply, Environmental taxes, Network costs, ...), not by their code.
 */
export const componentPalette = ['#388AE2', '#06D7FF', '#19FF99', '#4C99FF', '#FFD900', '#C88000', '#33D129', '#FFB800'] as const

export const componentFallbackColors = [
  '#2CB523', '#8C4000', '#0033FF', '#00A68C', '#FF8C00', '#00D98C', '#2673FF', '#FFB300',
] as const

/** Colour of the three-part breakdown of a semi-annual price: energy, taxes and levies, VAT. */
export const breakdownColors = { energy: '#388AE2', taxes: '#06D7FF', vat: '#19FF99' } as const

/** Publish the colours as CSS custom properties: `--color-<code lowercased>`. Call once at start-up. */
export function applyColorCssVariables(root: HTMLElement = document.documentElement): void {
  for (const [code, color] of Object.entries(categoryColors)) {
    root.style.setProperty(`--color-${code.toLowerCase()}`, color)
  }
  for (const [name, color] of Object.entries(namedColors)) {
    root.style.setProperty(`--color-${name.toLowerCase()}`, color)
  }
}

/* ------------------------------------------------------------------ */
/* CODE MAPPINGS (source code <-> tool code)                           */
/* ------------------------------------------------------------------ */






/* ------------------------------------------------------------------ */
/* DATASETS (dimensions, allowed codes, labels)                        */
/* ------------------------------------------------------------------ */

export interface DatasetDefinition {
  /** Dimension order of the dataset. */
  dimensions: string[]
  /** Allowed codes per dimension (only the dimensions the tool filters on). */
  codes: Record<string, string[]>
  // Labels are translated in the locale files (`indicators.<code>`), not here.
}

/** One entry per Eurostat dataset code used by the tool. */
export const datasets: Record<string, DatasetDefinition> = {
  nrg_pc_202: { dimensions: ['freq', 'siec', 'nrg_cons', 'unit', 'tax', 'currency', 'geo', 'time'], codes: { tax: ['X_TAX', 'X_VAT', 'I_TAX'] } },
  nrg_pc_202_c: { dimensions: ['freq', 'nrg_prc', 'nrg_cons', 'currency', 'unit', 'geo', 'time'], codes: { nrg_prc: ['NRG_SUP', 'NETC', 'TAX_FEE_LEV_CHRG', 'VAT', 'TAX_RNW', 'TAX_CAP', 'TAX_ENV', 'TAX_NUC', 'TAX_FEE_LEV_CHRG_ALLOW', 'TAX_RNW_ALLOW', 'TAX_CAP_ALLOW', 'TAX_ENV_ALLOW', 'TAX_NUC_ALLOW', 'ALLOW_OTH', 'OTH'] } },
  nrg_pc_203: { dimensions: ['freq', 'siec', 'nrg_cons', 'unit', 'tax', 'currency', 'geo', 'time'], codes: { tax: ['X_TAX', 'X_VAT', 'I_TAX'] } },
  nrg_pc_203_c: { dimensions: ['freq', 'nrg_prc', 'nrg_cons', 'currency', 'unit', 'geo', 'time'], codes: { nrg_prc: ['NRG_SUP', 'NETC', 'TAX_FEE_LEV_CHRG', 'VAT', 'TAX_RNW', 'TAX_CAP', 'TAX_ENV', 'TAX_NUC', 'TAX_FEE_LEV_CHRG_ALLOW', 'TAX_RNW_ALLOW', 'TAX_CAP_ALLOW', 'TAX_ENV_ALLOW', 'TAX_NUC_ALLOW', 'ALLOW_OTH', 'OTH'] } },
  nrg_pc_204: { dimensions: ['freq', 'siec', 'nrg_cons', 'unit', 'tax', 'currency', 'geo', 'time'], codes: { tax: ['X_TAX', 'X_VAT', 'I_TAX'] } },
  nrg_pc_204_c: { dimensions: ['freq', 'nrg_cons', 'nrg_prc', 'currency', 'geo', 'time'], codes: { nrg_prc: ['NRG_SUP', 'NETC', 'TAX_FEE_LEV_CHRG', 'VAT', 'TAX_RNW', 'TAX_CAP', 'TAX_ENV', 'TAX_NUC', 'TAX_FEE_LEV_CHRG_ALLOW', 'TAX_RNW_ALLOW', 'TAX_CAP_ALLOW', 'TAX_ENV_ALLOW', 'TAX_NUC_ALLOW', 'ALLOW_OTH', 'OTH'] } },
  nrg_pc_205: { dimensions: ['freq', 'siec', 'nrg_cons', 'unit', 'tax', 'currency', 'geo', 'time'], codes: { tax: ['X_TAX', 'X_VAT', 'I_TAX'] } },
  nrg_pc_205_c: { dimensions: ['freq', 'nrg_prc', 'nrg_cons', 'currency', 'geo', 'time'], codes: { nrg_prc: ['NRG_SUP', 'NETC', 'TAX_FEE_LEV_CHRG', 'VAT', 'TAX_RNW', 'TAX_CAP', 'TAX_ENV', 'TAX_NUC', 'TAX_FEE_LEV_CHRG_ALLOW', 'TAX_RNW_ALLOW', 'TAX_CAP_ALLOW', 'TAX_ENV_ALLOW', 'TAX_NUC_ALLOW', 'ALLOW_OTH', 'OTH'] } },
}

/* ------------------------------------------------------------------ */
/* COUNTRIES                                                           */
/* ------------------------------------------------------------------ */

/**
 * Geo codes of the tool. Country and group NAMES are not here: they are translated in the locale files
 * (`countries.<code>` and `countryGroups.<id>` in src/locales/*.json).
 */
export const allCountries = ["EU27_2020","EA","BE","BG","CZ","DK","DE","EE","IE","EL","ES","FR","HR","IT","CY","LV","LT","LU","HU","MT","NL","AT","PL","PT","RO","SI","SK","FI","SE","IS","LI","NO","ME","MK","AL","RS","TR","BA","XK","MD","UA","GE"];
export const AGGREGATES_COUNTRY_CODES = ["EU27_2020", "EA"];
export const EU_COUNTRY_CODES = ["BE", "BG", "CZ", "DK", "DE", "EE", "IE", "EL", "ES", "FR", "HR", "IT", "CY", "LV", "LT", "LU", "HU", "MT", "NL", "AT", "PL", "PT", "RO", "SI", "SK", "FI", "SE"];
export const EFTA_COUNTRY_CODES = ["IS", "LI", "NO"];
export const ENLARGEMENT_COUNTRY_CODES = [ "BA","ME","MD","MK","GE","AL","RS","TR","UA","XK",]
export const OTHER_THIRD_COUNTRY_CODES = ["UA", "MD", "GE"];

/** Groups shown in country selectors, in display order. `id` is the key under `countryGroups` in the locale files. */
export const countryGroups = [
  { id: 'aggregates', codes: AGGREGATES_COUNTRY_CODES },
  { id: 'eu', codes: EU_COUNTRY_CODES },
  { id: 'efta', codes: EFTA_COUNTRY_CODES },
  { id: 'enlargement', codes: ENLARGEMENT_COUNTRY_CODES },
] as const


/* ------------------------------------------------------------------ */
/* UNITS                                                               */
/* ------------------------------------------------------------------ */

export interface UnitDefinition {
  abbr: string
  /** Multiply a value in the dataset's base unit (THS_T) by this factor to get this unit. */
  conversionFactor: number
  // The unit name is translated in the locale files (`units.<code>`), not here.
}

/** EXAMPLE units; the base unit of the dataset has conversionFactor 1. */
export const units: Record<string, UnitDefinition> = {
  KWH: { abbr: 'kWh', conversionFactor: 1 },
  MWH: { abbr: 'MWh', conversionFactor: 1000 },
  GJ_GCV: { abbr: 'GJ', conversionFactor: 1 },
}

/** Convert a value expressed in the base unit into another configured unit. */
export function convertUnit(value: number, unitCode: string): number {
  return value * (Object.hasOwn(units, unitCode) ? units[unitCode].conversionFactor : 1)
}

/* ------------------------------------------------------------------ */
/* IMAGES                                                              */
/* ------------------------------------------------------------------ */

export const images = {
  eurostatLogo: { src: `${import.meta.env?.BASE_URL ?? './'}images/eurostat-logo-horizontal.svg` },
  headerRibbon: { src: `${import.meta.env?.BASE_URL ?? './'}images/eurostat-banner-ribbon.svg` },
} as const

/* ------------------------------------------------------------------ */
/* CODES THE TOOL REQUESTS FROM THE API                                */
/* ------------------------------------------------------------------ */

/**
 * The tax series Eurostat gives for the half-yearly prices, and the one that is the price shown: the price
 * excluding taxes and levies. Bars, tables, totals and the insights all use it; change it here to show another.
 */
export const PRICE_TAX_CODE = 'X_TAX'

/**
 * The three parts of the details view of the half-yearly price. `true`: the figures of the original tool, from its
 * formula on the three tax series in the order Eurostat gives them (X_TAX, X_VAT, I_TAX): the first part is the series
 * X_VAT, the second I_TAX - X_VAT, the third X_TAX - I_TAX, and the three add up to the plain bar (X_TAX). `false`:
 * the split by meaning: the price without taxes, the other taxes and levies, the VAT, adding up to the price with all taxes.
 */
export const ORIGINAL_DETAILS = true

export const apiCodes = {
  geo: allCountries,
  product: ['4100', '6000'],
  consumer: ['HOUSEHOLD', 'N_HOUSEHOLD'],
  nrg_cons: [
    'TOT_GJ', 'GJ_LT20', 'GJ20-199', 'GJ_GE200',
    'GJ_LT1000', 'GJ1000-9999', 'GJ10000-99999', 'GJ100000-999999', 'GJ1000000-3999999', 'GJ_GE4000000',
    'TOT_KWH', 'KWH_LT1000', 'KWH1000-2499', 'KWH2500-4999', 'KWH5000-14999', 'KWH_LE15000', 'KWH_GE15000',
    'MWH_LE149999', 'MWH_LT20', 'MWH20-499', 'MWH500-1999', 'MWH2000-19999', 'MWH20000-69999', 'MWH70000-149999', 'MWH_GE150000',
  ],
  tax: ['X_TAX', 'X_VAT', 'I_TAX'],
}

/**
 * The parts of the annual datasets that make the plain bar. `null`: all of them, as in the original tool, which sums
 * every component (taxes and VAT included). A list such as ['NRG_SUP', 'NETC'] gives the price without taxes instead.
 */
export const PRICE_COMPONENT_CODES: readonly string[] | null = null

/** `siec` is the energy product of the half-yearly datasets (G3000 natural gas, E7000 electricity): it is always requested. */
export const energyDatasets = {
  '4100_HOUSEHOLD': {
    code: 'nrg_pc_202', siec: 'G3000', componentsCode: 'nrg_pc_202_c', defaultBand: 'GJ20-199',
    defaultComponentsBand: 'TOT_GJ', units: ['GJ_GCV', 'KWH', 'MWH'], componentsUnits: ['GJ_GCV', 'KWH'],
    componentCodes: ['NETC', 'NRG_SUP', 'OTH', 'TAX_CAP', 'TAX_ENV', 'TAX_RNW', 'VAT'],
  },
  '4100_N_HOUSEHOLD': {
    code: 'nrg_pc_203', siec: 'G3000', componentsCode: 'nrg_pc_203_c', defaultBand: 'GJ10000-99999',
    defaultComponentsBand: 'TOT_GJ', units: ['GJ_GCV', 'KWH', 'MWH'], componentsUnits: ['GJ_GCV', 'KWH'],
    componentCodes: ['NETC', 'NRG_SUP', 'OTH', 'TAX_CAP', 'TAX_ENV', 'TAX_RNW', 'VAT'],
  },
  '6000_HOUSEHOLD': {
    code: 'nrg_pc_204', siec: 'E7000', componentsCode: 'nrg_pc_204_c', defaultBand: 'KWH2500-4999',
    defaultComponentsBand: 'TOT_KWH', units: ['KWH', 'MWH'], componentsUnits: ['KWH', 'MWH'],
    componentCodes: ['NETC', 'NRG_SUP', 'OTH', 'TAX_CAP', 'TAX_ENV', 'TAX_NUC', 'TAX_RNW', 'VAT'],
  },
  '6000_N_HOUSEHOLD': {
    code: 'nrg_pc_205', siec: 'E7000', componentsCode: 'nrg_pc_205_c', defaultBand: 'MWH500-1999',
    defaultComponentsBand: 'TOT_KWH', units: ['KWH', 'MWH'], componentsUnits: ['MWH'],
    componentCodes: ['NETC', 'NRG_SUP', 'OTH', 'TAX_CAP', 'TAX_ENV', 'TAX_NUC', 'TAX_RNW', 'VAT'],
  },
} as const

export const consumptionBands: Record<string, readonly string[]> = {
  nrg_pc_202: ['TOT_GJ', 'GJ_LT20', 'GJ20-199', 'GJ_GE200'],
  nrg_pc_203: ['TOT_GJ', 'GJ_LT1000', 'GJ1000-9999', 'GJ10000-99999', 'GJ100000-999999', 'GJ1000000-3999999', 'GJ_GE4000000'],
  nrg_pc_204: ['TOT_KWH', 'KWH_LT1000', 'KWH1000-2499', 'KWH2500-4999', 'KWH5000-14999', 'KWH_GE15000'],
  nrg_pc_205: ['TOT_KWH', 'MWH_LT20', 'MWH20-499', 'MWH500-1999', 'MWH2000-19999', 'MWH20000-69999', 'MWH70000-149999', 'MWH_GE150000'],
  nrg_pc_202_c: ['TOT_GJ', 'GJ_LT20', 'GJ20-199', 'GJ_GE200'],
  nrg_pc_203_c: ['TOT_GJ', 'GJ_LT1000', 'GJ1000-9999', 'GJ10000-99999', 'GJ100000-999999', 'GJ1000000-3999999', 'GJ_GE4000000'],
  nrg_pc_204_c: ['TOT_KWH', 'KWH_LT1000', 'KWH1000-2499', 'KWH2500-4999', 'KWH5000-14999', 'KWH_LE15000'],
  nrg_pc_205_c: ['TOT_KWH', 'MWH_LE149999', 'MWH_LT20', 'MWH20-499', 'MWH500-1999', 'MWH2000-19999', 'MWH20000-69999', 'MWH70000-149999', 'MWH_GE150000'],
}

/* ------------------------------------------------------------------ */
/* GUIDED TOUR                                                         */
/* ------------------------------------------------------------------ */

/** Address of a dataset in the Eurostat data browser (`lang` is en, fr or de). */
export const eurostatDatasetUrl = (dataset: string, lang: string) =>
  `https://ec.europa.eu/eurostat/databrowser/view/${dataset}/default/table?lang=${lang}`

export const tourConfig = {
  /** Start the tour when the tool loads. */
  autoStart: true,
  /** true: only the first visit in this browser. false: on every load. */
  showOnce: true,
  /** localStorage key; change it (e.g. add a version) to show an updated tour to returning visitors. */
  storageKey: 'eurostat-tool-tour-seen-v1',
  startDelayMs: 800,
  /**
   * The steps after the welcome. `id` names the texts (`tour.<id>Title` and `tour.<id>Description` in the locale
   * files), `element` is the CSS selector to highlight. Steps whose element is not in the page are skipped.
   */
  steps: [
    { id: 'chart', element: '.energy-chart' },
    // The whole first bar of the chart (all its stacked parts), to show that it can be clicked.
    { id: 'country', element: '@first-bar' },
    { id: 'menu', element: '#menu-toggle' },
    { id: 'table', element: '#chart-table' },
    { id: 'order', element: '#chart-order' },
    { id: 'decimals', element: '#chart-decimals' },
    { id: 'aggregates', element: '#chart-aggregates' },
    { id: 'components', element: '#components-toggle' },
    { id: 'details', element: '#chart-details' },
    { id: 'insights', element: '#insights-button' },
    { id: 'download', element: '#download-button' },
    { id: 'embed', element: '#share-button' },
    { id: 'language', element: '#toggleLanguageBtn' },
    // The last two: first where to see the tour again, then the end of the tour.
    { id: 'replay', element: '#tour-button' },
    { id: 'share', element: '#share-button' },
  ],
}

/* ------------------------------------------------------------------ */
/* FILTERS (the controls of the menu and the state kept in the address) */
/* ------------------------------------------------------------------ */

export interface FilterGroup {
  /** Key of the group's name in the locale namespace `groupKey`. */
  id: string
  codes: readonly string[]
}

interface FilterBase {
  /** Name of the address parameter (`?<id>=...`). The label of the control is `filters.<id>` in the locale files. */
  id: string
  /** Locale namespace of the option names: the option `X` is shown as `<nameKey>.X`. */
  nameKey: string
}

export type FilterDefinition =
  | (FilterBase & { type: 'select'; options: readonly string[]; default: string })
  | (FilterBase & {
      type: 'multiselect'
      options: readonly string[] | readonly FilterGroup[]
      /** Locale namespace of the group names, when `options` are groups. */
      groupKey?: string
      default: readonly string[]
    })

/**
 * EXAMPLE: the controls shown in the menu. Everything that depends on the tool is here: add, remove or change a
 * filter and the menu, the address, the shared and embedded views and the contact e-mail all follow.
 */
export const filters: readonly FilterDefinition[] = [
  { id: 'geo', type: 'multiselect', nameKey: 'countries', groupKey: 'countryGroups', options: countryGroups, default: allCountries },
  { id: 'product', type: 'select', nameKey: 'products', options: ['6000', '4100'], default: '6000' },
  { id: 'consumer', type: 'select', nameKey: 'consumers', options: ['HOUSEHOLD', 'N_HOUSEHOLD'], default: 'HOUSEHOLD' },
  {
    id: 'time',
    type: 'select',
    nameKey: 'periods',
    options: Array.from({ length: new Date().getFullYear() - 1984 }, (_, index) => 1985 + index)
      .flatMap((year) => [String(year), `${year}-S1`, `${year}-S2`]),
    default: `${new Date().getFullYear()}-S1`,
  },
  { id: 'band', type: 'select', nameKey: 'bands', options: apiCodes.nrg_cons, default: 'KWH2500-4999' },
  { id: 'unit', type: 'select', nameKey: 'units', options: Object.keys(units), default: 'KWH' },
  { id: 'component', type: 'select', nameKey: 'componentModes', options: ['total', 'components'], default: 'total' },
  { id: 'breakdown', type: 'select', nameKey: 'breakdowns', options: ['total', 'components'], default: 'total' },
  { id: 'order', type: 'select', nameKey: 'orders', options: ['proto', 'alfa', 'asc', 'desc'], default: 'desc' },
  { id: 'percentage', type: 'select', nameKey: 'percentageModes', options: ['value', 'percentage'], default: 'value' },
  // Decimals of the prices in every chart, tooltip and table (the button of the floating bar goes 4, 3, 2, 1, 4, ...).
  { id: 'decimals', type: 'select', nameKey: 'decimalModes', options: ['4', '3', '2', '1'], default: '4' },
]

/** The orders of the original tool: highest first, lowest first, alphabetical and the protocol order of the countries. */
export const sortOrders = ['desc', 'asc', 'alfa', 'proto'] as const

/** Filters that live in the floating bar of the main chart (FloatingControls) instead of in the menu. */
export const filtersUnderChart: readonly string[] = ['component', 'breakdown', 'percentage', 'order', 'decimals']

/* ------------------------------------------------------------------ */
/* MENU                                                                */
/* ------------------------------------------------------------------ */

/** Links of the menu. `labelKey` is a key in the locale files. */
/** Eurostat reference metadata (SIMS) of the price datasets, by product: `<base>/<LANGUAGE>/<dataset>_sims.htm`. */
export const metadataLinks = {
  base: 'https://ec.europa.eu/eurostat/cache/metadata',
  datasets: { '4100': 'nrg_pc_202', '6000': 'nrg_pc_204' } as Record<string, string>,
}

export const menuItems = [
  { labelKey: 'subnav.menuItem1', href: '#main-content' },
  { labelKey: 'subnav.menuItem2', href: 'https://ec.europa.eu/eurostat/databrowser/' },
] as const

/* ------------------------------------------------------------------ */
/* FEATURES                                                            */
/* ------------------------------------------------------------------ */

/** Switch the shared features of the template on or off for this tool. */
export const features = {
  /** Lightbulb button and the insights overlay. */
  insights: true,
  /** Download button (PNG / JPEG image of the chart, Excel file of its data). */
  download: true,
  /** Share button (social networks, contact e-mail, copy link). */
  share: true,
  /** "Embed" entry of the share menu (needs `share`). */
  embed: true,
  /** Guided tour and its help button. */
  tour: true,
}

/* ------------------------------------------------------------------ */
/* DOWNLOAD                                                            */
/* ------------------------------------------------------------------ */

export const downloadConfig = {
  /** Entries of the download menu, in this order. 'excel' needs the tool to provide its data (see App.tsx). */
  formats: ['png', 'jpeg', 'excel'] as const,
  /**
   * CSS selector of the element saved as an image: the chart (a Webtools chart, an inline SVG or any HTML).
   * The image is drawn from what is on screen, so it works for charts of any library.
   */
  imageTarget: '.tool-content',
  /** Logo drawn in the bottom right corner of the downloaded images. */
  logoUrl: 'https://ec.europa.eu/eurostat/cache/countryfacts/img/estat-logo-horizontal.svg',
  /** Start of the file names, followed by the date: `eurostat-tool-2026-11-05.png`. */
  fileName: 'energy-prices',
}

/* ------------------------------------------------------------------ */
/* EMBEDDED VIEW                                                     */
/* ------------------------------------------------------------------ */

export const embedConfig = {
  /** Height of the <iframe> people paste into their page, in pixels. */
  height: 600,
  /** Chart shown when `?embed` has no value. */
  defaultChart: 'main',
  /** Ids of the charts that can be embedded on their own (`?embed=<id>`). */
  charts: ['main'],
}
