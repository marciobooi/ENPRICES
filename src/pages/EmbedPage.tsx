import { useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { ToolContent } from '../components/ToolContent'
import { site } from '../config/toolConfig'
import { embedChartId } from '../embed/embed'
import { readUrlState } from '../state/urlState'
import { filterParams } from '../state/filters'
import '../App.css'

/**
 * `?embed=<chartId>`: only the main content, for an <iframe> on another page. No banner, toolbar or footer, and no
 * Webtools (the page that embeds this view brings its own banner and cookie notice). The state comes from the address.
 */
export function EmbedPage() {
  const { i18n } = useTranslation()
  const state = useMemo(() => readUrlState(filterParams), [])

  useEffect(() => {
    document.documentElement.lang = i18n.resolvedLanguage ?? 'en'
    document.title = site.title
  }, [i18n.resolvedLanguage])

  return (
    <main className="embed-shell">
      <ToolContent chartId={embedChartId()} values={state} headingLevel={1} />
    </main>
  )
}
