import {
  AGGREGATES,
  computeCagr,
  isValid,
  median,
  percentChange,
  priorYearPeriod,
  quartile,
  type HistoryPoint,
} from './compute'

/**
 * The remaining insight calculations of the original `insightsData.js`: the ones that need their own datasets
 * (purchasing-power panel, annual components, bands, inflation, the other fuel) or look at several periods.
 * Same definitions and thresholds as the original.
 */
const STABILITY_EPSILON_PERCENT = 0.5
const DISPERSION_THRESHOLD_PERCENT = 5
const DOMINANCE_THRESHOLD_PERCENT = 50
const RANK_SENSITIVITY_THRESHOLD_PERCENT = 2
const PERSISTENT_QUARTILE_SHARE_THRESHOLD = 0.75
const IMPLAUSIBLE_CHANGE_PERCENT = 200

export interface PanelRow {
  geo: string
  value: number | null
}

const absoluteChange = (from: number | null | undefined, to: number | null | undefined) =>
  isValid(from) && isValid(to) ? to - from : null

const yearOf = (period: string) => /^(\d{4})/.exec(period)?.[1] ?? null

/* ---- history based ---- */

export function computeTrendReversal(history: HistoryPoint[]) {
  if (history.length < 4) return null
  const diffs = history.slice(1).map((point, index) => point.value - history[index].value)
  const last = diffs[diffs.length - 1]
  const previous1 = diffs[diffs.length - 2]
  const previous2 = diffs[diffs.length - 3]
  const prior = previous1 > 0 && previous2 > 0 ? 1 : previous1 < 0 && previous2 < 0 ? -1 : 0
  const latest = Math.sign(last)
  return prior !== 0 && latest !== 0 && prior !== latest ? { from: prior > 0 ? ('rising' as const) : ('falling' as const) } : null
}

export function computeSeasonalPattern(history: HistoryPoint[]) {
  const byYear = new Map<string, { s1?: number; s2?: number }>()
  history.forEach((point) => {
    const match = /^(\d{4})-S([12])$/.exec(point.period)
    if (!match) return
    const entry = byYear.get(match[1]) ?? {}
    entry[match[2] === '1' ? 's1' : 's2'] = point.value
    byYear.set(match[1], entry)
  })
  const diffs = [...byYear.values()].flatMap((entry) => {
    const change = percentChange(entry.s1, entry.s2)
    return change === null ? [] : [change]
  })
  if (diffs.length < 2) return null
  const typical = median(diffs)
  const latest = history[history.length - 1]
  const years = [...byYear.keys()].sort()
  const latestEntry = byYear.get(years[years.length - 1])
  const latestDiff = latestEntry ? percentChange(latestEntry.s1, latestEntry.s2) : null
  return {
    typicalSecondHalfPct: typical,
    years: diffs.length,
    latestSemester: latest ? /-S([12])$/.exec(latest.period)?.[1] ?? null : null,
    deviation: typical !== null && latestDiff !== null ? latestDiff - typical : null,
  }
}

export function computeHighRegimeShare(history: HistoryPoint[]) {
  if (history.length < 5) return null
  const values = history.map((point) => point.value)
  const sorted = [...values].sort((a, b) => a - b)
  const p80 = sorted[Math.floor(sorted.length * 0.8)]
  const above = values.filter((value) => value >= p80).length
  return { p80, sharePct: (above / values.length) * 100, count: values.length }
}

export function computeCrisisRecovery(history: HistoryPoint[]) {
  if (history.length < 3) return null
  const latest = history[history.length - 1]
  const preCrisis = history.find((point) => point.period === '2019-S2') ?? history.find((point) => point.period === '2019-S1')
  const crisis = history.filter((point) => {
    const year = Number(yearOf(point.period))
    return year >= 2021 && year <= 2023
  })
  if (crisis.length === 0) return null
  const peak = crisis.reduce((max, point) => point.value > max.value ? point : max, crisis[0])
  return {
    peakPeriod: peak.period,
    dropFromPeakPct: percentChange(peak.value, latest.value),
    preCrisisPeriod: preCrisis?.period ?? null,
    gapFromPreCrisisPct: preCrisis ? percentChange(preCrisis.value, latest.value) : null,
  }
}

/* ---- panel (all countries) based ---- */

