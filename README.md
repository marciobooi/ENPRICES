# ENPRICES 3.0

The ENPRICES energy-price visualisation tool rebuilt with Vite, React and TypeScript. Tool configuration and translations live in `src/config/toolConfig.ts` and `src/locales/`; data loading, chart configuration and rendering live in the relevant hooks and services.

It includes:

- The Europa Component Library (EU preset 5.4.0) installed from npm (`@ecl/preset-eu`) and the Webtools Smart Loader (GloBan, cookie consent kit, analytics, icons).
- The shared shell: branded banner, language selector, tool toolbar with menu and filters, footer and an in-app accessibility statement.
- Shared features, each switchable in the config: download menu (PNG / JPEG image, Excel file), share menu (social networks, contact e-mail with screenshot, copy link, embed code), insights panel, guided tour.
- Interface translations in separate files (English, French and German to start with).
- Building blocks: `Select`, `MultiSelect`, `Card`, `Loading`, `RoundButton`, `Tooltip`, `useFocusTrap`.
- The state of the tool in the address (every link, shared view and embedded `<iframe>` carries it).
- A shared Axios client for the Eurostat Statistics API.
- Eurostat gas and electricity prices for household and non-household consumers, including annual component datasets.
- Chart rendering through the European Commission Webtools UEC (`service: "chart"`, version 2.0); this project does not load or license Highcharts directly.

## Run locally

```sh
npm install
npm run dev
```

The legacy source is retained under `OLD enprices/` for local reference only and is ignored by Git.

## Energy-price data and charts

- `src/config/toolConfig.ts` maps product and consumer pairs to the four Eurostat price datasets (`nrg_pc_202`–`nrg_pc_205`) and their annual component counterparts (`*_c`), consumption bands, valid units and country groups.
- `src/hooks/useEnergyPrices.ts` requests the appropriate dataset and extracts either the `tax` dimension for semi-annual total prices or `nrg_prc` for annual component prices. The component toggle switches dataset, year granularity, consumption bands and valid units together.
- `src/services/energyChart.ts` builds the Webtools UEC configuration for the total, detailed, trend and pie views. The data table and Excel export use the same fetched observations.
- **Country drill-down.** Clicking a bar (or a country name in the data table) opens that country's charts: bar chart by consumption band, pie chart of the price composition and line chart over time, with a table view, download and a close button. The filter menu is replaced by these controls while it is open. `src/hooks/useEnergyPrices.ts` (`useCountryPrices`) fetches the country across all bands and periods; `src/services/countryChart.ts` builds the charts; `src/components/CountryContent.tsx` is the view. The country and chart are kept in the address as `chartGeo` and `chartView`. Bars carry `className: 'geo-<code>'` so `WebChart` can tell which one was clicked.
- ENPRICES selections are persisted in the URL so shared links and embedded views preserve the selected product, consumer, band, unit, period, chart, price breakdown, order and countries.

- **Insights.** `src/insights/` holds the calculations ported from the original tool (`compute.ts` from the data on screen, `extra.ts` and `useInsightsData.ts` for the ones that need their own Eurostat datasets: purchasing-power panel, annual components, bands, inflation, the other fuel). They do not depend on the chart toggles and are requested only while the panel is open.
- **Old links and texts.** Links of the previous tool (`geos`, `detail`, `component=0/1`, ...) are rewritten by `src/state/legacyUrl.ts`. Country, band, component and menu names and the tour texts were taken from the old `labels_*.json` and `tutorial_*.json` files.

| Command | What it does |
|---|---|
| `npm run dev` / `npm run preview` | Development server / serve the production build |
| `npm run build` | Type-check and build into `dist/` |
| `npm run typecheck` / `npm run lint` | TypeScript (strict) / oxlint, both must be clean |
| `npm run check:statement` | Fails while `<<PLACEHOLDER>>` text is left in the accessibility statement |
| `npm run check:share` | Reads `dist/index.html` like a social crawler and checks the preview tags and image |
| `npm run check:release` | `check:statement` + `check:share`; run it after `npm run build`, before publishing |

Webtools shows GloBan only on `*.europa.eu` hosts. Locally, add `127.0.0.1 localhost.europa.eu` to `C:\Windows\System32\drivers\etc\hosts` (administrator) and open `http://localhost.europa.eu:5173`; `vite.config.ts` already allows that host.

## Porting an existing tool

Use this to move an existing Eurostat tool (jQuery, Bootstrap or plain JavaScript pages) onto the template. The rule: **port the tool's data and logic, not its page furniture.** The banner, GloBan, cookie kit, language selector, footer, social sharing, accessibility page and loading indicator already exist.

