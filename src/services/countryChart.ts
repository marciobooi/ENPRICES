import type { TFunction } from 'i18next'
import { breakdownColors, componentColors, componentFallbackColors, units } from '../config/toolConfig'
import type { BandPrice, CountryPrices } from '../hooks/useEnergyPrices'
import { priceAxisTitle, paintByPosition, roundLegend, sortByName, tooltipTable } from './chartOptions'
import { resolveEnergyQuery } from '../hooks/useEnergyPrices'
import type { FilterValues } from '../state/filters'

export type CountryView = 'bar' | 'pie' | 'line'
export const countryViews: readonly CountryView[] = ['bar', 'pie', 'line']

/** One part of a price: a component code of the annual datasets, or energy / taxes / VAT of the semi-annual ones. */
export interface PricePart {
  key: string
  name: string
  color: string
  pick: (row: BandPrice) => number | null
}

export function colorOfComponent(code: string, index: number): string {
  return componentColors[code] ?? componentFallbackColors[index % componentFallbackColors.length]
}

/** The parts the price is made of: the annual components, or the price without taxes, the other taxes and the VAT. */
export function pricePartsOf(data: CountryPrices, t: TFunction): PricePart[] {
  if (data.componentMode) {
    return data.componentCodes.map((code, index) => ({
      key: code,
      name: t(`taxComponents.${code}`, { defaultValue: code }),
      color: colorOfComponent(code, index),
      pick: (row) => row.breakdown.find((point) => point.code === code)?.value ?? null,
    }))
  }
  return [
    { key: 'energy', name: t('chart.components.energy'), color: breakdownColors.energy, pick: (row) => row.components.energy },
    { key: 'taxes', name: t('chart.components.taxes'), color: breakdownColors.taxes, pick: (row) => row.components.taxes },
    { key: 'vat', name: t('chart.components.vat'), color: breakdownColors.vat, pick: (row) => row.components.vat },
  ]
}

/** The parts the bars of a country are stacked into: the annual components, or the three parts of the original details. */
export function stackPartsOf(data: CountryPrices, t: TFunction): PricePart[] {
  if (data.componentMode) return pricePartsOf(data, t)
  return [
    { key: 'energy', name: t('chart.components.energy'), color: breakdownColors.energy, pick: (row) => row.detail[0] ?? null },
    { key: 'taxes', name: t('chart.components.taxes'), color: breakdownColors.taxes, pick: (row) => row.detail[1] ?? null },
    { key: 'vat', name: t('chart.components.vat'), color: breakdownColors.vat, pick: (row) => row.detail[2] ?? null },
  ]
}

/** The period shown: the one requested if the country has it, otherwise the latest. */
export function countryPeriod(data: CountryPrices, requested: string): string {
  if (data.periods.includes(requested)) return requested
  return data.periods[data.periods.length - 1] ?? ''
}

/** The band shown by the pie and the line chart: the one selected in the menu when the country has it. */
export function countryBand(data: CountryPrices, values: FilterValues): string {
  const wanted = resolveEnergyQuery(values).selectedBand
  return data.bands.includes(wanted) ? wanted : data.bands[0] ?? ''
}

const roundTo = (decimals: number) => (value: number | null) => (value === null ? null : Number(value.toFixed(decimals)))

/** The periods of the line chart: from the first to the last period that has a value for the band, none of the empty ones around. */
export function linePeriods(data: CountryPrices, band: string): string[] {
  const hasValue = (period: string) => {
    const row = data.rows.find((candidate) => candidate.band === band && candidate.period === period)
    return Boolean(row) && (row!.total !== null || row!.breakdown.some((point) => point.value !== null))
  }
  const first = data.periods.findIndex(hasValue)
  if (first === -1) return []
  let last = data.periods.length - 1
  while (last > first && !hasValue(data.periods[last])) last--
  return data.periods.slice(first, last + 1)
}

