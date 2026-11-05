import type { CountryPrice, EnergyPrices } from '../hooks/useEnergyPrices'

/**
 * Insight calculations of the ENPRICES tool, ported from the original `insightsData.js` (same definitions and
 * thresholds). Pure functions of the data already loaded for the chart: no extra requests.
 */
export const AGGREGATES = ['EU27_2020', 'EA']
const STABILITY_EPSILON_PERCENT = 0.5
const NEAR_EXTREME_PERCENT = 5
const DOMINANCE_THRESHOLD_PERCENT = 50
const VOLATILITY_WINDOW = 10
const DISPERSION_THRESHOLD_PERCENT = 5
const CAGR_YEARS = 5

export const isValid = (value: number | null | undefined): value is number =>
  value !== null && value !== undefined && !Number.isNaN(value)

export function percentChange(from: number | null | undefined, to: number | null | undefined): number | null {
  if (!isValid(from) || !isValid(to) || from === 0) return null
  return ((to - from) / Math.abs(from)) * 100
}

export function median(values: Array<number | null | undefined>): number | null {
  const sorted = values.filter(isValid).sort((a, b) => a - b)
  if (sorted.length === 0) return null
  const middle = Math.floor(sorted.length / 2)
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2
}

export function quartile(sorted: number[], q: number): number {
  const position = (sorted.length - 1) * q
  const base = Math.floor(position)
  const rest = position - base
  return sorted[base + 1] !== undefined ? sorted[base] + rest * (sorted[base + 1] - sorted[base]) : sorted[base]
}

/* ---- periods: "YYYY" (annual datasets) or "YYYY-S1" / "YYYY-S2" ---- */

function parsePeriod(code: string): { year: number; semester: number | null } | null {
  const match = /^(\d{4})(?:-S([12]))?$/.exec(code)
  return match ? { year: Number(match[1]), semester: match[2] ? Number(match[2]) : null } : null
}

const periodCode = (year: number, semester: number | null) => semester ? `${year}-S${semester}` : String(year)

export function priorYearPeriod(code: string, years = 1): string | null {
  const parsed = parsePeriod(code)
  return parsed ? periodCode(parsed.year - years, parsed.semester) : null
}

export function previousPeriod(code: string): string | null {
  const parsed = parsePeriod(code)
  if (!parsed) return null
  if (parsed.semester === null) return periodCode(parsed.year - 1, null)
  return parsed.semester === 2 ? periodCode(parsed.year, 1) : periodCode(parsed.year - 1, 2)
}

/* ---- series ---- */

export interface HistoryPoint {
  period: string
  value: number
}

export function historyOf(data: EnergyPrices, geo: string, upTo: string): HistoryPoint[] {
  return data.countries
    .filter((row) => row.countryCode === geo && row.period <= upTo && isValid(row.total))
    .map((row) => ({ period: row.period, value: row.total as number }))
    .sort((a, b) => a.period.localeCompare(b.period))
}

export const valueAt = (history: HistoryPoint[], period: string | null) =>
  period ? history.find((point) => point.period === period)?.value ?? null : null

/* ---- the calculations ---- */

export interface CrossCountry {
  n: number
  value: number | null
  rankHigh: number | null
  /** Share of countries with a lower price, 0-100. */
  percentile: number | null
  median: number | null
  medianGapPct: number | null
  euValue: number | null
  euGapPct: number | null
  eaValue: number | null
  eaGapPct: number | null
  min: number | null
  max: number | null
  minGeo: string | null
  maxGeo: string | null
  outlier: 'low' | 'high' | 'within' | 'unknown'
}

