import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { toolHref } from '../accessibility/mode'
import { statementConfig } from '../accessibility/statementConfig'
import { AccessibilityStatement } from '../components/AccessibilityStatement'
import { SiteFooter } from '../components/Footer'
import { SiteNavigation } from '../components/Nav'
import { useSiteShell } from '../hooks/useSiteShell'
import '../App.css'

/** `?accessibility`: the same app shell (banner + footer) with the statement instead of the tool. */
export function AccessibilityPage() {
  const { t, i18n } = useTranslation()
  useSiteShell()

  useEffect(() => {
    document.title = `Accessibility statement - ${statementConfig.toolName} - Eurostat`
  }, [])

  return (
    <>
      <SiteNavigation title={t('brand')} />
      <main id="main-content" className="visualization-shell">
        <AccessibilityStatement config={statementConfig} backHref={toolHref(i18n.resolvedLanguage ?? 'en')} />
      </main>
      <SiteFooter />
    </>
  )
}