export function rowAt(data: CountryPrices, band: string, period: string): BandPrice | undefined {
  return data.rows.find((row) => row.band === band && row.period === period)
}

/**
 * A pie cannot show a negative part (a subsidy or allowance larger than the charge), so, as in the original tool,
 * the pie is not drawn when any part of the price is negative.
 */
export function pieHasNegativePart(data: CountryPrices, values: FilterValues, t: TFunction): boolean {
  const period = countryPeriod(data, typeof values.time === 'string' ? values.time : '')
  const row = rowAt(data, countryBand(data, values), period)
  return Boolean(row) && pricePartsOf(data, t).some((part) => (part.pick(row as BandPrice) ?? 0) < 0)
}

/** True when the chosen view has at least one value to draw. */
export function countryHasData(data: CountryPrices, values: FilterValues, view: CountryView): boolean {
  const period = countryPeriod(data, typeof values.time === 'string' ? values.time : '')
  if (view === 'bar') return data.bands.some((band) => rowAt(data, band, period)?.total != null)
  const band = countryBand(data, values)
  if (view === 'pie') return (rowAt(data, band, period)?.allTaxes ?? rowAt(data, band, period)?.total ?? 0) > 0
  return linePeriods(data, band).length > 0
}

/** The title of one view of a country, e.g. "Germany: price by consumption band, 2026-S1". */
export function countryViewTitle(data: CountryPrices, values: FilterValues, view: CountryView, t: TFunction): string {
  const period = countryPeriod(data, typeof values.time === 'string' ? values.time : '')
  const band = t(`bands.${countryBand(data, values)}`, { defaultValue: countryBand(data, values) })
  const country = t(`countries.${data.countryCode}`, { defaultValue: data.countryCode })
  return view === 'bar'
    ? t('country.titleBar', { country, period })
    : view === 'pie'
      ? t('country.titlePie', { country, band, period })
      : t('country.titleLine', { country, band })
}