function computeCrossCountry(rows: CountryPrice[], focus: string): CrossCountry {
  const countries = rows.filter((row) => !AGGREGATES.includes(row.countryCode) && isValid(row.total))
  const values = countries.map((row) => row.total as number).sort((a, b) => a - b)
  const n = values.length
  const valueOfGeo = (geo: string) => rows.find((row) => row.countryCode === geo)?.total ?? null
  const value = valueOfGeo(focus)
  const eu = valueOfGeo('EU27_2020')
  const ea = valueOfGeo('EA')
  const med = median(values)
  let rankHigh: number | null = null
  let percentile: number | null = null
  let outlier: CrossCountry['outlier'] = 'unknown'

  if (isValid(value) && n > 0) {
    const below = values.filter((v) => v < value).length
    const equal = values.filter((v) => v === value).length
    rankHigh = 1 + values.filter((v) => v > value).length
    percentile = (100 * (below + 0.5 * equal)) / n
    if (n >= 8) {
      const q1 = quartile(values, 0.25)
      const q3 = quartile(values, 0.75)
      const spread = q3 - q1
      outlier = value < q1 - 1.5 * spread ? 'low' : value > q3 + 1.5 * spread ? 'high' : 'within'
    }
  }

  return {
    n,
    value: isValid(value) ? value : null,
    rankHigh,
    percentile,
    median: med,
    medianGapPct: percentChange(med, value),
    euValue: isValid(eu) ? eu : null,
    euGapPct: percentChange(eu, value),
    eaValue: isValid(ea) ? ea : null,
    eaGapPct: percentChange(ea, value),
    min: n ? values[0] : null,
    max: n ? values[n - 1] : null,
    minGeo: n ? countries.find((row) => row.total === values[0])?.countryCode ?? null : null,
    maxGeo: n ? countries.find((row) => row.total === values[n - 1])?.countryCode ?? null : null,
    outlier,
  }
}

export interface HistoricalPosition {
  max: number
  min: number
  peakPeriod: string | null
  percentBelowMax: number | null
  percentAboveMin: number | null
  percentile: number
  isNewHigh: boolean
  isNewLow: boolean
  nearHigh: boolean
  nearLow: boolean
  observations: number
}

function computeHistoricalPosition(history: HistoryPoint[]): HistoricalPosition | null {
  if (history.length < 2) return null
  const values = history.map((point) => point.value)
  const latest = values[values.length - 1]
  const max = Math.max(...values)
  const min = Math.min(...values)
  const peak = [...history].reverse().find((point) => point.value === max)
  const below = values.filter((v) => v < latest).length
  const equal = values.filter((v) => v === latest).length
  const belowMax = percentChange(max, latest)
  const aboveMin = percentChange(min, latest)
  return {
    max,
    min,
    peakPeriod: peak?.period ?? null,
    percentBelowMax: belowMax,
    percentAboveMin: aboveMin,
    percentile: (100 * (below + 0.5 * equal)) / values.length,
    isNewHigh: latest === max,
    isNewLow: latest === min,
    nearHigh: belowMax !== null && Math.abs(belowMax) <= NEAR_EXTREME_PERCENT,
    nearLow: aboveMin !== null && Math.abs(aboveMin) <= NEAR_EXTREME_PERCENT,
    observations: values.length,
  }
}

export type MomentumClass =
  | 'risingAccelerating' | 'risingSlowing' | 'fallingAccelerating' | 'fallingSlowing' | 'reversal' | 'stableYoy'

function yoySeries(history: HistoryPoint[]) {
  const byPeriod = new Map(history.map((point) => [point.period, point.value]))
  return history.flatMap((point) => {
    const change = percentChange(byPeriod.get(priorYearPeriod(point.period) ?? ''), point.value)
    return change === null ? [] : [{ period: point.period, yoyPct: change }]
  })
}

export function computeMomentum(history: HistoryPoint[]) {
  const series = yoySeries(history)
  if (series.length < 2) return null
  const latest = series[series.length - 1]
  const previous = series[series.length - 2]
  const change = latest.yoyPct - previous.yoyPct
  const eps = STABILITY_EPSILON_PERCENT
  let classification: MomentumClass
  if (latest.yoyPct > eps && change > eps) classification = 'risingAccelerating'
  else if (latest.yoyPct > eps && change < -eps) classification = 'risingSlowing'
  else if (latest.yoyPct < -eps && change < -eps) classification = 'fallingAccelerating'
  else if (latest.yoyPct < -eps && change > eps) classification = 'fallingSlowing'
  else if (Math.sign(latest.yoyPct) !== 0 && Math.sign(latest.yoyPct) !== Math.sign(previous.yoyPct) && Math.abs(latest.yoyPct) > eps) classification = 'reversal'
  else classification = 'stableYoy'
  return { latestYoyPct: latest.yoyPct, previousYoyPct: previous.yoyPct, classification }
}

export function computeCagr(history: HistoryPoint[], years: number) {
  const latest = history[history.length - 1]
  if (!latest || latest.value <= 0) return null
  const base = history.find((point) => point.period === priorYearPeriod(latest.period, years))
  if (!base || base.value <= 0) return null
  return { years, basePeriod: base.period, cagr: (Math.pow(latest.value / base.value, 1 / years) - 1) * 100 }
}

