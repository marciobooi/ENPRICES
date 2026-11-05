import type { TFunction } from 'i18next'
import type { CountryPrices, EnergyPrices } from '../hooks/useEnergyPrices'
import type { CountryView } from '../services/countryChart'
import { countryTableOf } from '../services/countryTable'
import type { FilterValues } from '../state/filters'
import type { DownloadTable } from './download'

/** Title, source and unit around the table: what the person needs to quote the figures. */
function sheetText(dataset: string, unit: string, heading: { title?: string; subtitle?: string } | undefined, t: TFunction) {
  const url = `https://ec.europa.eu/eurostat/databrowser/view/${dataset}/default/table`
  return {
    title: heading?.title,
    subtitle: heading?.subtitle,
    notes: [
      t('download.noteSource'),
      t('download.noteDataset', { code: dataset }),
      t('download.noteLink', { url }),
      t('download.noteUnit', { unit }),
      t('download.noteDate', { date: new Date().toISOString().slice(0, 10) }),
    ],
  }
}

/** Export the values currently shown by the selected ENPRICES dataset. */
export function buildToolTable(data: EnergyPrices, t: TFunction, heading?: { title?: string; subtitle?: string }, period?: string): DownloadTable {
  // Only the period on screen (all of them when none is given).
  const rows = period ? data.countries.filter((row) => row.period === period) : data.countries
  // The price without taxes first (the bar), then the parts that are added to it, then the price with all taxes.
  const added = data.componentMode
    ? data.componentCodes.map((code) => t(`taxComponents.${code}`, { defaultValue: code }))
    : [t('chart.components.taxes'), t('chart.components.vat')]
  const headers = [t('filters.geo'), t('filters.time'), data.componentMode ? t('chart.totalPrice') : t('chart.components.energy'), ...added, t('chart.totalPrice')]

  return {
    ...sheetText(data.dataset, data.unit, heading, t),
    sheet: t('download.sheet'),
    headers,
    rows: rows.map((row) => [
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
export function buildCountryTable(data: CountryPrices, values: FilterValues, view: CountryView, t: TFunction, heading?: { title?: string; subtitle?: string }): DownloadTable {
  const table = countryTableOf(data, values, view, t)
  return {
    ...sheetText(data.dataset, data.unit, heading, t),
    sheet: t('download.sheet'),
    headers: table.headers,
    rows: table.rows.map(([name, ...cells]) => [name as string, ...cells.map((cell) => cell ?? '-')]),
  }
}
