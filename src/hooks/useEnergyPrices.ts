import { useEffect, useMemo, useState } from 'react'
import { fetchEurostatDataset, type JsonStatDataset } from '../api/eurostat'
import { apiCodes, consumptionBands, energyDatasets, PRICE_COMPONENT_CODES, PRICE_TAX_CODE } from '../config/toolConfig'
import i18n from '../i18n'
import type { FilterValues } from '../state/filters'

export interface PriceComponents {
  energy: number | null
  taxes: number | null
  vat: number | null
}

export interface PriceBreakdown {
  code: string
  value: number | null
}

export interface CountryPrice {
  countryCode: string
  period: string
  /** The price shown: without taxes and levies (see `PRICE_TAX_CODE`); in the annual datasets the sum of the parts. */
  total: number | null
  /** The price with all taxes and levies (half-yearly datasets), for the figures about taxes. */
  allTaxes: number | null
  components: PriceComponents
  breakdown: PriceBreakdown[]
}

export interface EnergyPrices {
  dataset: string
  unit: string
  componentMode: boolean
  periods: string[]
  componentCodes: string[]
  countries: CountryPrice[]
}

export interface EnergyPricesState {
  data?: EnergyPrices
  error?: Error
  loading: boolean
}

interface StoredEnergyPricesState extends EnergyPricesState {
  requestKey: string
}

export function filterValue(value: string | string[] | undefined, fallback: string): string {
  return typeof value === 'string' ? value : fallback
}

export function codesInDimension(dataset: JsonStatDataset, dimensionId: string): string[] {
  const index = dataset.dimension[dimensionId]?.category.index
  if (!index) return []
  if (Array.isArray(index)) return [...index]
  return Object.entries(index)
    .sort(([, left], [, right]) => left - right)
    .map(([code]) => code)
}

function categoryPosition(dataset: JsonStatDataset, dimensionId: string, code: string): number | undefined {
  const index = dataset.dimension[dimensionId]?.category.index
  if (!index) return undefined
  if (Array.isArray(index)) {
    const position = index.indexOf(code)
    return position < 0 ? undefined : position
  }
  return index[code]
}