export function computeStreak(history: HistoryPoint[]) {
  if (history.length < 2) return null
  const direction = (index: number) => Math.sign(history[index].value - history[index - 1].value)
  const first = direction(history.length - 1)
  if (first === 0) return null
  let count = 1
  for (let i = history.length - 2; i > 0; i--) {
    if (direction(i) === first) count++
    else break
  }
  return { count, direction: first > 0 ? ('increase' as const) : ('decrease' as const) }
}

export function computeVolatility(history: HistoryPoint[]) {
  const window = history.slice(-VOLATILITY_WINDOW)
  if (window.length < 4) return null
  const changes = window.slice(1).flatMap((point, index) => {
    const change = percentChange(window[index].value, point.value)
    return change === null ? [] : [change]
  })
  if (changes.length < 3) return null
  const mean = changes.reduce((sum, change) => sum + change, 0) / changes.length
  const variance = changes.reduce((sum, change) => sum + (change - mean) ** 2, 0) / (changes.length - 1)
  return { volatility: Math.sqrt(variance), periods: window.length }
}

export function computeLongTermAverage(history: HistoryPoint[]) {
  if (history.length < 2) return null
  const average = history.reduce((sum, point) => sum + point.value, 0) / history.length
  return { diffPct: percentChange(average, history[history.length - 1].value), startPeriod: history[0].period }
}

export function computeLifetimeGrowth(history: HistoryPoint[]) {
  if (history.length < 2 || history[0].value <= 0) return null
  const latest = history[history.length - 1]
  return {
    startPeriod: history[0].period,
    changePct: percentChange(history[0].value, latest.value),
    multiplier: latest.value / history[0].value,
  }
}

export function computeSpikesAndDrops(history: HistoryPoint[]) {
  let spike: { period: string; changePct: number } | null = null
  let drop: { period: string; changePct: number } | null = null
  for (let i = 1; i < history.length; i++) {
    const change = percentChange(history[i - 1].value, history[i].value)
    if (change === null || history[i - 1].value <= 0) continue
    if (!spike || change > spike.changePct) spike = { period: history[i].period, changePct: change }
    if (!drop || change < drop.changePct) drop = { period: history[i].period, changePct: change }
  }
  return spike || drop ? { spike, drop } : null
}

export interface EuropeSnapshot {
  reporting: number
  rising: number
  falling: number
  stable: number
  euYoyPct: number | null
  topRising: Array<{ geo: string; yoyPct: number }>
  topFalling: Array<{ geo: string; yoyPct: number }>
  dispersion: 'converging' | 'diverging' | 'stable' | 'unknown'
}

function computeEuropeSnapshot(data: EnergyPrices, latest: string): EuropeSnapshot | null {
  const before = priorYearPeriod(latest)
  const geos = [...new Set(data.countries.map((row) => row.countryCode))]
  const rows = geos.map((geo) => {
    const now = data.countries.find((row) => row.countryCode === geo && row.period === latest)?.total ?? null
    const then = data.countries.find((row) => row.countryCode === geo && row.period === before)?.total ?? null
    return { geo, latest: now, yoyPct: percentChange(then, now), previous: then }
  })
  const countries = rows.filter((row) => !AGGREGATES.includes(row.geo))
  const reporting = countries.filter((row) => isValid(row.latest))
  if (reporting.length === 0) return null

  const direction = (pct: number | null) =>
    pct === null ? 'unavailable' : pct > STABILITY_EPSILON_PERCENT ? 'rising' : pct < -STABILITY_EPSILON_PERCENT ? 'falling' : 'stable'
  const counts = { rising: 0, falling: 0, stable: 0, unavailable: 0 }
  countries.forEach((row) => { counts[direction(row.yoyPct)]++ })

  const spread = (values: number[]) => {
    const sorted = [...values].sort((a, b) => a - b)
    return sorted.length >= 8 ? quartile(sorted, 0.75) - quartile(sorted, 0.25) : null
  }
  const iqrNow = spread(reporting.map((row) => row.latest as number))
  const iqrThen = spread(countries.flatMap((row) => isValid(row.previous) ? [row.previous] : []))
  const dispersionChange = iqrNow !== null && iqrThen !== null ? percentChange(iqrThen, iqrNow) : null

  const withChange = countries.flatMap((row) => row.yoyPct === null ? [] : [{ geo: row.geo, yoyPct: row.yoyPct }])
  return {
    reporting: reporting.length,
    ...counts,
    euYoyPct: rows.find((row) => row.geo === 'EU27_2020')?.yoyPct ?? null,
    topRising: [...withChange].sort((a, b) => b.yoyPct - a.yoyPct).slice(0, 3),
    topFalling: [...withChange].sort((a, b) => a.yoyPct - b.yoyPct).slice(0, 3),
    dispersion: dispersionChange === null ? 'unknown'
      : dispersionChange < -DISPERSION_THRESHOLD_PERCENT ? 'converging'
        : dispersionChange > DISPERSION_THRESHOLD_PERCENT ? 'diverging' : 'stable',
  }
}

