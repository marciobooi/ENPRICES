import type { TFunction } from 'i18next'
import { filters } from '../config/toolConfig'
import { describeFilter, type FilterValues } from '../state/filters'
import type { DownloadTable } from './download'

/**
 * EXAMPLE data of the chart for the Excel download: one row per filter in force. Replace it with the real series
 * of your chart (headers + rows); the download menu only needs this shape.
 */
export function buildToolTable(values: FilterValues, t: TFunction): DownloadTable {
  return {
    sheet: t('download.sheet'),
    headers: [t('download.columnFilter'), t('download.columnSelection')],
    rows: filters.map((definition) => [t(`filters.${definition.id}`), describeFilter(definition, values[definition.id], t)]),
  }
}
