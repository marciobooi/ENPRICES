import type { TFunction } from 'i18next'
import { allCountries, breakdownColors } from '../config/toolConfig'
import { priceAxisTitle, roundLegend, tooltipTable } from './chartOptions'
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

/** The countries of the period shown, in the order chosen (the same order for the bars and the table). */
export function orderedCountries(data: EnergyPrices, values: FilterValues, t: TFunction): CountryPrice[] {
  const period = selectedPeriod(data, valueOf(values, 'time', ''))
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
  const currentCountries = sortCountries(
    filterCountries(data, period),
    order,
    (code) => t(`countries.${code}`, { defaultValue: code }),
  )
  const decimals = data.unit === 'MWH' ? 0 : 4
  const rounded = (price: number | null) => priceValue(price, decimals)
  const partsOf = (row: CountryPrice): Array<number | null> =>
    data.componentMode ? data.componentCodes.map((code) => row.breakdown.find((point) => point.code === code)?.value ?? null) : row.detail
  const stackTotal = (row: CountryPrice) => Number(partsOf(row).reduce<number>((sum, value) => sum + (rounded(value) ?? 0), 0).toFixed(decimals))

  const series: object[] = stacked
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

  return {
    service: 'chart',
    version: '2.0',
    menu: false,
    data: {
      chart: { type: 'column', height: 560, style: { fontFamily: 'Arial, sans-serif' }, backgroundColor: 'transparent' },
      title: { text: '' },
      subtitle: { text: '' },
      credits: { enabled: false },
      exporting: { enabled: false },
      xAxis: {
        categories: currentCountries.map(({ countryCode }) => t(`countries.${countryCode}`, { defaultValue: countryCode })),
        labels: {
          rotation: -45,
          // A long name wraps onto at most two lines instead of being cut or running into its neighbour.
          style: { fontSize: '13px', width: '110px', whiteSpace: 'normal', textOverflow: 'ellipsis', lineClamp: 2 },
        },
      },
      yAxis: {
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
      // Narrow screens: every country name stays, rotated and smaller; a long name wraps onto a second line.
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
  return sortCountries(
    filterCountries(data, period),
    valueOf(values, 'order', 'desc'),
    (code) => t(`countries.${code}`, { defaultValue: code }),
  ).filter((row) => row.total !== null).map((row) => row.countryCode)
}