### What to port, and where it goes

| In the old tool | In the template |
|---|---|
| Lookup tables: colours, code dictionaries, datasets, countries and groups, units | `src/config/toolConfig.ts` (typed exports, no globals). Names are **not** in the config, see Translations below |
| Filter controls (selects, multi-selects) and their default values | `filters` in `toolConfig.ts`. They appear in the menu and are kept in the address (`?unit=..&geo=a,b`) |
| Menu entries | `menuItems` in `toolConfig.ts` |
| The main chart, its data loading and transformations | `src/components/ToolContent.tsx` and hooks next to it; data requests with `src/api/eurostat.ts`. Charts that can be embedded on their own are listed in `embedConfig.charts` |
| Toolbar buttons (download, settings, ...) | `RoundButton` entries in the `actions` of `App.tsx`; icons from `ToolbarIcon.tsx` or Webtools (`WebtoolsIcon`) |
| "Info" / summary overlay | `InsightsPanel` with your own `InsightsContent` (texts under `insights.*`) |
| KPI blocks, theme cards | `Card` inside a `<div className="card-grid">` |
| Share / social namespace (X, Facebook, LinkedIn, e-mail) | Already in `ShareMenu`. Port only the description text (`share.text`) and the mailbox (`contactEmail`) |
| Embed link with all the parameters in the URL | Already built: the filters are the parameters, `?embed=<chartId>` shows only the chart, "Embed" in the share menu produces the `<iframe>` |
| Tutorial / intro tour | `tourConfig.steps` + `tour.*` texts |
| Texts and language switch (JSON files, `data-i18n`) | `src/locales/<code>.json` and `languages` in `toolConfig.ts` |
| Accessibility statement (Word document) | `src/accessibility/statementConfig.ts` |
| Spinners | `Loading` |

**Do not port:** jQuery, Bootstrap classes (`d-flex`, `col-*`), Font Awesome, global variables and `window` namespaces, ECL loaded from a CDN, the old header, footer, GloBan and cookie code, and a second copy of the Webtools loader. Rebuild the UI with React state and ECL classes.

### How, step by step

1. **Set up.** Copy the template, rename it (`package.json` name, `brand` in the locale files), `npm install`, `npm run dev`. Copy `.env.example` to `.env.local`; ask the Webtools team for **this tool's** analytics site ID (no analytics runs while it is empty).
2. **Take stock of the old tool** before writing code: every view and how it is reached, every control and what it does, the state it keeps and whether it is in the URL, every data source and transformation, the chart library and its licence (production charts use an approved Webtools chart embed or an already licensed library), every text and its languages, every export.
3. **Fill `toolConfig.ts`.** Page identity (`site`: title, description, address, preview image, languages, contact e-mail, links), then colours, datasets, countries, units, `filters`, `menuItems`, `features`, `embedConfig`, `tourConfig`. Replace the `EXAMPLE` entries; remove what the tool does not use.
4. **Write the translations.** For every code in the config add its name in **every** `src/locales/*.json` file: `countries.<code>`, `countryGroups.<id>`, `units.<code>`, `indicators.<code>`, the filter label `filters.<id>`, the menu texts, `tour.<id>Title` / `Description`, `insights.*`, `share.text`, `toolContent.*`. No text is written in components.
5. **Port the data and the chart.** Replace the example card in `ToolContent.tsx` with the tool's chart, reading the filters from its `values`. Fetch in a hook per view that returns `{ data, loading, error }`, show `<Loading />` while loading and an `role="alert"` message on error. Give every chart a text alternative or a data table.
6. **Port the toolbar actions and extras.** Add buttons to `actions`; switch features off with `features` if the tool does not need them.
7. **Accessibility statement.** Fill `statementConfig.ts` from the tool's Word document (wording, dates, contacts), never from another tool's text. Replace every `<<PLACEHOLDER>>`.
8. **Social preview.** Put the tool's image in `public/images/share-preview.png` (1200x630 PNG or JPEG under 5 MB) and set `site.url` to the deployed address (see Social sharing preview).
9. **Quality gate** (all must pass): `npm run typecheck`, `npm run lint`, `npm run build`, `npm run check:release`. Then check in a browser: both views (`/` and `?accessibility`) load without console errors, axe-core reports 0 violations on both, keyboard-only use works (skip link, every control, popovers close with Escape and return focus), the three languages work (`?language=de`), 320 px wide and 200 % zoom are usable, the tour starts on a first visit (clear site data), and the embedded view (`?embed=main`) shows only the chart.
10. **Deploy** from the fixed Eurostat path (see Deployment).

### Prompt to give Claude

