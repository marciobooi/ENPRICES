import type { TFunction } from 'i18next'
import { allCountries, breakdownColors } from '../config/toolConfig'
import { priceAxisTitle, roundLegend, tooltipTable } from './chartOptions'
import { colorOfComponent } from './countryChart'
import type { EnergyPrices, CountryPrice } from '../hooks/useEnergyPrices'
import type { FilterValues } from '../state/filters'

const countryColor = (code: string) => code === 'EU27_2020' ? '#CCA300' : code === 'EA' ? '#208486' : '#0E47CB'

/** A column point that remembers its country, so a click on the bar can open that country's charts. */
const columnPoint = (row: CountryPrice, y: number | null, color?: string) => ({
  y,
  className: `geo-${row.countryCode}`,
  ...(color ? { color } : {}),
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
    return [...countries].sort((a, b) => {
      if (a.total === null) return b.total === null ? 0 : 1
      if (b.total === null) return -1
      return direction * (a.total - b.total)
    })
  }
  return countries
}

function priceValue(price: number | null): number | null {
  return price === null ? null : Number(price.toFixed(4))
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

  const series: object[] = stacked
    ? data.componentMode
      ? data.componentCodes.map((code, index) => ({
          name: t(`taxComponents.${code}`, { defaultValue: code }),
          color: colorOfComponent(code, index),
          data: currentCountries.map((row) => columnPoint(row, priceValue(row.breakdown.find((point) => point.code === code)?.value ?? null))),
        }))
      : [
          // The first part is the price without taxes, the bar of the plain view; the taxes are stacked on top of it.
          { name: t('chart.components.energy'), color: breakdownColors.energy, data: currentCountries.map((row) => columnPoint(row, priceValue(row.components.energy))) },
          { name: t('chart.components.taxes'), color: breakdownColors.taxes, data: currentCountries.map((row) => columnPoint(row, priceValue(row.components.taxes))) },
          { name: t('chart.components.vat'), color: breakdownColors.vat, data: currentCountries.map((row) => columnPoint(row, priceValue(row.components.vat))) },
        ]
    : [{
        // The price without taxes and levies, as the original tool names it.
        name: t('chart.components.energy'),
        data: currentCountries.map((row) => columnPoint(row, priceValue(row.total), countryColor(row.countryCode))),
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
        labels: { rotation: -45, style: { fontSize: '13px' } },
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