export function valueAt(dataset: JsonStatDataset, coordinates: Record<string, string>): number | null {
  const positions = dataset.id.map((dimensionId, dimensionIndex) => {
    const code = coordinates[dimensionId]
    if (code !== undefined) return categoryPosition(dataset, dimensionId, code)
    return dataset.size[dimensionIndex] === 1 ? 0 : undefined
  })

  if (positions.some((position) => position === undefined)) return null

  const flatIndex = positions.reduce<number>(
    (index, position, dimensionIndex) => index * dataset.size[dimensionIndex] + (position ?? 0),
    0,
  )
  const value = Array.isArray(dataset.value)
    ? dataset.value[flatIndex]
    : dataset.value?.[String(flatIndex)]
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

function scaleValue(value: number | null, factor: number): number | null {
  return value === null ? null : value * factor
}

interface PriceFigures {
  total: number | null
  allTaxes: number | null
  components: PriceComponents
  breakdown: PriceBreakdown[]
}

/** The price figures of one cell (country, period, band), with the same maths as the original ENPRICES tool. */
function priceFigures(
  dataset: JsonStatDataset,
  base: Record<string, string>,
  componentMode: boolean,
  componentCodes: readonly string[],
  factor: number,
): PriceFigures {
  const valueFor = (dimension: string, code: string) => valueAt(dataset, { ...base, [dimension]: code })

  if (componentMode) {
    const breakdown = componentCodes.map((code) => ({ code, value: scaleValue(valueFor('nrg_prc', code), factor) }))
    const sumOf = (parts: PriceBreakdown[]) => {
      const available = parts.flatMap(({ value }) => value === null ? [] : [value])
      return available.length > 0 ? available.reduce((sum, value) => sum + value, 0) : null
    }
    return {
      // The price without taxes is energy and supply plus network costs; with every part it is the price with all taxes.
      total: sumOf(breakdown.filter(({ code }) => (PRICE_COMPONENT_CODES as readonly string[]).includes(code))),
      allTaxes: sumOf(breakdown),
      components: { energy: null, taxes: null, vat: null },
      breakdown,
    }
  }

  // The breakdown of the original tool (enprices.js), with each value read by its tax code:
  //   energy = price excluding taxes and levies         (X_TAX)
  //   vat    = all taxes included - excluding VAT        (I_TAX - X_VAT)
  //   taxes  = all taxes included - (energy + vat)       (what is left: the other taxes and levies)
  const excludingTaxes = valueFor('tax', 'X_TAX')
  const excludingVat = valueFor('tax', 'X_VAT')
  const includingTaxes = valueFor('tax', 'I_TAX')
  const vat = excludingVat !== null && includingTaxes !== null ? includingTaxes - excludingVat : null
  const taxes = excludingTaxes !== null && vat !== null && includingTaxes !== null ? includingTaxes - (excludingTaxes + vat) : null
  return {
    total: scaleValue(valueFor('tax', PRICE_TAX_CODE), factor),
    allTaxes: scaleValue(includingTaxes, factor),
    components: {
      energy: scaleValue(excludingTaxes, factor),
      taxes: scaleValue(taxes, factor),
      vat: scaleValue(vat, factor),
    },
    breakdown: [],
  }
}

function usableComponentCodes(
  dataset: JsonStatDataset,
  componentMode: boolean,
  selectedComponentCodes: readonly string[],
): string[] {
  if (!componentMode) return []
  const available = codesInDimension(dataset, 'nrg_prc')
  return selectedComponentCodes.filter((code) => available.includes(code))
}

export function loadEnergyPrices(
  dataset: JsonStatDataset,
  datasetCode: string,
  unit: string,
  geos: string[],
  componentMode: boolean,
  selectedComponentCodes: readonly string[],
): EnergyPrices {
  const periods = codesInDimension(dataset, 'time').sort()
  const componentCodes = usableComponentCodes(dataset, componentMode, selectedComponentCodes)
  const factor = unit === 'MWH' ? 1000 : 1
  const countries = geos.flatMap((countryCode) => periods.map((period) => ({
    countryCode,
    period,
    ...priceFigures(dataset, { geo: countryCode, time: period }, componentMode, componentCodes, factor),
  })))

  return { dataset: datasetCode, unit, componentMode, periods, componentCodes, countries }
}

/** What the filters ask for: which dataset, band and unit to request. Shared by the main view and the country view. */
export function resolveEnergyQuery(values: FilterValues) {
  const product = filterValue(values.product, '6000')
  const consumer = filterValue(values.consumer, 'HOUSEHOLD')
  const requestedUnit = filterValue(values.unit, 'KWH')
  const band = filterValue(values.band, '')
  const componentMode = values.component === 'components'
  const datasetConfig = energyDatasets[`${product}_${consumer}` as keyof typeof energyDatasets]
  const availableUnits: readonly string[] = componentMode ? datasetConfig.componentsUnits : datasetConfig.units
  const unit = availableUnits.includes(requestedUnit)
    ? requestedUnit
    : availableUnits.includes('KWH') ? 'KWH' : availableUnits[0]
  const datasetCode: string = componentMode ? datasetConfig.componentsCode : datasetConfig.code
  const selectedBand = consumptionBands[datasetCode].includes(band)
    ? band
    : componentMode ? datasetConfig.defaultComponentsBand : datasetConfig.defaultBand
  const unitDimension = datasetCode === 'nrg_pc_202_c' || datasetCode === 'nrg_pc_203_c'
    ? unit
    : unit === 'MWH' ? 'KWH' : unit
  const sendsUnit = !componentMode || datasetCode === 'nrg_pc_202_c' || datasetCode === 'nrg_pc_203_c'
  return {
    componentMode,
    datasetCode,
    unit,
    unitDimension,
    sendsUnit,
    selectedBand,
    selectedComponentCodes: datasetConfig.componentCodes as readonly string[],
  }
}

/** Fetch the matching semi-annual price or annual component dataset for the selected filters. */
export function useEnergyPrices(values: FilterValues): EnergyPricesState {
  const [state, setState] = useState<StoredEnergyPricesState>()
  const geos = useMemo(() => Array.isArray(values.geo) ? values.geo : [], [values.geo])
  const {
    componentMode, datasetCode, unit, unitDimension, sendsUnit, selectedBand, selectedComponentCodes,
  } = resolveEnergyQuery(values)
  const requestKey = JSON.stringify({ componentMode, datasetCode, geos, selectedBand, unit, unitDimension })

  useEffect(() => {
    const controller = new AbortController()

    if (geos.length === 0) return () => controller.abort()

    const params: Record<string, string | string[]> = { geo: geos, nrg_cons: selectedBand, currency: 'EUR' }
    if (sendsUnit) params.unit = unitDimension
    // Only the three tax series are requested.
    if (!componentMode) params.tax = [...apiCodes.tax]

    void fetchEurostatDataset(datasetCode, params, { signal: controller.signal }).then((dataset) => {
      if (!controller.signal.aborted) {
        setState({
          requestKey,
          data: loadEnergyPrices(dataset, datasetCode, unit, geos, componentMode, selectedComponentCodes),
          loading: false,
        })
      }
    }).catch((error: unknown) => {
      if (!controller.signal.aborted) {
        setState({
          requestKey,
          loading: false,
          error: error instanceof Error ? error : new Error(i18n.t('errors.dataLoad')),
        })
      }
    })

    return () => controller.abort()
  }, [componentMode, datasetCode, geos, requestKey, selectedBand, selectedComponentCodes, sendsUnit, unit, unitDimension])

  if (geos.length === 0) {
    return { loading: false, error: new Error(i18n.t('errors.noCountries')) }
  }
  if (!state || state.requestKey !== requestKey) return { loading: true }
  return state
}

/* ------------------------------------------------------------------ */
/* ONE COUNTRY, ALL CONSUMPTION BANDS AND PERIODS (the drill-down)     */
/* ------------------------------------------------------------------ */

export interface BandPrice extends PriceFigures {
  band: string
  period: string
}

export interface CountryPrices {
  dataset: string
  unit: string
  componentMode: boolean
  countryCode: string
  periods: string[]
  bands: string[]
  componentCodes: string[]
  rows: BandPrice[]
}

export interface CountryPricesState {
  data?: CountryPrices
  error?: Error
  loading: boolean
}

interface StoredCountryPricesState extends CountryPricesState {
  requestKey: string
}

/** One country across every consumption band and period, from a dataset fetched without the band filter. */
export function buildCountryPrices(
  dataset: JsonStatDataset,
  datasetCode: string,
  unit: string,
  componentMode: boolean,
  selectedComponentCodes: readonly string[],
  countryCode: string,
): CountryPrices {
  const periods = codesInDimension(dataset, 'time').sort()
  const allowedBands: readonly string[] = consumptionBands[datasetCode]
  const bands = codesInDimension(dataset, 'nrg_cons')
    .filter((code) => allowedBands.includes(code))
    .sort((a, b) => allowedBands.indexOf(a) - allowedBands.indexOf(b))
  const componentCodes = usableComponentCodes(dataset, componentMode, selectedComponentCodes)
  const factor = unit === 'MWH' ? 1000 : 1
  const rows = bands.flatMap((band) => periods.map((period) => ({
    band,
    period,
    ...priceFigures(dataset, { geo: countryCode, nrg_cons: band, time: period }, componentMode, componentCodes, factor),
  })))
  return { dataset: datasetCode, unit, componentMode, countryCode, periods, bands, componentCodes, rows }
}

/** Fetch one country across every consumption band and period: the data behind the charts a click on a bar opens. */
export function useCountryPrices(values: FilterValues, countryCode: string): CountryPricesState {
  const [state, setState] = useState<StoredCountryPricesState>()
  const { componentMode, datasetCode, unit, unitDimension, sendsUnit, selectedComponentCodes } = resolveEnergyQuery(values)
  const requestKey = JSON.stringify({ componentMode, datasetCode, unit, unitDimension, countryCode })

  useEffect(() => {
    if (!countryCode) return
    const controller = new AbortController()
    const params: Record<string, string | string[]> = { geo: countryCode, currency: 'EUR' }
    if (sendsUnit) params.unit = unitDimension
    if (!componentMode) params.tax = [...apiCodes.tax]

    void fetchEurostatDataset(datasetCode, params, { signal: controller.signal }).then((dataset) => {
      if (controller.signal.aborted) return
      const data = buildCountryPrices(dataset, datasetCode, unit, componentMode, selectedComponentCodes, countryCode)
      setState({
        requestKey,
        loading: false,
        data,
      })
    }).catch((error: unknown) => {
      if (!controller.signal.aborted) {
        setState({
          requestKey,
          loading: false,
          error: error instanceof Error ? error : new Error(i18n.t('errors.dataLoad')),
        })
      }
    })

    return () => controller.abort()
  }, [componentMode, countryCode, datasetCode, requestKey, selectedComponentCodes, sendsUnit, unit, unitDimension])

  if (!countryCode) return { loading: false }
  if (!state || state.requestKey !== requestKey) return { loading: true }
  return state
}
