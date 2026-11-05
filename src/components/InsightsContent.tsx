import { useEffect, useId, useMemo, useRef, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import '../insights/insights.css'
import { allCountries, breakdownColors, componentColors, componentFallbackColors, units } from '../config/toolConfig'
import { AGGREGATES, type HistoryPoint } from '../insights/compute'
import { computeAnnualCost } from '../insights/extra'
import { useInsightsData, type InsightsBundle } from '../insights/useInsightsData'
import type { FilterValues } from '../state/filters'
import { Loading } from './Loading'
import { Select } from './Select'

interface InsightsContentProps {
  values: FilterValues
  /** Country or area the insights start with (the opened country, otherwise the first one selected). */
  defaultFocus?: string
  /** Data is requested only while the panel is open. */
  open: boolean
}

type Translate = (key: string, options?: Record<string, unknown>) => string

/** kWh per unit of the consumption units the bands are written in. */
const KWH_PER_UNIT: Record<string, number> = { KWH: 1, MWH: 1000, GJ: 1000 / 3.6 }

/**
 * Insights of the tool, laid out like the original: the current selection, then one section per question (how the
 * price compares, how it developed, what it is made of, ...), each made of cards with a "how is this calculated"
 * popover, plus small charts. The texts are the original ones (`iv.*` in the locale files).
 */
export function InsightsContent({ values, defaultFocus, open }: InsightsContentProps) {
  const { t, i18n } = useTranslation()
  const [chosen, setChosen] = useState<string>()
  const [other, setOther] = useState('')
  const [consumption, setConsumption] = useState('')
  const focus = chosen ?? defaultFocus ?? 'EU27_2020'
  const { data, error, loading } = useInsightsData(values, focus, other, open)
  const language = i18n.resolvedLanguage ?? 'en'

  const geoOptions = useMemo(
    () => allCountries.map((code) => ({ value: code, label: t(`countries.${code}`, { defaultValue: code }) })),
    [t],
  )
  const product = typeof values.product === 'string' ? values.product : '6000'
  const consumer = typeof values.consumer === 'string' ? values.consumer : 'HOUSEHOLD'
  const unitName = units[data?.unit ?? 'KWH']?.abbr ?? 'kWh'
  const bandCode = data?.band ?? (typeof values.band === 'string' ? values.band : '')

  return (
    <div className="insights-panel">
      <div className="insights-meta" role="region" aria-label={t('iv.CONTEXT')}>
        <div className="insights-meta__item">
          <Select id="insights-focus" label={t('iv.FOCUS_COUNTRY')} options={geoOptions} value={focus} onChange={setChosen} width="m" />
        </div>
        <MetaItem label={t('iv.PERIOD')} value={data?.core.latestPeriod} />
        <MetaItem label={t('iv.PRODUCT')} value={t(`products.${product}`)} />
        <MetaItem label={t('iv.CONSUMER')} value={t(`consumers.${consumer}`)} />
        <MetaItem label={t('iv.BAND')} value={bandCode ? t(`bands.${bandCode}`, { defaultValue: bandCode }) : undefined} />
        <MetaItem label={t('iv.PRICE_EXPRESSION')} value={`€/${unitName}`} />
      </div>

      <p className="ecl-u-sr-only" role="status" aria-live="polite">
        {data && !error ? `${t('insights.title')}: ${t(`countries.${focus}`, { defaultValue: focus })}, ${data.core.latestPeriod}` : ''}
      </p>
      {loading && <Loading centered />}
      {error && <p className="insights-no-prev" role="alert">{t('toolContent.loadError')} {error.message}</p>}
      {data && !error && (
        <InsightsBody
          data={data}
          focus={focus}
          other={other}
          onOther={setOther}
          geoOptions={geoOptions}
          language={language}
          t={t as Translate}
          product={product}
          consumer={consumer}
          unitName={unitName}
          consumption={consumption}
          onConsumption={setConsumption}
        />
      )}
    </div>
  )
}

function MetaItem({ label, value }: { label: string; value?: string }) {
  if (!value) return null
  return (
    <div className="insights-meta__item">
      <span className="insights-meta__label">{label}</span>
      <span className="insights-meta__value">{value}</span>
    </div>
  )
}

/* ------------------------------------------------------------------ building blocks */

interface Info {
  what?: string
  calc?: string
  purpose?: string
}

/** The "How is this calculated?" popover of a section: what it is, how it is calculated, why it matters. */
function InfoPopover({ title, info, t }: { title: string; info: Info; t: Translate }) {
  const [shown, setShown] = useState(false)
  const id = useId()
  const wrapper = useRef<HTMLDivElement>(null)
  const toggle = useRef<HTMLButtonElement>(null)
  const close = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!shown) return
    // The content is read next: keyboard and screen reader users land inside it, Escape or Close brings them back.
    close.current?.focus()
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        // Closes only the popover: without this the dialog around it would close too.
        event.preventDefault()
        event.stopPropagation()
        const dialog = wrapper.current?.closest('dialog')
        const keepOpen = (cancel: Event) => cancel.preventDefault()
        dialog?.addEventListener('cancel', keepOpen, { once: true })
        setTimeout(() => dialog?.removeEventListener('cancel', keepOpen), 150)
        setShown(false)
        toggle.current?.focus()
      }
    }
    const onPointer = (event: PointerEvent) => {
      if (!wrapper.current?.contains(event.target as Node)) setShown(false)
    }
    document.addEventListener('keydown', onKey, true)
    document.addEventListener('pointerdown', onPointer, true)
    return () => {
      document.removeEventListener('keydown', onKey, true)
      document.removeEventListener('pointerdown', onPointer, true)
    }
  }, [shown])

  return (
    <div className="ecl-popover" ref={wrapper} style={{ position: 'relative', display: 'inline-flex', marginInlineStart: '0.5rem', verticalAlign: 'middle' }}>
      <button
        ref={toggle}
        type="button"
        className="ecl-button ecl-button--tertiary ecl-popover__toggle"
        aria-controls={id}
        aria-expanded={shown}
        title={t('iv.HOW_CALCULATED')}
        aria-label={`${t('iv.HOW_CALCULATED')}: ${title}`}
        onClick={() => setShown((current) => !current)}
      >
        <span className="ecl-button__container">
          <svg viewBox="0 0 48 48" aria-hidden="true" focusable="false" width="24" height="24" fill="currentColor">
            <path d="M24 3C35.61 3 45 12.39 45 24C45 35.61 35.61 45 24 45C12.39 45 3 35.61 3 24C3 12.39 12.39 3 24 3ZM24 6C14.07 6 6 14.07 6 24C6 33.93 14.07 42 24 42C33.93 42 42 33.93 42 24C42 14.07 33.93 6 24 6ZM25.5 21V33H30V36H18V33H22.5V24H19.5V21H25.5ZM24 12C25.4 12 26.6 13.1 26.6 14.5C26.6 15.9 25.5 17.1 24 17.1C22.6 17.1 21.5 16 21.5 14.5C21.5 13.1 22.6 12 24 12Z" />
          </svg>
        </span>
      </button>
      <div id={id} className="ecl-popover__container" role="group" aria-label={title} hidden={!shown} style={{ display: shown ? 'block' : 'none' }}>
        <div className="ecl-popover__scrollable">
          <button ref={close} type="button" className="ecl-button ecl-button--tertiary ecl-button--neutral ecl-popover__close ecl-button--icon-only" aria-label={t('insights.close')} onClick={() => { setShown(false); toggle.current?.focus() }}>
            <span className="ecl-button__container" aria-hidden="true">✕</span>
          </button>
          <div className="ecl-popover__content">
            <h4 className="insight-popover-card__title">{title}</h4>
            {info.what && <div className="insight-popover-card__item"><strong>{t('iv.WHAT_IT_IS')}:</strong> {info.what}</div>}
            {info.calc && <div className="insight-popover-card__item"><strong>{t('iv.CALCULATION')}:</strong> {info.calc}</div>}
            {info.purpose && <div className="insight-popover-card__item"><strong>{t('iv.PURPOSE')}:</strong> {info.purpose}</div>}
          </div>
        </div>
      </div>
    </div>
  )
}

