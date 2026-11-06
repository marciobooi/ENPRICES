import type { TFunction } from 'i18next'
import { allCountries, breakdownColors } from '../config/toolConfig'
import { priceAxisTitle, paintByPosition, roundLegend, sortByName, tooltipTable } from './chartOptions'
import { priceDecimals } from './decimals'
import { colorOfComponent } from './countryChart'
import type { EnergyPrices, CountryPrice } from '../hooks/useEnergyPrices'
import type { FilterValues } from '../state/filters'

const countryColor = (code: string) => code === 'EU27_2020' ? '#CCA300' : code === 'EA' ? '#208486' : '#0E47CB'

/** A column point that remembers its country, so a click on the bar can open that country's charts. */
const columnPoint = (row: CountryPrice, y: number | null, color?: string, customTotal?: number) => ({
  y,
  className: `geo-${row.countryCode}`,
  ...(color ? { color } : {}),
  // The total shown by the tooltip of a stacked bar: the sum of all its parts, negative ones included, as in the original tool
  ...(customTotal === undefined ? {} : { customTotal }),
})

function valueOf(values: FilterValues, key: string, fallback: string): string {
  const value = values[key]
  return typeof value === 'string' ? value : fallback
}

function filterCountries(data: EnergyPrices, period: string): CountryPrice[] {
  return data.countries.filter((row) => row.period === period)
}

function sortCountries(
  countries: CountryPrice[],
  order: string,
  translate: (code: string) => string,
): CountryPrice[] {
  if (order === 'proto') {
    const position = new Map(allCountries.map((code, index) => [code, index]))
    return [...countries].sort((a, b) => (position.get(a.countryCode) ?? Number.MAX_SAFE_INTEGER) - (position.get(b.countryCode) ?? Number.MAX_SAFE_INTEGER))
  }
  if (order === 'alfa') return [...countries].sort((a, b) => translate(a.countryCode).localeCompare(translate(b.countryCode)))
  if (order === 'asc' || order === 'desc') {
    const direction = order === 'asc' ? 1 : -1
    // A country without a value counts as 0, as in the original tool, so it moves with the others: first when the
    // order is ascending, last when it is descending.
    return [...countries].sort((a, b) => direction * ((a.total ?? 0) - (b.total ?? 0)))
  }
  return countries
}

/** A price rounded once, to the decimals the original tool uses: 4, or none for MWh. */
function priceValue(price: number | null, decimals: number): number | null {
  return price === null ? null : Number(price.toFixed(decimals))
}

/**
 * While the period timeline plays, the countries keep the places they had when it started (`playOrder`), so from one
 * period to the next the bars only grow and shrink instead of jumping to new places. A country with no figure in a period
 * keeps its place with no bar (`gaps`) or, for the table, is left out.
 */
function lockedCountries(data: EnergyPrices, period: string, playOrder: readonly string[], gaps: boolean): CountryPrice[] {
  const rows = new Map(filterCountries(data, period).map((row) => [row.countryCode, row]))
  return playOrder.flatMap((code) => {
    const row = rows.get(code)
    if (row) return [row]
    if (!gaps) return []
    return [{ countryCode: code, period, total: null, allTaxes: null, detail: [null, null, null], components: { energy: null, taxes: null, vat: null }, breakdown: [] } as CountryPrice]
  })
}

const playOrderOf = (values: FilterValues): string[] => (Array.isArray(values.playOrder) ? values.playOrder : [])

/** The value axis while the timeline plays: the same from the first period to the last, so the bars are measured against one scale. */
function playAxis(data: EnergyPrices, stacked: boolean, decimals: number): { min: number; max: number } {
  let low = 0
  let high = 0
  for (const row of data.countries) {
    const parts = stacked
      ? data.componentMode ? data.componentCodes.map((code) => row.breakdown.find((point) => point.code === code)?.value ?? null) : row.detail
      : [row.total]
    const numbers = parts.filter((value): value is number => value !== null)
    high = Math.max(high, numbers.filter((value) => value > 0).reduce((sum, value) => sum + value, 0))
    low = Math.min(low, numbers.filter((value) => value < 0).reduce((sum, value) => sum + value, 0))
  }
  const round = (value: number) => Number(value.toFixed(Math.max(2, decimals)))
  return { min: round(low * 1.05), max: round(high * 1.05) }
}

/** The countries of the period shown, in the order chosen (the same order for the bars and the table). */
export function orderedCountries(data: EnergyPrices, values: FilterValues, t: TFunction): CountryPrice[] {
  const period = selectedPeriod(data, valueOf(values, 'time', ''))
  const playOrder = playOrderOf(values)
  if (playOrder.length > 0) return lockedCountries(data, period, playOrder, false)
  return sortCountries(filterCountries(data, period), valueOf(values, 'order', 'desc'), (code) => t(`countries.${code}`, { defaultValue: code }))
}

export function selectedPeriod(data: EnergyPrices, requested: string): string {
  if (data.periods.includes(requested)) return requested
  return data.periods[data.periods.length - 1] ?? ''
}

/**
 * The bar chart of the main view: one bar per country, in the order chosen, either the total price or the price
 * broken down into its parts. It has no title, subtitle or source line of its own: they are in the top bar.
 */