export interface CompositionPart {
  key: string
  value: number
  sharePct: number
}

export interface Composition {
  parts: CompositionPart[]
  dominant: string | null
  /** Taxes and VAT as a share of the total, semi-annual datasets only. */
  taxShare: number | null
  taxShareBefore: number | null
}

function partsOf(row: CountryPrice | undefined, data: EnergyPrices): Array<{ key: string; value: number }> {
  if (!row || row.total === null || row.total <= 0) return []
  const raw = data.componentMode
    ? row.breakdown.map((point) => ({ key: point.code, value: point.value }))
    : [
        { key: 'energy', value: row.components.energy },
        { key: 'taxes', value: row.components.taxes },
        { key: 'vat', value: row.components.vat },
      ]
  return raw.flatMap((part) => part.value !== null && part.value > 0 ? [{ key: part.key, value: part.value }] : [])
}

function computeComposition(data: EnergyPrices, focus: string, latest: string): Composition | null {
  const rowAt = (period: string | null) => data.countries.find((row) => row.countryCode === focus && row.period === period)
  const parts = partsOf(rowAt(latest), data)
  if (parts.length === 0) return null
  const sum = parts.reduce((total, part) => total + part.value, 0)
  const shares = parts.map((part) => ({ ...part, sharePct: (part.value / sum) * 100 }))
  const dominant = shares.find((part) => part.sharePct > DOMINANCE_THRESHOLD_PERCENT)?.key ?? null
  const taxShareOf = (row: CountryPrice | undefined) => {
    if (data.componentMode || !row || !row.allTaxes || row.components.taxes === null || row.components.vat === null) return null
    return ((row.components.taxes + row.components.vat) / row.allTaxes) * 100
  }
  return {
    parts: shares,
    dominant,
    taxShare: taxShareOf(rowAt(latest)),
    taxShareBefore: taxShareOf(rowAt(priorYearPeriod(latest))),
  }
}

export interface Insights {
  focus: string
  latestPeriod: string
  latestValue: number | null
  previousPeriod: string | null
  previousChangePct: number | null
  yoyPeriod: string | null
  yoyChangePct: number | null
  crossCountry: CrossCountry
  position: HistoricalPosition | null
  momentum: ReturnType<typeof computeMomentum>
  cagr: ReturnType<typeof computeCagr>
  streak: ReturnType<typeof computeStreak>
  volatility: ReturnType<typeof computeVolatility>
  longTerm: ReturnType<typeof computeLongTermAverage>
  lifetime: ReturnType<typeof computeLifetimeGrowth>
  spikes: ReturnType<typeof computeSpikesAndDrops>
  europe: EuropeSnapshot | null
  composition: Composition | null
}

export function computeInsights(data: EnergyPrices, focus: string, latestPeriod: string): Insights {
  const history = historyOf(data, focus, latestPeriod)
  const previous = previousPeriod(latestPeriod)
  const yoy = priorYearPeriod(latestPeriod)
  const latestValue = valueAt(history, latestPeriod)
  return {
    focus,
    latestPeriod,
    latestValue,
    previousPeriod: previous,
    previousChangePct: percentChange(valueAt(history, previous), latestValue),
    yoyPeriod: yoy,
    yoyChangePct: percentChange(valueAt(history, yoy), latestValue),
    crossCountry: computeCrossCountry(data.countries.filter((row) => row.period === latestPeriod), focus),
    position: computeHistoricalPosition(history),
    momentum: computeMomentum(history),
    cagr: computeCagr(history, CAGR_YEARS),
    streak: computeStreak(history),
    volatility: computeVolatility(history),
    longTerm: computeLongTermAverage(history),
    lifetime: computeLifetimeGrowth(history),
    spikes: computeSpikesAndDrops(history),
    europe: computeEuropeSnapshot(data, latestPeriod),
    composition: computeComposition(data, focus, latestPeriod),
  }
}
