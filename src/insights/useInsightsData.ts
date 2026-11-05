import { useEffect, useState } from 'react'
import { fetchEurostatDataset, type JsonStatDataset } from '../api/eurostat'
import { apiCodes, consumptionBands, energyDatasets, PRICE_TAX_CODE } from '../config/toolConfig'
import { codesInDimension, filterValue, loadEnergyPrices, valueAt as datasetValue } from '../hooks/useEnergyPrices'
import type { FilterValues } from '../state/filters'
import { computeInsights, historyOf, percentChange, priorYearPeriod, type HistoryPoint, type Insights } from './compute'
import {
  computeBandPattern,
  computeBandSpread,
  computeCagr,
  computeComponentComparison,
  computeComponents,
  computeCrisisRecovery,
  computeCrossFuelRatio,
  computeDirectComparison,
  computeFiscalEffect,
  computeHighRegimeShare,
  computeInflationComparison,
  computePersistentPosition,
  computeRankSensitivity,
  computeRankShift,
  computeRegionalBenchmark,
  computeSeasonalPattern,
  computeTrendReversal,
  detectAnomalies,
  type BandValue,
  type ComponentValue,
  type PanelRow,
} from './extra'

const PERSISTENT_QUARTILE_WINDOW = 8
const DATA_URL_PARAMS_VERSION = 1

/** Datasets already requested in this visit are not requested again (Eurostat data changes twice a year). */
const requests = new Map<string, Promise<JsonStatDataset>>()

function request(code: string, params: Record<string, string | string[]>, signal: AbortSignal): Promise<JsonStatDataset> {
  const key = `${DATA_URL_PARAMS_VERSION}|${code}|${JSON.stringify(params)}`
  const cached = requests.get(key)
  if (cached) return cached
  const promise = fetchEurostatDataset(code, params, { signal })
  requests.set(key, promise)
  promise.catch(() => requests.delete(key))
  return promise
}

/** The data-quality flag Eurostat gives a value ("p" provisional, "e" estimated), if any. */
function statusAt(dataset: JsonStatDataset, coordinates: Record<string, string>): string | null {
  const status = dataset.status
  if (!status) return null
  let flat = 0
  for (let i = 0; i < dataset.id.length; i++) {
    const id = dataset.id[i]
    const code = coordinates[id]
    const codes = codesInDimension(dataset, id)
    const position = code !== undefined ? codes.indexOf(code) : dataset.size[i] === 1 ? 0 : -1
    if (position < 0) return null
    flat = flat * dataset.size[i] + position
  }
  const flag = Array.isArray(status) ? status[flat] : status[String(flat)]
  return typeof flag === 'string' ? flag : null
}

export interface InsightsBundle {
  core: Insights
  dataset: string
  componentDataset: string
  unit: string
  band: string
  history: HistoryPoint[]
  development: {
    cagr2: ReturnType<typeof computeCagr>
    cagr10: ReturnType<typeof computeCagr>
    trendReversal: ReturnType<typeof computeTrendReversal>
    seasonal: ReturnType<typeof computeSeasonalPattern>
    highRegime: ReturnType<typeof computeHighRegimeShare>
    crisis: ReturnType<typeof computeCrisisRecovery>
  }
  rankSensitivity: ReturnType<typeof computeRankSensitivity>
  persistent: ReturnType<typeof computePersistentPosition>
  regional: ReturnType<typeof computeRegionalBenchmark>
  rankShift: ReturnType<typeof computeRankShift> | null
  fiscal: (NonNullable<ReturnType<typeof computeFiscalEffect>> & { preTaxYoyPct: number | null }) | null
  anomalies: ReturnType<typeof detectAnomalies>
  status: 'p' | 'e' | null
  bandRows: BandValue[]
  bandPattern: ReturnType<typeof computeBandPattern> | null
  bandSpread: ReturnType<typeof computeBandSpread> | null
  components: ReturnType<typeof computeComponents>
  componentPeriod: string | null
  euComponents: ReturnType<typeof computeComponents>
  componentComparison: ReturnType<typeof computeComponentComparison>
  inflation: ReturnType<typeof computeInflationComparison>
  crossFuel: ReturnType<typeof computeCrossFuelRatio>
  direct: ReturnType<typeof computeDirectComparison>
  geos: string[]
}

export interface InsightsDataState {
  data?: InsightsBundle
  error?: Error
  loading: boolean
}

interface Stored extends InsightsDataState {
  key: string
}

const DEFAULT_BAND_OPPOSITE: Record<string, string> = { '4100': 'GJ20-199', '6000': 'KWH2500-4999' }

function pickBand(requested: string, dataset: string, fallback: string): string {
  const valid: readonly string[] = consumptionBands[dataset] ?? []
  return valid.includes(requested) && !requested.startsWith('TOT_') ? requested : fallback
}

