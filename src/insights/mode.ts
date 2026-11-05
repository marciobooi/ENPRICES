/** The insights are the same page shell with `?insights` in the URL (no second HTML file), like the accessibility statement. */
export const INSIGHTS_PARAM = 'insights'

export function isInsightsMode(): boolean {
  return new URLSearchParams(window.location.search).has(INSIGHTS_PARAM)
}

/** The current address with `insights` added: the insights of exactly what the person is looking at. */
export function insightsHref(): string {
  const address = new URL(window.location.href)
  address.hash = ''
  address.searchParams.set(INSIGHTS_PARAM, '')
  return `${address.pathname}${address.search.replace('insights=', 'insights')}`
}

/** The address of the tool with the same selection: the current one without `insights`. */
export function toolHrefFromInsights(): string {
  const address = new URL(window.location.href)
  address.searchParams.delete(INSIGHTS_PARAM)
  return `${address.pathname}${address.search}`
}