```text
Port the tool "<<TOOL NAME>>" to this React template, following the "Porting an existing tool" section of README.md.

Source tool: <<path to the existing tool folder>>
Accessibility statement (Word, source of the statement text): <<path to the .docx>>
Deployed address: <<https://ec.europa.eu/eurostat/cache/visualisations/<<tool>>/<<tool>>.html>>
Languages: <<EN, FR, DE>>

Rules: do not copy jQuery, Bootstrap or globals; put everything that depends on the tool in
src/config/toolConfig.ts and every text in src/locales/*.json; use the shared components; ask before deleting
anything from the source tool. Start with the inventory of the old tool, then config, data, UI, translations,
accessibility statement, social preview, quality gate. Finish by listing every file you changed and anything you
could not verify.
```

## Configuration

### `src/config/toolConfig.ts` (the only config file)

Pure data, so the build can read it too. Sections:

- **Page identity (`site`)**: title, description, deployed address, preview image, languages, contact e-mail, footer and home links. A Vite plugin (`plugins/siteMeta.ts`) writes it into the static HTML at build time: `<title>`, description, canonical, Open Graph, Twitter Card and the page language.
- **Colours, datasets, countries and groups, units, images, API codes**: the lookup tables.
- **`filters`**: the controls of the menu (`select` or `multiselect`), their option codes, groups and defaults. Everything follows from them: the menu, the address, the shared and embedded views, the summary in the content and the contact e-mail.
- **`menuItems`**, **`features`** (insights, download, share, embed, tour), **`downloadConfig`** (formats, the element saved as an image, file name), **`embedConfig`** (iframe height, embeddable charts) and **`tourConfig`** (settings and steps).

The config never contains display names. Every name is translated in `src/locales/<code>.json` under the code (`countries.<code>`, `units.<code>`, `filters.<id>`, ...). Languages are listed in `site.languages`; adding one means a new locale file and an entry there.

### Environment (`.env.local`, see `.env.example`)

- `VITE_WEBTOOLS_ANALYTICS_SITE_ID` and `VITE_WEBTOOLS_ANALYTICS_INSTANCE`: analytics of this tool (no default; analytics is off while the site ID is empty).
- `VITE_WEBTOOLS_IS_404`: `true` only for a not-found page. `VITE_WEBTOOLS_CHART_URL`: optional published Webtools chart address.
- `VITE_SITE_URL`: optional override of `site.url` for a deployment pipeline (the preview image address follows it).

### Webtools notes

The Smart Loader is loaded once over HTTPS by `src/services/webtools.ts`. Never add another `load.js` tag, never use `rel="noreferrer"` or a blocking `referrer` policy on links, and do not add a restrictive Content Security Policy without allowing the Europa resources. If the loader answers 403 locally, use the `localhost.europa.eu` host above. Webtools components cannot come from npm; ECL does (`@ecl/preset-eu`, imported in `src/index.css` and `src/main.tsx`).

Webtools icons are used through `WebtoolsIcon` (`set` + `name`, for example `phosphor` + `lightbulb` or `networks` + `facebook`): Webtools swaps the icon element for an SVG, so the wrapper is the node React owns. Icon names: <https://webtools.europa.eu/showcase/demo/?comp=icons>.

## Structure

- `src/config/toolConfig.ts`: everything that depends on the tool. `src/locales/*.json`: every text.
- `src/App.tsx`: the page (banner, toolbar with menu, filters and actions, content, footer). `src/pages/`: the accessibility statement page and the embedded page.
- `src/components/`: shell (`Nav`, `SubNav`, `Footer`, `LanguageSelector`), controls (`Select`, `MultiSelect`, `FilterControls`, `RoundButton`), content (`ToolContent`, `CountryContent`, `WebChart`, `Card`, `InsightsPanel`, `Loading`), sharing (`ShareMenu`), icons (`ToolbarIcon`, `WebtoolsIcon`), `Tooltip`.
- `src/state/`: the address-based state (`urlState.ts`, `filters.ts`). `src/embed/`, `src/share/`: embed and share helpers. `src/accessibility/`: the statement.
- `src/hooks/`: `useEnergyPrices` (main and country data), `useFocusTrap`, `useSiteShell`, `useGuidedTour`, `useNeedsScroll`. `src/services/`: `energyChart`, `countryChart`, `webtools`. `src/tour.ts`: the tour helper.
- `src/api/eurostat.ts`: Axios client and JSON-stat helpers. `src/services/webtools.ts`: Smart Loader, GloBan, cookie kit, analytics.
- `plugins/siteMeta.ts` and `scripts/`: build-time tags and the release checks.

