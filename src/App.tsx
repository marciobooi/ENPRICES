import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { DriveStep } from 'driver.js'
import { features, filters, tourConfig, units } from './config/toolConfig'
import { describeFilter, useDrillState, useFilters } from './state/filters'
import { resolveEnergyQuery, useCountryPrices, useEnergyPrices } from './hooks/useEnergyPrices'
import { countryBand, countryPeriod, countryViewTitle, countryViews, type CountryView } from './services/countryChart'
import { selectedPeriod } from './services/energyChart'
import { useGuidedTour } from './hooks/useGuidedTour'
import { useSiteShell } from './hooks/useSiteShell'
import { DownloadMenu } from './components/DownloadMenu'
import { FilterControls } from './components/FilterControls'
import { SiteFooter } from './components/Footer'
import { insightsHref } from './insights/mode'
import { SiteNavigation } from './components/Nav'
import { RoundButton } from './components/RoundButton'
import { ShareMenu } from './components/ShareMenu'
import { SiteSubNavigation } from './components/SubNav'
import { ToolContent } from './components/ToolContent'
import { CountryContent } from './components/CountryContent'
import { CountryToolbar } from './components/CountryToolbar'
import { FloatingControls } from './components/FloatingControls'
import { buildCountryTable, buildToolTable } from './download/toolTable'
import './App.css'

function App() {
  const { t } = useTranslation()
  useSiteShell()

  // The filters (src/config/toolConfig.ts) live in the address: shared links and embedded views show this state.
  const [values, setFilter] = useFilters()
  const prices = useEnergyPrices(values)
  const drill = useDrillState()
  const [showTable, setShowTable] = useState(false)
  const [countryTable, setCountryTable] = useState(false)

  // Opening or closing a country removes the button that had focus: move focus to the heading of the new view
  // (WCAG 2.4.3), whose text is then read out. Not on the first render.
  const openCountry = useRef(drill.chartGeo)
  useEffect(() => {
    if (openCountry.current === drill.chartGeo) return
    openCountry.current = drill.chartGeo
    document.querySelector<HTMLElement>('#main-content .tool-content h1, #main-content .tool-content h2')?.focus()
  }, [drill.chartGeo])
  const countryPrices = useCountryPrices(values, drill.chartGeo)
  const countryView = (countryViews as readonly string[]).includes(drill.chartView) ? drill.chartView as CountryView : 'bar'
  const getTable = drill.chartGeo && countryPrices.data
    ? () => buildCountryTable(countryPrices.data!, values, countryView, t, { title: viewTitle, subtitle: viewSubtitle })
    : prices.data ? () => buildToolTable(prices.data!, t, { title: viewTitle, subtitle: viewSubtitle }, shownPeriod) : undefined

  // Context added to the contact e-mail: what the person had selected when they wrote.
  const emailDetails = useMemo(
    () => filters.map((definition) => ({
      label: t(`filters.${definition.id}`),
      value: describeFilter(definition, values[definition.id], t) || '-',
    })),
    [t, values],
  )

  // Title and subtitle of the view in the top bar: the dataset and the period, then the consumption band.
  const query = resolveEnergyQuery(values)
  const shownPeriod = prices.data ? selectedPeriod(prices.data, typeof values.time === 'string' ? values.time : '') : ''
  const unitAbbreviation = units[query.unit]?.abbr ?? query.unit
  const viewTitle = drill.chartGeo
    ? t(`datasets.${query.datasetCode}`)
    : `${t(`datasets.${query.datasetCode}`)} (EUR/${unitAbbreviation})${shownPeriod ? ` ${shownPeriod}` : ''}`
  const viewSubtitle = drill.chartGeo
    ? countryPrices.data ? countryViewTitle(countryPrices.data, values, countryView, t) : ''
    : `${t(`bands.${query.selectedBand}`, { defaultValue: query.selectedBand })}${shownPeriod ? ` - ${shownPeriod}` : ''}`

  // Tells screen readers that the chart changed (the chart itself is redrawn silently).
  const timeValue = typeof values.time === 'string' ? values.time : ''
  const announcement = drill.chartGeo
    ? countryPrices.data
      ? t('announce.updated', {
          title: `${t('country.heading', { country: t(`countries.${drill.chartGeo}`, { defaultValue: drill.chartGeo }) })}, ${countryPeriod(countryPrices.data, timeValue)}, ${t(`bands.${countryBand(countryPrices.data, values)}`)}`,
        })
      : ''
    : prices.data
      ? t('announce.updated', { title: `${t('toolContent.title')}, ${selectedPeriod(prices.data, timeValue)}, ${t(`bands.${String(values.band)}`, { defaultValue: '' })}` })
      : ''

  // The steps come from `tourConfig.steps`, their texts from the locale files.
  const tourSteps = useMemo<DriveStep[]>(
    () => tourConfig.steps.map(({ id, element }) => ({
      element,
      popover: { title: t(`tour.${id}Title`), description: t(`tour.${id}Description`) },
    })),
    [t],
  )
  const { startTour } = useGuidedTour(tourSteps)

  return (
    <>
      <SiteNavigation title={t('brand')} />

      <SiteSubNavigation
        title={viewTitle}
        subtitle={viewSubtitle}
        filters={drill.chartGeo ? undefined : <FilterControls values={values} periods={prices.data?.periods} onChange={setFilter} />}
        actions={drill.chartGeo ? (
          // While a country is open the top bar has its own buttons, as in the original tool.
          <CountryToolbar
            view={countryView}
            onViewChange={drill.setView}
            showTable={countryTable}
            onToggleTable={() => setCountryTable((current) => !current)}
            onClose={() => {
              setCountryTable(false)
              drill.close()
            }}
            getTable={getTable}
            title={viewSubtitle || viewTitle}
            heading={viewTitle}
          />
        ) : (
          <>
            {features.insights && (
              <RoundButton
                id="insights-button"
                icon="lightbulb"
                label={t('insights.open')}
                aria-haspopup="dialog"
                onClick={() => window.location.assign(insightsHref())}
              />
            )}
            {features.download && <DownloadMenu getTable={getTable} heading={{ title: viewTitle, subtitle: viewSubtitle }} />}
            {features.share && <ShareMenu emailDetails={emailDetails} />}
            {features.tour && <RoundButton id="tour-button" icon="help" label={t('tour.start')} onClick={startTour} />}
          </>
        )}
      />

      <main id="main-content" className="visualization-shell">
        {drill.chartGeo ? (
          <CountryContent
            countryCode={drill.chartGeo}
            values={values}
            state={countryPrices}
            view={countryView}
            showTable={countryTable}
          />
        ) : (
          <>
            <FloatingControls values={values} onChange={setFilter} showTable={showTable} onToggleTable={() => setShowTable((current) => !current)} />
            <ToolContent values={values} state={prices} onSelectCountry={(code) => {
                setCountryTable(false)
                drill.open(code)
              }}
              showTable={showTable} />
          </>
        )}
      </main>

      <span className="ecl-u-sr-only" role="status" aria-live="polite">{announcement}</span>

      <SiteFooter />
    </>
  )
}

export default App
