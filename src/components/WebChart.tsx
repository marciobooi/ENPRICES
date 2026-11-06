import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { webtoolsService } from '../services/webtools'

interface WebChartProps {
  /** Webtools UEC chart configuration. A new object updates the chart that is already drawn. */
  config: object
  label: string
  busy?: boolean
  /** Called with the country code when a bar that carries `className: 'geo-<code>'` is clicked. */
  onSelectCountry?: (code: string) => void
  /** Country codes in the order of the first series: used when the click cannot be matched by class name. */
  fallbackCodes?: readonly string[]
}

const GEO_CLASS = /(?:^|\s)geo-([A-Za-z0-9_]+)/

/** The part of a Highcharts chart that is used here (Webtools loads Highcharts on the page). */
interface LiveChart {
  container: HTMLElement
  update: (options: Record<string, unknown>, redraw?: boolean, oneToOne?: boolean, animation?: boolean | object) => void
}

interface ChartConfig {
  data?: { chart?: { type?: string }; series?: Array<{ type?: string }> }
}

/** The chart that is drawn inside `element`, if there is one. */
function liveChartIn(element: HTMLElement): LiveChart | undefined {
  const highcharts = (window as unknown as { Highcharts?: { charts: Array<LiveChart | undefined> } }).Highcharts
  return highcharts?.charts.find((chart): chart is LiveChart => !!chart && typeof chart.update === 'function' && element.contains(chart.container))
}

/**
 * What kind of chart a configuration draws. A chart is updated in place only into another of the same kind (more or
 * fewer bars, other values, another period range); a bar chart becoming a pie or a line chart is drawn from scratch.
 */
function kindOf(config: object): string {
  const data = (config as ChartConfig).data
  return `${data?.chart?.type ?? ''}|${data?.series?.[0]?.type ?? ''}`
}

/**
 * Renders one Webtools chart and, when asked, reports which country's bar was clicked.
 *
 * The first configuration draws the chart. A new configuration of the same kind is given to the chart that is on
 * screen (`chart.update`), so a changed filter, a switch or the period slider moves the bars and lines to their new
 * values instead of tearing the chart down and drawing it again (no blank flash, no replay of the opening animation).
 */
export function WebChart({ config, label, busy = false, onSelectCountry, fallbackCodes }: WebChartProps) {
  const { t } = useTranslation()
  const target = useRef<HTMLDivElement>(null)
  const request = useRef(0)
  const drawnKind = useRef<string | null>(null)
  // A failure belongs to the configuration that failed: a new configuration starts without one.
  const [failure, setFailure] = useState<{ config: object; error: Error }>()
  const error = failure?.config === config ? failure.error : undefined

  useEffect(() => {
    const element = target.current
    if (!element) return
    const kind = kindOf(config)
    const live = drawnKind.current === kind ? liveChartIn(element) : undefined
    if (live) {
      try {
        const data = (config as ChartConfig).data as Record<string, unknown>
        // `true` for the third argument: series are matched one to one, so a removed series goes away.
        live.update(data, true, true)
        return
      } catch {
        // the chart cannot take this configuration: draw it again from scratch below
      }
    }
    const requestId = ++request.current
    element.replaceChildren()
    drawnKind.current = null
    void webtoolsService.renderChart(element, config).then(() => {
      if (request.current === requestId) drawnKind.current = kind
    }).catch((renderError: unknown) => {
      if (request.current === requestId) {
        setFailure({ config, error: renderError instanceof Error ? renderError : new Error(t('toolContent.renderError')) })
      }
    })
  }, [config, t])

  // Only when the chart goes away (another view, another page) is the drawing removed.
  useEffect(() => {
    const element = target.current
    return () => {
      request.current += 1
      drawnKind.current = null
      element?.replaceChildren()
    }
  }, [])

  useEffect(() => {
    const element = target.current
    if (!element || !onSelectCountry) return
    const onClick = (event: MouseEvent) => {
      const point = (event.target as Element | null)?.closest('.highcharts-point')
      if (!point) return
      const match = GEO_CLASS.exec(point.getAttribute('class') ?? '')
      if (match) {
        onSelectCountry(match[1])
        return
      }
      const series = point.closest('.highcharts-series')
      const index = series ? Array.from(series.querySelectorAll('.highcharts-point')).indexOf(point) : -1
      const code = index >= 0 ? fallbackCodes?.[index] : undefined
      if (code) onSelectCountry(code)
    }
    element.addEventListener('click', onClick)
    return () => element.removeEventListener('click', onClick)
  }, [fallbackCodes, onSelectCountry])

  return (
    <>
      {error && <p className="tool-content__message" role="alert">{t('toolContent.renderError')} {error.message}</p>}
      <div
        ref={target}
        className={`energy-chart${onSelectCountry ? ' energy-chart--clickable' : ''}`}
        role="region"
        aria-label={label}
        aria-busy={busy || Boolean(error)}
      />
    </>
  )
}
