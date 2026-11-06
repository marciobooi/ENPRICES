import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import type { CountryPricesState } from '../hooks/useEnergyPrices'
import { countryBand, countryHasData, createCountryChart, linePeriods, pieHasNegativePart, type CountryView } from '../services/countryChart'
import { countryTableOf } from '../services/countryTable'
import type { FilterValues } from '../state/filters'
import { EclNumber, EclRow, EclRowHeader, EclTable } from './EclTable'
import { Loading } from './Loading'
import { PeriodRange } from './PeriodRange'
import { SourceNote } from './SourceNote'
import { WebChart } from './WebChart'

interface CountryContentProps {
  countryCode: string
  values: FilterValues
  state: CountryPricesState
  view: CountryView
  /** Show the table of the figures instead of the chart (the table button of the top bar). */
  showTable?: boolean
  headingLevel?: 1 | 2
  /** Called with the first and the last period of the line chart when its range slider moves. */
  onRange?: (from: string, to: string) => void
}

/**
 * What a click on a country's bar opens: that country across every consumption band (bar), its price composition
 * (pie) and its evolution over time (line), or a table of the same figures. The buttons that change the view are in
 * the top bar (`CountryToolbar`), as in the original tool.
 */
export function CountryContent({ countryCode, values, state, view, showTable = false, headingLevel = 2, onRange }: CountryContentProps) {
  const { t } = useTranslation()
  const { data, error, loading } = state
  const country = t(`countries.${countryCode}`, { defaultValue: countryCode })
  const config = useMemo(() => data ? createCountryChart(data, values, view, t) : undefined, [data, t, values, view])
  const hasData = data ? countryHasData(data, values, view) : false
  const pieBlocked = Boolean(data) && view === 'pie' && pieHasNegativePart(data!, values, t)

  const table = useMemo(() => data ? countryTableOf(data, values, view, t) : undefined, [data, t, values, view])
  const Heading = `h${headingLevel}` as 'h1' | 'h2'
  const allPeriods = data && view === 'line' ? linePeriods(data, countryBand(data, values)) : []

  return (
    <div className="tool-content country-content">
      <Heading className="ecl-u-sr-only" tabIndex={-1}>{t('country.heading', { country })}</Heading>
      {loading && !data && <Loading stage />}
      {error && <p className="tool-content__message" role="alert">{t('toolContent.loadError')} {error.message}</p>}
      {data && !error && !hasData && <p className="tool-content__message" role="status">{t('country.empty')}</p>}
      {data && !error && hasData && pieBlocked && !showTable && <p className="tool-content__message" role="status">{t('country.pieNegative')}</p>}
      {data && config && hasData && !pieBlocked && !showTable && (
        <WebChart config={config} label={t(`country.view.${view}`)} busy={loading} />
      )}
      {data && !error && hasData && view === 'line' && onRange && allPeriods.length > 2 && (
        <PeriodRange
          periods={allPeriods}
          from={typeof values.lineFrom === 'string' ? values.lineFrom : ''}
          to={typeof values.lineTo === 'string' ? values.lineTo : ''}
          onChange={onRange}
        />
      )}
      {table && showTable && (
        <EclTable caption={table.caption} headers={table.headers}>
          {table.rows.map(([name, ...cells], index) => (
            <EclRow key={String(name)} current={index === table.currentRow}>
              <EclRowHeader label={table.headers[0]}>{name}</EclRowHeader>
              {cells.map((cell, column) => (
                <EclNumber key={table.headers[column + 1]} label={table.headers[column + 1]}>
                  {cell === null ? '-' : typeof cell === 'number' ? cell.toFixed(table.shareColumns.includes(column + 1) ? 1 : table.decimals) : cell}
                </EclNumber>
              ))}
            </EclRow>
          ))}
        </EclTable>
      )}
      {data && !error && hasData && <SourceNote dataset={data.dataset} />}
    </div>
  )
}