export function computeRankSensitivity(panel: PanelRow[], focus: string) {
  const rows = panel
    .filter((row) => !AGGREGATES.includes(row.geo) && isValid(row.value))
    .sort((a, b) => (b.value as number) - (a.value as number))
  const index = rows.findIndex((row) => row.geo === focus)
  if (index === -1) return null
  const value = rows[index].value as number
  const above = index > 0 ? rows[index - 1] : null
  const below = index < rows.length - 1 ? rows[index + 1] : null
  const gapAbovePct = above && value ? (((above.value as number) - value) / Math.abs(value)) * 100 : null
  const gapBelowPct = below && value ? ((value - (below.value as number)) / Math.abs(value)) * 100 : null
  return {
    aboveGeo: above?.geo ?? null,
    belowGeo: below?.geo ?? null,
    gapAbovePct,
    gapBelowPct,
    sensitive: (gapAbovePct !== null && gapAbovePct < RANK_SENSITIVITY_THRESHOLD_PERCENT)
      || (gapBelowPct !== null && gapBelowPct < RANK_SENSITIVITY_THRESHOLD_PERCENT),
  }
}

export function computePersistentPosition(panels: PanelRow[][], focus: string) {
  let top = 0
  let bottom = 0
  let valid = 0
  panels.forEach((rows) => {
    const countries = rows.filter((row) => !AGGREGATES.includes(row.geo) && isValid(row.value))
    if (countries.length < 8) return
    const values = countries.map((row) => row.value as number).sort((a, b) => a - b)
    const own = countries.find((row) => row.geo === focus)
    if (!own) return
    valid++
    if ((own.value as number) >= quartile(values, 0.75)) top++
    if ((own.value as number) <= quartile(values, 0.25)) bottom++
  })
  if (valid === 0) return null
  return {
    periods: valid,
    persistentlyHigh: top / valid >= PERSISTENT_QUARTILE_SHARE_THRESHOLD,
    persistentlyLow: bottom / valid >= PERSISTENT_QUARTILE_SHARE_THRESHOLD,
    topSharePct: (top / valid) * 100,
    bottomSharePct: (bottom / valid) * 100,
  }
}

/** Regions used by the regional benchmark of the original tool. */
export const GEO_REGIONS: Record<string, string[]> = {
  nordicBaltic: ['DK', 'FI', 'SE', 'EE', 'LV', 'LT', 'NO', 'IS'],
  western: ['BE', 'FR', 'DE', 'LU', 'NL', 'AT', 'IE'],
  southern: ['ES', 'PT', 'IT', 'EL', 'CY', 'MT'],
  centralEastern: ['CZ', 'HU', 'PL', 'SK', 'BG', 'RO', 'SI', 'HR'],
}

export function computeRegionalBenchmark(panel: PanelRow[], focus: string) {
  const entry = Object.entries(GEO_REGIONS).find(([, members]) => members.includes(focus))
  if (!entry) return null
  const rows = panel
    .filter((row) => entry[1].includes(row.geo) && isValid(row.value))
    .sort((a, b) => (b.value as number) - (a.value as number))
  const index = rows.findIndex((row) => row.geo === focus)
  if (index === -1) return null
  const average = rows.reduce((sum, row) => sum + (row.value as number), 0) / rows.length
  return {
    region: entry[0],
    size: rows.length,
    rank: index + 1,
    gapPct: percentChange(average, rows[index].value),
  }
}

export function computeRankShift(eur: PanelRow[], pps: PanelRow[], focus: string) {
  const toMap = (rows: PanelRow[]) => new Map(rows.filter((row) => !AGGREGATES.includes(row.geo) && isValid(row.value)).map((row) => [row.geo, row.value as number]))
  const eurByGeo = toMap(eur)
  const ppsByGeo = toMap(pps)
  const common = [...eurByGeo.keys()].filter((geo) => ppsByGeo.has(geo))
  if (!common.includes(focus)) return null
  const rankIn = (map: Map<string, number>) => 1 + common.filter((geo) => (map.get(geo) as number) > (map.get(focus) as number)).length
  const rankEur = rankIn(eurByGeo)
  const rankPps = rankIn(ppsByGeo)
  const shift = rankEur - rankPps
  return {
    cohort: common.length,
    rankEur,
    rankPps,
    classification: shift >= 5 ? ('higherInPps' as const) : shift <= -5 ? ('lowerInPps' as const) : ('similar' as const),
  }
}

/* ---- price, fiscal effect, data quality ---- */

export function computeFiscalEffect(
  preTaxLatest: number | null,
  preTaxPrior: number | null,
  finalLatest: number | null,
  finalPrior: number | null,
) {
  const deltaPreTax = absoluteChange(preTaxPrior, preTaxLatest)
  const deltaFinal = absoluteChange(finalPrior, finalLatest)
  if (deltaPreTax === null || deltaFinal === null) return null
  let classification: 'cushioned' | 'amplified' | 'offsetDecrease' | 'oppositeUp' | 'oppositeDown' | 'neutral' = 'neutral'
  if (deltaPreTax > 0 && deltaFinal > 0 && deltaFinal < deltaPreTax) classification = 'cushioned'
  else if (deltaPreTax > 0 && deltaFinal > deltaPreTax) classification = 'amplified'
  else if (deltaPreTax < 0 && deltaFinal < 0 && Math.abs(deltaFinal) < Math.abs(deltaPreTax)) classification = 'offsetDecrease'
  else if (deltaPreTax < 0 && deltaFinal > 0) classification = 'oppositeUp'
  else if (deltaPreTax > 0 && deltaFinal < 0) classification = 'oppositeDown'
  return { deltaPreTax, deltaFinal, classification }
}