function componentValues(
  dataset: JsonStatDataset | null,
  geo: string,
  codes: readonly string[],
  requestedYear: string,
  factor: number,
): { period: string | null; values: ComponentValue[] } {
  if (!dataset || !geo) return { period: null, values: [] }
  const years = codesInDimension(dataset, 'time')
  let start = years.indexOf(requestedYear)
  if (start === -1) start = years.length - 1
  const read = (year: string | undefined, code: string) => {
    if (!year) return null
    const value = datasetValue(dataset, { geo, time: year, nrg_prc: code })
    return value === null ? null : value * factor
  }
  for (let i = start; i >= 0; i--) {
    if (codes.some((code) => read(years[i], code) !== null)) {
      return {
        period: years[i],
        values: codes.map((code) => ({ code, latest: read(years[i], code), prior: i > 0 ? read(years[i - 1], code) : null })),
      }
    }
  }
  return { period: null, values: [] }
}

/**
 * Everything the insights need, independent of the chart's toggles (the original tool also always used the
 * semi-annual price dataset for them): the price panel in EUR and PPS, the annual components, the bands of the
 * country, euro-area inflation and the other fuel. Requested only while the insights panel is open.
 */
export function useInsightsData(values: FilterValues, focus: string | undefined, other: string, enabled: boolean): InsightsDataState {
  const [state, setState] = useState<Stored>()
  const product = filterValue(values.product, '6000')
  const consumer = filterValue(values.consumer, 'HOUSEHOLD')
  const requestedUnit = filterValue(values.unit, 'KWH')
  const requestedBand = filterValue(values.band, '')
  const time = filterValue(values.time, '')
  const key = JSON.stringify({ product, consumer, requestedUnit, requestedBand, time, focus, other })

  useEffect(() => {
    if (!enabled || !focus) return
    const controller = new AbortController()
    const config = energyDatasets[`${product}_${consumer}` as keyof typeof energyDatasets]
    const dataset: string = config.code
    const componentDataset: string = config.componentsCode
    const unit = (config.units as readonly string[]).includes(requestedUnit) ? requestedUnit : 'KWH'
    const unitParam = unit === 'MWH' ? 'KWH' : unit
    const factor = unit === 'MWH' ? 1000 : 1
    const band = pickBand(requestedBand, dataset, config.defaultBand)
    const componentBand = pickBand(requestedBand, componentDataset, config.defaultComponentsBand)
    const sendsComponentUnit = componentDataset === 'nrg_pc_202_c' || componentDataset === 'nrg_pc_203_c'
    const oppositeProduct = product === '6000' ? '4100' : '6000'
    const opposite = energyDatasets[`${oppositeProduct}_${consumer}` as keyof typeof energyDatasets]

    void (async () => {
      const priceParams = { tax: [...apiCodes.tax], unit: unitParam, nrg_cons: band }
      const [panelDs, ppsDs, bandDs, oppositeDs] = await Promise.all([
        request(dataset, { ...priceParams, currency: 'EUR' }, controller.signal),
        request(dataset, { ...priceParams, currency: 'PPS' }, controller.signal).catch(() => null),
        request(dataset, { tax: PRICE_TAX_CODE, unit: unitParam, currency: 'EUR', geo: focus }, controller.signal).catch(() => null),
        request(opposite.code, {
          tax: PRICE_TAX_CODE, unit: 'KWH', nrg_cons: DEFAULT_BAND_OPPOSITE[oppositeProduct] ?? opposite.defaultBand, currency: 'EUR', geo: focus,
        }, controller.signal).catch(() => null),
      ])

      const geos = codesInDimension(panelDs, 'geo')
      const panel = loadEnergyPrices(panelDs, dataset, unit, geos, false, [])
      const periods = panel.periods
      const requestedPeriod = /^\d{4}$/.test(time) ? `${time}-S2` : time
      const latest = periods.includes(requestedPeriod) ? requestedPeriod : periods[periods.length - 1]
      if (!latest) throw new Error('no period')
      const latestYear = latest.slice(0, 4)
      const yoyYear = String(Number(latestYear) - 1)
      const yoy = priorYearPeriod(latest)
      const month = `${latestYear}-${latest.endsWith('S1') ? '06' : '12'}`

      const geoList = [...new Set([focus, 'EU27_2020', ...(other ? [other] : [])])]
      const componentParams: Record<string, string | string[]> = {
        nrg_prc: [...config.componentCodes], nrg_cons: componentBand, currency: 'EUR', geo: geoList, time: [latestYear, yoyYear],
      }
      if (sendsComponentUnit) componentParams.unit = unitParam
      const [componentDs, hicpDs] = await Promise.all([
        request(componentDataset, componentParams, controller.signal).catch(() => null),
        request('prc_hicp_manr', { coicop: 'CP00', unit: 'RCH_A', geo: focus, time: month }, controller.signal).catch(() => null),
      ])

      const core = computeInsights(panel, focus, latest)
      const history = historyOf(panel, focus, latest)
      const rowAt = (geo: string, period: string | null) => panel.countries.find((row) => row.countryCode === geo && row.period === period)
      const panelAt = (period: string): PanelRow[] => geos.map((geo) => ({ geo, value: rowAt(geo, period)?.total ?? null }))
      const eurLatest = panelAt(latest)

      const rankShift = ppsDs && codesInDimension(ppsDs, 'time').includes(latest)
        ? computeRankShift(
            eurLatest,
            geos.map((geo) => ({ geo, value: datasetValue(ppsDs, { geo, time: latest, tax: PRICE_TAX_CODE }) })),
            focus,
          )
        : null

      const flag = statusAt(panelDs, { geo: focus, time: latest, tax: PRICE_TAX_CODE })

      // Bands of the country: price including taxes at the latest period, and low/high band history.
      let bandRows: BandValue[] = []
      let bandPattern: InsightsBundle['bandPattern'] = null
      let bandSpread: InsightsBundle['bandSpread'] = null
      if (bandDs) {
        const bandCodes = codesInDimension(bandDs, 'nrg_cons').filter((code) => (consumptionBands[dataset] ?? []).includes(code))
        const bandValue = (code: string, period: string) => {
          const value = datasetValue(bandDs, { geo: focus, nrg_cons: code, time: period, tax: PRICE_TAX_CODE })
          return value === null ? null : value * factor
        }
        bandRows = bandCodes.map((code) => ({ band: code, value: bandValue(code, latest) }))
        bandPattern = computeBandPattern(bandRows, config.defaultBand, band)
        if (bandPattern.lowBand && bandPattern.highBand && bandPattern.lowBand !== bandPattern.highBand) {
          const series = (code: string): HistoryPoint[] => codesInDimension(bandDs, 'time').sort().flatMap((period) => {
            const value = bandValue(code, period)
            return value === null || period > latest ? [] : [{ period, value }]
          })
          bandSpread = computeBandSpread(series(bandPattern.lowBand), series(bandPattern.highBand))
        }
      }

      const compFocus = componentValues(componentDs, focus, config.componentCodes, latestYear, factor)
      const compEu = componentValues(componentDs, 'EU27_2020', config.componentCodes, latestYear, factor)
      const compOther = other ? componentValues(componentDs, other, config.componentCodes, latestYear, factor) : { period: null, values: [] }

      const hicpValue = hicpDs ? datasetValue(hicpDs, { geo: focus, time: month }) : null
      const oppositePrice = oppositeDs && codesInDimension(oppositeDs, 'time').includes(latest)
        ? datasetValue(oppositeDs, { geo: focus, time: latest, tax: PRICE_TAX_CODE })
        : null
      const latestKwh = core.latestValue === null ? null : core.latestValue / factor

      const result: InsightsBundle = {
        core,
        dataset,
        componentDataset,
        unit,
        band,
        history,
        development: {
          cagr2: computeCagr(history, 2),
          cagr10: computeCagr(history, 10),
          trendReversal: computeTrendReversal(history),
          seasonal: computeSeasonalPattern(history),
          highRegime: computeHighRegimeShare(history),
          crisis: computeCrisisRecovery(history),
        },
        rankSensitivity: computeRankSensitivity(eurLatest, focus),
        persistent: computePersistentPosition(periods.filter((period) => period <= latest).slice(-PERSISTENT_QUARTILE_WINDOW).map(panelAt), focus),
        regional: computeRegionalBenchmark(eurLatest, focus),
        rankShift,
        fiscal: (() => {
          const preLatest = rowAt(focus, latest)?.components.energy ?? null
          const prePrior = rowAt(focus, yoy)?.components.energy ?? null
          const effect = computeFiscalEffect(preLatest, prePrior, rowAt(focus, latest)?.allTaxes ?? null, rowAt(focus, yoy)?.allTaxes ?? null)
          return effect ? { ...effect, preTaxYoyPct: percentChange(prePrior, preLatest) } : null
        })(),
        anomalies: detectAnomalies(core.latestValue, core.yoyChangePct),
        status: flag === 'p' || flag === 'e' ? flag : null,
        bandRows,
        bandPattern,
        bandSpread,
        components: computeComponents(compFocus.values),
        componentPeriod: compFocus.period,
        euComponents: computeComponents(compEu.values),
        componentComparison: computeComponentComparison(computeComponents(compFocus.values), computeComponents(compEu.values)),
        inflation: computeInflationComparison(hicpValue, core.yoyChangePct),
        crossFuel: computeCrossFuelRatio(latestKwh, oppositePrice, product),
        direct: other
          ? computeDirectComparison(
              focus, other,
              rowAt(focus, latest)?.total ?? null, rowAt(other, latest)?.total ?? null,
              rowAt(focus, yoy)?.total ?? null, rowAt(other, yoy)?.total ?? null,
              compFocus.values, compOther.values,
            )
          : null,
        geos,
      }
      if (!controller.signal.aborted) setState({ key, data: result, loading: false })
    })().catch((error: unknown) => {
      if (!controller.signal.aborted) {
        setState({ key, loading: false, error: error instanceof Error ? error : new Error(String(error)) })
      }
    })

    return () => controller.abort()
  }, [consumer, enabled, focus, key, other, product, requestedBand, requestedUnit, time])

  if (!enabled || !focus) return { loading: false }
  if (!state || state.key !== key) return { loading: true }
  return state
}
