import type { TFunction } from 'i18next'
import { units } from '../config/toolConfig'

/** Title of the vertical axis as in the original tool: "Electricity price [€/kWh]", or "... %" for shares. */
export function priceAxisTitle(t: TFunction, product: string, unit: string, shares = false): string {
  const name = t(`chart.productPrice.${product}`, { defaultValue: t('chart.price') })
  return shares ? `${name} %` : `${name} [€/${units[unit]?.abbr ?? unit}]`
}

/** Tooltip in the style of the original tool: a small table with the name of the bar in a dark header. */
export function tooltipTable(options: { decimals: number; unit: string; stacked: boolean; shares: boolean; totalLabel: string; total?: boolean }) {
  const { decimals, unit, stacked, shares, totalLabel, total = stacked } = options
  const abbr = units[unit]?.abbr ?? unit
  return {
    useHTML: true,
    shared: true,
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
      ? `<tr class="TOTAL"><td class="TOTAL">${totalLabel}</td><td class="TOTAL">{point.total:.${decimals}f}</td></tr></tbody></table>`
      : '</tbody></table>',
  }
}

/** The legend of the original tool: round markers, the text a little smaller. */
export const roundLegend = { enabled: true, align: 'center', verticalAlign: 'bottom', layout: 'horizontal', symbolRadius: 8, itemStyle: { fontSize: '.9rem', fontWeight: 'normal' } }
