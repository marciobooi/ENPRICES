import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { allCountries } from '../config/toolConfig'
import { AGGREGATES } from '../insights/compute'
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
 * Insights of the tool, ported from the original: where a country stands among the others, how its price developed,
 * what it is made of, how it varies with consumption, how it compares with another country, plus the context
 * (inflation, the other fuel) and the quality notes of the data.
 */
export function InsightsContent({ values, defaultFocus, open }: InsightsContentProps) {
  const { t, i18n } = useTranslation()
  const [chosen, setChosen] = useState<string>()
  const [other, setOther] = useState('')
  const [consumption, setConsumption] = useState('')
  const focus = chosen ?? defaultFocus ?? 'EU27_2020'
  const { data, error, loading } = useInsightsData(values, focus, other, open)

  const language = i18n.resolvedLanguage ?? 'en'
  const place = (code: string | null | undefined) => code ? t(`countries.${code}`, { defaultValue: code }) : '–'
  const geoOptions = useMemo(
    () => allCountries.map((code) => ({ value: code, label: t(`countries.${code}`, { defaultValue: code }) })),
    [t],
  )

  const selectors = (
    <div className="insights-controls">
      <Select id="insights-focus" label={t('insights.focusLabel')} options={geoOptions} value={focus} onChange={setChosen} width="m" />
      <Select
        id="insights-other"
        label={t('insights.otherLabel')}
        options={geoOptions.filter((option) => option.value !== focus)}
        value={other}
        placeholder={t('insights.otherNone')}
        onChange={setOther}
        width="m"
      />
    </div>
  )

  return (
    <>
      <section className="insights-hero">
        <p className="insights-kicker">{t('insights.kicker')}</p>
        <h3>{t('insights.heading')}</h3>
        <p>{t('insights.intro')}</p>
        {selectors}
      </section>

      {loading && <Loading centered />}
      {error && <p className="tool-content__message" role="alert">{t('toolContent.loadError')} {error.message}</p>}
      {data && !error && (
        <InsightsBody
          data={data}
          focus={focus}
          other={other}
          language={language}
          place={place}
          t={t as Translate}
          consumption={consumption}
          onConsumption={setConsumption}
        />
      )}
    </>
  )
}

interface BodyProps {
  data: InsightsBundle
  focus: string
  other: string
  language: string
  place: (code: string | null | undefined) => string
  t: Translate
  consumption: string
  onConsumption: (value: string) => void
}