## Features

**State in the address.** The filters of `toolConfig.ts` are written to the address (`?unit=MIO_T&geo=EU27_2020,NO`), without a history entry, next to `language`. A link, a bookmark and an embedded view therefore show exactly what the person saw. Invalid values fall back to the defaults.

**Embedded view.** `?embed=<chartId>` renders only the chart (no banner, toolbar, footer or Webtools), from the state in the address. The share menu's "Embed" entry shows the `<iframe>` code with the current filters and a copy button. Charts that can be embedded are listed in `embedConfig.charts`; the host page's server must allow framing.

**Download menu.** The download button offers the formats of `downloadConfig.formats`. PNG and JPEG are drawn from the chart on screen (the element of `downloadConfig.imageTarget`) with html2canvas, so they work for any chart, including the Webtools wrapper of Highcharts, with no Highcharts export module or licence. The Excel file is written by `write-excel-file` from the table that `App.tsx` passes to `DownloadMenu` (`getTable`, example in `src/download/toolTable.ts`: replace it with the series of your chart; without `getTable` the Excel entry is left out). Both libraries load only when someone downloads. Limit: an image is a picture of the screen, so Webtools-injected icons and cross-origin images without CORS headers may be missing.

**Share menu.** X, Facebook and LinkedIn open in a small window. The e-mail goes to `contactEmail` with the tool, address, language, the filters in force, date, window size and browser filled in, and a screenshot of the current view on the clipboard (a `mailto:` link cannot carry an attachment, so the screenshot is pasted into the message; if the clipboard refuses, it is saved as a file). Networks are defined in `src/share/networks.ts`; to add one, add an entry, its `share.networks.<id>` name in every locale file and any `wt-icon-networks--<name>` icon.

**Accessibility statement.** The footer link opens `?accessibility&language=xx`: an English-only statement in ECL classes. Edit only `src/accessibility/statementConfig.ts`, from the tool's Word document; `npm run check:statement` fails while a placeholder is left.

**Guided tour.** Starts on a first visit (`tourConfig.showOnce`), always with a welcome step, then `tourConfig.steps`; replayed with the help button. Focus is trapped in the popover and the page behind is inert.

**Components.** `Select` (native select, option groups) and `MultiSelect` (checkbox dropdown with search, select all, groups, counter) use ECL form markup, accept `helper`, `error`, `required`, `hideLabel`, `width`, and submit their values with a form when given a `name`. `Card` (ECL card; icon, title, description, actions, content, footer, accent colour). `Loading` (ECL spinner): `size` small, medium or large, `text`, `showText`, `centered`, `overlay`, plus `loading` and `variant`; it is a polite `role="status"` and stops turning for reduced motion. `RoundButton` + `Tooltip`; `useFocusTrap` for popovers; the footer's back-to-top button shows only when the page scrolls.

**Eurostat API.** `fetchEurostatDataset('nama_10_gdp', { geo: ['BE', 'FR'], sinceTimePeriod: '2020' })` sends repeated keys (`geo=BE&geo=FR`); `getTimeSeries` turns a JSON-stat answer into chart points and throws when a non-time dimension still has several categories (filter the request first). Production charts use an approved Webtools chart embed or an already licensed library.

## Social sharing preview

Facebook, LinkedIn and X build the post from the `<meta>` tags of the page's **static HTML** (they do not run JavaScript), so the preview is one language whatever `?language=` the link has. The tags are generated from `site` in `toolConfig.ts` at build time: nothing is written in `index.html`.

Per tool: edit `site` (title, description, image alt text, `url` = the **absolute https** address of the deployed page; the image address is derived from it), replace the preview image (`site.image.file`, now `public/images/enprices-share.jpg`, 1200x600) with the tool's own (**PNG or JPEG, 1200x630 recommended, under 5 MB**; SVG and WebP are not supported by all networks), then `npm run build` and `npm run check:release`.

Facebook and LinkedIn read only the tags (title, summary and quote parameters in a share link are ignored); X uses the text of the link plus the Twitter Card image. After deploying, check one real post per network and refresh the previews with the Facebook Sharing Debugger and the LinkedIn Post Inspector; networks cache previews. The shared address is the current page without its `#fragment`.

## Deployment

Tools are served from a fixed Eurostat path such as `/eurostat/cache/visualisations/<tool>/`. The template is ready for it: `vite.config.ts` sets `base: './'` and public files are referenced through `import.meta.env.BASE_URL` (never with a leading `/`). Test the `dist` folder from a sub-folder on a local server. All query-string links (`?language=`, `?accessibility`, `?embed=`) are relative on purpose.
