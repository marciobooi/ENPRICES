import { useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { ToolContent } from '../components/ToolContent'
import { site } from '../config/toolConfig'
import { embedChartId } from '../embed/embed'
import { CountryContent } from '../components/CountryContent'
import { useCountryPrices, useEnergyPrices } from '../hooks/useEnergyPrices'
import { countryViews, type CountryView } from '../services/countryChart'
import { readUrlState } from '../state/urlState'
import { drillParams, filterParams } from '../state/filters'
import '../App.css'

/**
 * `?embed=<chartId>`: only the main chart content for an <iframe>. The state comes from the address.
 */
export function EmbedPage() {
  const { i18n } = useTranslation()
  const state = useMemo(() => readUrlState(filterParams), [])
  const prices = useEnergyPrices(state)
  const drill = useMemo(() => readUrlState(drillParams), [])
  const countryPrices = useCountryPrices(state, drill.chartGeo)
  const view = (countryViews as readonly string[]).includes(drill.chartView) ? drill.chartView as CountryView : 'bar'

  useEffect(() => {
    document.documentElement.lang = i18n.resolvedLanguage ?? 'en'
    document.title = site.title
  }, [i18n.resolvedLanguage])

  return (
    <main className="embed-shell">
      {drill.chartGeo ? (
        <CountryContent countryCode={drill.chartGeo} values={state} state={countryPrices} view={view} headingLevel={1} />
      ) : (
        <ToolContent chartId={embedChartId()} values={state} state={prices} headingLevel={1} tableInDetails />
      )}
    </main>
  )
}
