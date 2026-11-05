import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { DriveStep } from 'driver.js'
import { features, filters, menuItems, tourConfig } from './config/toolConfig'
import { describeFilter, useFilters } from './state/filters'
import { useGuidedTour } from './hooks/useGuidedTour'
import { useSiteShell } from './hooks/useSiteShell'
import { DownloadMenu } from './components/DownloadMenu'
import { FilterControls } from './components/FilterControls'
import { SiteFooter } from './components/Footer'
import { InsightsContent } from './components/InsightsContent'
import { InsightsPanel } from './components/InsightsPanel'
import { SiteNavigation } from './components/Nav'
import { RoundButton } from './components/RoundButton'
import { ShareMenu } from './components/ShareMenu'
import { SiteSubNavigation } from './components/SubNav'
import { ToolContent } from './components/ToolContent'
import { buildToolTable } from './download/toolTable'
import './App.css'

function App() {
  const { t } = useTranslation()
  useSiteShell()

  // The filters (src/config/toolConfig.ts) live in the address: shared links and embedded views show this state.
  const [values, setFilter] = useFilters()
  const [insightsOpen, setInsightsOpen] = useState(false)

  // Context added to the contact e-mail: what the person had selected when they wrote.
  const emailDetails = useMemo(
    () => filters.map((definition) => ({
      label: t(`filters.${definition.id}`),
      value: describeFilter(definition, values[definition.id], t) || '-',
    })),
    [t, values],
  )

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
        title={t('subnav.title')}
        subtitle={t('subnav.subtitle')}
        menuItems={menuItems.map(({ labelKey, href }) => ({ label: t(labelKey), href }))}
        filters={<FilterControls values={values} onChange={setFilter} />}
        actions={
          <>
            {features.insights && (
              <RoundButton
                id="insights-button"
                icon="lightbulb"
                label={t('insights.open')}
                aria-haspopup="dialog"
                onClick={() => setInsightsOpen(true)}
              />
            )}
            {features.download && <DownloadMenu getTable={() => buildToolTable(values, t)} />}
            {features.share && <ShareMenu emailDetails={emailDetails} />}
            {features.tour && <RoundButton id="tour-button" icon="help" label={t('tour.start')} onClick={startTour} />}
          </>
        }
      />

      <main id="main-content" className="visualization-shell">
        <ToolContent values={values} />
      </main>

      {features.insights && (
        <InsightsPanel
          open={insightsOpen}
          onClose={() => setInsightsOpen(false)}
          title={t('insights.title')}
          closeLabel={t('insights.close')}
        >
          <InsightsContent />
        </InsightsPanel>
      )}

      <SiteFooter />
    </>
  )
}

export default App