function InsightsBody({ data, focus, other, language, place, t, consumption, onConsumption }: BodyProps) {
  const { core } = data
  const decimals = data.unit === 'MWH' ? 0 : 4
  const number = new Intl.NumberFormat(language, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
  const percent = new Intl.NumberFormat(language, { maximumFractionDigits: 1, signDisplay: 'exceptZero' })
  const plain = new Intl.NumberFormat(language, { maximumFractionDigits: 0 })
  const one = new Intl.NumberFormat(language, { maximumFractionDigits: 1 })
  const money = new Intl.NumberFormat(language, { maximumFractionDigits: 0 })
  const unitName = t(`units.${data.unit}`, { defaultValue: data.unit })
  const unit = `EUR/${unitName}`
  const price = (value: number) => `${number.format(value)} ${unit}`
  const pct = (value: number | null) => value === null ? '–' : `${percent.format(value)} %`
  const country = place(focus)
  const partName = (key: string) =>
    ['energy', 'taxes', 'vat'].includes(key) ? t(`chart.components.${key}`) : t(`taxComponents.${key}`, { defaultValue: key })
  const isAggregate = AGGREGATES.includes(focus)
  const sections: Array<{ id: string; lines: string[] }> = []
  const add = (id: string, lines: Array<string | null | false | undefined> | null) => {
    const kept = (lines ?? []).filter((line): line is string => Boolean(line))
    if (kept.length > 0) sections.push({ id, lines: kept })
  }

  if (core.latestValue === null) {
    return <p className="tool-content__message" role="status">{t('insights.noValue', { country, period: core.latestPeriod })}</p>
  }

  const cc = core.crossCountry
  const sensitivity = data.rankSensitivity
  const neighbours = sensitivity?.sensitive
    ? [
        sensitivity.aboveGeo && sensitivity.gapAbovePct !== null ? `${place(sensitivity.aboveGeo)} (${pct(sensitivity.gapAbovePct)})` : null,
        sensitivity.belowGeo && sensitivity.gapBelowPct !== null ? `${place(sensitivity.belowGeo)} (−${one.format(sensitivity.gapBelowPct)} %)` : null,
      ].filter(Boolean).join(', ')
    : null
  const persistent = data.persistent

  add('position', [
    !isAggregate && cc.rankHigh !== null && t('insights.position.rank', { rank: cc.rankHigh, n: cc.n }),
    !isAggregate && cc.percentile !== null && t('insights.position.percentile', { percent: plain.format(cc.percentile) }),
    cc.medianGapPct !== null && t('insights.position.median', { gap: pct(cc.medianGapPct), median: cc.median !== null ? price(cc.median) : '–' }),
    !isAggregate && cc.euGapPct !== null && t('insights.position.eu', { gap: pct(cc.euGapPct) }),
    !isAggregate && cc.eaGapPct !== null && t('insights.position.ea', { gap: pct(cc.eaGapPct) }),
    cc.min !== null && cc.max !== null && t('insights.position.extremes', {
      maxGeo: place(cc.maxGeo), max: price(cc.max), minGeo: place(cc.minGeo), min: price(cc.min),
    }),
    cc.outlier === 'high' && t('insights.position.outlierHigh'),
    cc.outlier === 'low' && t('insights.position.outlierLow'),
    neighbours && t('insights.position.sensitive', { list: neighbours }),
    persistent?.persistentlyHigh && t('insights.position.persistentHigh', { share: plain.format(persistent.topSharePct), periods: persistent.periods }),
    persistent?.persistentlyLow && t('insights.position.persistentLow', { share: plain.format(persistent.bottomSharePct), periods: persistent.periods }),
    data.regional && t('insights.position.regional', {
      region: t(`insights.regions.${data.regional.region}`), rank: data.regional.rank, size: data.regional.size, gap: pct(data.regional.gapPct),
    }),
    data.rankShift && t(`insights.position.rankShift.${data.rankShift.classification}`, {
      rankEur: data.rankShift.rankEur, rankPps: data.rankShift.rankPps, cohort: data.rankShift.cohort,
    }),
  ])

  const dev = data.development
  add('development', [
    core.previousChangePct !== null && t('insights.development.previous', { change: pct(core.previousChangePct), period: core.previousPeriod }),
    core.yoyChangePct !== null && t('insights.development.year', { change: pct(core.yoyChangePct), period: core.yoyPeriod }),
    core.momentum && t(`insights.development.momentum.${core.momentum.classification}`, {
      latest: pct(core.momentum.latestYoyPct), previous: pct(core.momentum.previousYoyPct),
    }),
    dev.trendReversal && t(`insights.development.reversal.${dev.trendReversal.from}`),
    dev.cagr2 && t('insights.development.cagr', { years: dev.cagr2.years, change: pct(dev.cagr2.cagr) }),
    core.cagr && t('insights.development.cagr', { years: core.cagr.years, change: pct(core.cagr.cagr) }),
    dev.cagr10 && t('insights.development.cagr', { years: dev.cagr10.years, change: pct(dev.cagr10.cagr) }),
    core.streak && core.streak.count >= 2 && t(`insights.development.streak.${core.streak.direction}`, { count: core.streak.count }),
    core.volatility && t('insights.development.volatility', { value: percent.format(core.volatility.volatility), periods: core.volatility.periods }),
    core.longTerm && core.longTerm.diffPct !== null && t('insights.development.average', { diff: pct(core.longTerm.diffPct), start: core.longTerm.startPeriod }),
    core.lifetime && core.lifetime.changePct !== null && t('insights.development.lifetime', {
      change: pct(core.lifetime.changePct), start: core.lifetime.startPeriod, multiplier: one.format(core.lifetime.multiplier),
    }),
    core.spikes?.spike && t('insights.development.spike', { change: pct(core.spikes.spike.changePct), period: core.spikes.spike.period }),
    core.spikes?.drop && t('insights.development.drop', { change: pct(core.spikes.drop.changePct), period: core.spikes.drop.period }),
    dev.seasonal && dev.seasonal.typicalSecondHalfPct !== null && t('insights.development.seasonal', {
      typical: pct(dev.seasonal.typicalSecondHalfPct), years: dev.seasonal.years,
    }),
    dev.highRegime && t('insights.development.highRegime', { share: plain.format(dev.highRegime.sharePct), price: price(dev.highRegime.p80) }),
    dev.crisis && dev.crisis.dropFromPeakPct !== null && t('insights.development.crisisPeak', {
      peak: dev.crisis.peakPeriod, change: pct(dev.crisis.dropFromPeakPct),
    }),
    dev.crisis && dev.crisis.gapFromPreCrisisPct !== null && dev.crisis.preCrisisPeriod && t('insights.development.crisisBefore', {
      period: dev.crisis.preCrisisPeriod, change: pct(dev.crisis.gapFromPreCrisisPct),
    }),
  ])

  const position = core.position
  add('history', position && [
    position.isNewHigh && t('insights.history.newHigh'),
    position.isNewLow && t('insights.history.newLow'),
    !position.isNewHigh && position.peakPeriod !== null && position.percentBelowMax !== null && t('insights.history.peak', {
      value: price(position.max), period: position.peakPeriod, gap: pct(position.percentBelowMax),
    }),
    !position.isNewHigh && position.nearHigh && t('insights.history.nearHigh'),
    !position.isNewLow && position.nearLow && t('insights.history.nearLow'),
    t('insights.history.percentile', { percent: plain.format(position.percentile), count: position.observations }),
  ])

  const europe = core.europe
  add('europe', europe && [
    t('insights.europe.counts', { rising: europe.rising, falling: europe.falling, stable: europe.stable }),
    europe.euYoyPct !== null && t('insights.europe.eu', { change: pct(europe.euYoyPct) }),
    europe.topRising.length > 0 && t('insights.europe.topRising', { list: europe.topRising.map((row) => `${place(row.geo)} (${pct(row.yoyPct)})`).join(', ') }),
    europe.topFalling.length > 0 && t('insights.europe.topFalling', { list: europe.topFalling.map((row) => `${place(row.geo)} (${pct(row.yoyPct)})`).join(', ') }),
    europe.dispersion !== 'unknown' && t(`insights.europe.dispersion.${europe.dispersion}`),
  ])

  const composition = core.composition
  add('composition', composition && [
    ...composition.parts.map((part) => t('insights.composition.share', { name: partName(part.key), share: plain.format(part.sharePct), value: price(part.value) })),
    composition.dominant && t('insights.composition.dominant', { name: partName(composition.dominant) }),
    composition.taxShare !== null && composition.taxShareBefore !== null && t('insights.composition.taxShare', {
      share: plain.format(composition.taxShare), delta: percent.format(composition.taxShare - composition.taxShareBefore),
    }),
  ])

  const fiscal = data.fiscal
  add('fiscal', fiscal && [
    t('insights.fiscal.change', { pre: pct(fiscal.preTaxYoyPct), final: pct(core.yoyChangePct) }),
    t(`insights.fiscal.${fiscal.classification}`),
  ])

  add('bands', [
    data.bandPattern && t(`insights.bands.pattern.${data.bandPattern.pattern}`),
    data.bandPattern?.bandGapPct != null && Math.abs(data.bandPattern.bandGapPct) > 0 && t('insights.bands.gap', {
      gap: pct(data.bandPattern.bandGapPct), band: t(`bands.${data.band}`, { defaultValue: data.band }),
    }),
    data.bandSpread && data.bandSpread.classification !== 'unavailable' && t(`insights.bands.spread.${data.bandSpread.classification}`, {
      spread: price(data.bandSpread.latestSpread),
    }),
  ])

  const components = data.components
  const reference = data.componentComparison
  add('components', components && [
    t('insights.components.period', { period: data.componentPeriod }),
    ...components.components.filter((component) => component.share !== null).map((component) => t('insights.composition.share', {
      name: partName(component.code), share: one.format(component.share as number), value: component.latest === null ? '–' : price(component.latest),
    })),
    components.mainUp && t('insights.components.mainUp', { name: partName(components.mainUp.code), delta: price(components.mainUp.delta as number) }),
    components.mainDown && t('insights.components.mainDown', { name: partName(components.mainDown.code), delta: price(components.mainDown.delta as number) }),
    components.dominant && t('insights.components.dominant', { name: partName(components.dominant.code) }),
    reference && !isAggregate && focus !== 'EU27_2020' && t('insights.components.versusEu', {
      name: partName(reference.mostDivergent.code),
      focus: one.format(reference.mostDivergent.focusShare),
      eu: one.format(reference.mostDivergent.referenceShare),
    }),
  ])

  add('context', [
    data.inflation && t('insights.context.inflation', {
      energy: pct(data.inflation.energyYoyPct), hicp: pct(data.inflation.hicpYoyPct),
    }),
    data.crossFuel && t('insights.context.crossFuel', {
      ratio: one.format(data.crossFuel.ratio),
      electricity: `${new Intl.NumberFormat(language, { maximumFractionDigits: 4 }).format(data.crossFuel.electricity)} EUR/kWh`,
      gas: `${new Intl.NumberFormat(language, { maximumFractionDigits: 4 }).format(data.crossFuel.gas)} EUR/kWh`,
    }),
  ])

  const direct = data.direct
  add('compare', direct && [
    t('insights.compare.gap', {
      country, other: place(other), gap: pct(direct.gapPct), abs: price(Math.abs(direct.gapAbs)),
    }),
    direct.fasterGrowth && direct.focusYoyPct !== null && direct.otherYoyPct !== null && t('insights.compare.growth', {
      name: place(direct.fasterGrowth), a: pct(direct.focusYoyPct), b: pct(direct.otherYoyPct), country, other: place(other),
    }),
    direct.mainDriver && t('insights.compare.driver', { name: partName(direct.mainDriver.code), gap: price(Math.abs(direct.mainDriver.gap)) }),
  ])

  add('quality', [
    data.status === 'p' && t('insights.quality.provisional'),
    data.status === 'e' && t('insights.quality.estimated'),
    ...data.anomalies.map((flag) => t(`insights.quality.${flag}`)),
    !components && t('insights.quality.noComponents'),
    cc.n < 8 && t('insights.quality.smallGroup', { n: cc.n }),
    core.position && core.position.observations < 6 && t('insights.quality.shortHistory', { count: core.position.observations }),
  ])

  // Yearly cost: the price of the band the yearly consumption falls in, times the consumption.
  const bandUnit = /^(KWH|MWH|GJ)/i.exec(data.bandRows[1]?.band ?? '')?.[1]?.toUpperCase() ?? 'KWH'
  const priceUnit = data.unit === 'GJ_GCV' ? 'GJ' : data.unit
  const consumptionNumber = Number(consumption.replace(',', '.'))
  const inBandUnit = consumption.trim() === '' ? null : consumptionNumber
  const cost = inBandUnit !== null ? computeAnnualCost(data.bandRows, inBandUnit) : null
  const costInPriceUnit = cost && inBandUnit !== null
    ? cost.price * inBandUnit * (KWH_PER_UNIT[bandUnit] ?? 1) / (KWH_PER_UNIT[priceUnit] ?? 1)
    : null
  const bandUnitName = bandUnit === 'KWH' ? 'kWh' : bandUnit === 'MWH' ? 'MWh' : 'GJ'

  return (
    <>
      <dl className="insights-kpis">
        <div><dt>{t('insights.kpiPrice', { period: core.latestPeriod })}</dt><dd>{price(core.latestValue)}</dd></div>
        {cc.rankHigh !== null && !isAggregate && <div><dt>{t('insights.kpiRank')}</dt><dd>{cc.rankHigh} / {cc.n}</dd></div>}
        {core.yoyChangePct !== null && <div><dt>{t('insights.kpiYear')}</dt><dd>{pct(core.yoyChangePct)}</dd></div>}
        {cc.euGapPct !== null && !isAggregate && <div><dt>{t('insights.kpiEu')}</dt><dd>{pct(cc.euGapPct)}</dd></div>}
      </dl>

      {sections.map((section) => (
        <section key={section.id} className="insights-section" aria-labelledby={`insights-${section.id}`}>
          <h3 id={`insights-${section.id}`}>{t(`insights.${section.id}.title`)}</h3>
          <ul className="ecl-unordered-list">
            {section.lines.map((line) => <li key={line} className="ecl-unordered-list__item">{line}</li>)}
          </ul>
          {section.id === 'bands' && data.bandRows.length > 0 && (
            <div className="insights-cost">
              <label className="ecl-form-label" htmlFor="insights-consumption">{t('insights.cost.label', { unit: bandUnitName })}</label>
              <input
                id="insights-consumption"
                className="ecl-text-input ecl-text-input--m"
                type="number"
                inputMode="decimal"
                min="0"
                value={consumption}
                onChange={(event) => onConsumption(event.target.value)}
              />
              <p role="status" aria-live="polite">
                {consumption.trim() === ''
                  ? t('insights.cost.hint')
                  : cost && costInPriceUnit !== null
                    ? t('insights.cost.result', {
                        consumption: `${plain.format(consumptionNumber)} ${bandUnitName}`,
                        band: t(`bands.${cost.band}`, { defaultValue: cost.band }),
                        cost: `${money.format(costInPriceUnit)} EUR`,
                      })
                    : t('insights.cost.none')}
              </p>
            </div>
          )}
        </section>
      ))}
    </>
  )
}