function Section({ title, info, t, children }: { title: string; info?: Info; t: Translate; children: ReactNode }) {
  return (
    <section className="insights-section" aria-label={title}>
      <h3 className="insights-section__title">
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
          {title}
          {info && <InfoPopover title={title} info={info} t={t} />}
        </span>
      </h3>
      {children}
    </section>
  )
}

function Card({ label, value, sub, note }: { label: string; value?: ReactNode; sub?: ReactNode; note?: ReactNode }) {
  return (
    <div className="insight-card">
      <div className="insight-card__label"><span>{label}</span></div>
      <div className="insight-card__value">{value}</div>
      {sub && <div className="insight-card__sub">{sub}</div>}
      {note && <div className="insight-card__note">{note}</div>}
    </div>
  )
}

const colorOf = (code: string, index: number) =>
  (breakdownColors as Record<string, string>)[code]
  ?? (componentColors as Record<string, string>)[code]
  ?? componentFallbackColors[index % componentFallbackColors.length]

/* ------------------------------------------------------------------ small charts */

function Sparkline({ history, price, t }: { history: HistoryPoint[]; price: (value: number) => string; t: Translate }) {
  if (history.length < 2) return null
  const width = 800, height = 320, padX = 40, padY = 28
  const values = history.map((point) => point.value)
  const min = Math.min(...values)
  const max = Math.max(...values)
  const avg = values.reduce((sum, value) => sum + value, 0) / values.length
  const range = max - min || 1
  const step = (width - padX * 2) / (history.length - 1)
  const yOf = (value: number) => padY + (1 - (value - min) / range) * (height - padY * 2)
  const points = history.map((point, index) => ({ x: padX + index * step, y: yOf(point.value), period: point.period, value: point.value }))
  const line = points.map((point, index) => `${index === 0 ? 'M' : 'L'}${point.x.toFixed(1)},${point.y.toFixed(1)}`).join(' ')
  const base = (height - padY).toFixed(1)
  const area = `${line} L${points[points.length - 1].x.toFixed(1)},${base} L${points[0].x.toFixed(1)},${base} Z`
  const peak = points[values.indexOf(max)]
  const low = points[values.indexOf(min)]
  const last = points[points.length - 1]
  const clampX = (x: number) => Math.min(width - 80, Math.max(80, x))
  return (
    <div className="insights-history-trend" role="region" aria-label={`${t('iv.HISTORICAL_POSITION')} ${t('iv.TREND')}`}>
      <div className="insights-history-trend__title">
        {t('iv.HISTORICAL_POSITION')}
        <span className="insights-history-trend__meta">({history.length})</span>
      </div>
      <p className="ecl-u-sr-only">{`${t('iv.HISTORICAL_POSITION')}: ${history[0].period} – ${history[history.length - 1].period}. Max: ${price(max)} (${peak.period}). Min: ${price(min)} (${low.period}). Avg: ${price(avg)}. ${t('iv.LATEST_PRICE')}: ${price(last.value)}.`}</p>
      <div className="insights-sparkline">
        <svg className="insights-sparkline__svg" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" aria-hidden="true">
          <path className="insights-sparkline__area" d={area} />
          <line className="insights-sparkline__ref-line insights-sparkline__ref-line--max" x1={padX} y1={yOf(max)} x2={width - padX} y2={yOf(max)} />
          <line className="insights-sparkline__ref-line insights-sparkline__ref-line--avg" x1={padX} y1={yOf(avg)} x2={width - padX} y2={yOf(avg)} />
          <line className="insights-sparkline__ref-line insights-sparkline__ref-line--min" x1={padX} y1={yOf(min)} x2={width - padX} y2={yOf(min)} />
          <path className="insights-sparkline__line" d={line} />
          <circle className="insights-sparkline__marker insights-sparkline__marker--max" cx={peak.x} cy={peak.y} r="6" />
          <circle className="insights-sparkline__marker insights-sparkline__marker--min" cx={low.x} cy={low.y} r="6" />
          <circle className="insights-sparkline__marker insights-sparkline__marker--latest" cx={last.x} cy={last.y} r="6" />
          {points.map((point) => (
            <circle key={point.period} cx={point.x} cy={point.y} r="9" fill="transparent"><title>{`${point.period}: ${price(point.value)}`}</title></circle>
          ))}
          <text className="insights-sparkline__label insights-sparkline__label--max" x={clampX(peak.x)} y={Math.max(16, yOf(max) - 8)} textAnchor="middle">Max: {price(max)}</text>
          <text className="insights-sparkline__label insights-sparkline__label--min" x={clampX(low.x)} y={Math.min(height - 6, yOf(min) + 18)} textAnchor="middle">Min: {price(min)}</text>
          <text className="insights-sparkline__label insights-sparkline__label--avg" x={width - padX - 6} y={yOf(avg) - 6} textAnchor="end">Avg: {price(avg)}</text>
        </svg>
        <div className="insights-sparkline__axis"><span>{history[0].period}</span><span>{history[history.length - 1].period}</span></div>
        <div className="insights-sparkline__legend">
          <span><span className="insights-sparkline__legend-dot" style={{ background: '#b91c1c' }} /><strong>Max:</strong> {price(max)} ({peak.period})</span>
          <span><span className="insights-sparkline__legend-dot" style={{ background: '#1d4ed8' }} /><strong>Avg:</strong> {price(avg)}</span>
          <span><span className="insights-sparkline__legend-dot" style={{ background: '#15803d' }} /><strong>Min:</strong> {price(min)} ({low.period})</span>
        </div>
      </div>
    </div>
  )
}

