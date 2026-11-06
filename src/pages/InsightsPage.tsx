import { useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { SiteFooter } from '../components/Footer'
import { InsightsContent } from '../components/InsightsContent'
import { SiteNavigation } from '../components/Nav'
import { useSiteShell } from '../hooks/useSiteShell'
import { toolHrefFromInsights } from '../insights/mode'
import { drillParams, filterParams } from '../state/filters'
import { readUrlState } from '../state/urlState'
import '../App.css'

/**
 * `?insights`: the same app shell (banner + footer) with the insights instead of the tool. The selection of the
 * tool (product, consumer, band, period, country that was open) comes from the address; nothing is changed here.
 */
export function InsightsPage() {
  const { t } = useTranslation()
  useSiteShell()
  // Read once: the page changes nothing, and a new object on every render would look like a new selection.
  const values = useMemo(() => readUrlState(filterParams), [])
  const drill = useMemo(() => readUrlState(drillParams), [])

  useEffect(() => {
    document.title = `${t('insights.title')} - ${t('brand')} - Eurostat`
  }, [t])

  return (
    <>
      <SiteNavigation title={t('brand')} />
      <main id="main-content" className="visualization-shell">
        <div className="insights-page">
          <div className="insights-page__bar">
            <h2 className="insights-page__title" id="insights-page-title">{t('insights.title')}</h2>
            <a className="ecl-button ecl-button--secondary" href={toolHrefFromInsights()}>
              <span className="ecl-button__container">
                <span className="ecl-button__label" data-ecl-label="true">{t('insights.back')}</span>
              </span>
            </a>
          </div>
          <InsightsContent
            open
            values={values}
            defaultFocus={drill.chartGeo || (Array.isArray(values.geo) ? values.geo[0] : undefined)}
          />
        </div>
      </main>
      <SiteFooter />
    </>
  )
}