export function createEnergyPriceChart(data: EnergyPrices, values: FilterValues, t: TFunction) {
  const period = selectedPeriod(data, valueOf(values, 'time', ''))
  const stacked = valueOf(values, 'breakdown', 'total') === 'components'
  const percentage = stacked && valueOf(values, 'percentage', 'value') === 'percentage'
  const order = valueOf(values, 'order', 'desc')
  const playOrder = playOrderOf(values)
  const currentCountries = playOrder.length > 0
    ? lockedCountries(data, period, playOrder, true)
    : sortCountries(filterCountries(data, period), order, (code) => t(`countries.${code}`, { defaultValue: code }))
  const decimals = priceDecimals(data.unit, values)
  const rounded = (price: number | null) => priceValue(price, decimals)
  const partsOf = (row: CountryPrice): Array<number | null> =>
    data.componentMode ? data.componentCodes.map((code) => row.breakdown.find((point) => point.code === code)?.value ?? null) : row.detail
  const stackTotal = (row: CountryPrice) => Number(partsOf(row).reduce<number>((sum, value) => sum + (rounded(value) ?? 0), 0).toFixed(decimals))

  const unsortedSeries: Array<{ name: string; [key: string]: unknown }> = stacked
    ? data.componentMode
      ? data.componentCodes.map((code, index) => ({
          name: t(`taxComponents.${code}`, { defaultValue: code }),
          color: colorOfComponent(code, index),
          data: currentCountries.map((row) => columnPoint(row, rounded(row.breakdown.find((point) => point.code === code)?.value ?? null), undefined, stackTotal(row))),
        }))
      : [
          // The three parts of the original tool; together they are the plain bar.
          { name: t('chart.components.energy'), color: breakdownColors.energy, data: currentCountries.map((row) => columnPoint(row, rounded(row.detail[0] ?? null), undefined, stackTotal(row))) },
          { name: t('chart.components.taxes'), color: breakdownColors.taxes, data: currentCountries.map((row) => columnPoint(row, rounded(row.detail[1] ?? null), undefined, stackTotal(row))) },
          { name: t('chart.components.vat'), color: breakdownColors.vat, data: currentCountries.map((row) => columnPoint(row, rounded(row.detail[2] ?? null), undefined, stackTotal(row))) },
        ]
    : [{
        // The price without taxes and levies (half-yearly), or the sum of the components (annual), as in the original tool.
        name: data.componentMode ? t('chart.totalPrice') : t('chart.components.energy'),
        data: currentCountries.map((row) => columnPoint(row, rounded(row.total), countryColor(row.countryCode))),
      }]
  // Alphabetical, like the tooltip: the stack, the legend and the tooltip list the parts in the same order.
  const series = stacked ? (data.componentMode ? paintByPosition(sortByName(unsortedSeries)) : sortByName(unsortedSeries)) : unsortedSeries

  return {
    service: 'chart',
    version: '2.0',
    menu: false,
    data: {
      chart: { type: 'column', height: 560, style: { fontFamily: 'Arial, sans-serif' }, backgroundColor: 'transparent' },
      title: { text: '' },
      subtitle: { text: '' },
      credits: { enabled: false },
      // No data table under the chart: the tool has its own table view.
      exporting: { enabled: false, showTable: false },
      xAxis: {
        categories: currentCountries.map(({ countryCode }) => t(`countries.${countryCode}`, { defaultValue: countryCode })),
        labels: {
          rotation: -45,
          // One line per name: a rotated name that wraps onto two lines runs into its neighbour.
          style: { fontSize: '13px', whiteSpace: 'nowrap' },
        },
      },
      yAxis: {
        ...(playOrder.length > 0 && !percentage ? playAxis(data, stacked, decimals) : {}),
        title: { text: priceAxisTitle(t, valueOf(values, 'product', '6000'), data.unit, percentage) },
        labels: { format: percentage ? '{value}%' : '{value:.2f}' },
      },
      plotOptions: {
        column: { stacking: stacked ? (percentage ? 'percent' : 'normal') : undefined },
        series: { dataLabels: { enabled: false }, cursor: 'pointer' },
      },
      tooltip: tooltipTable({ decimals, unit: data.unit, stacked, shares: percentage, totalLabel: t('chart.totalPrice') }),
      legend: { ...roundLegend, enabled: stacked },
      series,
      // Narrow screens: every country name stays, rotated and smaller.
      responsive: {
        rules: [
          { condition: { maxWidth: 700 }, chartOptions: { xAxis: { labels: { rotation: -90, style: { fontSize: '11px' } } }, chart: { height: 500 } } },
          { condition: { maxWidth: 440 }, chartOptions: { xAxis: { labels: { rotation: -90, style: { fontSize: '10px' } } }, chart: { height: 480 } } },
        ],
      },
    },
  }
}

/** Country codes in the order the bars are drawn (countries without a value have no bar). */
export function chartCountryCodes(data: EnergyPrices, values: FilterValues, t: TFunction): string[] {
  const period = selectedPeriod(data, valueOf(values, 'time', ''))
  const playOrder = playOrderOf(values)
  return (playOrder.length > 0
    ? lockedCountries(data, period, playOrder, true)
    : sortCountries(filterCountries(data, period), valueOf(values, 'order', 'desc'), (code) => t(`countries.${code}`, { defaultValue: code }))
  ).filter((row) => row.total !== null).map((row) => row.countryCode)
}
