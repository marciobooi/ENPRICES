/**
 * Tool configuration: every lookup table of the tool lives here (colours, code mappings, dataset
 * definitions, countries, units, images). Components import from this file and never hard-code codes.
 *
 * Per tool: keep the structure, replace the EXAMPLE entries marked below with the tool's own codes.
 * Labels that must be translated belong in src/locales; the labels here are neutral English fallbacks.
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
 * Replace every <<PLACEHOLDER>>; `npm run check:release` fails while one is left.
 */
export const site = {
  /** Page title and `og:title`. */
  title: 'Eurostat tools',
  /** Meta description and `og:description` (about 150 characters shows fully in most networks). */
  description: 'A multilingual starter for Eurostat data tools.',
  siteName: 'Eurostat',

  /** Absolute https address of the deployed page: what people share and the canonical address. */
  url: 'https://ec.europa.eu/eurostat/cache/visualisations/<<TOOL>>/<<TOOL>>.html',

  /** Preview image shown in the post. The file lives in public/; its address is derived from `url`. */
  image: {
    /** Path inside the deployed folder (the file is public/images/share-preview.png). PNG or JPEG, never SVG. */
    file: 'images/share-preview.png',
    type: 'image/png',
    width: 1200,
    height: 630,
    alt: 'Eurostat tools: an interactive data tool to explore European statistics.',
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

/** EXAMPLE: one colour per category code. Exposed as CSS variables `--color-<code>` (see applyColorCssVariables). */
export const categoryColors: Record<string, string> = {
  TOTAL: euColors.cornflower[0], // all categories aggregate
  CAT1: euColors.forestGreen[0],
  CAT2: euColors.cornflower[3],
  CAT3: euColors.darkGold[2],
  CAT4: euColors.berry[0],
  CAT5: euColors.sienna[3],
  CAT6: euColors.darkOrchid[2],
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

/** EXAMPLE: one entry per Eurostat dataset code used by the tool. */
export const datasets: Record<string, DatasetDefinition> = {
  env_example_a: {
    dimensions: ['indic_env', 'category', 'unit', 'geo', 'time'],
    codes: {
      indic_env: ['DE', 'DMC', 'DMI', 'EXP', 'IMP'],
      category: ['TOTAL', 'CAT1', 'CAT2', 'CAT3', 'CAT4', 'CAT5', 'CAT6'],
    },
  },
}

/* ------------------------------------------------------------------ */
/* COUNTRIES                                                           */
/* ------------------------------------------------------------------ */

/**
 * Geo codes of the tool. Country and group NAMES are not here: they are translated in the locale files
 * (`countries.<code>` and `countryGroups.<id>` in src/locales/*.json).
 */
export const allCountries = ["EU27_2020","BE","BG","CZ","DK","DE","EE","IE","EL","ES","FR","HR","IT","CY","LV","LT","LU","HU","MT","NL","AT","PL","PT","RO","SI","SK","FI","SE","IS","LI","NO","ME","MK","AL","RS","TR","BA","XK","MD","UA","GE"];
export const AGGREGATES_COUNTRY_CODES = ["EU27_2020"];
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
  T_HAB: { abbr: 'T_HAB', conversionFactor: 1 },
  THS_T: { abbr: 'KT', conversionFactor: 1 },
  MIO_T: { abbr: 'MT', conversionFactor: 0.001 },
  G_T: { abbr: 'GT', conversionFactor: 0.000001 },
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

export const apiCodes = {
  geo: allCountries,
  /** Flow / indicator codes of the tool (fill in per tool). */
  flow: [] as string[],
  category: Object.keys(categoryColors),
  /** Years are queried from the dataset directly. */
  year: [] as string[],
}

/* ------------------------------------------------------------------ */
/* GUIDED TOUR                                                         */
/* ------------------------------------------------------------------ */

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
    { id: 'language', element: '#toggleLanguageBtn' },
    { id: 'menu', element: '#menu-toggle' },
    { id: 'tool', element: '.toolbar-title' },
    { id: 'insights', element: '#insights-button' },
    { id: 'download', element: '#download-button' },
    { id: 'share', element: '#share-button' },
    { id: 'replay', element: '#tour-button' },
    { id: 'content', element: '#main-content' },
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
  { id: 'unit', type: 'select', nameKey: 'units', options: Object.keys(units), default: 'THS_T' },
  { id: 'geo', type: 'multiselect', nameKey: 'countries', groupKey: 'countryGroups', options: countryGroups, default: ['EU27_2020'] },
]

/* ------------------------------------------------------------------ */
/* MENU                                                                */
/* ------------------------------------------------------------------ */

/** EXAMPLE links of the menu. `labelKey` is a key in the locale files. */
export const menuItems = [
  { labelKey: 'subnav.menuItem1', href: '#main-content' },
  { labelKey: 'subnav.menuItem2', href: '#main-content' },
  { labelKey: 'subnav.menuItem3', href: '#main-content' },
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
  /** Start of the file names, followed by the date: `eurostat-tool-2026-11-05.png`. */
  fileName: 'eurostat-tool',
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

