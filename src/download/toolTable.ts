import type { TFunction } from 'i18next'
import type { CountryPrices, EnergyPrices } from '../hooks/useEnergyPrices'
import type { CountryView } from '../services/countryChart'
import { countryTableOf } from '../services/countryTable'
import type { FilterValues } from '../state/filters'
import type { DownloadTable } from './download'

/** Export the values currently shown by the selected ENPRICES dataset. */
export function buildToolTable(data: EnergyPrices, t: TFunction): DownloadTable {
  // The price without taxes first (the bar), then the parts that are added to it, then the price with all taxes.
  const added = data.componentMode
    ? data.componentCodes.map((code) => t(`taxComponents.${code}`, { defaultValue: code }))
    : [t('chart.components.taxes'), t('chart.components.vat')]
  const headers = [t('filters.geo'), t('filters.time'), t('chart.components.energy'), ...added, t('chart.totalPrice')]

  return {
    sheet: t('download.sheet'),
    headers,
    rows: data.countries.map((row) => [
      t(`countries.${row.countryCode}`, { defaultValue: row.countryCode }),
      row.period,
      row.total ?? '-',
      ...(data.componentMode
        ? data.componentCodes.map((code) => row.breakdown.find((point) => point.code === code)?.value ?? '-')
        : [row.components.taxes ?? '-', row.components.vat ?? '-']),
      row.allTaxes ?? '-',
    ]),
  }
}

/** Excel table of a country: the same table the screen shows for the chart that is in view. */
export function buildCountryTable(data: CountryPrices, values: FilterValues, view: CountryView, t: TFunction): DownloadTable {
  const table = countryTableOf(data, values, view, t)
  return {
    sheet: t('download.sheet'),
    headers: table.headers,
    rows: table.rows.map(([name, ...cells]) => [name as string, ...cells.map((cell) => cell ?? '-')]),
  }
}