export function createCountryChart(data: CountryPrices, values: FilterValues, view: CountryView, t: TFunction) {
  const period = countryPeriod(data, typeof values.time === 'string' ? values.time : '')
  const band = countryBand(data, values)
  const stacked = values.breakdown === 'components'
  const percentage = values.percentage === 'percentage'
  const decimals = data.unit === 'MWH' ? 0 : 4
  const round = roundTo(decimals)
  const unitLabel = t(`units.${data.unit}`, { defaultValue: data.unit })
  const parts = pricePartsOf(data, t)
  const bandLabels = data.bands.map((code) => t(`bands.${code}`, { defaultValue: code }))

  let chart: Record<string, unknown> = { type: view === 'bar' ? 'column' : view === 'pie' ? 'pie' : 'line', height: view === 'pie' ? 560 : 560, style: { fontFamily: 'Arial, sans-serif' } }
  let xAxis: Record<string, unknown> = {}
  const shares = percentage && view === 'bar' && stacked
  let yAxis: Record<string, unknown> = {
    title: { text: priceAxisTitle(t, typeof values.product === 'string' ? values.product : '6000', data.unit, shares) },
    labels: { format: shares ? '{value}%' : '{value:.2f}' },
  }
  let plotOptions: Record<string, unknown> = { series: { dataLabels: { enabled: false } } }
  let legend: Record<string, unknown> = { enabled: false }
  let series: object[]

  if (view === 'bar') {
    // The names of the bands are long: they wrap under their bar, as in the original tool.
    xAxis = { categories: bandLabels, labels: { style: { fontSize: '12px', width: '140px', whiteSpace: 'normal' } } }
    if (stacked) {
      plotOptions = { column: { stacking: percentage ? 'percent' : 'normal' }, series: { dataLabels: { enabled: false } } }
      legend = { ...roundLegend }
      const stack = stackPartsOf(data, t)
      // The total of a stacked bar is the sum of all its parts, negative ones included, as in the original tool
      const sumOf = (code: string) => Number(stack.reduce((sum, part) => {
        const row = rowAt(data, code, period)
        return sum + (round(row ? part.pick(row) : null) ?? 0)
      }, 0).toFixed(decimals))
      const stacked = sortByName(stack.map((part) => ({
        name: part.name,
        color: part.color,
        data: data.bands.map((code) => {
          const row = rowAt(data, code, period)
          return { y: round(row ? part.pick(row) : null), customTotal: sumOf(code) }
        }),
      })))
      series = data.componentMode ? paintByPosition(stacked) : stacked
    } else {
      series = [{
        name: t('chart.totalPrice'),
        color: '#0E47CB',
        data: data.bands.map((code) => round(rowAt(data, code, period)?.total ?? null)),
      }]
    }
  } else if (view === 'pie') {
    const row = rowAt(data, band, period)
    const slices = parts
      .map((part) => ({ name: part.name, y: round(row ? part.pick(row) : null), color: part.color }))
      .filter((slice) => (slice.y ?? 0) > 0)
      .sort((a, b) => (b.y ?? 0) - (a.y ?? 0))
    xAxis = {}
    yAxis = {}
    plotOptions = {
      pie: {
        allowPointSelect: true,
        cursor: 'pointer',
        innerSize: '75%',
        showInLegend: true,
        // Name in bold, then the share and the value, as in the original tool.
        dataLabels: {
          enabled: true,
          y: -10,
          style: { fontSize: '.8rem', fontWeight: 'normal' },
          format: `<b>{point.name}</b>:<br>{point.percentage:.1f} %<br>${t('chart.value')} : {point.y:,.2f} €/${units[data.unit]?.abbr ?? data.unit}`,
        },
      },
    }
    // Wide screens: the legend stands on the right, one entry per line; narrow ones: below the chart.
    legend = typeof window !== 'undefined' && window.innerWidth > 700
      ? { ...roundLegend, align: 'right', verticalAlign: 'middle', layout: 'vertical', padding: 3, itemMarginTop: 5, itemMarginBottom: 5 }
      : { ...roundLegend }
    series = [{ type: 'pie', name: `EUR/${unitLabel}`, colorByPoint: true, data: slices }]
  } else {
    const shown = linePeriods(data, band)
    xAxis = { categories: shown, title: { text: t('chart.time') }, labels: { rotation: -45 } }
    legend = { ...roundLegend }
    const at = (period: string) => rowAt(data, band, period)
    series = [
      { name: t('chart.totalPrice'), color: componentColors.TOTAL, lineWidth: 3, data: shown.map((p) => round(at(p)?.total ?? null)) },
      ...(data.componentMode ? paintByPosition : (list: object[]) => list)(sortByName(parts.filter((part) => data.componentMode || part.key !== 'energy').map((part) => ({
        name: part.name,
        color: part.color,
        data: shown.map((p) => round(((row) => (row ? part.pick(row) : null))(at(p)))),
      })))),
    ]
  }

  chart = { ...chart, backgroundColor: 'transparent' }

  return {
    service: 'chart',
    version: '2.0',
    menu: false,
    data: {
      chart,
      title: { text: '' },
      subtitle: { text: '' },
      credits: { enabled: false },
      exporting: { enabled: false },
      xAxis,
      yAxis,
      plotOptions,
      tooltip: view === 'pie'
        ? { useHTML: true, headerFormat: '<table class="table_component"><thead><tr><th colspan="2">{point.key}</th></tr></thead><tbody>', pointFormat: `<tr><td><b>{point.y:.${decimals}f}</b> €/${units[data.unit]?.abbr ?? data.unit}</td><td>{point.percentage:.1f} %</td></tr>`, footerFormat: '</tbody></table>', padding: 0, borderWidth: 0, shadow: false, backgroundColor: 'transparent' }
        : tooltipTable({ decimals, unit: data.unit, stacked: view === 'line' || stacked, shares, totalLabel: t('chart.totalPrice'), total: view !== 'line' }),
      legend,
      series,
    },
  }
}
