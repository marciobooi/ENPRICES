import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { embedConfig } from '../config/toolConfig'
import type { EnergyPricesState } from '../hooks/useEnergyPrices'
import { chartCountryCodes, createEnergyPriceChart, selectedPeriod } from '../services/energyChart'
import type { FilterValues } from '../state/filters'
import { EclNumber, EclRow, EclRowHeader, EclTable } from './EclTable'
import { Loading } from './Loading'
import { WebChart } from './WebChart'

interface ToolContentProps {
  /** Which chart to show: the page shows the main one; an embedded view shows the chart named in `?embed=`. */
  chartId?: string
  /** The filters in force (from the address). */
  values: FilterValues
  /** Loaded data is shared with the Excel export on the full page. */
  state: EnergyPricesState
  /** Heading level of the chart title: 2 under the banner's h1, 1 in an embedded view that has no banner. */
  headingLevel?: 1 | 2
  /** Opens the charts of one country; given, the bars (and the table rows) become clickable. */
  onSelectCountry?: (code: string) => void
  /** Show the data table instead of the chart (the table button of the floating bar). */
  showTable?: boolean
  /** Offer the table as a disclosure under the chart: for the embedded view, which has no floating bar and so no table button. */
  tableInDetails?: boolean
}

export function ToolContent({
  chartId = embedConfig.defaultChart,
  values,
  state,
  headingLevel = 2,
  onSelectCountry,
  showTable = false,
  tableInDetails = false,
}: ToolContentProps) {
  const { t } = useTranslation()
  const { data, error, loading } = state
  const chartConfig = useMemo(
    () => data ? createEnergyPriceChart(data, values, t) : undefined,
    [data, t, values],
  )
  const barCodes = useMemo(() => data ? chartCountryCodes(data, values, t) : [], [data, t, values])

  if (!embedConfig.charts.includes(chartId)) {
    return <p className="tool-content__message" role="alert">{t('toolContent.unknownChart')}</p>
  }

  const period = data ? selectedPeriod(data, typeof values.time === 'string' ? values.time : '') : ''
  const currentRows = data?.countries.filter((row) => row.period === period) ?? []
  const showBreakdown = values.breakdown === 'components'
  const canOpenCountry = onSelectCountry

  const decimals = data?.unit === 'MWH' ? 0 : 4
  const figure = (value: number | null | undefined) => value?.toFixed(decimals) ?? '-'
  const partNames = data
    ? data.componentMode
      ? data.componentCodes.map((code) => t(`taxComponents.${code}`, { defaultValue: code }))
      : [t('chart.components.energy'), t('chart.components.taxes'), t('chart.components.vat')]
    : []
  const columns = data
    ? [
        t('filters.geo'),
        ...(showBreakdown ? partNames : []),
        // Plain: the price without taxes. With the details: the sum of the parts, the price with all taxes.
        showBreakdown ? t('chart.totalPrice') : t('chart.components.energy'),
      ]
    : []
  const dataTable = data ? (
    <EclTable caption={t('toolContent.tableCaption', { period })} headers={columns}>
      {currentRows.map((row) => {
        const name = t(`countries.${row.countryCode}`, { defaultValue: row.countryCode })
        const parts = data.componentMode
          ? data.componentCodes.map((code) => row.breakdown.find((point) => point.code === code)?.value)
          : [row.components.energy, row.components.taxes, row.components.vat]
        return (
          <EclRow key={row.countryCode}>
            <EclRowHeader label={columns[0]}>
              {onSelectCountry && row.total !== null ? (
                <button
                  type="button"
                  className="ecl-link ecl-link--standalone energy-data__country"
                  onClick={() => onSelectCountry(row.countryCode)}
                  aria-label={t('country.open', { country: name })}
                >
                  {name}
                </button>
              ) : name}
            </EclRowHeader>
            {showBreakdown && parts.map((value, index) => (
              <EclNumber key={columns[index + 1]} label={columns[index + 1]}>{figure(value)}</EclNumber>
            ))}
            <EclNumber label={columns[columns.length - 1]}>{figure(showBreakdown ? row.allTaxes : row.total)}</EclNumber>
          </EclRow>
        )
      })}
    </EclTable>
  ) : null

  const Heading = `h${headingLevel}` as 'h1' | 'h2'

  return (
    <div className="tool-content">
      <Heading className="ecl-u-sr-only" tabIndex={-1}>{t('toolContent.title')}</Heading>
      {loading && <Loading centered />}
      {error && <p className="tool-content__message" role="alert">{t('toolContent.loadError')} {error.message}</p>}
      {data && !error && chartConfig && (
        <>
          {!showTable && (
            <WebChart
              config={chartConfig}
              label={t('toolContent.title')}
              busy={loading}
              onSelectCountry={canOpenCountry ? onSelectCountry : undefined}
              fallbackCodes={barCodes}
            />
          )}
          {canOpenCountry && !showTable && <p className="ecl-u-sr-only">{t('country.openHint')}</p>}
          {showTable && dataTable}
          {!showTable && tableInDetails && (
            <details className="energy-data">
              <summary>{t('toolContent.dataTable')}</summary>
              {dataTable}
            </details>
          )}
        </>
      )}
    </div>
  )
}
