import type { TFunction } from 'i18next'
import { componentFallbackColors, componentPalette, units } from '../config/toolConfig'

/** Title of the vertical axis as in the original tool: "Electricity price [€/kWh]", or "... %" for shares. */
export function priceAxisTitle(t: TFunction, product: string, unit: string, shares = false): string {
  const name = t(`chart.productPrice.${product}`, { defaultValue: t('chart.price') })
  return shares ? `${name} %` : `${name} [€/${units[unit]?.abbr ?? unit}]`
}

/**
 * Stacked series in alphabetical order of their (translated) names, so the tooltip, the legend and the stack read the
 * same way in every language. Highcharts lists a shared tooltip in series order.
 */
export function sortByName<T extends { name?: string }>(series: T[]): T[] {
  const collator = new Intl.Collator(document.documentElement.lang || 'en')
  return [...series].sort((a, b) => collator.compare(a.name ?? '', b.name ?? ''))
}

/** The original paints the (alphabetical) components by position: the first one blue, the second cyan, and so on. */
export function paintByPosition<T extends object>(series: T[]): T[] {
  const colors = [...componentPalette, ...componentFallbackColors]
  return series.map((entry, index) => ({ ...entry, color: colors[index % colors.length] }))
}

/** Tooltip in the style of the original tool: a small table with the name of the bar in a dark header. */
export function tooltipTable(options: { decimals: number; unit: string; stacked: boolean; shares: boolean; totalLabel: string; total?: boolean }) {
  const { decimals, unit, stacked, shares, totalLabel, total = stacked } = options
  const abbr = units[unit]?.abbr ?? unit
  return {
    useHTML: true,
    shared: true,
    // Drawn outside the chart, on top of the page: not clipped by the chart and not covered by the floating options bar.
    outside: true,
    padding: 0,
    borderWidth: 0,
    shadow: false,
    backgroundColor: 'transparent',
    headerFormat: stacked
      ? `<table class="table_component"><thead><tr><th>{point.key}</th><th class="tooltipUnit">${unit}</th></tr></thead><tbody>`
      : '<table class="table_component"><thead><tr><th colspan="2">{point.key}</th></tr></thead><tbody>',
    pointFormat: stacked
      ? `<tr><td><span style="color:{series.color}">●</span> {series.name}</td><td>${shares ? '{point.percentage:.0f} %' : `{point.y:.${decimals}f}`}</td></tr>`
      : `<tr><td colspan="2"><b>{point.y:.${decimals}f}</b> €/${abbr}</td></tr>`,
    footerFormat: stacked && total && !shares
      ? `<tr class="TOTAL"><td class="TOTAL">${totalLabel}</td><td class="TOTAL">{point.customTotal:.${decimals}f}</td></tr></tbody></table>`
      : '</tbody></table>',
  }
}

/** The legend of the original tool: round markers, the text a little smaller. */
export const roundLegend = { enabled: true, align: 'center', verticalAlign: 'bottom', layout: 'horizontal', symbolRadius: 8, itemStyle: { fontSize: '.9rem', fontWeight: 'normal' } }