export function detectAnomalies(latest: number | null, yoyChangePct: number | null): Array<'negativePrice' | 'zeroPrice' | 'implausibleChange'> {
  const flags: Array<'negativePrice' | 'zeroPrice' | 'implausibleChange'> = []
  if (isValid(latest) && latest < 0) flags.push('negativePrice')
  if (isValid(latest) && latest === 0) flags.push('zeroPrice')
  if (isValid(yoyChangePct) && Math.abs(yoyChangePct) >= IMPLAUSIBLE_CHANGE_PERCENT) flags.push('implausibleChange')
  return flags
}

/* ---- consumption bands ---- */

export interface BandValue {
  band: string
  value: number | null
}

function bandSortKey(code: string): number {
  const upper = code.toUpperCase()
  const match = /(\d+)/.exec(upper)
  if (!match) return Number.POSITIVE_INFINITY
  return Number(match[1]) - (upper.includes('_LT') ? 0.5 : 0)
}

export function computeBandPattern(rows: BandValue[], referenceBand: string, selectedBand: string) {
  const bounded = rows
    .filter((row) => !row.band.toUpperCase().includes('TOT') && isValid(row.value))
    .sort((a, b) => bandSortKey(a.band) - bandSortKey(b.band))
  const diffs = bounded.slice(1).map((row, index) => (row.value as number) - (bounded[index].value as number))
  const reference = rows.find((row) => row.band === referenceBand)?.value ?? null
  const selected = rows.find((row) => row.band === selectedBand)?.value ?? null
  const epsilon = isValid(reference) && reference ? Math.abs(reference) * 0.01 : 0.001
  let pattern: 'flat' | 'decreasing' | 'increasing' | 'mixed' = 'mixed'
  if (diffs.length > 0) {
    if (diffs.every((diff) => Math.abs(diff) <= epsilon)) pattern = 'flat'
    else if (diffs.every((diff) => diff <= epsilon)) pattern = 'decreasing'
    else if (diffs.every((diff) => diff >= -epsilon)) pattern = 'increasing'
  }
  return {
    bands: bounded,
    lowBand: bounded[0]?.band ?? null,
    highBand: bounded[bounded.length - 1]?.band ?? null,
    bandGapPct: percentChange(reference, selected),
    pattern,
  }
}

export function computeBandSpread(low: HistoryPoint[], high: HistoryPoint[]) {
  const lowByPeriod = new Map(low.map((point) => [point.period, point.value]))
  const spreads = high.flatMap((point) => {
    const spread = absoluteChange(point.value, lowByPeriod.get(point.period))
    return spread === null ? [] : [{ period: point.period, spread }]
  })
  if (spreads.length < 2) return null
  const latest = spreads[spreads.length - 1]
  const before = spreads.find((row) => row.period === priorYearPeriod(latest.period))
  const change = before ? percentChange(before.spread, latest.spread) : null
  return {
    latestSpread: latest.spread,
    changePct: change,
    classification: change === null ? ('unavailable' as const)
      : change > DISPERSION_THRESHOLD_PERCENT ? ('widened' as const)
        : change < -DISPERSION_THRESHOLD_PERCENT ? ('narrowed' as const) : ('stable' as const),
  }
}

function parseBandBounds(code: string): { lower: number; upper: number } | null {
  const upper = code.toUpperCase()
  if (upper.includes('TOT')) return null
  const lt = /_LT(\d+)/.exec(upper)
  if (lt) return { lower: 0, upper: Number(lt[1]) }
  const open = /_(?:GE|LE)(\d+)/.exec(upper)
  if (open) return { lower: Number(open[1]), upper: Infinity }
  const range = /(\d+)-(\d+)/.exec(upper)
  if (range) return { lower: Number(range[1]), upper: Number(range[2]) + 1 }
  return null
}

/** Annual cost for a yearly consumption: the price of the band the consumption falls in, times the consumption. */
export function computeAnnualCost(rows: BandValue[], consumption: number) {
  if (!isValid(consumption) || consumption < 0) return null
  const match = rows
    .map((row) => ({ ...row, bounds: parseBandBounds(row.band) }))
    .find((row) => row.bounds && consumption >= row.bounds.lower && consumption < row.bounds.upper)
  if (!match || !isValid(match.value)) return null
  return { band: match.band, price: match.value, cost: match.value * consumption }
}

