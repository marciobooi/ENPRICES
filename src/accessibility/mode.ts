/** The statement is the same page with `?accessibility` in the URL (no second HTML file to deploy). */
export function isAccessibilityMode(): boolean {
  return new URLSearchParams(window.location.search).has('accessibility')
}

export function accessibilityHref(language: string): string {
  return `?accessibility&language=${language}`
}

export function toolHref(language: string): string {
  return `?language=${language}`
}
