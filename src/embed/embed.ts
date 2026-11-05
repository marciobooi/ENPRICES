import { embedConfig } from '../config/toolConfig'

/**
 * Embedded view: `?embed=<chartId>` shows only the main content of the tool (no banner, toolbar or footer), with
 * the state taken from the rest of the address. People paste an <iframe> that points to it into another page.
 */
export const EMBED_PARAM = 'embed'
/** Chart shown when `?embed` has no value. The charts that can be embedded are listed in `embedConfig`. */
export const DEFAULT_CHART = embedConfig.defaultChart
export const EMBED_HEIGHT = embedConfig.height

export function isEmbedMode(): boolean {
  return new URLSearchParams(window.location.search).has(EMBED_PARAM)
}

export function embedChartId(): string {
  return new URLSearchParams(window.location.search).get(EMBED_PARAM) || DEFAULT_CHART
}

/** The current address (with all the state in it) turned into the address of the embedded view. */
export function buildEmbedUrl(chartId: string = DEFAULT_CHART): string {
  const address = new URL(window.location.href)
  address.hash = ''
  address.searchParams.delete('accessibility')
  address.searchParams.set(EMBED_PARAM, chartId)
  // Lists of values (countries, ...) stay readable: a comma is valid in a query string, no need for %2C.
  return address.toString().replace(/%2C/gi, ',')
}

const escapeAttribute = (value: string) =>
  value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

/** The <iframe> markup to copy and paste into another page. */
export function buildEmbedCode({ url, title, height = EMBED_HEIGHT }: { url: string; title: string; height?: number }): string {
  return `<iframe src="${escapeAttribute(url)}" title="${escapeAttribute(title)}" width="100%" height="${height}" style="border:0" loading="lazy" allowfullscreen></iframe>`
}