interface Slice { key: string; label: string; share: number; color: string; detail: string }

function Donut({ slices, center, centerLabel }: { slices: Slice[]; center: string; centerLabel: string }) {
  const radius = 54
  const circumference = 2 * Math.PI * radius
  const total = slices.reduce((sum, slice) => sum + slice.share, 0) || 100
  const starts = slices.map((_, index) => slices.slice(0, index).reduce((sum, slice) => sum + (slice.share / total) * circumference, 0))
  return (
    <div className="insights-donut-container">
      <div className="insights-donut-chart">
        <svg className="insights-donut-svg" viewBox="0 0 145 145" aria-hidden="true">
          <circle cx="72.5" cy="72.5" r={radius} fill="transparent" stroke="#f1f5f9" strokeWidth="22" />
          {slices.map((slice, index) => {
            const length = (slice.share / total) * circumference
            return (
              <circle key={slice.key} className="insights-donut-circle" cx="72.5" cy="72.5" r={radius} fill="transparent" stroke={slice.color} strokeWidth="22"
                strokeDasharray={`${length.toFixed(2)} ${(circumference - length).toFixed(2)}`} strokeDashoffset={(-starts[index]).toFixed(2)}>
                <title>{slice.detail}</title>
              </circle>
            )
          })}
        </svg>
        <div className="insights-donut-center">
          <div className="insights-donut-center__val">{center}</div>
          <div className="insights-donut-center__lbl">{centerLabel}</div>
        </div>
      </div>
      <div className="insights-donut-legend">
        {slices.map((slice) => (
          <div key={slice.key} className="insights-donut-legend__item" title={slice.detail}>
            <span className="insights-donut-legend__badge">
              <span className="insights-donut-legend__dot" style={{ background: slice.color }} />
              <span>{slice.label}</span>
            </span>
            <strong>{slice.detail.split(': ').pop()}</strong>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ the sections */

interface BodyProps {
  data: InsightsBundle
  focus: string
  other: string
  onOther: (value: string) => void
  geoOptions: Array<{ value: string; label: string }>
  language: string
  t: Translate
  product: string
  consumer: string
  unitName: string
  consumption: string
  onConsumption: (value: string) => void
}

function InsightsBody({ data, focus, other, onOther, geoOptions, language, t, product, consumer, unitName, consumption, onConsumption }: BodyProps) {
  const { core } = data
  const decimals = data.unit === 'MWH' ? 0 : 4
  const num = new Intl.NumberFormat(language, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
  const one = new Intl.NumberFormat(language, { minimumFractionDigits: 1, maximumFractionDigits: 1 })
  const plain = new Intl.NumberFormat(language, { maximumFractionDigits: 0 })
  const money = new Intl.NumberFormat(language, { maximumFractionDigits: 0 })
  const v = (key: string, options?: Record<string, unknown>) => t(`iv.${key}`, options)
  const price = (value: number | null | undefined) => value === null || value === undefined ? '–' : `${num.format(value)} €/${unitName}`
  const raw = (value: number | null | undefined) => value === null || value === undefined ? '–' : num.format(value)
  const pct = (value: number | null | undefined) => {
    if (value === null || value === undefined) return '–'
    return `${value > 0 ? '+' : value < 0 ? '−' : ''}${one.format(Math.abs(value))}%`
  }
  const place = (code: string | null | undefined) => code ? t(`countries.${code}`, { defaultValue: code }) : '–'
  const partName = (key: string) =>
    ['energy', 'taxes', 'vat'].includes(key) ? t(`chart.components.${key}`) : t(`taxComponents.${key}`, { defaultValue: key })
  const band = (code: string) => t(`bands.${code}`, { defaultValue: code })
  const isAggregate = AGGREGATES.includes(focus)
  const isEu = focus === 'EU27_2020'
  const period = core.latestPeriod
  const label = (text: string, range?: string) => `${text}${range ? ` (${range})` : ''}`
  const historyRange = data.history.length > 1 ? `${data.history[0].period} – ${data.history[data.history.length - 1].period}` : period
  const sectionInfo = (what: string, calc: string, purpose: string): Info => ({ what: v(what), calc: v(calc), purpose: v(purpose) })

  if (core.latestValue === null) {
    return <p className="insights-no-prev" role="status">{t('insights.noValue', { country: place(focus), period })}</p>
  }

  const cc = core.crossCountry
  const direction = (change: number | null) => change === null ? null : change > 0 ? v('RISING') : change < 0 ? v('FALLING') : v('STABLE')
  const arrow = (change: number | null) => change === null ? '' : change > 0 ? '▲' : change < 0 ? '▼' : '–'
  const absChange = (change: number | null) => change === null ? null : core.latestValue! - core.latestValue! / (1 + change / 100)
  const changeSub = (change: number | null) => change === null ? null : <>{arrow(change)} {direction(change)} ({price(absChange(change))})</>
  const context = [t(`products.${product}`), t(`consumers.${consumer}`), band(data.band), place(focus)].join(' · ')

  /* direct comparison */
  const direct = data.direct
  const comparison = (
    <Section title={label(v('DIRECT_COMPARISON'), period)} t={t} info={sectionInfo('EXPLAIN_COUNTRY_COMPARISON', 'CALC_COUNTRY_COMPARISON', 'PURPOSE_RANK')}>
      <div className="insights-meta__item">
        <Select
          id="insights-other"
          label={`${v('COMPARE_WITH')} (${place(focus)} vs.)`}
          options={geoOptions.filter((option) => option.value !== focus && !['EU27_2020', 'EA'].includes(option.value))}
          value={other}
          placeholder={`-- ${v('COMPARE_WITH')} --`}
          onChange={onOther}
          width="m"
        />
      </div>
      {direct && (
        <>
          <div className="insights-cards">
            <Card label={`${v('FOCUS_COUNTRY')}: ${place(focus)}`} value={price(direct.valueFocus)} />
            <Card label={`${v('PARTNER_COUNTRY')}: ${place(other)}`} value={price(direct.valueOther)} />
            <Card label={v('COUNTRY_GAP')} value={pct(direct.gapPct)} sub={`${price(direct.gapAbs)} (${direct.gapAbs > 0 ? place(focus) : place(other)} ${v('RISING').toLowerCase()})`} />
          </div>
          {direct.mainDriver && (
            <p className="insights-summary">{v('MAIN_GAP_DRIVER')}: <strong>{partName(direct.mainDriver.code)}</strong> ({price(direct.mainDriver.gap)})</p>
          )}
        </>
      )}
    </Section>
  )

  /* latest price */
  const latest = (
    <Section title={label(v('LATEST_PRICE'), period)} t={t} info={sectionInfo('EXPLAIN_LATEST_PRICE', 'CALC_LATEST_PRICE', 'PURPOSE_LATEST_PRICE')}>
      <div className="insights-cards">
        <Card label={label(v('LATEST_PRICE'), period)} value={price(core.latestValue)} sub={context} />
        {core.previousChangePct !== null && (
          <Card label={label(v('SEMESTER_CHANGE'), core.previousPeriod ? `${core.previousPeriod} – ${period}` : undefined)} value={pct(core.previousChangePct)} sub={changeSub(core.previousChangePct)} />
        )}
        {core.yoyChangePct !== null && (
          <Card label={label(v('YOY_CHANGE'), core.yoyPeriod ? `${core.yoyPeriod} – ${period}` : undefined)} value={pct(core.yoyChangePct)} sub={changeSub(core.yoyChangePct)} />
        )}
        {data.crossFuel && (
          <Card
            label={v('CROSS_FUEL_RATIO')}
            value={`${one.format(data.crossFuel.ratio)}×`}
            sub={`${product === '6000' ? t('products.6000') : t('products.4100')} vs ${product === '6000' ? t('products.4100') : t('products.6000')} (${pct(product === '6000' ? data.crossFuel.pctDiff : -data.crossFuel.pctDiff)})`}
          />
        )}
      </div>
    </Section>
  )

  /* EU comparison: where the country stands among the others */
  let distribution: ReactNode = null
  if (cc.value !== null && cc.min !== null && cc.max !== null && cc.max !== cc.min) {
    const at = (value: number) => Math.max(0, Math.min(100, ((value - cc.min!) / (cc.max! - cc.min!)) * 100))
    distribution = (
      <div className="insights-distribution" role="region" aria-label={`${v('EU_COMPARISON')} ${v('DISTRIBUTION')}`}>
        <div className="insights-distribution__track">
          <div className="insights-distribution__marker insights-distribution__marker--focus" style={{ left: `${at(cc.value).toFixed(1)}%` }} role="img" aria-label={`${place(focus)}: ${price(cc.value)}`} title={`${place(focus)}: ${price(cc.value)}`} />
          {!isEu && cc.euValue !== null && (
            <div className="insights-distribution__marker insights-distribution__marker--eu" style={{ left: `${at(cc.euValue).toFixed(1)}%` }} role="img" aria-label={`${place('EU27_2020')}: ${price(cc.euValue)}`} title={`${place('EU27_2020')}: ${price(cc.euValue)}`} />
          )}
        </div>
        <div className="insights-distribution__labels">
          <span>Min: {price(cc.min)}{cc.minGeo ? ` (${place(cc.minGeo)})` : ''}</span>
          <span>Max: {price(cc.max)}{cc.maxGeo ? ` (${place(cc.maxGeo)})` : ''}</span>
        </div>
        <div className="insights-distribution__legend">
          <span><span className="insights-distribution__legend-dot" style={{ background: '#0e47cb' }} />{place(focus)} ({price(cc.value)})</span>
          {!isEu && cc.euValue !== null && <span><span className="insights-distribution__legend-dot" style={{ background: '#92400e' }} />{place('EU27_2020')} ({price(cc.euValue)})</span>}
        </div>
      </div>
    )
  }
  const sensitivity = data.rankSensitivity
  const regional = data.regional
  const europeComparison = (
    <Section title={label(v('EU_COMPARISON'), period)} t={t} info={sectionInfo('EXPLAIN_EU_COMPARISON', 'CALC_EU_COMPARISON', 'PURPOSE_EU_GAP')}>
      {distribution}
      <div className="insights-cards">
        {!isEu && cc.euGapPct !== null && (
          <Card label={label(v('EU_COMPARISON'), period)} value={pct(cc.euGapPct)} sub={cc.euGapPct > 0 ? v('ABOVE_EU') : cc.euGapPct < 0 ? v('BELOW_EU') : v('IN_LINE_EU')} />
        )}
        {!isAggregate && cc.rankHigh !== null && (
          <Card
            label={label(v('COUNTRY_RANK'), period)}
            value={`${cc.rankHigh} / ${cc.n}`}
            sub={<>{v('REPORTING_COUNTRIES')}{cc.outlier === 'high' || cc.outlier === 'low' ? ` · ${v(cc.outlier === 'high' ? 'OUTLIER_HIGH' : 'OUTLIER_LOW')}` : ''}</>}
          />
        )}
        {cc.median !== null && (
          <Card
            label={label(isEu ? 'EU27 vs. Country Median' : v('VS_MEDIAN'), period)}
            value={pct(cc.medianGapPct)}
            sub={isEu ? `${place('EU27_2020')} (${price(cc.value)}) vs. Median (${price(cc.median)})` : price(cc.median)}
          />
        )}
        {regional && !isEu && (
          <Card
            label={`${v('REGIONAL_RANK')} (${t(`insights.regions.${regional.region}`)})`}
            value={`${regional.rank} / ${regional.size}`}
            sub={`${pct(regional.gapPct)} vs ${t(`insights.regions.${regional.region}`)} avg`}
          />
        )}
      </div>
      {sensitivity && !isAggregate && (
        <p className="insights-summary">
          <strong>{v('RANK_SENSITIVITY')}:</strong> {v(sensitivity.sensitive ? 'RANK_SENSITIVE' : 'RANK_NOT_SENSITIVE')}
          {(sensitivity.aboveGeo || sensitivity.belowGeo) && (
            <>
              <br />
              {[
                sensitivity.aboveGeo && sensitivity.gapAbovePct !== null ? `${v('GAP_ABOVE')} (${place(sensitivity.aboveGeo)}): ${pct(sensitivity.gapAbovePct)}` : null,
                sensitivity.belowGeo && sensitivity.gapBelowPct !== null ? `${v('GAP_BELOW')} (${place(sensitivity.belowGeo)}): ${pct(-sensitivity.gapBelowPct)}` : null,
              ].filter(Boolean).join(' · ')}
            </>
          )}
        </p>
      )}
    </Section>
  )

  /* historical position */
  const position = core.position
  const historical = position && (
    <Section title={label(v('HISTORICAL_POSITION'), historyRange)} t={t} info={sectionInfo('EXPLAIN_HISTORICAL', 'CALC_HISTORICAL', 'PURPOSE_HIST_MAX')}>
      <Sparkline history={data.history} price={price} t={t} />
      <div className="insights-cards">
        <Card label={label(v('HISTORICAL_MAX'), historyRange)} value={price(position.max)} sub={position.peakPeriod ? `${v('PEAK_PERIOD')}: ${position.peakPeriod}` : undefined} />
        <Card label={label(v('HISTORICAL_MIN'), historyRange)} value={price(position.min)} />
        <Card
          label={label(v('PERCENTILE'), historyRange)}
          value={`${plain.format(position.percentile)}%`}
          sub={[position.isNewHigh ? v('NEW_HIGH') : position.nearHigh ? v('NEAR_HIGH') : null, position.isNewLow ? v('NEW_LOW') : position.nearLow ? v('NEAR_LOW') : null].filter(Boolean).join(' · ') || undefined}
        />
        {data.persistent && (
          <Card
            label={label(v('PERSISTENT_POSITION'), historyRange)}
            value={data.persistent.persistentlyHigh ? v('PERSISTENTLY_HIGH') : data.persistent.persistentlyLow ? v('PERSISTENTLY_LOW') : v('NOT_PERSISTENT')}
            sub={`${data.persistent.periods} ${v('PERIOD').toLowerCase()}`}
          />
        )}
      </div>
    </Section>
  )

  /* development: recent trends and long-term context */
  const dev = data.development
  const momentumKey: Record<string, string> = {
    risingAccelerating: 'RISING_ACCELERATING', risingSlowing: 'RISING_SLOWING', fallingAccelerating: 'FALLING_ACCELERATING',
    fallingSlowing: 'FALLING_SLOWING', reversal: 'REVERSAL', stableYoy: 'STABLE_YOY',
  }
  const cagrCard = (cagr: { years: number; basePeriod: string; cagr: number }, key: string) => (
    <Card key={key} label={label(v(key), `${cagr.basePeriod} – ${period}`)} value={pct(cagr.cagr)} sub={`${cagr.basePeriod} → ${period}`} />
  )
  const recentCards = [
    core.momentum && (
      <Card key="momentum" label={label(v('MOMENTUM'), core.yoyPeriod ? `${core.yoyPeriod} – ${period}` : undefined)} value={v(momentumKey[core.momentum.classification])}
        sub={`${pct(core.momentum.latestYoyPct)} → ${pct(core.momentum.previousYoyPct)} ${v('YOY_CHANGE').toLowerCase()}`} />
    ),
    core.cagr && cagrCard(core.cagr, 'CAGR_5Y'),
    dev.cagr2 && cagrCard(dev.cagr2, 'CAGR_2Y'),
    core.volatility && <Card key="vol" label={label(v('VOLATILITY'), historyRange)} value={`${one.format(core.volatility.volatility)} pp`} sub={`${core.volatility.periods} ${v("PERIOD").toLowerCase()}`} />,
    core.streak && core.streak.count > 1 && (
      <Card key="streak" label={label(v('CONSECUTIVE_MOVEMENT'), historyRange)} value={`${core.streak.count} ${v('PERIOD').toLowerCase()}`} sub={v(core.streak.direction === 'increase' ? 'CONSECUTIVE_INCREASE' : 'CONSECUTIVE_DECREASE')} />
    ),
    dev.trendReversal && <Card key="rev" label={label(v('TREND_REVERSAL'), historyRange)} value={v('REVERSAL_DETECTED')} />,
    dev.seasonal && dev.seasonal.typicalSecondHalfPct !== null && (
      <Card key="season" label={label(v('TYPICAL_S2_PREMIUM'), historyRange)} value={pct(dev.seasonal.typicalSecondHalfPct)} sub={`${dev.seasonal.years}`} />
    ),
  ].filter(Boolean)
  const longCards = [
    core.lifetime && core.lifetime.changePct !== null && (
      <Card key="life" label={label(v('LIFETIME_GROWTH'), historyRange)} value={`${pct(core.lifetime.changePct)} (${one.format(core.lifetime.multiplier)}×)`} sub={`${v('PERIOD')} ${core.lifetime.startPeriod}`} />
    ),
    core.longTerm && core.longTerm.diffPct !== null && <Card key="long" label={label(v('LONG_TERM_AVG'), historyRange)} value={pct(core.longTerm.diffPct)} sub={core.longTerm.startPeriod} />,
    dev.crisis && dev.crisis.dropFromPeakPct !== null && (
      <Card key="crisis" label={v('CRISIS_RECOVERY')} value={`${pct(dev.crisis.dropFromPeakPct)} vs Peak`} sub={dev.crisis.gapFromPreCrisisPct !== null ? `${pct(dev.crisis.gapFromPreCrisisPct)} vs ${dev.crisis.preCrisisPeriod?.slice(0, 4)} baseline` : undefined} />
    ),
    dev.cagr10 && cagrCard(dev.cagr10, 'CAGR_10Y'),
    core.spikes?.spike && <Card key="spike" label={label(v('HISTORICAL_SPIKE'), historyRange)} value={pct(core.spikes.spike.changePct)} sub={core.spikes.spike.period} />,
    core.spikes?.drop && <Card key="drop" label={label(v('HISTORICAL_DROP'), historyRange)} value={pct(core.spikes.drop.changePct)} sub={core.spikes.drop.period} />,
    dev.highRegime && <Card key="high" label={label(v('HIGH_REGIME_TENURE'), historyRange)} value={pct(dev.highRegime.sharePct)} sub={`${plain.format(dev.highRegime.count * dev.highRegime.sharePct / 100)} / ${dev.highRegime.count} (80th+)`} />,
  ].filter(Boolean)

  /* price composition (annual components) */
  const components = data.components
  const parts = components?.components.filter((component) => component.latest !== null && component.share !== null) ?? []
  const compositionBody = components && parts.length > 0 ? (
    <>
      <Donut
        slices={parts.map((component, index) => ({
          key: component.code,
          label: partName(component.code),
          share: component.share as number,
          color: colorOf(component.code, index),
          detail: `${partName(component.code)}: ${one.format(component.share as number)}%`,
        }))}
        center={price(components.sum)}
        centerLabel={v('TOTAL_PRICE')}
      />
      <div className="insights-composition-bar" aria-hidden="true">
        {parts.map((component, index) => (
          <div key={component.code} className="insights-composition-bar__segment" style={{ width: `${component.share}%`, background: colorOf(component.code, index) }} title={`${partName(component.code)}: ${one.format(component.share as number)}%`} />
        ))}
      </div>
      <div className="insights-mini-profile">
        {parts.map((component, index) => (
          <div key={component.code} className="insights-mini-profile__item">
            <span className="insights-mini-profile__label"><span style={{ display: 'inline-block', width: '0.6rem', height: '0.6rem', marginInlineEnd: '0.4rem', background: colorOf(component.code, index) }} aria-hidden="true" />{partName(component.code)}</span>
            <span className="insights-mini-profile__value">{price(component.latest)} ({one.format(component.share as number)}%)</span>
          </div>
        ))}
      </div>
      <p className="insights-summary">
        {components.dominant
          ? `${v((components.dominant.delta ?? 0) >= 0 ? 'MAIN_UPWARD_DRIVER' : 'MAIN_DOWNWARD_DRIVER')}: ${partName(components.dominant.code)}`
          : components.mainUp || components.mainDown
            ? [components.mainUp && `${v('MAIN_UPWARD_DRIVER')}: ${partName(components.mainUp.code)}`, components.mainDown && `${v('MAIN_DOWNWARD_DRIVER')}: ${partName(components.mainDown.code)}`].filter(Boolean).join(' · ')
            : v('MIXED_MOVEMENT')}
      </p>
      {data.componentComparison && !isEu && (
        <div className="insights-cards">
          <Card
            label={`${v('MOST_DIVERGENT_COMPONENT')} (${v('GLOBAL_COMPONENT')})`}
            value={partName(data.componentComparison.mostDivergent.code)}
            sub={`${one.format(data.componentComparison.mostDivergent.focusShare)}% ${place(focus)} vs ${one.format(data.componentComparison.mostDivergent.referenceShare)}% ${place('EU27_2020')}`}
          />
        </div>
      )}
      <p className="insight-card__note" style={{ marginTop: '0.4rem', fontSize: '0.8rem' }}>{v('COMPONENT_ANNUAL_NOTE')}</p>
    </>
  ) : <p className="insights-no-prev">{v('NO_COMPONENT_DATA')}</p>

  /* fiscal effect */
  const fiscal = data.fiscal
  const fiscalKey: Record<string, string> = {
    cushioned: 'FISCAL_CUSHIONED', amplified: 'FISCAL_AMPLIFIED', offsetDecrease: 'FISCAL_OFFSET_DECREASE',
    oppositeUp: 'FISCAL_OPPOSITE_UP', oppositeDown: 'FISCAL_OPPOSITE_DOWN', neutral: 'FISCAL_NEUTRAL',
  }
  const fiscalBody = fiscal ? (
    <>
      <div className="insights-cards">
        <Card label={v('PRETAX_CHANGE')} value={price(fiscal.deltaPreTax)} />
        <Card label={v('FINAL_CHANGE')} value={price(fiscal.deltaFinal)} />
      </div>
      <p className="insights-summary">{v(fiscalKey[fiscal.classification] ?? 'FISCAL_NEUTRAL')}</p>
    </>
  ) : <p className="insights-no-prev">{v('FISCAL_UNAVAILABLE')}</p>

  /* purchasing power */
  const shift = data.rankShift
  const ppsKey: Record<string, string> = { higherInPps: 'PPS_HIGHER', lowerInPps: 'PPS_LOWER', similar: 'PPS_SIMILAR' }
  const ppsBody = isEu ? (
    <p className="insights-summary">{v('PPS_EU_BASELINE_NOTE')}</p>
  ) : shift ? (
    <>
      <div className="insights-cards">
        <Card label={v('EUR_RANK')} value={`${shift.rankEur} / ${shift.cohort}`} />
        <Card label={v('PPS_RANK')} value={`${shift.rankPps} / ${shift.cohort}`} />
        <Card label={v('RANK_SHIFT')} value={`${shift.rankEur - shift.rankPps > 0 ? '+' : ''}${shift.rankEur - shift.rankPps}`} />
        <Card
          label={v('AFFORDABILITY_BURDEN')}
          value={v(shift.rankPps / shift.cohort <= 0.25 ? 'BURDEN_HIGH' : shift.rankPps / shift.cohort >= 0.75 ? 'BURDEN_LOW' : 'BURDEN_MODERATE')}
          sub={`${v('PPS_RANK')}: ${shift.rankPps} / ${shift.cohort}`}
        />
      </div>
      <p className="insights-summary">{v(ppsKey[shift.classification])}</p>
    </>
  ) : <p className="insights-no-prev">{v('PPS_UNAVAILABLE')}</p>

  /* Europe at a glance */
  const europe = core.europe
  let europeBody: ReactNode = null
  if (europe) {
    const slices: Slice[] = [
      { key: 'rising', label: v('RISING_COUNTRIES'), share: europe.rising, color: '#b91c1c', detail: `${v('RISING_COUNTRIES')}: ${europe.rising}` },
      { key: 'falling', label: v('FALLING_COUNTRIES'), share: europe.falling, color: '#15803d', detail: `${v('FALLING_COUNTRIES')}: ${europe.falling}` },
      { key: 'stable', label: v('STABLE_COUNTRIES'), share: europe.stable, color: '#1d4ed8', detail: `${v('STABLE_COUNTRIES')}: ${europe.stable}` },
    ]
    const movers = [
      ...europe.topRising.slice(0, 3).map((row) => ({ ...row, up: true })),
      ...europe.topFalling.slice(0, 3).map((row) => ({ ...row, up: false })),
    ]
    europeBody = (
      <>
        <Donut slices={slices} center={`${europe.reporting}`} centerLabel={v('REPORTING_COUNTRIES')} />
        {europe.dispersion !== 'unknown' && (
          <div className="insights-cards">
            <Card label={v('DISPERSION')} value={v(europe.dispersion === 'converging' ? 'CONVERGING' : europe.dispersion === 'diverging' ? 'DIVERGING' : 'DISPERSION_STABLE')} />
          </div>
        )}
        {movers.length > 0 && (
          <div className="insights-rank-movement">
            <div className="insights-rank-movement__label">{v('TOP_MOVERS')}</div>
            <div className="insights-rank-movement__items">
              {movers.map((row) => (
                <span key={row.geo} className="insight-rank-item">
                  <span className={row.up ? 'insight-rank-up' : 'insight-rank-down'} aria-hidden="true">{row.up ? '▲' : '▼'}</span> {place(row.geo)} {pct(row.yoyPct)}
                </span>
              ))}
            </div>
          </div>
        )}
      </>
    )
  }

  /* consumption bands */
  const bands = data.bandPattern?.bands.filter((row) => row.value !== null) ?? []
  const maxBand = Math.max(0, ...bands.map((row) => row.value as number))
  const patternKey: Record<string, string> = { increasing: 'PATTERN_INCREASING', decreasing: 'PATTERN_DECREASING', flat: 'PATTERN_FLAT', mixed: 'PATTERN_MIXED' }
  const spreadKey: Record<string, string> = { widened: 'SPREAD_WIDENED', narrowed: 'SPREAD_NARROWED', stable: 'SPREAD_STABLE' }
  const bandPattern = data.bandPattern
  const bandSection = bandPattern && bands.length > 0 && (
    <Section title={label(v('BAND_PATTERN'), period)} t={t} info={sectionInfo('EXPLAIN_BAND', 'CALC_BAND', 'PURPOSE_BAND_PATTERN')}>
      {maxBand > 0 && (
        <div className="insights-band-bars" role="region" aria-label={v('BAND_PATTERN')}>
          {bands.map((row) => {
            const selected = row.band === data.band
            return (
              <div key={row.band} className="insights-band-bar" title={`${band(row.band)}: ${price(row.value)}`}>
                <div className="insights-band-bar__val">{raw(row.value)}</div>
                <div className="insights-band-bar__track">
                  <div className={`insights-band-bar__fill${selected ? ' insights-band-bar__fill--selected' : ''}`} style={{ height: `${(((row.value as number) / maxBand) * 100).toFixed(1)}%` }} />
                </div>
                <div className={`insights-band-bar__label${selected ? ' insights-band-bar__label--selected' : ''}`}>{band(row.band)}</div>
              </div>
            )
          })}
        </div>
      )}
      <div className="insights-cards">
        <Card label={v('BAND_PATTERN')} value={v(patternKey[bandPattern.pattern])} />
        {bandPattern.bandGapPct !== null && Math.abs(bandPattern.bandGapPct) > 0 && <Card label={v('BAND_PREMIUM')} value={pct(bandPattern.bandGapPct)} sub={band(data.band)} />}
        {data.bandSpread && <Card label={v('BAND_SPREAD_TITLE')} value={price(data.bandSpread.latestSpread)} sub={data.bandSpread.classification !== 'unavailable' ? v(spreadKey[data.bandSpread.classification]) : undefined} />}
      </div>
      <CostEstimator data={data} consumption={consumption} onConsumption={onConsumption} t={t} money={money} plain={plain} />
    </Section>
  )

  /* inflation */
  const inflation = data.inflation && (
    <Section title={label(v('INFLATION_CONTEXT'), period)} t={t} info={sectionInfo('EXPLAIN_HICP', 'CALC_HICP', 'PURPOSE_INFLATION_GAP')}>
      <div className="insights-cards">
        <Card label={v('ENERGY_YOY')} value={pct(data.inflation.energyYoyPct)} />
        <Card label={v('HICP_YOY')} value={pct(data.inflation.hicpYoyPct)} />
        <Card label={v('INFLATION_CONTEXT')} value={`${pct(data.inflation.gap)} pp`} />
      </div>
      <p className="insights-note">{v('RELATED_CONTEXT_NOTE')}</p>
    </Section>
  )

  /* data quality */
  const anomalies = data.anomalies
  const anomalyKey = (flag: string) => v(`ANOMALY_${{ negativePrice: 'NEGATIVE', zeroPrice: 'ZERO', implausibleChange: 'IMPLAUSIBLE' }[flag] ?? flag.toUpperCase()}`)
  const quality = (
    <Section title={label(v('DATA_QUALITY_TITLE'), period)} t={t} info={sectionInfo('EXPLAIN_PROVENANCE', 'CALC_PROVENANCE', 'PURPOSE_PROVENANCE')}>
      <div className="insights-cards">
        <Card label={v('DATA_STATUS')} value={data.status ? `Flag: [${data.status}]` : 'Final'} sub={data.status === 'p' ? v('PROVISIONAL') : data.status === 'e' ? v('ESTIMATED') : v('STATUS_NORMAL')} />
        <Card label={v('ANOMALY_CHECK')} value={anomalies.length > 0 ? 'Flagged' : 'Passed'} sub={anomalies.length > 0 ? anomalies.map(anomalyKey).join(', ') : v('SAFEGUARD_OK')} />
        <Card
          label={v('DATASET_PROVENANCE')}
          value={`${data.dataset} vs ${data.componentDataset}`}
          sub={<>{v('DATASET_PRICE_NOTE')}: <strong>{data.dataset}</strong> ({period}){data.componentPeriod && <> · {v('DATASET_COMPONENT_NOTE')}: <strong>{data.componentDataset}</strong> ({data.componentPeriod})</>}</>}
        />
      </div>
      <div className="insights-summary" style={{ marginTop: '0.75rem' }}><strong>{v('QUALITY_RECONCILIATION')}</strong></div>
      <div className="insights-summary" style={{ marginTop: '0.5rem' }}>
        <strong>{v('CONSUMER_QUALIFICATION')} ({t(`consumers.${consumer}`)}):</strong> {v('CONSUMER_QUALIFICATION_DESC')}
      </div>
    </Section>
  )

  const recent = recentCards.length > 0 && (
    <Section title={label(v('RECENT_TRENDS'), historyRange)} t={t} info={sectionInfo('EXPLAIN_DEVELOPMENT', 'CALC_DEVELOPMENT', 'PURPOSE_MOMENTUM')}>
      <div className="insights-cards">{recentCards}</div>
    </Section>
  )
  const longTerm = longCards.length > 0 && (
    <Section title={label(v('LONG_TERM_CONTEXT'), historyRange)} t={t}>
      <div className="insights-cards">{longCards}</div>
    </Section>
  )

  return (
    <div className="insights-sections">
      {comparison}
      {latest}
      {europeComparison}
      {historical}
      {recent}
      {longTerm}
      <Section title={label(v('COMPOSITION'), data.componentPeriod ?? period)} t={t} info={sectionInfo('EXPLAIN_COMPOSITION', 'CALC_COMPOSITION', 'PURPOSE_PRETAX')}>{compositionBody}</Section>
      <Section title={label(v('FISCAL_EFFECT'), period)} t={t} info={sectionInfo('EXPLAIN_FISCAL', 'CALC_FISCAL', 'PURPOSE_FINAL')}>{fiscalBody}</Section>
      <Section title={label(v('PPS_PERSPECTIVE'), period)} t={t} info={sectionInfo('EXPLAIN_PPS', 'CALC_PPS', 'PURPOSE_RANK_SHIFT')}>{ppsBody}</Section>
      {europe && <Section title={label(v('EUROPE_SNAPSHOT'), period)} t={t} info={sectionInfo('EXPLAIN_EUROPE', 'CALC_EUROPE', 'PURPOSE_DISPERSION')}>{europeBody}</Section>}
      {bandSection}
      {inflation}
      {quality}
    </div>
  )
}

/** Yearly cost: the price of the band the yearly consumption falls in, times the consumption. */
function CostEstimator({ data, consumption, onConsumption, t, money, plain }: {
  data: InsightsBundle
  consumption: string
  onConsumption: (value: string) => void
  t: Translate
  money: Intl.NumberFormat
  plain: Intl.NumberFormat
}) {
  const inputId = useId()
  const bandUnit = /^(KWH|MWH|GJ)/i.exec(data.bandRows[1]?.band ?? '')?.[1]?.toUpperCase() ?? 'KWH'
  const priceUnit = data.unit === 'GJ_GCV' ? 'GJ' : data.unit
  const consumptionNumber = Number(consumption.replace(',', '.'))
  const entered = consumption.trim() === '' ? null : consumptionNumber
  const cost = entered !== null ? computeAnnualCost(data.bandRows, entered) : null
  const costInPriceUnit = cost && entered !== null ? cost.price * entered * (KWH_PER_UNIT[bandUnit] ?? 1) / (KWH_PER_UNIT[priceUnit] ?? 1) : null
  const bandUnitName = bandUnit === 'KWH' ? 'kWh' : bandUnit === 'MWH' ? 'MWh' : 'GJ'
  return (
    <div className="insights-widget-card" role="region" aria-label={t('iv.COST_ESTIMATOR')} style={{ marginTop: '1rem' }}>
      <div className="insights-widget-card__title">{t('iv.COST_ESTIMATOR')}</div>
      <div className="insights-input-group">
        <label htmlFor={inputId} className="insights-input-label">{t('insights.cost.label', { unit: bandUnitName })}</label>
        <input id={inputId} className="insight-input" type="number" inputMode="decimal" min="0" step="any" value={consumption} onChange={(event) => onConsumption(event.target.value)} />
      </div>
      <div className="insights-widget-result" role="status" aria-live="polite">
        {consumption.trim() === ''
          ? t('insights.cost.hint')
          : cost && costInPriceUnit !== null
            ? t('insights.cost.result', {
                consumption: `${plain.format(consumptionNumber)} ${bandUnitName}`,
                band: t(`bands.${cost.band}`, { defaultValue: cost.band }),
                cost: `${money.format(costInPriceUnit)} EUR`,
              })
            : t('insights.cost.none')}
      </div>
      <p className="insight-card__note">{t('iv.COST_DISCLAIMER')}</p>
    </div>
  )
}
