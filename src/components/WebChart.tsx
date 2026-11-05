import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { webtoolsService } from '../services/webtools'

interface WebChartProps {
  /** Webtools UEC chart configuration. A new object redraws the chart. */
  config: object
  label: string
  busy?: boolean
  /** Called with the country code when a bar that carries `className: 'geo-<code>'` is clicked. */
  onSelectCountry?: (code: string) => void
  /** Country codes in the order of the first series: used when the click cannot be matched by class name. */
  fallbackCodes?: readonly string[]
}

const GEO_CLASS = /(?:^|\s)geo-([A-Za-z0-9_]+)/

/** Renders one Webtools chart and, when asked, reports which country's bar was clicked. */
export function WebChart({ config, label, busy = false, onSelectCountry, fallbackCodes }: WebChartProps) {
  const { t } = useTranslation()
  const target = useRef<HTMLDivElement>(null)
  const request = useRef(0)
  const [error, setError] = useState<Error>()

  useEffect(() => {
    const element = target.current
    if (!element) return
    const requestId = ++request.current
    element.replaceChildren()
    setError(undefined)
    void webtoolsService.renderChart(element, config).catch((renderError: unknown) => {
      if (request.current === requestId) {
        setError(renderError instanceof Error ? renderError : new Error(t('toolContent.renderError')))
      }
    })
    return () => {
      request.current += 1
      element.replaceChildren()
    }
  }, [config, t])

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