/* ---- annual components ---- */

export interface ComponentValue {
  code: string
  latest: number | null
  prior: number | null
}

export function computeComponents(components: ComponentValue[]) {
  const valid = components.filter((component) => isValid(component.latest))
  if (valid.length === 0) return null
  const sum = valid.reduce((total, component) => total + (component.latest as number), 0)
  const withShares = components.map((component) => ({
    ...component,
    share: isValid(component.latest) && sum ? ((component.latest as number) / sum) * 100 : null,
    delta: absoluteChange(component.prior, component.latest),
  }))
  const deltas = withShares.filter((component) => isValid(component.delta))
  const base = deltas.reduce((total, component) => total + Math.abs(component.delta as number), 0)
  let mainUp: (typeof withShares)[number] | null = null
  let mainDown: (typeof withShares)[number] | null = null
  deltas.forEach((component) => {
    if ((component.delta as number) > 0 && (!mainUp || (component.delta as number) > (mainUp.delta as number))) mainUp = component
    if ((component.delta as number) < 0 && (!mainDown || (component.delta as number) < (mainDown.delta as number))) mainDown = component
  })
  let dominant: (typeof withShares)[number] | null = null
  if (base > 0) {
    const top = [...deltas].sort((a, b) => Math.abs(b.delta as number) - Math.abs(a.delta as number))[0]
    if (top && (Math.abs(top.delta as number) / base) * 100 >= DOMINANCE_THRESHOLD_PERCENT) dominant = top
  }
  return {
    sum,
    components: withShares.sort((a, b) => (b.latest ?? 0) - (a.latest ?? 0)),
    mainUp: mainUp as (typeof withShares)[number] | null,
    mainDown: mainDown as (typeof withShares)[number] | null,
    dominant,
  }
}

export function computeComponentComparison(
  focus: ReturnType<typeof computeComponents>,
  reference: ReturnType<typeof computeComponents>,
) {
  if (!focus || !reference) return null
  const gaps = focus.components.flatMap((component) => {
    const other = reference.components.find((candidate) => candidate.code === component.code)
    return component.share !== null && other?.share != null
      ? [{ code: component.code, focusShare: component.share, referenceShare: other.share, gap: component.share - other.share }]
      : []
  }).sort((a, b) => Math.abs(b.gap) - Math.abs(a.gap))
  return gaps.length > 0 ? { gaps, mostDivergent: gaps[0] } : null
}

/* ---- other datasets ---- */

export function computeInflationComparison(hicpYoyPct: number | null, energyYoyPct: number | null) {
  if (!isValid(hicpYoyPct) || !isValid(energyYoyPct)) return null
  return { hicpYoyPct, energyYoyPct, gap: energyYoyPct - hicpYoyPct }
}

export function computeCrossFuelRatio(currentPrice: number | null, oppositePrice: number | null, product: string) {
  if (!isValid(currentPrice) || !isValid(oppositePrice) || oppositePrice <= 0) return null
  const electricity = product === '6000' ? currentPrice : oppositePrice
  const gas = product === '6000' ? oppositePrice : currentPrice
  return { ratio: electricity / gas, pctDiff: ((electricity - gas) / gas) * 100, electricity, gas }
}

export function computeDirectComparison(
  focus: string,
  other: string,
  valueFocus: number | null,
  valueOther: number | null,
  yoyFocus: number | null,
  yoyOther: number | null,
  focusComponents: ComponentValue[],
  otherComponents: ComponentValue[],
) {
  if (!other || focus === other || !isValid(valueFocus) || !isValid(valueOther)) return null
  const gaps = focusComponents.flatMap((component) => {
    const counterpart = otherComponents.find((candidate) => candidate.code === component.code)
    return isValid(component.latest) && isValid(counterpart?.latest)
      ? [{ code: component.code, gap: component.latest - (counterpart.latest as number) }]
      : []
  }).sort((a, b) => Math.abs(b.gap) - Math.abs(a.gap))
  const focusPct = percentChange(yoyFocus, valueFocus)
  const otherPct = percentChange(yoyOther, valueOther)
  return {
    valueFocus,
    valueOther,
    gapPct: percentChange(valueOther, valueFocus),
    gapAbs: valueFocus - valueOther,
    focusYoyPct: focusPct,
    otherYoyPct: otherPct,
    fasterGrowth: focusPct !== null && otherPct !== null ? (focusPct > otherPct ? focus : other) : null,
    mainDriver: gaps[0] ?? null,
  }
}

export const STABLE_BAND = STABILITY_EPSILON_PERCENT
export { computeCagr }
