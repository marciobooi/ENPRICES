import type { TFunction } from 'i18next'
import type { CountryPrices } from '../hooks/useEnergyPrices'
import type { FilterValues } from '../state/filters'
import { countryBand, countryPeriod, linePeriods, pricePartsOf, rowAt, stackPartsOf, type CountryView } from './countryChart'

export interface CountryTable {
  caption: string
  headers: string[]
  /** The first cell is the name of the row; the others are numbers (or null when there is no value). */
  rows: Array<Array<string | number | null>>
  /** Index of the row that is the current selection (the band chosen in the menu), if any. */
  currentRow?: number
  /** Number of decimals of the price cells; the share column of the pie always has one. */
  decimals: number
  /** Columns that are shares in %, shown with one decimal. */
  shareColumns: number[]
}

/**
 * The table of the chart that is showing, so the table and the chart always say the same thing: for the bar chart
 * one row per consumption band, for the pie the parts of the price of the selected band, for the line chart one row
 * per period. It is also what the Excel file of a country contains.
 */
export function countryTableOf(data: CountryPrices, values: FilterValues, view: CountryView, t: TFunction): CountryTable {
  const period = countryPeriod(data, typeof values.time === 'string' ? values.time : '')
  const band = countryBand(data, values)
  const country = t(`countries.${data.countryCode}`, { defaultValue: data.countryCode })
  const bandName = t(`bands.${band}`, { defaultValue: band })
  const parts = pricePartsOf(data, t)
  const decimals = data.unit === 'MWH' ? 0 : 4
  const total = t('chart.totalPrice')

  if (view === 'pie') {
    const row = rowAt(data, band, period)
    const sum = row?.allTaxes ?? row?.total ?? null
    const rows: CountryTable['rows'] = parts.map((part) => {
      const value = row ? part.pick(row) : null
      return [part.name, value, value !== null && sum ? (value / sum) * 100 : null]
    })
    rows.push([total, sum, sum === null ? null : 100])
    return {
      caption: t('country.tableCaptionPie', { country, band: bandName, period }),
      headers: [t('country.colComponent'), t('country.colPrice'), t('country.colShare')],
      rows,
      decimals,
      shareColumns: [2],
    }
  }

  // The first part of a half-yearly price is the price without taxes, which is the `total`: it is not listed twice.
  const added = data.componentMode ? parts : parts.filter((part) => part.key !== 'energy')
  const withoutTaxes = data.componentMode ? total : t('chart.components.energy')

  if (view === 'line') {
    return {
      caption: t('country.tableCaptionLine', { country, band: bandName }),
      headers: [t('chart.time'), withoutTaxes, ...added.map((part) => part.name)],
      rows: linePeriods(data, band).map((p) => {
        const row = rowAt(data, band, p)
        return [p, row?.total ?? null, ...added.map((part) => (row ? part.pick(row) : null))]
      }),
      decimals,
      shareColumns: [],
    }
  }

  // The bar chart: the price without taxes per band, or, with the details, the parts it is stacked into and their sum.
  const details = values.breakdown === 'components'
  const stack = stackPartsOf(data, t)
  return {
    caption: t('country.tableCaption', { country, period }),
    headers: [t('filters.band'), ...(details ? [...stack.map((part) => part.name), total] : [withoutTaxes])],
    rows: data.bands.map((code) => {
      const row = rowAt(data, code, period)
      return [
        t(`bands.${code}`, { defaultValue: code }),
        ...(details
          ? [...stack.map((part) => (row ? part.pick(row) : null)), (data.componentMode ? row?.allTaxes : row?.total) ?? null]
          : [row?.total ?? null]),
      ]
    }),
    currentRow: data.bands.indexOf(band),
    decimals,
    shareColumns: [],
  }
}
